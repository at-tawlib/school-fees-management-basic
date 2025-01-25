import { setUpAcademicYearsSelect, setUpClassSelect } from "./utils/setup-select-inputs.js";

const studentClassTableBody = document.getElementById("studentClassTableBody");
const studentsClass = document.getElementById("filterByClassSelect");
const academicYear = document.getElementById("academicYearFilter");
const sectionHeaderTitle = document.getElementById("sectionHeaderTitle");

// Event Listeners for Filtering
studentsClass.addEventListener("change", filterStudentsClassTable);
academicYear.addEventListener("change", filterStudentsClassTable);

// Event Listener for Search Input (with debounce)
let searchTimeout;
document.getElementById("searchStudentClassInput").addEventListener("input", (e) => {
  clearTimeout(searchTimeout); // Clear the previous timeout
  searchTimeout = setTimeout(() => {
    filterStudentsClassTable(); // Apply filters and search after a delay
  }, 300);
});

document.getElementById("clearStudentClassFilters").addEventListener("click", () => {
  studentsClass.value = "all";
  academicYear.value = "all";
  document.getElementById("searchStudentClassInput").value = "";
  filterStudentsClassTable();
});

export async function displayStudentsClass() {
  sectionHeaderTitle.textContent = "Students Class";
  const response = await window.api.getAllClassesStudents();
  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  setUpClassSelect(studentsClass, true);
  setUpAcademicYearsSelect(academicYear, true);

  studentClassTableBody.innerHTML = "";
  response.data.forEach((student, index) => {
    const row = document.createElement("tr");

    // Add data attributes to the row
    row.setAttribute("data-id", student.student_id);
    row.setAttribute("data-class", student.class_name);
    row.setAttribute("data-academic-year", student.academic_year);

    row.innerHTML = `
        <tr>
            <td>${index + 1}</td>
            <td>${student.first_name} ${student.other_names} ${student.last_name}</td>
            <td>${student.class_name}</td>
            <td>${student.academic_year}</td>  
            <td></td>
        </tr>
        `;

    studentClassTableBody.appendChild(row);
  });
}

function filterStudentsClassTable() {
  const selectedClass = studentsClass.value;
  const selectedAcademicYear = academicYear.value;
  const searchValue = document.getElementById("searchStudentClassInput").value.toLowerCase();

  const rows = studentClassTableBody.querySelectorAll("tr");

  rows.forEach((row) => {
    const studentName = row.getElementsByTagName("td")[1].textContent.toLowerCase();
    const classMatch = selectedClass === "all" || row.getAttribute("data-class") === selectedClass;
    const academicYearMatch =
      selectedAcademicYear === "all" ||
      row.getAttribute("data-academic-year") === selectedAcademicYear;
    const searchMatch = studentName.includes(searchValue);

    // Show row only if it matches all filters and the search term
    if (classMatch && academicYearMatch && searchMatch) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}
