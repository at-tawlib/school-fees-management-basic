import { CONTAINERS } from "./constants/constants.js";
import { showHideFeesContainer } from "./utils/show-fees-container.js";

const studentClassTableBody = document.getElementById("studentClassTableBody");
const studentsClass = document.getElementById("filterByClassSelect");
const term = document.getElementById("filterByTErmSelect");
const academicYear = document.getElementById("academicYearFilter");

document.getElementById("viewClassesButton").addEventListener("click", function () {
    showHideFeesContainer(CONTAINERS.STUDENT_CLASS);
});

document
  .getElementById("studentClassGoBtn")
  .addEventListener("click", async function () {

    console.log(studentsClass.value, term.value, academicYear.value);

    const response = await window.api.getAllClassesStudents();
    if (!response.success) {
      showToast(response.message || "An error occurred", "error");
      return;
    }
    

    displayStudentsClass(response.data);
  });

async function displayStudentsClass(data) {
    studentClassTableBody.innerHTML = "";
    data.forEach((student, index) => {
        studentClassTableBody.innerHTML += `
        <tr>
            <td>${index + 1}</td>
            <td id="studentId" style="display:none">${student.student_id}</td>
            <td>${student.first_name} ${student.other_names} ${student.last_name}</td>
            <td>${student.class_name}</td>
            <td>${student.academic_year}</td>  
            <td></td>
        </tr>
        `;
    });
}

