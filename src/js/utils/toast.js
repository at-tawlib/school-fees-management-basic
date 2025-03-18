// Function to show a toast notification
export function showToast(message, type = "success") {
  const toastText = document.createElement("p");
  toastText.className = "toast-text";
  toastText.textContent = message;

  // Create close button
  const closeButton = document.createElement("button");
  closeButton.className = "toast-close-button";
  closeButton.innerHTML = "&times;";
  closeButton.onclick = () => {
    toastText.remove();
  };

  // Append close button to toast
  toastText.appendChild(closeButton);

  // Append toast to container
  const container = document.getElementById("toastContainer");
  container.classList.remove("toast-success", "toast-error");
  container.appendChild(toastText);
  container.classList.add(`toast-${type}`);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toastText.remove();
  }, 10000);
}
