import { setupStudentsClassSection } from "./student-class.js";
import { CONTAINERS } from "./constants/constants.js";
import { setUpPaymentsSection } from "./payments.js";
import { initStudentsSection } from "./student.js";
import { showHideFeesContainer } from "./utils/show-hide-container.js";
import { setUpFeesSection } from "./fees.js";
import { initHomeSection } from "./home.js";
import { openLoginModal } from "./modals/login-modal.js";

const navItems = document.querySelectorAll(".navbar ul li span");

// Function to handle navigation item clicks
// Remove the 'active' class from all navigation items and set active class to the clicked item
const handleNavClick = (event) => {
  navItems.forEach((item) => item.classList.remove("active"));
  event.target.classList.add("active");
};

navItems.forEach((item) => item.addEventListener("click", handleNavClick));

document.getElementById("navRefreshBtn").addEventListener("click", () => window.app.reloadApp());

document
  .getElementById("navAbout")
  .addEventListener("click", () => (document.getElementById("aboutModal").style.display = "block"));

document.getElementById("navHome").addEventListener("click", () => {
  showHideFeesContainer(CONTAINERS.HOME);
  initHomeSection();
});

document.getElementById("navStudents").addEventListener("click", async () => {
  showHideFeesContainer(CONTAINERS.STUDENTS_VIEW);
  await initStudentsSection();
});

document.getElementById("navFees").addEventListener("click", async () => {
  showHideFeesContainer(CONTAINERS.VIEW_FEES);
  setUpFeesSection();
});

document.getElementById("navClasses").addEventListener("click", () => {
  showHideFeesContainer(CONTAINERS.STUDENT_CLASS);
  setupStudentsClassSection();
});

document.getElementById("navPayments").addEventListener("click", () => {
  showHideFeesContainer(CONTAINERS.PAYMENTS);
  setUpPaymentsSection();
});

document.getElementById("navAdminBtn").addEventListener("click", () => openLoginModal());

document
  .getElementById("aboutCloseXBtn")
  .addEventListener("click", () => (document.getElementById("aboutModal").style.display = "none"));

window.onload = function () {
  showHideFeesContainer(CONTAINERS.HOME);
  initHomeSection();
};
