import {
  displayClassStudentsTable,
  resetCurrentFees,
  submitBill,
} from "../student-class.js";

const billClassModal = document.getElementById("billClassModal");
const billStudentsMessage = document.getElementById("billStudentsMessage");

export const openBillClassModal = (message) => {
  billClassModal.style.display = "block";
  billStudentsMessage.innerHTML = message;
};

document.getElementById("billClassCloseXBtn").addEventListener("click", () => {
  resetCurrentFees();
  billClassModal.style.display = "none";
});

document.getElementById("cancelBillClassModalBtn").addEventListener("click", () => {
  resetCurrentFees();
  billClassModal.style.display = "none";
});

document.getElementById("submitBillClassModalBtn").addEventListener("click", async () => {
  await submitBill();
  billClassModal.style.display = "none";
  await displayClassStudentsTable();
});
