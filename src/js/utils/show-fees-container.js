import { CONTAINERS } from "../constants/constants.js";

// This function is used to show and hide the container based on the container name passed as an argument.
export function showHideFeesContainer(container) {
  const feesTableContainer = document.getElementById("feesTableContainer");
  const addClassFormContainer = document.getElementById(
    "addClassFormContainer"
  );
  const studentClassContainer = document.getElementById(
    "studentClassContainer"
  );

  switch (container) {
    case CONTAINERS.FEES_TABLE:
      feesTableContainer.style.display = "block";
      addClassFormContainer.style.display = "none";
      studentClassContainer.style.display = "none";
      break;
    case CONTAINERS.CLASS_FORM:
      feesTableContainer.style.display = "none";
      addClassFormContainer.style.display = "block";
      studentClassContainer.style.display = "none";
      break;
    case CONTAINERS.STUDENT_CLASS:
      feesTableContainer.style.display = "none";
      addClassFormContainer.style.display = "none";
      studentClassContainer.style.display = "block";
      break;
  }
}
