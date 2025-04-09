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

document.getElementById("navQuit").addEventListener("click", () => {
  const confirmQuit = confirm("Are you sure you want to close the app?\n\n");
  if (!confirmQuit) return;
  window.app.quitApp();
});

navItems.forEach((item) => item.addEventListener("click", handleNavClick));

document.getElementById("navRefreshBtn").addEventListener("click", () => window.app.reloadApp());

document
  .getElementById("navAbout")
  .addEventListener("click", () => (document.getElementById("aboutModal").style.display = ""));

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

document.getElementById("navAdminBtn").addEventListener("click", async () => {
  const userSession = await window.app.getSession();
  if (userSession !== "admin") openLoginModal();
  else window.app.openAdminPage();
});

document.getElementById("navLogout").addEventListener("click", async () => {
  const confirmLogout = confirm("Confirm logout of admin session\n\n");

  if (!confirmLogout) return;
  await window.app.setSession("");
  window.app.closeAdmin();
  window.app.reloadApp();
});

document
  .getElementById("aboutCloseXBtn")
  .addEventListener("click", () => (document.getElementById("aboutModal").style.display = "none"));

document.getElementById("goToStudentsBtn").addEventListener("click", () => {
  navItems[0].classList.remove("active");
  navItems[1].classList.add("active");
  showHideFeesContainer(CONTAINERS.STUDENTS_VIEW);
  initStudentsSection();
});

document.getElementById("goToFeesBtn").addEventListener("click", () => {
  navItems[0].classList.remove("active");
  navItems[2].classList.add("active");
  showHideFeesContainer(CONTAINERS.VIEW_FEES);
  setUpFeesSection();
});

document.getElementById("goToBillsBtn").addEventListener("click", () => {
  navItems[0].classList.remove("active");
  navItems[3].classList.add("active");
  showHideFeesContainer(CONTAINERS.STUDENT_CLASS);
  setupStudentsClassSection();
});

document.getElementById("goToPaymentsBtn").addEventListener("click", () => {
  navItems[0].classList.remove("active");
  navItems[4].classList.add("active");
  showHideFeesContainer(CONTAINERS.PAYMENTS);
  setUpPaymentsSection();
});

const setUpAdminView = async () => {
  const adminSession = await window.app.getSession();
  if (adminSession === "admin") {
    document.getElementById("navLogout").style.display = "";
    document.getElementById("adminTitle").style.display = "";
    document.getElementById("appHeader").style.background = "#000";
  } else {
    document.getElementById("navLogout").style.display = "none";
    document.getElementById("adminTitle").style.display = "none";
    document.getElementById("appHeader").style.background = "";
  }
};

window.onload = async function () {
  showHideFeesContainer(CONTAINERS.HOME);
  setUpAdminView();
  initHomeSection();
};
