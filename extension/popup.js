// Endpoints injected via config.js at package time (see extension/build.sh).
const API_BASE =
  (typeof MINUTES_CONFIG !== "undefined" && MINUTES_CONFIG.API_BASE) ||
  "http://localhost:8000";
const DASHBOARD_URL =
  (typeof MINUTES_CONFIG !== "undefined" && MINUTES_CONFIG.DASHBOARD_URL) ||
  "http://localhost:3000";
const DASHBOARD_URL_PATTERNS =
  (typeof MINUTES_CONFIG !== "undefined" && MINUTES_CONFIG.DASHBOARD_HOSTS) || [
    "http://localhost:3000/*",
    "http://127.0.0.1:3000/*",
  ];

const loginView = document.getElementById("login-view");
const mainView = document.getElementById("main-view");
const loginForm = document.getElementById("login-form");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");
const mainError = document.getElementById("main-error");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

const gotoDashboardBtn = document.getElementById("goto-dashboard-btn");
const toggleManualLoginBtn = document.getElementById("toggle-manual-login");

const recordingCard = document.getElementById("recording-card");
const idleCard = document.getElementById("idle-card");
const recordingTimer = document.getElementById("recording-timer");
const startRecBtn = document.getElementById("start-rec-btn");
const stopRecBtn = document.getElementById("stop-rec-btn");
const openDashboardBtn = document.getElementById("open-dashboard-btn");

let timerInterval = null;

function showView(view) {
  loginView.classList.toggle("hidden", view !== "login");
  mainView.classList.toggle("hidden", view !== "main");
}

function showError(el, msg) {
  if (!msg) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hideError(el) {
  el.classList.add("hidden");
}

function formatTimer(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

function updateUI(status) {
  hideError(mainError);

  if (status && status.error) {
    showError(mainError, status.error);
  }

  if (status && status.isRecording) {
    recordingCard.classList.remove("hidden");
    idleCard.classList.add("hidden");

    const startTime = status.startTime || Date.now();
    if (timerInterval) clearInterval(timerInterval);

    const updateClock = () => {
      const elapsed = Date.now() - startTime;
      recordingTimer.textContent = formatTimer(elapsed);
    };
    updateClock();
    timerInterval = setInterval(updateClock, 1000);
  } else {
    recordingCard.classList.add("hidden");
    idleCard.classList.remove("hidden");
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
}

function checkAuthState() {
  chrome.runtime.sendMessage({ type: "GET_TOKEN" }, (response) => {
    if (response && response.token) {
      showView("main");
      userEmail.textContent = response.email || "Logged in";

      chrome.runtime.sendMessage({ type: "GET_STATUS" }, (statusResponse) => {
        updateUI(statusResponse);
      });
    } else {
      // Try requesting active dashboard sync from open tabs
      if (chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query(
          { url: DASHBOARD_URL_PATTERNS },
          (tabs) => {
            if (tabs && tabs.length > 0) {
              tabs.forEach((tab) => {
                chrome.tabs.sendMessage(tab.id, { type: "REQUEST_DASHBOARD_TOKEN" }, () => {
                  if (chrome.runtime.lastError) {
                    // Suppress tab error if tab script isn't ready
                  }
                });
              });
            }
          }
        );
      }
      showView("login");
    }
  });
}

// Listen for storage changes so popup updates dynamically when user logs in via dashboard tab
if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && (changes.token || changes.email)) {
      chrome.runtime.sendMessage({ type: "GET_TOKEN" }, (response) => {
        if (response && response.token) {
          showView("main");
          userEmail.textContent = response.email || "Logged in";
          chrome.runtime.sendMessage({ type: "GET_STATUS" }, (statusResponse) => {
            updateUI(statusResponse);
          });
        } else {
          showView("login");
        }
      });
    }
  });
}

// Initial check on popup open
checkAuthState();

// Redirect to dashboard button
if (gotoDashboardBtn) {
  gotoDashboardBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: DASHBOARD_URL });
  });
}

// Toggle manual email/password form
if (toggleManualLoginBtn) {
  toggleManualLoginBtn.addEventListener("click", () => {
    if (loginForm) {
      loginForm.classList.toggle("hidden");
    }
  });
}

// Manual login form submission fallback
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError(loginError);

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in...";

    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Login failed");
      }

      const data = await res.json();

      chrome.runtime.sendMessage(
        {
          type: "SET_TOKEN",
          token: data.access_token,
          email: email,
        },
        () => {
          showView("main");
          userEmail.textContent = email;

          chrome.runtime.sendMessage({ type: "GET_STATUS" }, (statusResponse) => {
            updateUI(statusResponse);
          });
        }
      );
    } catch (err) {
      showError(loginError, err.message);
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign In Directly";
    }
  });
}

logoutBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "LOGOUT" }, () => {
    showView("login");
    const emailInput = document.getElementById("email");
    const passInput = document.getElementById("password");
    if (emailInput) emailInput.value = "";
    if (passInput) passInput.value = "";
  });
});

async function requestMicPermissionIfNeeded() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
  } catch (err) {
    console.warn("Microphone permission check in popup skipped/failed:", err);
  }
}

startRecBtn.addEventListener("click", async () => {
  startRecBtn.disabled = true;
  startRecBtn.textContent = "Starting Recording...";
  hideError(mainError);

  await requestMicPermissionIfNeeded();

  chrome.runtime.sendMessage({ type: "MANUAL_START_RECORDING" }, (res) => {
    startRecBtn.disabled = false;
    startRecBtn.textContent = "Record Current Tab";

    if (res && res.error) {
      showError(mainError, res.error);
    } else {
      chrome.runtime.sendMessage({ type: "GET_STATUS" }, (statusResponse) => {
        updateUI(statusResponse);
      });
    }
  });
});

stopRecBtn.addEventListener("click", () => {
  stopRecBtn.disabled = true;
  stopRecBtn.textContent = "Stopping & Processing...";
  hideError(mainError);

  chrome.runtime.sendMessage({ type: "MANUAL_STOP_RECORDING" }, (res) => {
    stopRecBtn.disabled = false;
    stopRecBtn.textContent = "Stop & Process Notes";

    if (res && res.error) {
      showError(mainError, res.error);
    } else {
      chrome.runtime.sendMessage({ type: "GET_STATUS" }, (statusResponse) => {
        updateUI(statusResponse);
      });
    }
  });
});

if (openDashboardBtn) {
  openDashboardBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: `${DASHBOARD_URL}/dashboard` });
  });
}

const setupMicBtn = document.getElementById("setup-mic-btn");
if (setupMicBtn) {
  setupMicBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("permissions.html") });
  });
}

setInterval(() => {
  if (!mainView.classList.contains("hidden")) {
    chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
      updateUI(response);
    });
  }
}, 1500);
