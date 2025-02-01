import { CONTAINERS } from "../constants/constants.js";

// This function shows the container passed as an argument and hides all others
export function showHideFeesContainer(container) {
  // Store all section elements in an object
  const sections = {
    [CONTAINERS.DASHBOARD]: document.getElementById("dashboardSection"),
    [CONTAINERS.STUDENTS_VIEW]: document.getElementById("studentsView"),
    [CONTAINERS.VIEW_FEES]: document.getElementById("viewFeesSection"),
    [CONTAINERS.STUDENT_CLASS]: document.getElementById("studentClassSection"),
    [CONTAINERS.SETTINGS_VIEW]: document.getElementById("settingsSection"),
    [CONTAINERS.PAYMENTS]: document.getElementById("paymentsSection"),
  };

  // Hide all sections
  Object.values(sections).forEach((section) => {
    section.style.display = "none";
  });

  // Show the selected container
  if (sections[container]) {
    sections[container].style.display = "block";
  }
}
