import { initDashboard } from "../dashboard.js";
import { showToast } from "../utils/toast.js";

const modal = document.getElementById("updatePasswordModal");
const oldPassword = document.getElementById("oldPassword");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");

const showModal = () => {
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
};

const hideModal = () => {
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
};

document.getElementById("updatePasswordBtn").addEventListener("click", async () => {
  oldPassword.style.border = "";
  newPassword.style.border = "";
  confirmPassword.style.border = "";

  if (oldPassword.value === "" || newPassword.value === "" || confirmPassword.value === "") {
    showToast("Please fill all fields", "error");
    return;
  }

  const userRes = await window.user.getUser("admin");
  if (!userRes.success) {
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
    username: "admin",
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
  hideModal();
});

document.getElementById("closeUpdatePassword").addEventListener("click", () => {
  oldPassword.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  hideModal();
});

document.getElementById("cancelPasswordUpdate").addEventListener("click", () => {
  oldPassword.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  hideModal();
});

export const openUpdatePassword = () => showModal();
