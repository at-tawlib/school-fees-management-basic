import { showToast } from "../utils/toast.js";

const addFeesModal = document.getElementById("addFeesModal");

document.getElementById("addFeesButton").addEventListener("click", function () {
  addFeesModal.style.display = "block";
});

document
  .getElementById("addFeesCloseXBtn")
  .addEventListener("click", function () {
    addFeesModal.style.display = "none";
  });

document
  .getElementById("cancelFeesModalBtn")
  .addEventListener("click", function () {
    addFeesModal.style.display = "none";
  });

document.getElementById("setFeesBtn").addEventListener("click", async () => {
  const studentClass = document.getElementById("feesClassSelect").value;
  const academicYear = document.getElementById("feesAcademicYear").value;
  const term = document.getElementById("feesTerm").value;
  const feesAmount = document.getElementById("feesAmount").value;

  if (!academicYear || !studentClass || !term || !feesAmount) {
    showToast("Please fill all the fields", "error");
    return;
  }

  const response = await window.api.addFees({
    class: studentClass,
    academicYear,
    term,
    amount: feesAmount,
  });

  if (!response.success) {
    showToast(response.message || "Failed to set fees", "error");
    return;
  }

  showToast(response.message, "success");
  document.getElementById("feesAmount").value = "";
  addFeesModal.style.display = "none";
});
