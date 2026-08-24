(function () {
  let isInMeeting = false;
  let pendingMeetingTimer = null;
  let widgetDismissed = false;
  let timerInterval = null;

  function checkIsGoogleMeetCall() {
    if (window.location.host !== "meet.google.com") return false;

    const path = window.location.pathname;
    if (!path || path === "/" || path.startsWith("/landing") || path.startsWith("/about")) {
      return false;
    }

    const isMeetingUrl = /^\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i.test(path);
    if (!isMeetingUrl) return false;

    const leaveButton = document.querySelector(
      '[aria-label*="Leave"], [aria-label*="End call"], [jsname="CQylEf"], [data-tooltip*="Leave"]'
    );
    const micCamControls = document.querySelector(
      '[aria-label*="microphone"], [aria-label*="camera"], [aria-label*="Microphone"], [aria-label*="Camera"]'
    );
    const toolbar = document.querySelector('[jsname="A137Wd"], [jscontroller="kAP0id"]');

    return !!(leaveButton || (micCamControls && toolbar));
  }

  function formatTimer(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }

  function renderFloatingWidget(status) {
    if (widgetDismissed || !status || !status.isRecording) {
      removeFloatingWidget();
      return;
    }

    let widget = document.getElementById("minute-ai-floating-widget");
    if (!widget) {
      widget = document.createElement("div");
      widget.id = "minute-ai-floating-widget";
      widget.style.cssText = `
        position: fixed;
        bottom: 84px;
        right: 24px;
        z-index: 999999;
        background: #1c1917;
        color: #f5f5f4;
        border: 1px solid #44403c;
        border-radius: 8px;
        padding: 12px 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 280px;
        transition: all 0.2s ease;
      `;

      widget.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444; animation: minutePulse 1.2s infinite; display: inline-block;"></span>
          <span style="font-size: 11px; font-weight: 700; font-family: monospace; color: #f87171; letter-spacing: 0.05em;" id="minute-widget-timer">00:00</span>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 11px; font-weight: 600; color: #f5f5f4; line-height: 1.2;">Minute AI</div>
          <div style="font-size: 10px; color: #a8a29e;">Recording Tab + Mic</div>
        </div>
        <button id="minute-stop-btn" style="
          background: #dc2626;
          color: white;
          border: none;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        ">Stop & Summarize</button>
        <button id="minute-close-btn" style="
          background: transparent;
          color: #a8a29e;
          border: none;
          font-size: 14px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        " title="Dismiss overlay (recording continues)">✕</button>
      `;

      // Inject pulse animation keyframes if not already injected
      if (!document.getElementById("minute-widget-style")) {
        const style = document.createElement("style");
        style.id = "minute-widget-style";
        style.innerHTML = `
          @keyframes minutePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(1.2); }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(widget);

      // Attach button event listeners
      document.getElementById("minute-stop-btn").addEventListener("click", () => {
        const stopBtn = document.getElementById("minute-stop-btn");
        stopBtn.textContent = "Processing...";
        stopBtn.disabled = true;
        chrome.runtime.sendMessage({ type: "MANUAL_STOP_RECORDING" });
      });

      document.getElementById("minute-close-btn").addEventListener("click", () => {
        widgetDismissed = true;
        removeFloatingWidget();
      });
    }

    // Update live clock
    const startTime = status.startTime || Date.now();
    const timerEl = document.getElementById("minute-widget-timer");
    if (timerEl) {
      timerEl.textContent = formatTimer(Date.now() - startTime);
    }
  }

  function removeFloatingWidget() {
    const widget = document.getElementById("minute-ai-floating-widget");
    if (widget) {
      widget.remove();
    }
  }

  function monitorMeetingState() {
    const currentlyInMeeting = checkIsGoogleMeetCall();

    if (currentlyInMeeting && !isInMeeting && !pendingMeetingTimer) {
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

    if (!currentlyInMeeting && pendingMeetingTimer) {
      clearTimeout(pendingMeetingTimer);
      pendingMeetingTimer = null;
    }

    if (!currentlyInMeeting && isInMeeting) {
      isInMeeting = false;
      widgetDismissed = false;
      removeFloatingWidget();
      chrome.runtime.sendMessage({ type: "MEETING_ENDED" });
    }

    // Query status to update floating widget
    chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
      if (response && response.isRecording) {
        isInMeeting = true;
        renderFloatingWidget(response);
      } else {
        removeFloatingWidget();
      }
    });
  }

  setInterval(monitorMeetingState, 1500);

  // Sync state on load
  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
    if (response && response.isRecording) {
      isInMeeting = true;
      renderFloatingWidget(response);
    }
  });
})();
