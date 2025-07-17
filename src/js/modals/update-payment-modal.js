import { setUpPaymentsSection } from "../payments.js";
import { showToast } from "../utils/toast.js";

const modal = document.getElementById("updatePaymentModal");
const studentIdElement = document.getElementById("updatePaymentModalStudentId");
const paymentIdElement = document.getElementById("updatePaymentModalPaymentId");
const paymentModeSelect = document.getElementById("updatePaymentMode");
const paymentAmountInput = document.getElementById("updatePaymentAmount");
const paymentDetailsInput = document.getElementById("updatePaymentDetails");

const showModal = () => {
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
};

const hideModal = () => {
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
};

export function openUpdatePaymentModal(payment) {
  showModal();
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
  hideModal();
});

document.getElementById("btnCancelUpdatePayment").addEventListener("click", () => {
  hideModal();
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
  hideModal();
  setUpPaymentsSection();
});
