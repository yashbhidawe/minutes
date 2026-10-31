// Extension config (API_BASE, DASHBOARD_URL). build.sh injects prod values
// into config.js when packaging the distributable zip.
try {
  importScripts("config.js");
} catch (e) {
  // config.js missing (dev) — fallbacks below apply.
}

try {
  importScripts("recording-store.js");
} catch (e) {
  // Without the store, recordings are still uploaded but not recoverable.
}

const API_BASE =
  (typeof MINUTES_CONFIG !== "undefined" && MINUTES_CONFIG.API_BASE) ||
  "http://localhost:8000";
const DASHBOARD_URL =
  (typeof MINUTES_CONFIG !== "undefined" && MINUTES_CONFIG.DASHBOARD_URL) ||
  "http://localhost:3000";

let recordingState = {
  isRecording: false,
  meetingId: null,
  tabId: null,
  startTime: null,
  error: null,
};

// Restore state across service worker restarts. Handlers must await
// `stateReady`: a worker woken by a tab close or message starts with default
// state until this storage read resolves, and would otherwise ignore the event.
const stateReady = new Promise((resolve) => {
  if (!(chrome.storage && chrome.storage.local)) return resolve();
  chrome.storage.local.get(["recordingState"], (result) => {
    if (result && result.recordingState) {
      recordingState = result.recordingState;
      if (recordingState.isRecording) {
        chrome.action.setBadgeText({ text: "REC" });
        chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
      }
    }
    resolve();
  });
});

// ─── Offscreen document helpers ─────────────────────────────────────────────

async function ensureOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Record meeting tab audio for Minutes notes generation",
  });
}

async function closeOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) {
    await chrome.offscreen.closeDocument();
  }
}

// ─── Recovery of saved recordings ────────────────────────────────────────────

const RETRY_ALARM = "retry-uploads";

function idleState(error = null) {
  return { isRecording: false, meetingId: null, tabId: null, startTime: null, error };
}

async function hasPendingRecordings() {
  try {
    const sessions = await RecordingStore.listSessions();
    return sessions.some((s) => !(recordingState.isRecording && s.meetingId === recordingState.meetingId));
  } catch (err) {
    return false;
  }
}

async function scheduleUploadRetry() {
  if (!(await chrome.alarms.get(RETRY_ALARM))) {
    chrome.alarms.create(RETRY_ALARM, { delayInMinutes: 2, periodInMinutes: 10 });
  }
}

let recovering = false;

// Re-uploads recordings saved on this device (failed uploads, or recordings
// whose recorder died with the browser). Safe to call any time; it is a no-op
// unless something is pending.
async function recoverPendingUploads() {
  if (recovering) return;
  recovering = true;
  try {
    await stateReady;
    if (!(await hasPendingRecordings())) {
      chrome.alarms.clear(RETRY_ALARM);
      return;
    }
    const { token } = await chrome.storage.local.get("token");
    if (!token) return; // keep the alarm; retry after the user logs in
    await scheduleUploadRetry();
    await ensureOffscreenDocument();
    const res = await chrome.runtime.sendMessage({ type: "RECOVER_PENDING", token });
    if (res && res.remaining === 0) {
      chrome.alarms.clear(RETRY_ALARM);
      if (!recordingState.isRecording) chrome.action.setBadgeText({ text: "" });
    }
    if (res && res.idle && !recordingState.isRecording) await closeOffscreenDocument();
  } catch (err) {
    console.warn("Pending upload recovery failed:", err);
  } finally {
    recovering = false;
  }
}

// After a browser/extension restart the offscreen recorder is gone but the
// persisted state still says "recording" — which would block every new start.
async function reconcileRecordingState() {
  if (!recordingState.isRecording) return;
  if (await chrome.offscreen.hasDocument()) return;
  chrome.action.setBadgeText({ text: "" });
  recordingState = idleState("Recording was interrupted. Saved audio will be uploaded automatically.");
  chrome.storage.local.set({ recordingState });
}

async function bootRecovery() {
  await stateReady;
  await reconcileRecordingState();
  await recoverPendingUploads();
}

stateReady.then(reconcileRecordingState);
chrome.runtime.onStartup.addListener(bootRecovery);
chrome.runtime.onInstalled.addListener(bootRecovery);
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === RETRY_ALARM) recoverPendingUploads();
});

// ─── Message router ──────────────────────────────────────────────────────────

const HANDLED_MESSAGES = new Set([
  "MEETING_STARTED", "MANUAL_START_RECORDING", "MEETING_ENDED", "MANUAL_STOP_RECORDING",
  "UPLOAD_COMPLETE", "UPLOAD_FAILED", "GET_STATUS", "SET_TOKEN", "GET_TOKEN", "LOGOUT",
]);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!HANDLED_MESSAGES.has(message.type)) return false;
  stateReady.then(() => routeMessage(message, sender, sendResponse));
  return true;
});

function routeMessage(message, sender, sendResponse) {
  if (message.type === "MEETING_STARTED" || message.type === "MANUAL_START_RECORDING") {
    handleMeetingStarted(message, sender, sendResponse);
    return true;
  }

  if (message.type === "MEETING_ENDED" || message.type === "MANUAL_STOP_RECORDING") {
    handleMeetingEnded(message, sender, sendResponse);
    return true;
  }

  // Offscreen doc successfully uploaded audio. The recording itself already
  // ended when it was stopped, so this must not touch a newer recording's state.
  if (message.type === "UPLOAD_COMPLETE") {
    handleUploadComplete(message);
    return true;
  }

  // Offscreen doc failed to upload (the audio stays saved locally and is retried)
  if (message.type === "UPLOAD_FAILED") {
    handleUploadFailed(message);
    return true;
  }

  if (message.type === "GET_STATUS") {
    sendResponse({
      isRecording: recordingState.isRecording,
      meetingId: recordingState.meetingId,
      startTime: recordingState.startTime,
      error: recordingState.error,
      isThisTab: !!sender.tab && sender.tab.id === recordingState.tabId,
    });
    return true;
  }

  if (message.type === "SET_TOKEN") {
    chrome.storage.local.set({ token: message.token, email: message.email });
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "GET_TOKEN") {
    chrome.storage.local.get(["token", "email"], (data) => {
      sendResponse({ token: data.token || null, email: data.email || null });
    });
    return true;
  }

  if (message.type === "LOGOUT") {
    chrome.storage.local.remove(["token", "email", "recordingState"]);
    if (recordingState.isRecording) {
      chrome.runtime.sendMessage({ type: "STOP_RECORDING" }).catch(() => {});
      closeOffscreenDocument().catch(() => {});
    }
    chrome.action.setBadgeText({ text: "" });
    recordingState = { isRecording: false, meetingId: null, tabId: null, startTime: null, error: null };
    sendResponse({ ok: true });
    return true;
  }
}

async function handleUploadComplete(message) {
  if (!recordingState.isRecording) {
    chrome.action.setBadgeText({ text: "" });
    if (recordingState.error) {
      recordingState.error = null;
      chrome.storage.local.set({ recordingState });
    }
  }

  const pending = await hasPendingRecordings();
  if (message.idle && !recordingState.isRecording && !pending) {
    closeOffscreenDocument().catch(() => {});
  }

  if (chrome.notifications && message.meetingId) {
    chrome.notifications.create(`meeting_${message.meetingId}`, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Minutes — Meeting Notes Ready",
      message: "Audio processing started. Click to view notes and action items.",
      priority: 2,
    });
  }

  // The network evidently works now; flush anything else that was saved.
  if (pending && !message.recovered) recoverPendingUploads();
}

async function handleUploadFailed(message) {
  console.error(`Upload failed for meeting ${message.meetingId}: ${message.error}`);
  if (!recordingState.isRecording) {
    chrome.action.setBadgeText({ text: "ERR" });
    chrome.action.setBadgeBackgroundColor({ color: "#78716c" });
    recordingState = idleState(message.error);
    chrome.storage.local.set({ recordingState });
  }
  if (await hasPendingRecordings()) await scheduleUploadRetry();
  if (message.idle && !recordingState.isRecording) closeOffscreenDocument().catch(() => {});
}

// ─── Tab helpers ─────────────────────────────────────────────────────────────

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs && tabs.length > 0 ? tabs[0].id : null;
}

// ─── Meeting started ─────────────────────────────────────────────────────────

async function handleMeetingStarted(message, sender, sendResponse) {
  let tabId = sender.tab ? sender.tab.id : message.tabId;
  if (!tabId) tabId = await getActiveTabId();

  if (!tabId) {
    sendResponse({ error: "No active tab found to record" });
    return;
  }

  if (recordingState.isRecording) {
    await reconcileRecordingState();
  }
  if (recordingState.isRecording) {
    sendResponse({ meetingId: recordingState.meetingId, alreadyRecording: true });
    return;
  }

  chrome.storage.local.get(["token"], async (data) => {
    if (!data.token) {
      sendResponse({ error: "Not logged in to Minutes extension" });
      return;
    }

    let createdMeetingId = null;

    try {
      const title =
        message.title ||
        `Meeting ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

      // 1. Create meeting record in backend
      const res = await fetch(`${API_BASE}/meetings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({ title, duration_sec: 0 }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to create meeting" }));
        sendResponse({ error: err.detail || "Failed to create meeting" });
        return;
      }

      const meeting = await res.json();
      createdMeetingId = meeting.id;

      // 2. Ensure offscreen document exists
      await ensureOffscreenDocument();

      // 3. Get media stream ID for tab audio capture
      const streamId = await new Promise((resolve, reject) => {
        chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (id) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(id);
          }
        });
      });

      // 4. Start recording inside offscreen doc — pass token directly so
      //    offscreen.js never needs to call chrome.storage (not available there)
      await chrome.runtime.sendMessage({
        type: "START_RECORDING",
        streamId,
        meetingId: meeting.id,
        token: data.token,
      });

      recordingState = {
        isRecording: true,
        meetingId: meeting.id,
        tabId,
        startTime: Date.now(),
        error: null,
      };
      chrome.storage.local.set({ recordingState });
      chrome.action.setBadgeText({ text: "REC" });
      chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });

      // Push instant update to the Meet tab so the pill appears without waiting for next poll
      chrome.tabs.sendMessage(tabId, {
        type: "RECORDING_STARTED",
        meetingId: meeting.id,
        startTime: recordingState.startTime,
      }).catch(() => {}); // tab may not have content script yet — polling will catch it

      sendResponse({ meetingId: meeting.id });
    } catch (err) {
      console.error("Error starting recording:", err);

      // Clean up orphan meeting row if tab capture or recording start failed
      if (createdMeetingId && data.token) {
        fetch(`${API_BASE}/meetings/${createdMeetingId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${data.token}` },
        }).catch(() => {});
      }

      recordingState.error = err.message;
      sendResponse({ error: err.message });
    }
  });
}

// ─── Meeting ended ───────────────────────────────────────────────────────────

let stopInFlight = null;

// Stops the recorder and hands the audio to the offscreen uploader. Returns as
// soon as the recorder has stopped; the upload continues on its own and reports
// back with UPLOAD_COMPLETE / UPLOAD_FAILED. Concurrent callers (e.g. the
// meeting ending and the tab closing together) share one stop.
function stopActiveRecording() {
  if (!stopInFlight) {
    stopInFlight = doStopActiveRecording().finally(() => {
      stopInFlight = null;
    });
  }
  return stopInFlight;
}

async function doStopActiveRecording() {
  const { meetingId, tabId } = recordingState;
  const res = await chrome.runtime.sendMessage({ type: "STOP_RECORDING" });
  if (res && res.error) throw new Error(res.error);

  chrome.action.setBadgeText({ text: "UP" });
  chrome.action.setBadgeBackgroundColor({ color: "#78716c" });
  recordingState = idleState();
  await chrome.storage.local.set({ recordingState });
  if (tabId) {
    chrome.tabs.sendMessage(tabId, { type: "RECORDING_STOPPED" }).catch(() => {});
  }
  return meetingId;
}

async function resetAfterStopFailure(err) {
  chrome.action.setBadgeText({ text: "" });
  recordingState = idleState(err.message);
  await chrome.storage.local.set({ recordingState });
  await closeOffscreenDocument().catch(() => {});
}

async function handleMeetingEnded(message, sender, sendResponse) {
  // Another Meet/Zoom/Teams tab leaving a call must not stop this recording.
  if (message.type === "MEETING_ENDED" && sender.tab && sender.tab.id !== recordingState.tabId) {
    sendResponse({ ignored: true });
    return;
  }

  if (!recordingState.isRecording || !recordingState.meetingId) {
    sendResponse({ error: "No active recording" });
    return;
  }

  try {
    const meetingId = await stopActiveRecording();
    sendResponse({ status: "uploading", meetingId });
  } catch (err) {
    console.error("Error stopping recording:", err);
    // Another caller may have finished the stop while this one failed.
    if (recordingState.isRecording) await resetAfterStopFailure(err);
    sendResponse({ error: err.message });
  }
}

// ─── Tab closed while recording ──────────────────────────────────────────────

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await stateReady;
  if (recordingState.tabId === tabId && recordingState.isRecording) {
    console.log("Recorded tab closed — stopping recording and uploading...");
    try {
      await stopActiveRecording();
    } catch (err) {
      console.error("Failed to stop on tab close:", err);
      if (recordingState.isRecording) await resetAfterStopFailure(err);
    }
  }
});

// ─── Notification Click Listener ──────────────────────────────────────────────

if (chrome.notifications && chrome.notifications.onClicked) {
  chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId.startsWith("meeting_")) {
      const meetingId = notificationId.replace("meeting_", "");
      chrome.tabs.create({ url: `${DASHBOARD_URL}/meetings/${meetingId}` });
    }
  });
}
