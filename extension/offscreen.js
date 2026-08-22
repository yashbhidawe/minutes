const API_BASE = "http://localhost:8000";

let mediaRecorder = null;
let audioChunks = [];
let mediaStream = null;
let audioContext = null;
let currentMeetingId = null;
let recordingStartTime = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_RECORDING") {
    startRecording(message.streamId, message.meetingId)
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

async function startRecording(streamId, meetingId) {
  currentMeetingId = meetingId;
  recordingStartTime = Date.now();
  audioChunks = [];

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
    video: false,
  });

  mediaStream = stream;

  // Pass-through audio context so the user can still hear call participants
  audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(audioContext.destination);

  mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.start(1000);
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
        cleanup();

        // Upload directly from offscreen document — bypasses service worker lifecycle
        // The offscreen doc is persistent; the service worker may be dead by now.
        await uploadAudioToBackend(audioBlob, currentMeetingId, durationSec);
        resolve();
      } catch (err) {
        cleanup();
        // Notify background of failure so it can update badge/state
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
  // Read token directly from storage — no service worker needed
  const storageData = await new Promise((resolve) =>
    chrome.storage.local.get(["token"], resolve)
  );

  if (!storageData.token) {
    chrome.runtime.sendMessage({
      type: "UPLOAD_FAILED",
      meetingId,
      error: "Not logged in — token missing at upload time.",
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

  const headers = { Authorization: `Bearer ${storageData.token}` };
  if (durationSec) {
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

  // Notify background of success so it can clear badge/state
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
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  mediaRecorder = null;
  audioChunks = [];
}
