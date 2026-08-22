const API_BASE = "http://localhost:8000";

const loginView = document.getElementById("login-view");
const mainView = document.getElementById("main-view");
const loginForm = document.getElementById("login-form");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const meetingInfo = document.getElementById("meeting-info");

function showView(view) {
  loginView.classList.toggle("hidden", view !== "login");
  mainView.classList.toggle("hidden", view !== "main");
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hideError(el) {
  el.classList.add("hidden");
}

function updateStatus(isRecording, meetingId) {
  statusDot.className = "status-dot";

  if (isRecording) {
    statusDot.classList.add("recording");
    statusText.innerHTML = "<strong>Recording</strong> meeting in progress";
    meetingInfo.textContent = `Meeting #${meetingId} is being recorded. Audio will upload automatically when the call ends.`;
  } else {
    statusDot.classList.add("active");
    statusText.innerHTML = "<strong>Connected</strong>";
    meetingInfo.textContent = "Open Google Meet to start recording. Audio is captured automatically when the call ends.";
  }
}

chrome.runtime.sendMessage({ type: "GET_TOKEN" }, (response) => {
  if (response && response.token) {
    showView("main");
    userEmail.textContent = response.email || "Logged in";

    chrome.runtime.sendMessage({ type: "GET_STATUS" }, (statusResponse) => {
      if (statusResponse) {
        updateStatus(statusResponse.isRecording, statusResponse.meetingId);
      }
    });
  } else {
    showView("login");
  }
});

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

    chrome.runtime.sendMessage({
      type: "SET_TOKEN",
      token: data.access_token,
      email: email,
    }, () => {
      showView("main");
      userEmail.textContent = email;

      chrome.runtime.sendMessage({ type: "GET_STATUS" }, (statusResponse) => {
        if (statusResponse) {
          updateStatus(statusResponse.isRecording, statusResponse.meetingId);
        }
      });
    });
  } catch (err) {
    showError(loginError, err.message);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign in";
  }
});

logoutBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "LOGOUT" }, () => {
    showView("login");
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
  });
});

setInterval(() => {
  if (!mainView.classList.contains("hidden")) {
    chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
      if (response) {
        updateStatus(response.isRecording, response.meetingId);
      }
    });
  }
}, 2000);
