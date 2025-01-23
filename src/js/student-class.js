import { setUpAcademicYearsSelect, setUpClassSelect, setUpTermsSelect } from "./utils/setup-select-inputs.js";

const studentClassTableBody = document.getElementById("studentClassTableBody");
const studentsClass = document.getElementById("filterByClassSelect");
const term = document.getElementById("filterByTerm");
const academicYear = document.getElementById("academicYearFilter");

document.getElementById("studentClassGoBtn").addEventListener("click", async function () {
  console.log(studentsClass.value, term.value, academicYear.value);

  const response = await window.api.getAllClassesStudents();
  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }
  displayStudentsClass();
});

export async function displayStudentsClass() {
  const response = await window.api.getAllClassesStudents();
  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  studentsClass.innerHTML = "";
  setUpClassSelect(studentsClass);
  term.innerHTML = "";
  setUpTermsSelect(term);
  academicYear.innerHTML = "";
  setUpAcademicYearsSelect(academicYear);

  studentClassTableBody.innerHTML = "";
  response.data.forEach((student, index) => {
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