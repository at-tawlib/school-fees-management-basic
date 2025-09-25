import { displayClassStudentsTable, resetCurrentFees, submitBill } from "../bills.js";

const billClassModal = document.getElementById("billClassModal");
const billStudentsMessage = document.getElementById("billStudentsMessage");

export const openBillClassModal = (message) => {
  billClassModal.classList.add("active");
  document.body.style.overflow = "hidden";
  billStudentsMessage.innerHTML = message;
};

const closeModal = () => {
  billClassModal.classList.remove("active");
  document.body.style.overflow = "auto";
};

document.getElementById("billClassCloseXBtn").addEventListener("click", () => {
  resetCurrentFees();
  closeModal();
});

document.getElementById("cancelBillClassModalBtn").addEventListener("click", () => {
  resetCurrentFees();
  closeModal();
});

document.getElementById("submitBillClassModalBtn").addEventListener("click", async () => {
  await submitBill();
  closeModal();
  await displayClassStudentsTable();
});
