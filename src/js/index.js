import { setupStudentsClassSection } from "./student-class.js";
import { CONTAINERS } from "./constants/constants.js";
import { setUpPaymentsSection } from "./payments.js";
import { initSettings } from "./settings.js";
import { initStudentsSection } from "./student.js";
import { showHideFeesContainer } from "./utils/show-hide-container.js";
import { setUpFeesSection } from "./fees.js";
import { initDashboard } from "./dashboard.js";

const navItems = document.querySelectorAll(".navbar ul li span");
const navSettingsButton = document.getElementById("navSettings");
const navItemAdmin = document.getElementById("navAdmin"); 

// Function to handle navigation item clicks
// Remove the 'active' class from all navigation items and set active class to the clicked item
function handleNavClick(event) {
  navItems.forEach((item) => item.classList.remove("active"));
  navSettingsButton.classList.remove("active");
  navItemAdmin.classList.remove("active");
  event.target.classList.add("active");
}

navItems.forEach((item) => {
  item.addEventListener("click", handleNavClick);
});

document.getElementById("navRefreshBtn").addEventListener("click", function () {
  window.app.reloadApp();
});

document.getElementById("navAbout").addEventListener("click", function () {
  document.getElementById("aboutModal").style.display = "block";
});

document.getElementById("navDashboard").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.DASHBOARD);
  initDashboard();
});

document.getElementById("navStudents").addEventListener("click", async function () {
  showHideFeesContainer(CONTAINERS.STUDENTS_VIEW);
  await initStudentsSection();
});

document.getElementById("navFees").addEventListener("click", async function () {
  showHideFeesContainer(CONTAINERS.VIEW_FEES);
  setUpFeesSection();
});

document.getElementById("navClasses").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.STUDENT_CLASS);
  setupStudentsClassSection();
});

document.getElementById("navPayments").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.PAYMENTS);
  setUpPaymentsSection();
});

document.getElementById("navSettings").addEventListener("click", function () {
  // Remove the 'active' class from all navigation items
  navItems.forEach((item) => item.classList.remove("active"));
  navSettingsButton.classList.add("active");

  showHideFeesContainer(CONTAINERS.SETTINGS_VIEW);
  initSettings();
});

document.getElementById("navAdmin").addEventListener("click",  () => {
  window.app.openAdminPage();
});

document.getElementById("aboutCloseXBtn").addEventListener("click", function () {
  document.getElementById("aboutModal").style.display = "none";
});

window.onload = function () {
  showHideFeesContainer(CONTAINERS.DASHBOARD);
  initDashboard();
};
