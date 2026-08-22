let mediaRecorder = null;
let audioChunks = [];
let mediaStream = null;
let audioContext = null;
let currentMeetingId = null;

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
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result;
          chrome.runtime.sendMessage({
            type: "AUDIO_RECORDED",
            dataUrl: dataUrl,
            meetingId: currentMeetingId,
          });
          cleanup();
          resolve();
        };
        reader.onerror = (err) => {
          cleanup();
          reject(err);
        };
        reader.readAsDataURL(audioBlob);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    mediaRecorder.stop();
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
