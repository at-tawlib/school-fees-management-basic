import { showToast } from "./utils/toast.js";

const addStudentModal = document.getElementById("addStudentModal");
const firstNameInput = document.getElementById("studentFirstNameInput");
const lastNameInput = document.getElementById("studentLastNameInput");
const otherNamesInput = document.getElementById("studentOtherNameInput");
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

function editStudentRecord(student) {
  addStudentModal.style.display = "block";

  firstNameInput.value = student.first_name;
  lastNameInput.value = student.last_name;
  otherNamesInput.value = student.other_names;
  editingStudentId = student.id;
}

export async function displayStudents() {
  const response = await window.api.getAllStudents();
  const studentsTableBody = document.getElementById("studentsTableBody");
  studentsTableBody.innerHTML = "";

  if (response.success === false) {
    showToast(`An error occurred ${response.message}`, "error");
    return;
  }

  if (response.data.length === 0) {
    showToast("No data found", "error");
    return;
  }

  response.data.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${student.id}</td>
        <td>${student.first_name}</td>
        <td>${student.last_name}</td>
        <td>${student.other_names}</td>
        <td>
            <button id="btnEditStudent" class="text-button" title="Edit student">
              <i class="fa-solid fa-pen-to-square"></i>
                Edit
            </button>
        </td>
      `;

    row.querySelector("#btnEditStudent").addEventListener("click", () => {
      editStudentRecord(student);
    });
    studentsTableBody.appendChild(row);
  });
}
