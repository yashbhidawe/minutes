const API_BASE = "http://localhost:8000";

let mediaRecorder = null;
let audioChunks = [];
let mediaStream = null;  // Tab stream
let micStream = null;    // Microphone stream
let audioContext = null;
let currentMeetingId = null;
let recordingStartTime = null;
let authToken = null; // Passed in from background.js — we do NOT call chrome.storage here

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_RECORDING") {
    startRecording(message.streamId, message.meetingId, message.token)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === "STOP_RECORDING") {
    stopRecording()
      .then(() => sendResponse({ ok: true }))
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
    throw new Error("Unable to capture tab audio or microphone stream.");
  }

  // 3. Create AudioContext and FORCE RESUME (CRITICAL for Chrome MV3 offscreen)
  audioContext = new AudioContext();
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  let streamToRecord = null;

  if (tabStream && micStream) {
    // Both Tab + Mic available -> Mix them
    const tabSource = audioContext.createMediaStreamSource(tabStream);
    tabSource.connect(audioContext.destination); // Pass-through so user hears call out loud

    const mixerDestination = audioContext.createMediaStreamDestination();
    tabSource.connect(mixerDestination);

    const micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(mixerDestination);

    streamToRecord = mixerDestination.stream;
    console.log("[Offscreen] Recording mixed audio stream (Tab Audio + Local Mic).");
  } else if (micStream) {
    // Only Mic available
    streamToRecord = micStream;
    console.log("[Offscreen] Recording microphone stream only.");
  } else if (tabStream) {
    // Only Tab available
    const tabSource = audioContext.createMediaStreamSource(tabStream);
    tabSource.connect(audioContext.destination); // Pass-through to speakers
    streamToRecord = tabStream;
    console.log("[Offscreen] Recording direct tab audio stream.");
  }

  mediaRecorder = new MediaRecorder(streamToRecord, { mimeType: "audio/webm" });

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
    cleanup();
    return;
  }

  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = async () => {
      try {
        const durationSec = recordingStartTime
          ? Math.floor((Date.now() - recordingStartTime) / 1000)
          : null;

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        console.log(`[Offscreen] Final audio blob created: ${audioBlob.size} bytes`);
        cleanup();

        // Upload directly from offscreen document
        await uploadAudioToBackend(audioBlob, currentMeetingId, durationSec);
        resolve();
      } catch (err) {
        cleanup();
        chrome.runtime.sendMessage({
          type: "UPLOAD_FAILED",
          meetingId: currentMeetingId,
          error: err.message,
        });
        reject(err);
      }
    };

    mediaRecorder.stop();
  });
}

async function uploadAudioToBackend(audioBlob, meetingId, durationSec) {
  if (!authToken) {
    chrome.runtime.sendMessage({
      type: "UPLOAD_FAILED",
      meetingId,
      error: "Not logged in — auth token was not passed to recorder.",
    });
    return;
  }

  if (audioBlob.size < 1000) {
    chrome.runtime.sendMessage({
      type: "UPLOAD_FAILED",
      meetingId,
      error: "Recording too short or empty — no audio was captured.",
    });
    return;
  }

  const formData = new FormData();
  formData.append("file", audioBlob, `meeting_${meetingId}.webm`);

  const headers = { Authorization: `Bearer ${authToken}` };
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
    const errMsg = errData.detail || "Upload failed";
    chrome.runtime.sendMessage({
      type: "UPLOAD_FAILED",
      meetingId,
      error: errMsg,
    });
    throw new Error(errMsg);
  }

  // Notify background to clear badge and state
  chrome.runtime.sendMessage({
    type: "UPLOAD_COMPLETE",
    meetingId,
  });
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
    audioContext.close();
    audioContext = null;
  }
  mediaRecorder = null;
  audioChunks = [];
}
