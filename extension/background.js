const API_BASE = "http://localhost:8000";

let recordingState = {
  isRecording: false,
  meetingId: null,
  tabId: null,
  startTime: null,
  streamId: null,
  error: null,
};

chrome.storage.local.get(["recordingState"], (result) => {
  if (result.recordingState) {
    recordingState = result.recordingState;
    if (recordingState.isRecording) {
      chrome.action.setBadgeText({ text: "REC" });
      chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
    }
  }
});

async function ensureOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) {
    return;
  }
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "MEETING_STARTED" || message.type === "MANUAL_START_RECORDING") {
    handleMeetingStarted(message, sender, sendResponse);
    return true;
  }

  if (message.type === "MEETING_ENDED" || message.type === "MANUAL_STOP_RECORDING") {
    handleMeetingEnded(message, sender, sendResponse);
    return true;
  }

  if (message.type === "AUDIO_RECORDED") {
    handleAudioRecorded(message, sendResponse);
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
    recordingState = { isRecording: false, meetingId: null, tabId: null, startTime: null, streamId: null, error: null };
    sendResponse({ ok: true });
    return true;
  }
});

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs && tabs.length > 0 ? tabs[0].id : null;
}

async function handleMeetingStarted(message, sender, sendResponse) {
  let tabId = sender.tab ? sender.tab.id : message.tabId;
  if (!tabId) {
    tabId = await getActiveTabId();
  }

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

    try {
      const title = message.title || `Meeting ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const durationSec = message.duration || 1800;

      // 1. Create meeting in backend
      const res = await fetch(`${API_BASE}/meetings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`,
        },
        body: JSON.stringify({ title, duration_sec: durationSec }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to create meeting" }));
        sendResponse({ error: err.detail || "Failed to create meeting" });
        return;
      }

      const meeting = await res.json();

      // 2. Get Media Stream ID for target tab
      const streamId = await new Promise((resolve, reject) => {
        chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (id) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(id);
          }
        });
      });

      // 3. Ensure Offscreen Document exists
      await ensureOffscreenDocument();

      // 4. Instruct Offscreen Document to start recording
      await chrome.runtime.sendMessage({
        type: "START_RECORDING",
        streamId: streamId,
        meetingId: meeting.id,
      });

      recordingState = {
        isRecording: true,
        meetingId: meeting.id,
        tabId: tabId,
        startTime: Date.now(),
        streamId: streamId,
        error: null,
      };

      chrome.storage.local.set({ recordingState });
      chrome.action.setBadgeText({ text: "REC" });
      chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });

      sendResponse({ meetingId: meeting.id });
    } catch (err) {
      console.error("Error starting recording:", err);
      recordingState.error = err.message;
      sendResponse({ error: err.message });
    }
  });
}

async function handleMeetingEnded(message, sender, sendResponse) {
  if (!recordingState.isRecording || !recordingState.meetingId) {
    sendResponse({ error: "No active recording" });
    return;
  }

  try {
    await chrome.runtime.sendMessage({ type: "STOP_RECORDING" });
    sendResponse({ status: "stopping", meetingId: recordingState.meetingId });
  } catch (err) {
    console.error("Error stopping recording:", err);
    sendResponse({ error: err.message });
  }
}

async function handleAudioRecorded(message, sendResponse) {
  const { dataUrl, meetingId } = message;

  chrome.action.setBadgeText({ text: "" });

  chrome.storage.local.get(["token"], async (data) => {
    if (!data.token) {
      if (sendResponse) sendResponse({ error: "Not logged in" });
      await closeOffscreenDocument();
      return;
    }

    try {
      const audioRes = await fetch(dataUrl);
      const audioBlob = await audioRes.blob();

      const formData = new FormData();
      formData.append("file", audioBlob, `meeting_${meetingId}.webm`);

      const uploadRes = await fetch(`${API_BASE}/meetings/${meetingId}/upload-audio`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ detail: "Upload failed" }));
        console.error("Upload error:", err);
        recordingState.error = err.detail || "Upload failed";
        if (sendResponse) sendResponse({ error: err.detail || "Upload failed" });
      } else {
        const uploadData = await uploadRes.json();
        console.log("Audio uploaded successfully for meeting:", meetingId, uploadData);
        if (sendResponse) sendResponse({ ok: true, meetingId });
      }
    } catch (err) {
      console.error("Failed to process recorded audio:", err);
      recordingState.error = err.message;
      if (sendResponse) sendResponse({ error: err.message });
    } finally {
      recordingState = {
        isRecording: false,
        meetingId: null,
        tabId: null,
        startTime: null,
        streamId: null,
        error: null,
      };
      chrome.storage.local.set({ recordingState });
      await closeOffscreenDocument();
    }
  });
}

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (recordingState.tabId === tabId && recordingState.isRecording) {
    console.log("Recorded tab closed, stopping recording...");
    chrome.action.setBadgeText({ text: "" });
    try {
      await chrome.runtime.sendMessage({ type: "STOP_RECORDING" });
    } catch (err) {
      console.error("Failed to stop recording on tab remove:", err);
      await closeOffscreenDocument();
      recordingState = {
        isRecording: false,
        meetingId: null,
        tabId: null,
        startTime: null,
        streamId: null,
        error: null,
      };
      chrome.storage.local.set({ recordingState });
    }
  }
});
