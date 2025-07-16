import { classTerm, currentClass } from "../student-class.js";
import { fCurrency } from "../utils/format-currency.js";
import { formatDate } from "../utils/format-date.js";

const paymentHistoryModal = document.getElementById("paymentHistoryModal");

export const showPaymentHistoryModal = async (data, classDetails = null) => {
  const discountContainer = document.getElementById("paymentHistoryModalDiscountContainer");
  const discountText = document.getElementById("paymentHistoryModalDiscount");
  const classYearText = document.getElementById("paymentHistoryFeesText");
  const feesText = document.getElementById("paymentHistoryModalFees");
  const paidText = document.getElementById("paymentModalTotalPaidText");
  const balanceText = document.getElementById("paymentModalBalanceText");

  const response = await window.api.getStudentPayments(data.bill_id);
  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  openModal();
  document.getElementById("paymentHistoryStudentName").textContent = data.student_name;

  const tableBody = document.getElementById("paymentHistoryTableBody");
  tableBody.innerHTML = "";

  response.data.forEach((payment, index) => {
    const row = tableBody.insertRow(index);
    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${formatDate(payment.date_paid)}</td>
        <td class="color-green bold-text">${fCurrency(payment.payment_amount)}</td>
        <td>${payment.payment_mode}</td>
        <td>${payment.payment_details}</td>
      `;
  });

  if (classDetails) {
    const studentBillResp = await window.api.getSingleBillDetails({
      studentId: data.student_id,
      classId: data.class_id,
      academicYearId: data.year_id,
      termId: data.term_id,
    });

    if (!studentBillResp.success) {
      showToast(studentBillResp.message || "An error occurred fetching payment history", "error");
      return;
    }

    if (studentBillResp.data.length <= 0) {
      showToast("No payment history found for this student", "success");
      return;
    }

    const stdBill = studentBillResp.data[0];

    if (stdBill.discount_amount > 0) {
      discountContainer.style.display = "";
      discountText.textContent = fCurrency(stdBill.discount_amount);
    } else {
      discountContainer.style.display = "none";
    }

    classYearText.textContent = `${data.class_name} - ${data.term} Term, ${data.academic_year}`;
    paidText.textContent = fCurrency(stdBill.total_payments);
    balanceText.textContent = fCurrency(stdBill.balance);
    feesText.textContent = fCurrency(stdBill.fee_amount + stdBill.discount_amount);
  } else {
    classYearText.textContent = `${currentClass.className} - ${classTerm.text} Term, ${currentClass.academicYear}`;
    if (data.discount_amount > 0) {
      discountContainer.style.display = "";
      discountText.textContent = fCurrency(data.discount_amount);
    } else {
      discountContainer.style.display = "none";
    }

    feesText.textContent = fCurrency(data.fee_amount + data.discount_amount);
    paidText.textContent = fCurrency(data.total_payments);
    balanceText.textContent = fCurrency(data.balance);
  }

  openModal();
};

const openModal = () => {
  paymentHistoryModal.classList.add("active");
  document.body.style.overflow = "hidden";
};

const closeModal = () => {
  paymentHistoryModal.classList.remove("active");
  document.body.style.overflow = "auto";
};

document
  .getElementById("paymentHistoryClassCloseXBtn")
  .addEventListener("click", () => closeModal());

document.getElementById("paymentHistoryOkModalBtn").addEventListener("click", () => closeModal());
