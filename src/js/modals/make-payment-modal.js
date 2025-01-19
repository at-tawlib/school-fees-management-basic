import { showToast } from "../utils/toast.js";

const modal = document.getElementById("makePaymentModal");
const studentIdElement = document.getElementById("modalStudentId");
const billIdElement = document.getElementById("modalBillId");
const paymentAmountField = document.getElementById("paymentAmount");
const paymentModeSelect = document.getElementById("paymentMode");
const paymentDetailsField = document.getElementById("paymentDetails");

document.getElementById("cancelPaymentModalBtn").addEventListener("click", () => {
  modal.style.display = "none";
  clearPaymentModalFields();
});

document.getElementById("paymentCloseXBtn").addEventListener("click", () => {
  modal.style.display = "none";
  clearPaymentModalFields();
});

document.getElementById("submitPayment").addEventListener("click", async () => {
  const studentId = studentIdElement.textContent;
  const billId = billIdElement.textContent;
  const paymentAmount = paymentAmountField.value;
  const paymentMode = paymentModeSelect.value;
  const paymentDetails = paymentDetailsField.value;

  if (!studentId || !billId || !paymentAmount || !paymentMode) {
    showToast("Please fill all the fields", "error");
    return;
  }

  if (paymentMode !== "cash" && !paymentDetails) {
    showToast("Please provide payment details", "error");
    return;
  }

  // TODO: make sure the amount to pay is not greater than the current arrears
  const response = await window.api.makePayment({
    studentId,
    billId,
    amount: paymentAmount,
    paymentMode,
    paymentDetails,
  });

  if (!response.success) {
    showToast("Payment failed", "error");
    return;
  }
  showToast(response.message, "success");

  clearPaymentModalFields();
  modal.style.display = "none";
});

function clearPaymentModalFields() {
  studentIdElement.textContent = "";
  paymentAmountField.value = "";
  paymentModeSelect.value = "";
  paymentDetailsField.value = "";
}

export function openStudentPaymentModal(details) {
  if (!details.bill_id || !details.student_id) {
    showToast("Check student bill.", "error");
    return;
  }

  modal.style.display = "block";
  document.getElementById("modalStudentName").textContent = details.student_name;
  document.getElementById(
    "modalStudentClass"
  ).textContent = `Class ${details.class_name} - ${details.term} term, ${details.academic_year}`;

  studentIdElement.textContent = details.student_id;
  billIdElement.textContent = details.bill_id;
}
