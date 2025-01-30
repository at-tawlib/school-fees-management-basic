import { setupStudentsClassSection } from "./student-class.js";
import { CONTAINERS } from "./constants/constants.js";
import { displayPaymentsTable } from "./payments.js";
import { initSettings } from "./settings.js";
import { displayStudents } from "./student.js";
import { showHideFeesContainer } from "./utils/show-fees-container.js";
import { setUpFeesSection } from "./fees.js";

const sectionHeaderTitle = document.getElementById("sectionHeaderTitle");

document.getElementById("navStudents").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.STUDENTS_VIEW);
  sectionHeaderTitle.textContent = "Students";
  displayStudents();
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
  displayPaymentsTable();
});

// document.getElementById("navBillStudents").addEventListener("click", function () {
//   showHideFeesContainer(CONTAINERS.BILL_CLASS);
//   sectionHeaderTitle.textContent = "Bill Students";
//   setUpBillStudentsSection();
// });

document.getElementById("navSettings").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.SETTINGS_VIEW);
  initSettings();
});

// document.getElementById("navViewBills").addEventListener("click", function () {
//   showHideFeesContainer(CONTAINERS.VIEW_BILLS);
//   setUpViewBills();
// });
