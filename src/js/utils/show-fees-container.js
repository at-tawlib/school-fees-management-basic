import { CONTAINERS } from "../constants/constants.js";

// This function is used to show and hide the container based on the container name passed as an argument.
export function showHideFeesContainer(container) {
  const studentsView = document.getElementById("studentsView");
  const viewFeesSection = document.getElementById("viewFeesSection");
  const studentClassSection = document.getElementById("studentClassSection");
  const settingsSection = document.getElementById("settingsSection");
  const paymentsSection = document.getElementById("paymentsSection");

  switch (container) {
    case CONTAINERS.STUDENTS_VIEW:
      studentsView.style.display = "block";
      viewFeesSection.style.display = "none";
      studentClassSection.style.display = "none";
      studentClassSection.style.display = "none";
      settingsSection.style.display = "none";
      paymentsSection.style.display = "none";
      break;
    case CONTAINERS.VIEW_FEES:
      studentsView.style.display = "none";
      viewFeesSection.style.display = "block";
      studentClassSection.style.display = "none";
      studentClassSection.style.display = "none";
      settingsSection.style.display = "none";
      paymentsSection.style.display = "none";
      break;
    case CONTAINERS.STUDENT_CLASS:
      studentsView.style.display = "none";
      viewFeesSection.style.display = "none";
      studentClassSection.style.display = "none";
      studentClassSection.style.display = "block";
      settingsSection.style.display = "none";
      paymentsSection.style.display = "none";
      break;
    case CONTAINERS.BILL_CLASS:
      studentsView.style.display = "none";
      viewFeesSection.style.display = "none";
      studentClassSection.style.display = "none";
      studentClassSection.style.display = "none";
      settingsSection.style.display = "none";
      paymentsSection.style.display = "none";
      break;
    case CONTAINERS.SETTINGS_VIEW:
      studentsView.style.display = "none";
      viewFeesSection.style.display = "none";
      studentClassSection.style.display = "none";
      studentClassSection.style.display = "none";
      settingsSection.style.display = "block";
      paymentsSection.style.display = "none";
      break;
    case CONTAINERS.VIEW_BILLS:
      studentsView.style.display = "none";
      viewFeesSection.style.display = "none";
      studentClassSection.style.display = "none";
      studentClassSection.style.display = "none";
      settingsSection.style.display = "none";
      paymentsSection.style.display = "none";
      break;
    case CONTAINERS.PAYMENTS:
      studentsView.style.display = "none";
      viewFeesSection.style.display = "none";
      studentClassSection.style.display = "none";
      studentClassSection.style.display = "none";
      settingsSection.style.display = "none";
      paymentsSection.style.display = "block";
      break;
  }
}
