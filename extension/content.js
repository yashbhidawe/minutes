(function () {
  let isInMeeting = false;
  let recordingStartTime = null;

  function detectMeetingState() {
    const callEnded = document.querySelector('[data-is-muted]');
    const meetingActive = document.querySelector(
      'div[role="main"], div[jsname="r4nke"], video'
    );
    const leaveButton = document.querySelector(
      '[aria-label*="Leave call"], [data-tooltip*="Leave"], button[aria-label*="end"], [aria-label*="End call"]'
    );

    const participants = document.querySelectorAll(
      '[data-participant-id], [data-initial-participant-id]'
    );

    const hasVideo = document.querySelectorAll("video").length > 0;
    const hasMainContent = !!document.querySelector('div[role="main"]');

    const meetingDetected = hasVideo && hasMainContent && participants.length > 0;

    if (meetingDetected && !isInMeeting) {
      isInMeeting = true;
      recordingStartTime = Date.now();

      const title = document.title.replace(" - Google Meet", "").trim();

      chrome.runtime.sendMessage({
        type: "MEETING_STARTED",
        tabId: null,
        title: title,
        duration: 1800,
      });
    }

    if (!meetingDetected && isInMeeting) {
      isInMeeting = false;

      chrome.runtime.sendMessage({
        type: "MEETING_ENDED",
        audioBlob: null,
      });
    }
  }

  let lastState = false;
  setInterval(() => {
    const hasVideo = document.querySelectorAll("video").length > 0;
    const hasMainContent = !!document.querySelector('div[role="main"]');

    const currentlyInMeeting = hasVideo && hasMainContent;

    if (currentlyInMeeting !== lastState) {
      lastState = currentlyInMeeting;

      if (currentlyInMeeting && !isInMeeting) {
        isInMeeting = true;
        recordingStartTime = Date.now();

        const title = document.title.replace(" - Google Meet", "").trim();

        chrome.runtime.sendMessage({
          type: "MEETING_STARTED",
          title: title,
          duration: 1800,
        });
      }

      if (!currentlyInMeeting && isInMeeting) {
        isInMeeting = false;

        chrome.runtime.sendMessage({
          type: "MEETING_ENDED",
        });
      }
    }
  }, 3000);

  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
    if (response && response.isRecording) {
      isInMeeting = true;
    }
  });
})();
