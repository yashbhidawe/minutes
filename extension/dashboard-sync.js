(function () {
  function notifyExtensionStatus(authenticated) {
    window.postMessage(
      { type: "MINUTE_AI_EXTENSION_STATUS", authenticated },
      window.location.origin
    );
  }

  function requestExtensionStatus() {
    chrome.runtime.sendMessage({ type: "GET_TOKEN" }, (response) => {
      if (chrome.runtime.lastError) {
        notifyExtensionStatus(false);
        return;
      }
      notifyExtensionStatus(Boolean(response?.token));
    });
  }

  function syncAuthWithExtension() {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      let email = null;

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          email = user?.email || null;
        } catch (e) {
          // ignore json parse error
        }
      }

      if (token) {
        chrome.runtime.sendMessage(
          {
            type: "SET_TOKEN",
            token: token,
            email: email,
          },
          requestExtensionStatus
        );
      } else {
        chrome.runtime.sendMessage({ type: "GET_TOKEN" }, (response) => {
          if (response?.token) {
            chrome.runtime.sendMessage({ type: "LOGOUT" });
          }
          notifyExtensionStatus(false);
        });
      }
    } catch (err) {
      console.error("[Minutes Sync] Error syncing auth state:", err);
    }
  }

  // Initial sync on page load
  syncAuthWithExtension();

  // Listen for window postMessage events from the Next.js app (auth-context)
  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    if (event.data?.type === "MINUTE_AI_EXTENSION_STATUS_REQUEST") {
      syncAuthWithExtension();
      return;
    }
    if (event.data && event.data.type === "MINUTE_AI_AUTH_CHANGE") {
      const { token, user } = event.data;
      if (token) {
        chrome.runtime.sendMessage({
          type: "SET_TOKEN",
          token: token,
          email: user?.email || null,
        });
      } else {
        chrome.runtime.sendMessage({ type: "LOGOUT" });
      }
    }
  });

  // Listen for storage events (e.g. across browser tabs)
  window.addEventListener("storage", (event) => {
    if (event.key === "token" || event.key === "user") {
      syncAuthWithExtension();
    }
  });

  // Listen for explicit sync request from extension popup or background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "REQUEST_DASHBOARD_TOKEN") {
      syncAuthWithExtension();
      sendResponse({ synced: true });
    }
  });
})();
