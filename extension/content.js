(function () {
  let isInMeeting = false;
  let pendingMeetingTimer = null;

  function checkIsGoogleMeetCall() {
    if (window.location.host !== "meet.google.com") return false;

    const path = window.location.pathname;
    if (!path || path === "/" || path.startsWith("/landing") || path.startsWith("/about")) {
      return false;
    }

    // Require a leave/end button to confirm an active call (not lobby/pre-join)
    const leaveButton = document.querySelector(
      '[aria-label*="Leave"], [aria-label*="End call"], [jsname="CQylEf"]'
    );

    return !!leaveButton;
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
