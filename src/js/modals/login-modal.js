import { showToast } from "../utils/toast.js";

const modal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const closeBtn = document.getElementById("closeBtn");
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
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  //   TODO: close the page
  usernameField.value = "";
  passwordField.value = "";
});

export const openLoginModal = () => {
  modal.style.display = "flex";
};
