import { setUpPaymentsSection } from "../payments.js";
import { showToast } from "../utils/toast.js";

const modal = document.getElementById("updatePaymentModal");
const studentIdElement = document.getElementById("updatePaymentModalStudentId");
const paymentIdElement = document.getElementById("updatePaymentModalPaymentId");
const paymentModeSelect = document.getElementById("updatePaymentMode");
const paymentAmountInput = document.getElementById("updatePaymentAmount");
const paymentDetailsInput = document.getElementById("updatePaymentDetails");

export function openUpdatePaymentModal(payment) {
  modal.style.display = "block";
  document.getElementById("updatePaymentModalStudentName").textContent = payment.student_name;
  document.getElementById(
    "updatePaymentModalStudentClass"
  ).textContent = `${payment.class_name} - ${payment.term} Term, ${payment.academic_year}`;

  studentIdElement.textContent = payment.student_id;
  paymentIdElement.textContent = payment.payment_id;
  paymentModeSelect.value = payment.payment_mode;
  paymentAmountInput.value = payment.payment_amount;
  paymentDetailsInput.value = payment.payment_details;
}

document.getElementById("updatePaymentModalCloseXBtn").addEventListener("click", () => {
  modal.style.display = "none";
});

document.getElementById("btnCancelUpdatePayment").addEventListener("click", () => {
  modal.style.display = "none";
});

document.getElementById("btnUpdatePayment").addEventListener("click", async () => {
  
  const studentId = studentIdElement.textContent;
  const paymentId = paymentIdElement.textContent;
  const paymentAmount = paymentAmountInput.value;
  const paymentMode = paymentModeSelect.value;
  const paymentDetails = paymentDetailsInput.value;

  if (!studentId || !paymentId || !paymentAmount || !paymentMode) {
    showToast("Please fill all the fields", "error");
    return;
  }

  if (paymentMode !== "cash" && !paymentDetails) {
    showToast("Please provide payment details", "error");
    return;
  }

  if (paymentAmount <= 0 || isNaN(paymentAmount)) {
    showToast("Please provide a valid payment amount", "error");
    return;
  }

  const response = await window.api.updatePayment({
    paymentId,
    studentId,
    amount: paymentAmount,
    paymentMode,
    paymentDetails,
  });
  
  if (!response.success) {
    showToast(response.message || "Payment update failed", "error");
    return;
  }
  
  showToast(response.message, "success");
  modal.style.display = "none";
  setUpPaymentsSection();
});
