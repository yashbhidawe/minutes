(function () {
  let isInMeeting = false;
  let pendingMeetingTimer = null;

  function checkIsGoogleMeetCall() {
    if (window.location.host !== "meet.google.com") return false;

    const path = window.location.pathname;
    if (!path || path === "/" || path.startsWith("/landing") || path.startsWith("/about")) {
      return false;
    }

    const isMeetingUrl = /^\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i.test(path);
    if (!isMeetingUrl) return false;

    // Require active in-call DOM elements (Leave call button, mic/cam controls, or toolbar)
    const leaveButton = document.querySelector(
      '[aria-label*="Leave"], [aria-label*="End call"], [jsname="CQylEf"], [data-tooltip*="Leave"]'
    );
    const micCamControls = document.querySelector(
      '[aria-label*="microphone"], [aria-label*="camera"], [aria-label*="Microphone"], [aria-label*="Camera"]'
    );
    const toolbar = document.querySelector('[jsname="A137Wd"], [jscontroller="kAP0id"]');

    return !!(leaveButton || (micCamControls && toolbar));
  }

  function monitorMeetingState() {
    const currentlyInMeeting = checkIsGoogleMeetCall();

    if (currentlyInMeeting && !isInMeeting && !pendingMeetingTimer) {
      // Wait 5 seconds to confirm this isn't the lobby/pre-join transitioning
      pendingMeetingTimer = setTimeout(() => {
        pendingMeetingTimer = null;
        if (checkIsGoogleMeetCall() && !isInMeeting) {
          isInMeeting = true;
          const title = document.title.replace(" - Google Meet", "").trim() || "Google Meet";
          chrome.runtime.sendMessage({
            type: "MEETING_STARTED",
            title: title,
            duration: 0,
          });
        }
      }, 5000);
    }

    // Cancel pending timer if we left before 5s
    if (!currentlyInMeeting && pendingMeetingTimer) {
      clearTimeout(pendingMeetingTimer);
      pendingMeetingTimer = null;
    }

    if (!currentlyInMeeting && isInMeeting) {
      isInMeeting = false;
      chrome.runtime.sendMessage({ type: "MEETING_ENDED" });
    }
  }

  setInterval(monitorMeetingState, 2000);

  // Sync on load
  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
    if (response && response.isRecording) {
      isInMeeting = true;
    }
  });
})();
