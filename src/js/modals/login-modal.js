import { initDashboard } from "../dashboard.js";
import { showToast } from "../utils/toast.js";

const modal = document.getElementById("loginModal");
const usernameField = document.getElementById("usernameField");
const passwordField = document.getElementById("passwordField");

document.getElementById("loginBtn").addEventListener("click", async () => {
  const username = usernameField.value;
  const password = passwordField.value;

  if (!username || !password) {
    showToast("Please fill all the fields", "error");
    return;
  }

  const response = await window.user.login({ username, password });

  if (!response.success) {
    showToast(response.message || "Login failed", "error");
    return;
  }

  usernameField.value = "";
  passwordField.value = "";
  modal.style.display = "none";
  await window.app.setSession("admin");
  window.app.reloadApp();
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  usernameField.value = "";
  passwordField.value = "";
  modal.style.display = "none";
});

document.getElementById("closeLogin").addEventListener("click", () => {
  usernameField.value = "";
  passwordField.value = "";
  modal.style.display = "none";
});

export const openLoginModal = () => {
  modal.style.display = "flex";
  console.log(usernameField.disabled); // should be false
  console.log(window.getComputedStyle(usernameField).pointerEvents); // should not be 'none'
};
