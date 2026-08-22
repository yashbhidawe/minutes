(function () {
  let isInMeeting = false;

  function checkIsGoogleMeetCall() {
    if (window.location.host !== "meet.google.com") {
      return false;
    }

    const path = window.location.pathname;
    // Exclude root, landing pages, about, etc.
    if (!path || path === "/" || path.startsWith("/landing") || path.startsWith("/about")) {
      return false;
    }

    // Look for indicators of active meeting
    const leaveButton = document.querySelector(
      '[aria-label*="Leave"], [data-tooltip*="Leave"], button[aria-label*="Leave"], [aria-label*="End call"], [jsname="CQylEf"]'
    );
    const mainContent = document.querySelector('div[role="main"], div[jsname="r4nke"], video');
    const bottomBar = document.querySelector('[jsname="tB67fe"], [data-bottom-sheet]');

    return !!(leaveButton || (mainContent && bottomBar));
  }

  function monitorMeetingState() {
    const currentlyInMeeting = checkIsGoogleMeetCall();

    if (currentlyInMeeting && !isInMeeting) {
      isInMeeting = true;
      const title = document.title.replace(" - Google Meet", "").trim() || "Google Meet";

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

  // Check every 2 seconds
  setInterval(monitorMeetingState, 2000);

  // Sync state on load
  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
    if (response && response.isRecording) {
      isInMeeting = true;
    }
  });
})();
