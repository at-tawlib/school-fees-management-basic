import { setupStudentsClassSection } from "./student-class.js";
import { CONTAINERS } from "./constants/constants.js";
import { setUpPaymentsSection } from "./payments.js";
import { initSettings } from "./settings.js";
import { initStudentsSection } from "./student.js";
import { showHideFeesContainer } from "./utils/show-hide-container.js";
import { setUpFeesSection } from "./fees.js";
import { initDashboard } from "./dashboard.js";

const navItems = document.querySelectorAll(".sidebar ul li");
const sectionHeaderTitle = document.getElementById("sectionHeaderTitle");
const navSettingsButton = document.getElementById("navSettings");

// Function to handle navigation item clicks
function handleNavClick(event) {
  // Remove the 'active' class from all navigation items
  navItems.forEach((item) => item.classList.remove("active"));

  // Add the 'active' class to the clicked navigation item
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
  sectionHeaderTitle.textContent = "Dashboard";
  initDashboard();
});

document.getElementById("navStudents").addEventListener("click", async function () {
  showHideFeesContainer(CONTAINERS.STUDENTS_VIEW);
  sectionHeaderTitle.textContent = "Students";
  await initStudentsSection();
});

document.getElementById("navFees").addEventListener("click", async function () {
  showHideFeesContainer(CONTAINERS.VIEW_FEES);
  sectionHeaderTitle.textContent = "Fees";
  setUpFeesSection();
});

document.getElementById("navClasses").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.STUDENT_CLASS);
  sectionHeaderTitle.textContent = "Students Classes";
  setupStudentsClassSection();
});

document.getElementById("navPayments").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.PAYMENTS);
  sectionHeaderTitle.textContent = "Payments";
  setUpPaymentsSection();
});

document.getElementById("navSettings").addEventListener("click", function () {
  // Remove the 'active' class from all navigation items
  navItems.forEach((item) => item.classList.remove("active"));
  navSettingsButton.classList.add("active");

  showHideFeesContainer(CONTAINERS.SETTINGS_VIEW);
  sectionHeaderTitle.textContent = "Settings";
  initSettings();
});

document.getElementById("aboutCloseXBtn").addEventListener("click", function () {
  document.getElementById("aboutModal").style.display = "none";
});

window.onload = function () {
  showHideFeesContainer(CONTAINERS.DASHBOARD);
  sectionHeaderTitle.textContent = "Dashboard";
  initDashboard();
};
