import { CONTAINERS } from "./constants/constants.js";
import { displayStudents } from "./student.js";
import { showHideFeesContainer } from "./utils/show-fees-container.js";
import { displayFeesTable } from "./view-fees.js";

document.getElementById("navStudents").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.STUDENTS_VIEW);
  displayStudents();
});

document.getElementById("navViewFees").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.VIEW_FEES);
  displayFeesTable();
});
