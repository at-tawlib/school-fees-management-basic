import { showToast } from "./utils/toast.js";

const addStudentModal = document.getElementById("addStudentModal");
const firstNameInput = document.getElementById("studentFirstNameInput");
const lastNameInput = document.getElementById("studentLastNameInput");
const otherNamesInput = document.getElementById("studentOtherNameInput");
const totalStudentsNumber = document.getElementById("totalStudentsNumber");
const searchStudentInput = document.getElementById("searchStudentInput");
const studentsTableBody = document.getElementById("studentsTableBody");
const tableRows = studentsTableBody.getElementsByTagName("tr");
let editingStudentId = null;

document.getElementById("addStudentBtn").addEventListener("click", function () {
  addStudentModal.style.display = "block";
  document.getElementById("addStudentForm").reset();
});

document.getElementById("addStudentCloseX").addEventListener("click", function () {
  addStudentModal.style.display = "none";
  editingStudentId = null;
});

document.getElementById("cancelStudentModalBtn").addEventListener("click", function () {
  addStudentModal.style.display = "none";
  editingStudentId = null;
});

document.getElementById("addStudentModalBtn").addEventListener("click", async function () {
  const firstName = document.getElementById("studentFirstNameInput").value;
  const lastName = document.getElementById("studentLastNameInput").value;
  const otherNames = document.getElementById("studentOtherNameInput").value;

  if (!firstName || !lastName) {
    showToast("Please provide the student's first and last name.", "error");
    return;
  }

  if (editingStudentId) {
    // Update student record
    const result = await window.api.updateStudent({
      firstName,
      lastName,
      otherNames,
      id: editingStudentId,
    });

    if (result.success) {
      showToast(result.message, "success");
      editingStudentId = null;
      addStudentModal.style.display = "none";
      displayStudents();
      return;
    }

    showToast(result.message, "error");
    return;
  }

  const result = await window.api.insertStudent({
    firstName,
    lastName,
    otherNames,
  });

  if (result.success) {
    showToast(result.message, "success");
    addStudentModal.style.display = "none";
    displayStudents();
    return;
  }
  showToast(result.message, "error");
});

searchStudentInput.addEventListener("input", function () {
  filterStudentsTable();
});

function editStudentRecord(student) {
  addStudentModal.style.display = "block";

  firstNameInput.value = student.first_name;
  lastNameInput.value = student.last_name;
  otherNamesInput.value = student.other_names;
  editingStudentId = student.id;
}

export async function displayStudents() {
  const response = await window.api.getAllStudents();
  studentsTableBody.innerHTML = "";

  if (response.success === false) {
    showToast(`An error occurred ${response.message}`, "error");
    return;
  }

  if (response.data.length === 0) {
    showToast("No data found", "error");
    return;
  }

  totalStudentsNumber.textContent = `Total Number Of Students: ${response.data.length}`;

  response.data.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${student.id}</td>
        <td>${student.first_name}</td>
        <td>${student.last_name}</td>
        <td>${student.other_names}</td>
        <td> 
          <div id="btnEditStudent" class="text-button">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </div>
        </td>
      `;

    row.querySelector("#btnEditStudent").addEventListener("click", () => {
      editStudentRecord(student);
    });
    studentsTableBody.appendChild(row);
  });
}

function filterStudentsTable() {
  const searchValue = searchStudentInput.value.toLowerCase();

  for (let row of tableRows) {
    const cells = row.getElementsByTagName("td");
    const firstNameCell = cells[1]?.textContent.toLowerCase();
    const lastNameCell = cells[2]?.textContent.toLowerCase();
    const otherNamesCell = cells[3]?.textContent.toLowerCase();

    if (!firstNameCell && !lastNameCell && !otherNamesCell) return;

    // Check if search value is included in the name
    if (
      firstNameCell.includes(searchValue) ||
      lastNameCell.includes(searchValue) ||
      otherNamesCell.includes(searchValue)
    ) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  }
}
