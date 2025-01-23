import { resetAddStudentForm } from "./add-class.js";
import { setUpBillStudentsSection } from "./billing.js";
import { CONTAINERS } from "./constants/constants.js";
import { displayPaymentsTable } from "./payments.js";
import { displayAcademicYearSettingsTable, displayClassSettingsTable } from "./settings.js";
import { displayStudentsClass } from "./student-class.js";
import { displayStudents } from "./student.js";
import { showHideFeesContainer } from "./utils/show-fees-container.js";
import { setUpViewBills } from "./view-bills.js";
import { displayFeesTable } from "./view-fees.js";

document.getElementById("navStudents").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.STUDENTS_VIEW);
  displayStudents();
});

document.getElementById("navViewFees").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.VIEW_FEES);
  displayFeesTable();
});

document.getElementById("navAddClass").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.ADD_CLASS);
  resetAddStudentForm();
});

document.getElementById("navClasses").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.STUDENT_CLASS);
  displayStudentsClass();
});

document.getElementById("navBillStudents").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.BILL_CLASS);
  setUpBillStudentsSection();
});

document.getElementById("navSettings").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.SETTINGS_VIEW);
  displayClassSettingsTable();
  displayAcademicYearSettingsTable();
});

document.getElementById("navViewBills").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.VIEW_BILLS);
  setUpViewBills();
});

document.getElementById("navPayments").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.PAYMENTS);
  displayPaymentsTable();
});
