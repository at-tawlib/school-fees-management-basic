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
  closeModal();
  await window.app.setSession("admin");
  window.app.reloadApp();
});

const openModal = () => {
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
};

const closeModal = () => {
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
};

document.getElementById("cancelBtn").addEventListener("click", () => {
  usernameField.value = "";
  passwordField.value = "";
  closeModal();
});

document.getElementById("closeLogin").addEventListener("click", () => {
  usernameField.value = "";
  passwordField.value = "";
  closeModal();
});

export const openLoginModal = () => {
  openModal();
  // modal.style.display = "flex";
};
