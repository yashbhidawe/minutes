const API_BASE = "http://localhost:8000";

let recordingState = {
  isRecording: false,
  meetingId: null,
  tabId: null,
  startTime: null,
  error: null,
};

// Restore state across service worker restarts
// Guard in case storage API isn't fully bound yet (MV3 cold start race)
if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(["recordingState"], (result) => {
    if (result.recordingState) {
      recordingState = result.recordingState;
      if (recordingState.isRecording) {
        chrome.action.setBadgeText({ text: "REC" });
        chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
      }
    }
  });
}

// ─── Offscreen document helpers ─────────────────────────────────────────────

async function ensureOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Record meeting tab audio for Minute AI notes generation",
  });
}

async function closeOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) {
    await chrome.offscreen.closeDocument();
  }
}

// ─── Message router ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "MEETING_STARTED" || message.type === "MANUAL_START_RECORDING") {
    handleMeetingStarted(message, sender, sendResponse);
    return true;
  }

  if (message.type === "MEETING_ENDED" || message.type === "MANUAL_STOP_RECORDING") {
    handleMeetingEnded(message, sender, sendResponse);
    return true;
  }

  // Offscreen doc successfully uploaded audio
  if (message.type === "UPLOAD_COMPLETE") {
    chrome.action.setBadgeText({ text: "" });
    recordingState = { isRecording: false, meetingId: null, tabId: null, startTime: null, error: null };
    chrome.storage.local.set({ recordingState });
    closeOffscreenDocument().catch(() => {});

    if (chrome.notifications && message.meetingId) {
      chrome.notifications.create(`meeting_${message.meetingId}`, {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Minute AI — Meeting Notes Ready",
        message: "Audio processing started. Click to view notes and action items.",
        priority: 2,
      });
    }
    return true;
  }

  // Offscreen doc failed to upload
  if (message.type === "UPLOAD_FAILED") {
    console.error(`Upload failed for meeting ${message.meetingId}: ${message.error}`);
    chrome.action.setBadgeText({ text: "ERR" });
    chrome.action.setBadgeBackgroundColor({ color: "#78716c" });
    recordingState = { isRecording: false, meetingId: null, tabId: null, startTime: null, error: message.error };
    chrome.storage.local.set({ recordingState });
    closeOffscreenDocument().catch(() => {});
    return true;
  }

  if (message.type === "GET_STATUS") {
    sendResponse({
      isRecording: recordingState.isRecording,
      meetingId: recordingState.meetingId,
      startTime: recordingState.startTime,
      error: recordingState.error,
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
});

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
    sendResponse({ meetingId: recordingState.meetingId, alreadyRecording: true });
    return;
  }

  chrome.storage.local.get(["token"], async (data) => {
    if (!data.token) {
      sendResponse({ error: "Not logged in to Minute AI extension" });
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

      // 2. Get media stream ID (must happen before offscreen doc is created)
      const streamId = await new Promise((resolve, reject) => {
        chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (id) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(id);
          }
        });
      });

      // 3. Create offscreen recording document
      await ensureOffscreenDocument();

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

async function handleMeetingEnded(message, sender, sendResponse) {
  if (!recordingState.isRecording || !recordingState.meetingId) {
    sendResponse({ error: "No active recording" });
    return;
  }

  try {
    // Tell offscreen doc to stop — it will upload directly to backend
    await chrome.runtime.sendMessage({ type: "STOP_RECORDING" });
    sendResponse({ status: "uploading", meetingId: recordingState.meetingId });
  } catch (err) {
    console.error("Error stopping recording:", err);
    // Offscreen doc is gone — just clean up state
    chrome.action.setBadgeText({ text: "" });
    recordingState = { isRecording: false, meetingId: null, tabId: null, startTime: null, error: err.message };
    chrome.storage.local.set({ recordingState });
    await closeOffscreenDocument();
    sendResponse({ error: err.message });
  }
}

// ─── Tab closed while recording ──────────────────────────────────────────────

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (recordingState.tabId === tabId && recordingState.isRecording) {
    console.log("Recorded tab closed — stopping recording and uploading...");
    try {
      await chrome.runtime.sendMessage({ type: "STOP_RECORDING" });
    } catch (err) {
      console.error("Failed to stop on tab close:", err);
      chrome.action.setBadgeText({ text: "" });
      recordingState = { isRecording: false, meetingId: null, tabId: null, startTime: null, error: null };
      chrome.storage.local.set({ recordingState });
      await closeOffscreenDocument();
    }
  }
});

// ─── Notification Click Listener ──────────────────────────────────────────────

if (chrome.notifications && chrome.notifications.onClicked) {
  chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId.startsWith("meeting_")) {
      const meetingId = notificationId.replace("meeting_", "");
      chrome.tabs.create({ url: `http://localhost:3000/meetings/${meetingId}` });
    }
  });
}
