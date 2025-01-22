import { CONTAINERS } from "../constants/constants.js";

// This function is used to show and hide the container based on the container name passed as an argument.
export function showHideFeesContainer(container) {
  const studentsView = document.getElementById("studentsView");
  const viewFeesSection = document.getElementById("viewFeesSection");

  switch (container) {
    case CONTAINERS.STUDENTS_VIEW:
      studentsView.style.display = "block";
      viewFeesSection.style.display = "none";
      break;
    case CONTAINERS.VIEW_FEES:
      studentsView.style.display = "none";
      viewFeesSection.style.display = "block";
      break;
  }
}
