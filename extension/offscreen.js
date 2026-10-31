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

// Durability: every recorder chunk is also written to IndexedDB (RecordingStore)
// and the local copy is only deleted once the backend accepted the upload.
let persistEnabled = false;
let chunkSeq = 0;
let writeChain = Promise.resolve();
const uploadsInFlight = new Set(); // meetingIds being uploaded right now

const RETRY_DELAYS_MS = [2000, 8000, 30000];
const MAX_RECOVERY_ATTEMPTS = 12;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_RECORDING") {
    startRecording(message.streamId, message.meetingId, message.token)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === "RECOVER_PENDING") {
    recoverPending(message.token)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message, remaining: 1, idle: isIdle() }));
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
  chunkSeq = 0;
  writeChain = Promise.resolve();
  try {
    await RecordingStore.startSession(meetingId, recordingStartTime);
    persistEnabled = true;
  } catch (err) {
    persistEnabled = false;
    console.warn("[Offscreen] Local persistence unavailable, recording from memory only:", err);
  }

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
      if (persistEnabled) {
        const seq = chunkSeq++;
        const id = currentMeetingId;
        writeChain = writeChain
          .then(() => RecordingStore.appendChunk(id, seq, event.data))
          .catch((err) => console.warn("[Offscreen] Failed to persist chunk:", err));
      }
    }
  };

  mediaRecorder.onerror = (err) => {
    console.error("[Offscreen] MediaRecorder error:", err);
  };

  mediaRecorder.start(5000);
  console.log("[Offscreen] MediaRecorder started successfully.");
}

function isIdle() {
  return !mediaRecorder && uploadsInFlight.size === 0;
}

function snapshotJob() {
  const durationSec = recordingStartTime
    ? Math.floor((Date.now() - recordingStartTime) / 1000)
    : null;
  const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
  console.log(`[Offscreen] Final audio blob created: ${audioBlob.size} bytes`);
  return {
    audioBlob,
    meetingId: currentMeetingId,
    durationSec,
    token: authToken,
    persisted: persistEnabled,
  };
}

async function stopRecording() {
  if (!mediaRecorder) {
    // Nothing is recording. Report it so the background clears its state
    // instead of waiting for an upload that will never happen.
    chrome.runtime.sendMessage({
      type: "UPLOAD_FAILED",
      meetingId: currentMeetingId,
      error: "No active recording to stop.",
      idle: isIdle(),
    });
    return null;
  }

  if (mediaRecorder.state === "inactive") {
    // The recorder ended on its own; upload whatever it captured.
    const job = snapshotJob();
    cleanup();
    return job;
  }

  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      // Wait for in-flight chunk writes so the local copy is complete.
      writeChain.then(() => {
        const job = snapshotJob();
        cleanup();
        resolve(job);
      });
    };

    mediaRecorder.stop();
  });
}

class UploadError extends Error {
  constructor(message, { retryable = false, discard = false } = {}) {
    super(message);
    this.retryable = retryable;
    this.discard = discard;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Uploads with backoff on network errors / 5xx / 408 / 409 / 429. Other
// failures (bad token, rejected file) are not retried here; the local copy
// stays and is retried later by RECOVER_PENDING.
async function uploadWithRetry(audioBlob, meetingId, durationSec, token) {
  let lastErr;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      await uploadAudioToBackend(audioBlob, meetingId, durationSec, token);
      return;
    } catch (err) {
      lastErr = err;
      if (!err.retryable || attempt === RETRY_DELAYS_MS.length) break;
      console.warn(`[Offscreen] Upload attempt ${attempt + 1} failed (${err.message}), retrying...`);
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
  throw lastErr;
}

async function uploadAudioToBackend(audioBlob, meetingId, durationSec, token) {
  if (!token) {
    throw new UploadError("Not logged in — auth token was not passed to recorder.");
  }

  if (audioBlob.size < 1000) {
    throw new UploadError("Recording too short or empty — no audio was captured.", { discard: true });
  }

  const formData = new FormData();
  formData.append("file", audioBlob, `meeting_${meetingId}.webm`);

  const headers = { Authorization: `Bearer ${token}` };
  if (durationSec && durationSec > 0) {
    headers["X-Recording-Duration"] = String(durationSec);
  }

  let res;
  try {
    res = await fetch(`${API_BASE}/meetings/${meetingId}/upload-audio`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (err) {
    throw new UploadError(`Network error: ${err.message}`, { retryable: true });
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Upload failed" }));
    const retryable = res.status >= 500 || [408, 409, 429].includes(res.status);
    throw new UploadError(errData.detail || "Upload failed", { retryable });
  }
}

function settle(meetingId, message) {
  uploadsInFlight.delete(meetingId);
  chrome.runtime.sendMessage({ ...message, meetingId, idle: isIdle() });
}

async function finishUpload({ audioBlob, meetingId, durationSec, token, persisted }) {
  uploadsInFlight.add(meetingId);
  try {
    await uploadWithRetry(audioBlob, meetingId, durationSec, token);
    if (persisted) await RecordingStore.remove(meetingId).catch(() => {});
    settle(meetingId, { type: "UPLOAD_COMPLETE" });
  } catch (err) {
    console.error("[Offscreen] Upload failed:", err);
    let retained = false;
    if (persisted) {
      if (err.discard) {
        await RecordingStore.remove(meetingId).catch(() => {});
      } else {
        retained = await RecordingStore.updateSession(meetingId, { status: "pending_upload", durationSec })
          .then(() => true)
          .catch(() => false);
      }
    }
    const suffix = retained
      ? " Your recording is saved on this device and will be uploaded automatically."
      : "";
    settle(meetingId, { type: "UPLOAD_FAILED", error: err.message + suffix });
  }
}

// Re-uploads recordings left in IndexedDB: failed uploads, or recordings whose
// recorder died with the browser/extension. Returns how many still need work.
async function recoverPending(token) {
  let sessions;
  try {
    sessions = await RecordingStore.listSessions();
  } catch (err) {
    console.warn("[Offscreen] Could not read pending recordings:", err);
    return { remaining: 0, idle: isIdle() };
  }

  let remaining = 0;
  for (const session of sessions) {
    const id = session.meetingId;
    if (mediaRecorder && id === currentMeetingId) continue; // live recording
    if (uploadsInFlight.has(id)) {
      remaining++;
      continue;
    }
    if ((session.attempts || 0) >= MAX_RECOVERY_ATTEMPTS) continue;

    uploadsInFlight.add(id);
    try {
      const blob = await RecordingStore.buildBlob(id);
      if (!blob || blob.size < 1000) {
        await RecordingStore.remove(id);
        continue;
      }
      const durationSec =
        session.durationSec ?? Math.floor((session.lastChunkAt - session.startTime) / 1000);
      await uploadWithRetry(blob, id, durationSec, token);
      await RecordingStore.remove(id);
      uploadsInFlight.delete(id);
      chrome.runtime.sendMessage({ type: "UPLOAD_COMPLETE", meetingId: id, recovered: true, idle: isIdle() });
    } catch (err) {
      console.warn(`[Offscreen] Recovery upload failed for meeting ${id}:`, err.message);
      remaining++;
      await RecordingStore.updateSession(id, {
        status: "pending_upload",
        attempts: (session.attempts || 0) + 1,
      }).catch(() => {});
    } finally {
      uploadsInFlight.delete(id);
    }
  }

  return { remaining, idle: isIdle() };
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
  persistEnabled = false;
}
