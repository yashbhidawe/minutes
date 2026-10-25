(function () {
  let isInMeeting = false;
  let pendingMeetingTimer = null;
  let widgetDismissed = false;
  let timerInterval = null;
  let startBannerDismissed = false;
  let isWidgetMinimized = false;
  let widgetPosition = null; // { left, top }
  let currentRecordingStatus = null;

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

  function ensureWidgetStyles() {
    if (document.getElementById("minute-widget-style")) return;
    const style = document.createElement("style");
    style.id = "minute-widget-style";
    style.innerHTML = `
      @keyframes minutePulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.3; transform: scale(1.2); }
      }
      .minute-btn-icon {
        background: transparent;
        color: #a8a29e;
        border: none;
        cursor: pointer;
        padding: 3px 4px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: color 0.15s ease, background 0.15s ease;
      }
      .minute-btn-icon:hover {
        color: #f5f5f4;
        background: rgba(255, 255, 255, 0.08);
      }
      .minute-btn-icon:active {
        transform: scale(0.95);
      }
      .minute-drag-handle {
        cursor: grab;
        color: #78716c;
        display: inline-flex;
        align-items: center;
        padding: 0 2px;
        transition: color 0.15s ease;
      }
      .minute-drag-handle:hover {
        color: #d6d3d1;
      }
      #minutes-floating-widget:active .minute-drag-handle,
      #minutes-start-banner:active .minute-drag-handle {
        cursor: grabbing;
      }
    `;
    document.head.appendChild(style);
  }

  function makeDraggable(element, onMove) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest("button")) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = element.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      element.style.bottom = "auto";
      element.style.right = "auto";
      element.style.left = `${initialLeft}px`;
      element.style.top = `${initialTop}px`;
      element.style.transition = "none";
      document.body.style.userSelect = "none";

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newLeft = initialLeft + deltaX;
      let newTop = initialTop + deltaY;

      const rect = element.getBoundingClientRect();
      const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
      const maxTop = Math.max(8, window.innerHeight - rect.height - 8);

      newLeft = Math.max(8, Math.min(newLeft, maxLeft));
      newTop = Math.max(8, Math.min(newTop, maxTop));

      element.style.left = `${newLeft}px`;
      element.style.top = `${newTop}px`;

      if (onMove) {
        onMove({ left: newLeft, top: newTop });
      }
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      element.style.transition = "all 0.2s ease";
      document.body.style.userSelect = "";

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    }

    element.addEventListener("pointerdown", onPointerDown);
  }

  function clampWidgetPosition(widget) {
    if (!widgetPosition) return;
    const rect = widget.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
    widgetPosition.left = Math.max(8, Math.min(widgetPosition.left, maxLeft));
    widgetPosition.top = Math.max(8, Math.min(widgetPosition.top, maxTop));
    widget.style.left = `${widgetPosition.left}px`;
    widget.style.top = `${widgetPosition.top}px`;
    widget.style.bottom = "auto";
    widget.style.right = "auto";
  }

  window.addEventListener("resize", () => {
    const widget = document.getElementById("minutes-floating-widget");
    if (widget && widgetPosition) {
      clampWidgetPosition(widget);
    }
  });

  function renderWidgetInner(widget, minimized, status) {
    if (minimized) {
      widget.style.padding = "6px 12px";
      widget.style.gap = "8px";
      widget.style.minWidth = "auto";
      widget.style.borderRadius = "20px";
      widget.innerHTML = `
        <div class="minute-drag-handle" title="Drag to move anywhere">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="3" cy="2.5" r="1.3"/>
            <circle cx="7" cy="2.5" r="1.3"/>
            <circle cx="3" cy="7" r="1.3"/>
            <circle cx="7" cy="7" r="1.3"/>
            <circle cx="3" cy="11.5" r="1.3"/>
            <circle cx="7" cy="11.5" r="1.3"/>
          </svg>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #ef4444; animation: minutePulse 1.2s infinite; display: inline-block;"></span>
          <span style="font-size: 11px; font-weight: 700; font-family: monospace; color: #f87171; letter-spacing: 0.05em;" id="minute-widget-timer">00:00</span>
        </div>
        <button id="minute-stop-btn" style="
          background: #dc2626;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          line-height: 1.2;
        " title="Stop & Summarize">Stop</button>
        <button id="minute-expand-btn" class="minute-btn-icon" title="Expand widget">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
        <button id="minute-close-btn" class="minute-btn-icon" title="Dismiss overlay (recording continues)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;
    } else {
      widget.style.padding = "10px 14px";
      widget.style.gap = "12px";
      widget.style.minWidth = "290px";
      widget.style.borderRadius = "8px";
      widget.innerHTML = `
        <div class="minute-drag-handle" title="Drag to move anywhere">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="3" cy="2.5" r="1.3"/>
            <circle cx="7" cy="2.5" r="1.3"/>
            <circle cx="3" cy="7" r="1.3"/>
            <circle cx="7" cy="7" r="1.3"/>
            <circle cx="3" cy="11.5" r="1.3"/>
            <circle cx="7" cy="11.5" r="1.3"/>
          </svg>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444; animation: minutePulse 1.2s infinite; display: inline-block;"></span>
          <span style="font-size: 11px; font-weight: 700; font-family: monospace; color: #f87171; letter-spacing: 0.05em;" id="minute-widget-timer">00:00</span>
        </div>
        <div style="flex: 1; min-width: 90px;">
          <div style="font-size: 11px; font-weight: 600; color: #f5f5f4; line-height: 1.2;">Minutes</div>
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
        <button id="minute-minimize-btn" class="minute-btn-icon" title="Minimize to pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button id="minute-close-btn" class="minute-btn-icon" title="Dismiss overlay (recording continues)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;
    }

    const startTime = (status && status.startTime) || Date.now();
    const timerEl = widget.querySelector("#minute-widget-timer");
    if (timerEl) {
      timerEl.textContent = formatTimer(Date.now() - startTime);
    }

    attachWidgetListeners(widget, status);
  }

  function attachWidgetListeners(widget, status) {
    const stopBtn = widget.querySelector("#minute-stop-btn");
    if (stopBtn) {
      stopBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        stopBtn.textContent = isWidgetMinimized ? "..." : "Processing...";
        stopBtn.disabled = true;
        chrome.runtime.sendMessage({ type: "MANUAL_STOP_RECORDING" });
      });
    }

    const closeBtn = widget.querySelector("#minute-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        widgetDismissed = true;
        removeFloatingWidget();
      });
    }

    const minBtn = widget.querySelector("#minute-minimize-btn");
    if (minBtn) {
      minBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        isWidgetMinimized = true;
        renderWidgetInner(widget, true, currentRecordingStatus || status);
        clampWidgetPosition(widget);
      });
    }

    const expBtn = widget.querySelector("#minute-expand-btn");
    if (expBtn) {
      expBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        isWidgetMinimized = false;
        renderWidgetInner(widget, false, currentRecordingStatus || status);
        clampWidgetPosition(widget);
      });
    }
  }

  function renderFloatingWidget(status) {
    if (widgetDismissed || !status || !status.isRecording) {
      removeFloatingWidget();
      return;
    }

    currentRecordingStatus = status;

    let widget = document.getElementById("minutes-floating-widget");
    if (!widget) {
      ensureWidgetStyles();
      widget = document.createElement("div");
      widget.id = "minutes-floating-widget";
      widget.style.cssText = `
        position: fixed;
        z-index: 999999;
        background: #1c1917;
        color: #f5f5f4;
        border: 1px solid #44403c;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        user-select: none;
        -webkit-user-select: none;
        box-sizing: border-box;
        transition: all 0.2s ease;
      `;

      if (widgetPosition) {
        widget.style.left = `${widgetPosition.left}px`;
        widget.style.top = `${widgetPosition.top}px`;
        widget.style.bottom = "auto";
        widget.style.right = "auto";
      } else {
        widget.style.bottom = "84px";
        widget.style.right = "24px";
      }

      document.body.appendChild(widget);

      makeDraggable(widget, (pos) => {
        widgetPosition = pos;
      });

      renderWidgetInner(widget, isWidgetMinimized, status);
      if (widgetPosition) clampWidgetPosition(widget);
    }

    // Update live clock
    const startTime = status.startTime || Date.now();
    const timerEl = document.getElementById("minute-widget-timer");
    if (timerEl) {
      timerEl.textContent = formatTimer(Date.now() - startTime);
    }
  }

  function removeFloatingWidget() {
    const widget = document.getElementById("minutes-floating-widget");
    if (widget) {
      widget.remove();
    }
  }

  // ── Start-recording banner (shown while detecting / kicking off recording) ──

  function renderStartBanner(state) {
    // state: "detecting" | "starting" | "error"
    if (startBannerDismissed) return;

    let banner = document.getElementById("minutes-start-banner");
    if (!banner) {
      ensureWidgetStyles();
      banner = document.createElement("div");
      banner.id = "minutes-start-banner";
      banner.style.cssText = `
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
        gap: 12px;
        min-width: 260px;
        user-select: none;
        -webkit-user-select: none;
        box-sizing: border-box;
        transition: all 0.2s ease;
      `;
      document.body.appendChild(banner);
      makeDraggable(banner);
    }

    const stateStyles = {
      detecting: { dot: "#f59e0b", label: "Minutes", sub: "Meeting detected — preparing…" },
      starting:  { dot: "#3b82f6", label: "Minutes", sub: "Starting recording…" },
      error:     { dot: "#ef4444", label: "Minutes — Error", sub: "Could not start recording. Are you logged in?" },
    };
    const s = stateStyles[state] || stateStyles.detecting;

    banner.innerHTML = `
      <div class="minute-drag-handle" title="Drag to move anywhere">
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <circle cx="3" cy="2.5" r="1.3"/>
          <circle cx="7" cy="2.5" r="1.3"/>
          <circle cx="3" cy="7" r="1.3"/>
          <circle cx="7" cy="7" r="1.3"/>
          <circle cx="3" cy="11.5" r="1.3"/>
          <circle cx="7" cy="11.5" r="1.3"/>
        </svg>
      </div>
      <span style="width:8px;height:8px;border-radius:50%;background:${s.dot};display:inline-block;flex-shrink:0;"></span>
      <div style="flex:1;">
        <div style="font-size:11px;font-weight:600;color:#f5f5f4;line-height:1.2;">${s.label}</div>
        <div style="font-size:10px;color:#a8a29e;">${s.sub}</div>
      </div>
      <button id="minutes-banner-close" class="minute-btn-icon" title="Dismiss">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    document.getElementById("minutes-banner-close").addEventListener("click", () => {
      startBannerDismissed = true;
      removeStartBanner();
    });
  }

  function removeStartBanner() {
    const banner = document.getElementById("minutes-start-banner");
    if (banner) banner.remove();
  }

  function monitorMeetingState() {
    const currentlyInMeeting = checkIsGoogleMeetCall();

    if (currentlyInMeeting && !isInMeeting && !pendingMeetingTimer) {
      // Show "detecting" banner immediately so user knows extension is active
      renderStartBanner("detecting");
      pendingMeetingTimer = setTimeout(() => {
        pendingMeetingTimer = null;
        if (checkIsGoogleMeetCall() && !isInMeeting) {
          isInMeeting = true;
          renderStartBanner("starting");
          const title = document.title.replace(" - Google Meet", "").trim() || "Google Meet";
          chrome.runtime.sendMessage(
            { type: "MEETING_STARTED", title: title, duration: 0 },
            (res) => {
              if (res && res.error) {
                renderStartBanner("error");
                // Auto-hide error banner after 6s
                setTimeout(removeStartBanner, 6000);
              } else if (res && (res.meetingId || res.alreadyRecording)) {
                // Recording started — banner will be replaced by pill on next poll
                removeStartBanner();
                startBannerDismissed = false; // reset so pill can show
              }
            }
          );
        }
      }, 5000);
    }

    if (!currentlyInMeeting && pendingMeetingTimer) {
      clearTimeout(pendingMeetingTimer);
      pendingMeetingTimer = null;
      removeStartBanner();
    }

    if (!currentlyInMeeting && isInMeeting) {
      isInMeeting = false;
      widgetDismissed = false;
      startBannerDismissed = false;
      removeFloatingWidget();
      removeStartBanner();
      chrome.runtime.sendMessage({ type: "MEETING_ENDED" });
    }

    // Query status to update floating widget
    chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
      if (response && response.isRecording) {
        isInMeeting = true;
        removeStartBanner(); // pill takes over
        renderFloatingWidget(response);
      } else if (!pendingMeetingTimer) {
        // Only remove widget if we're not mid-detection
        removeFloatingWidget();
      }
    });
  }

  setInterval(monitorMeetingState, 1500);

  // Listen for push messages from background (instant pill update without waiting for next poll)
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "RECORDING_STARTED") {
      isInMeeting = true;
      widgetDismissed = false;
      startBannerDismissed = false;
      removeStartBanner();
      renderFloatingWidget({ isRecording: true, startTime: message.startTime, meetingId: message.meetingId });
    }
    if (message.type === "RECORDING_STOPPED") {
      removeFloatingWidget();
      removeStartBanner();
      widgetDismissed = false;
      startBannerDismissed = false;
    }
  });

  // Sync state on load
  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
    if (response && response.isRecording) {
      isInMeeting = true;
      renderFloatingWidget(response);
    }
  });
})();
