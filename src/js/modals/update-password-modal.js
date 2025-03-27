import { initDashboard } from "../dashboard.js";
import { showToast } from "../utils/toast.js";

const modal = document.getElementById("updatePasswordModal");
const username = document.getElementById("username");
const oldPassword = document.getElementById("oldPassword");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");

document.getElementById("updatePasswordBtn").addEventListener("click", async () => {
  username.style.border = "";
  oldPassword.style.border = "";
  newPassword.style.border = "";
  confirmPassword.style.border = "";

  if (
    username.value === "" ||
    oldPassword.value === "" ||
    newPassword.value === "" ||
    confirmPassword.value === ""
  ) {
    showToast("Please fill all fields", "error");
    return;
  }

  const userRes = await window.user.getUser(username.value);
  if (!userRes.success) {
    username.style.border = "1px solid red";
    showToast(userRes.message || "An error occurred", "error");
    return;
  }

  if (oldPassword.value !== userRes.data.password) {
    showToast("Invalid Password", "error");
    oldPassword.style.border = "1px solid red";
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    showToast("Passwords do not match", "error");
    newPassword.style.border = "1px solid red";
    confirmPassword.style.border = "1px solid red";
    return;
  }

  const updateRes = await window.user.updatePassword({
    username: username.value,
    password: newPassword.value,
  });

  if (!updateRes.success) {
    showToast(updateRes.message || "An error occurred updating password", "error");
    return;
  }

  // Perform password update
  showToast(updateRes.message, "success");
  oldPassword.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  modal.style.display = "none";
});

document.getElementById("closeUpdatePassword").addEventListener("click", () => {
  oldPassword.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  modal.style.display = "none";
});

document.getElementById("cancelPasswordUpdate").addEventListener("click", () => {
  oldPassword.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  modal.style.display = "none";
});

export const openUpdatePassword = () => {
  modal.style.display = "flex";
};
