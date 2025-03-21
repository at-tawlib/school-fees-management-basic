import { ADMIN_CONTAINERS } from "../constants/constants.js";

// This function shows the container passed as an argument and hides all others
export function showHideAdminContainer(container) {
  // Store all section elements in an object
  const sections = {
    [ADMIN_CONTAINERS.DASHBOARD]: document.getElementById("dashboardSection"),
    [ADMIN_CONTAINERS.SETTINGS]: document.getElementById("settingsSection"),
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
