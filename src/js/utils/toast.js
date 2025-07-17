// Function to show a toast notification
export function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toastContainer");
  const toastText = document.getElementById("toastText");
  const closeButton = document.getElementById("toastClose");

  toastContainer.style.display = "";
  toastText.textContent = message;
  closeButton.onclick = () => {
    toastContainer.style.display = "none";
  };

  toastContainer.classList.remove("toast-success", "toast-error", "toast-info", "toast-default");
  toastContainer.classList.add(`toast-${type}`);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toastContainer.style.display = "none";
  }, 10000);
}
