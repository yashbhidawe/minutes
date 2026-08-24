const grantBtn = document.getElementById("grant-btn");
const statusMsg = document.getElementById("status-msg");

grantBtn.addEventListener("click", async () => {
  grantBtn.disabled = true;
  grantBtn.textContent = "Requesting Access...";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());

    grantBtn.style.display = "none";
    statusMsg.className = "success";
    statusMsg.textContent = "Microphone Access Granted! You can now close this tab and start recording meetings.";
  } catch (err) {
    grantBtn.disabled = false;
    grantBtn.textContent = "Try Again";
    alert("Microphone access was denied or blocked: " + err.message);
  }
});
