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
      return;
    }

    showToast(result.message, "error");
  });
