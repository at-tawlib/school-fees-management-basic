import { ADMIN_CONTAINERS } from "./constants/constants.js";
import { initDashboard } from "./dashboard.js";
import { openUpdatePassword } from "./modals/update-password-modal.js";
import { initSettings } from "./settings.js";
import { showHideAdminContainer } from "./utils/show-hide-admin.js";

const navItems = document.querySelectorAll(".navbar ul li span");

// Function to handle navigation item clicks
// Remove the 'active' class from all navigation items and set active class to the clicked item
const handleNavClick = (event) => {
  navItems.forEach((item) => item.classList.remove("active"));
  event.target.classList.add("active");
};

navItems.forEach((item) => item.addEventListener("click", handleNavClick));

document.getElementById("navAdminClose").addEventListener("click", () => {
  const confirmQuit = confirm("Are you sure you want to close the admin?\n\n");
  if (!confirmQuit) return;
  window.app.closeAdmin();
});

document.getElementById("navRefreshBtn").addEventListener("click", () => window.app.reloadApp());

document.getElementById("navUpdatePassword").addEventListener("click", () => openUpdatePassword());

document.getElementById("navAdminSettings").addEventListener("click", () => {
  showHideAdminContainer(ADMIN_CONTAINERS.SETTINGS);
  initSettings();
});

document.getElementById("navDashboard").addEventListener("click", () => {
  showHideAdminContainer(ADMIN_CONTAINERS.DASHBOARD);
  initDashboard();
});

window.onload = function () {
  initDashboard();
};
