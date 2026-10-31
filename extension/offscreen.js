// API base injected via config.js at package time (see extension/build.sh).
const API_BASE =
  (typeof MINUTES_CONFIG !== "undefined" && MINUTES_CONFIG.API_BASE) ||
  "http://localhost:8000";

let mediaRecorder = null;
let audioChunks = [];
let mediaStream = null;  // Tab stream
let micStream = null;    // Microphone stream
let audioContext = null;
let currentMeetingId = null;
let recordingStartTime = null;
let authToken = null; // Passed in from background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_RECORDING") {
    startRecording(message.streamId, message.meetingId, message.token)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === "STOP_RECORDING") {
    // Ack as soon as the recorder has stopped; the upload can take a while and
    // reports back through UPLOAD_COMPLETE / UPLOAD_FAILED.
    stopRecording()
      .then((job) => {
        sendResponse({ ok: true });
        if (job) finishUpload(job);
      })
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

async function startRecording(streamId, meetingId, token) {
  console.log(`[Offscreen] Starting recording for meeting ${meetingId}...`);
  currentMeetingId = meetingId;
  recordingStartTime = Date.now();
  authToken = token;
  audioChunks = [];

  // 1. Capture Tab Audio (Other call participants)
  let tabStream = null;
  if (streamId) {
    try {
      tabStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: "tab",
            chromeMediaSourceId: streamId,
          },
        },
        video: false,
      });
      console.log("[Offscreen] Tab audio stream acquired!");
    } catch (err) {
      console.warn("[Offscreen] Tab audio stream capture failed:", err);
    }
  } else {
    console.warn("[Offscreen] No streamId provided for tab capture.");
  }

  mediaStream = tabStream;

  // 2. Capture Microphone Audio (User's own voice)
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("[Offscreen] Microphone audio stream acquired!");
  } catch (err) {
    console.warn("[Offscreen] Microphone access unavailable or denied:", err);
    micStream = null;
  }

  if (!tabStream && !micStream) {
    throw new Error("Unable to capture tab audio or microphone stream. Please ensure microphone permissions are enabled.");
  }

  // 3. Create AudioContext and FORCE RESUME
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const mixerDestination = audioContext.createMediaStreamDestination();
  let streamToRecord = null;

  if (tabStream && micStream) {
    // Both Tab + Mic available -> Mix them cleanly
    const tabSource = audioContext.createMediaStreamSource(tabStream);
    tabSource.connect(audioContext.destination); // Play to speakers out loud
    tabSource.connect(mixerDestination);          // Route to recorder

    const micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(mixerDestination);          // Route to recorder (no speaker connection to prevent echo)

    streamToRecord = mixerDestination.stream;
    console.log("[Offscreen] Recording mixed audio stream (Tab Audio + Local Mic).");
  } else if (tabStream) {
    // Only Tab available -> Pass to speakers AND destination
    const tabSource = audioContext.createMediaStreamSource(tabStream);
    tabSource.connect(audioContext.destination); // Play to speakers out loud
    tabSource.connect(mixerDestination);          // Route to recorder

    streamToRecord = mixerDestination.stream;
    console.log("[Offscreen] Recording tab audio stream via AudioContext.");
  } else if (micStream) {
    // Only Mic available
    streamToRecord = micStream;
    console.log("[Offscreen] Recording microphone stream only.");
  }

  let options = { mimeType: "audio/webm;codecs=opus" };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: "audio/webm" };
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = {};
  }

  mediaRecorder = new MediaRecorder(streamToRecord, options);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      console.log(`[Offscreen] Audio chunk captured: ${event.data.size} bytes`);
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.onerror = (err) => {
    console.error("[Offscreen] MediaRecorder error:", err);
  };

  mediaRecorder.start(1000);
  console.log("[Offscreen] MediaRecorder started successfully.");
}

async function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    // Recorder already ended (e.g. its tracks died with the tab). Report it so
    // the background clears its recording state instead of waiting forever.
    const meetingId = currentMeetingId;
    cleanup();
    chrome.runtime.sendMessage({
      type: "UPLOAD_FAILED",
      meetingId,
      error: "Recording had already stopped — no audio was uploaded.",
    });
    return null;
  }

  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      const durationSec = recordingStartTime
        ? Math.floor((Date.now() - recordingStartTime) / 1000)
        : null;
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      console.log(`[Offscreen] Final audio blob created: ${audioBlob.size} bytes`);
      const job = { audioBlob, meetingId: currentMeetingId, durationSec, token: authToken };
      cleanup();
      resolve(job);
    };

    mediaRecorder.stop();
  });
}

async function finishUpload({ audioBlob, meetingId, durationSec, token }) {
  try {
    await uploadAudioToBackend(audioBlob, meetingId, durationSec, token);
    chrome.runtime.sendMessage({ type: "UPLOAD_COMPLETE", meetingId });
  } catch (err) {
    console.error("[Offscreen] Upload failed:", err);
    chrome.runtime.sendMessage({ type: "UPLOAD_FAILED", meetingId, error: err.message });
  }
}

async function uploadAudioToBackend(audioBlob, meetingId, durationSec, token) {
  if (!token) {
    throw new Error("Not logged in — auth token was not passed to recorder.");
  }

  if (audioBlob.size < 1000) {
    throw new Error("Recording too short or empty — no audio was captured.");
  }

  const formData = new FormData();
  formData.append("file", audioBlob, `meeting_${meetingId}.webm`);

  const headers = { Authorization: `Bearer ${token}` };
  if (durationSec && durationSec > 0) {
    headers["X-Recording-Duration"] = String(durationSec);
  }

  const res = await fetch(`${API_BASE}/meetings/${meetingId}/upload-audio`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(errData.detail || "Upload failed");
  }
}

function cleanup() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  if (micStream) {
    micStream.getTracks().forEach((track) => track.stop());
    micStream = null;
  }
  if (audioContext) {
    try {
      audioContext.close();
    } catch (e) {}
    audioContext = null;
  }
  mediaRecorder = null;
  audioChunks = [];
}
