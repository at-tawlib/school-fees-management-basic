import { showToast } from "./utils/toast.js";

const addStudentModal = document.getElementById("addStudentModal");

document.getElementById("addStudentBtn").addEventListener("click", function () {
  addStudentModal.style.display = "block";
  document.getElementById("addStudentForm").reset();
});

document
  .getElementById("addStudentCloseX")
  .addEventListener("click", function () {
    addStudentModal.style.display = "none";
  });

document
  .getElementById("cancelStudentModalBtn")
  .addEventListener("click", function () {
    addStudentModal.style.display = "none";
  });

document
  .getElementById("addStudentModalBtn")
  .addEventListener("click", async function () {
    const firstName = document.getElementById("studentFirstNameInput").value;
    const lastName = document.getElementById("studentLastNameInput").value;
    const otherNames = document.getElementById("studentOtherNameInput").value;

    if (!firstName || !lastName) {
      showToast("Please provide the student's first and last name.", "error");
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

async function displayStudents() {
  const response = await window.api.getAllStudents();
  const studentsTableBody = document.getElementById("studentsTableBody");
  studentsTableBody.innerHTML = "";

  if(!response.success) {
    showToast(`An error occurred ${response.message}`)
    return;
  }

  response.data.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${student.id}</td>
        <td>${student.first_name}</td>
        <td>${student.last_name}</td>
        <td>${student.other_names}</td>
        <td><button>Edit</button></td>
      `;
    studentsTableBody.appendChild(row);
  });
}


window.onload = displayStudents;