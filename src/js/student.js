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
