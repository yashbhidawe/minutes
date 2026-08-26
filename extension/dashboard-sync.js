(function () {
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
        chrome.runtime.sendMessage({
          type: "SET_TOKEN",
          token: token,
          email: email,
        });
      } else {
        // If extension currently has a token stored, notify it of logout
        chrome.runtime.sendMessage({ type: "GET_TOKEN" }, (res) => {
          if (res && res.token) {
            chrome.runtime.sendMessage({ type: "LOGOUT" });
          }
        });
      }
    } catch (err) {
      console.error("[Minute AI Sync] Error syncing auth state:", err);
    }
  }

  // Initial sync on page load
  syncAuthWithExtension();

  // Listen for window postMessage events from the Next.js app (auth-context)
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
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
