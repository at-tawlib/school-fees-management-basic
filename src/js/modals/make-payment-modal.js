import { displayClassStudentsTable } from "../bills.js";
import { fCurrency } from "../utils/format-currency.js";
import { showToast } from "../utils/toast.js";

const modal = document.getElementById("makePaymentModal");
const studentIdElement = document.getElementById("modalStudentId");
const billIdElement = document.getElementById("modalBillId");
const paymentAmountField = document.getElementById("paymentAmount");
const paymentModeSelect = document.getElementById("paymentMode");
const paymentDetailsField = document.getElementById("paymentDetails");
const feesText = document.getElementById("makePaymentModalFees");
const paidText = document.getElementById("makePaymentModalPaid");
const arrearsText = document.getElementById("makePaymentModalArrears");

let selectedFee = null;
let selectedTerm = null;
let arrears = null;

const showModal = () => {
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
};

const hideModal = () => {
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
};

document.getElementById("cancelPaymentModalBtn").addEventListener("click", () => {
  hideModal();
  clearPaymentModalFields();
});

document.getElementById("paymentCloseXBtn").addEventListener("click", () => {
  hideModal();
  clearPaymentModalFields();
});

document.getElementById("submitPayment").addEventListener("click", async () => {
  const studentId = studentIdElement.textContent;
  const billId = billIdElement.textContent;
  const paymentAmount = paymentAmountField.value;
  const paymentMode = paymentModeSelect.value;
  const paymentDetails = paymentDetailsField.value;

  paymentAmountField.style.border = "";

  if (!studentId || !billId || !paymentAmount || !paymentMode) {
    showToast("Please fill all the fields", "error");
    return;
  }

  if (paymentMode !== "cash" && !paymentDetails) {
    showToast("Please provide payment details", "error");
    return;
  }

  if (paymentAmount <= 0 || isNaN(paymentAmount)) {
    paymentAmountField.style.border = "1px solid red";
    showToast("Please provide a valid payment amount", "error");
    return;
  }

  if (paymentAmount > arrears) {
    paymentAmountField.style.border = "1px solid red";
    showToast("Amount to pay cannot be greater than the current arrears", "error");
    return;
  }

  const response = await window.api.makePayment({
    studentId,
    billId,
    amount: paymentAmount,
    paymentMode,
    paymentDetails,
  });

  if (!response.success) {
    showToast(response.message || "Payment failed", "error");
    return;
  }
  showToast(response.message, "success");

  clearPaymentModalFields();
  hideModal();

  displayClassStudentsTable(
    {
      class_name: selectedFee.className,
      academic_year: selectedFee.academicYear,
      academic_year_id: selectedFee.yearId,
      class_id: selectedFee.classId,
    },
    { value: selectedFee.termId, text: selectedFee.term }
  );
});

function clearPaymentModalFields() {
  studentIdElement.textContent = "";
  paymentAmountField.value = "";
  paymentModeSelect.value = "";
  paymentDetailsField.value = "";
}

export function openStudentPaymentModal(details, currentFee, classTerm) {
  selectedFee = currentFee;
  selectedTerm = classTerm;

  if (!details.bill_id || !details.student_id) {
    showToast("Check student bill.", "error");
    return;
  }

  showModal();
  document.getElementById("modalStudentName").textContent = details.student_name;
  document.getElementById(
    "modalStudentClass"
  ).textContent = `Pay fees for ${currentFee.className} - ${classTerm.text} term, ${currentFee.academicYear}`;

  arrears = details.fee_amount - (details.total_payments ?? 0);
  studentIdElement.textContent = details.student_id;
  billIdElement.textContent = details.bill_id;
  feesText.textContent = fCurrency(details.fee_amount);
  paidText.textContent = fCurrency(details.total_payments);
  arrearsText.textContent = fCurrency(arrears);

  if (details.discount_amount > 0)
    document.getElementById("discountText").textContent = `(Discount ${fCurrency(
      details.discount_amount
    )})`;
  else document.getElementById("discountText").textContent = "";

  if (arrears <= 0) {
    document.getElementById("makePaymentForm").style.display = "none";
    document.getElementById("fullyPaidText").style.display = "block";
  } else {
    document.getElementById("fullyPaidText").style.display = "none";
    document.getElementById("makePaymentForm").style.display = "block";
  }
}
