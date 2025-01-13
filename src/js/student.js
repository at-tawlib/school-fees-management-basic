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

    const result = await window.api.insertStudent({ firstName, lastName, otherNames });
    addStudentModal.style.display = "none";
  });
