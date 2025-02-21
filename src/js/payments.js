import { showPaymentHistoryModal } from "./student-class.js";
import { fCurrency } from "./utils/format-currency.js";
import { formatDate } from "./utils/format-date.js";
import { getDefaultTermSetting, getDefaultYearSetting } from "./utils/get-settings.js";
import {
  setUpAcademicYearsSelect,
  setUpClassSelect,
  setUpTermsSelect,
} from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

const tableBody = document.getElementById("paymentsTableBody");
const classSelect = document.getElementById("paymentClass");
const termSelect = document.getElementById("paymentTerm");
const yearSelect = document.getElementById("paymentAcademicYear");

const searchPaymentsInput = document.getElementById("searchPaymentsInput");

classSelect.addEventListener("change", filterPaymentsTable);
termSelect.addEventListener("change", displayPaymentsTable);
yearSelect.addEventListener("change", displayPaymentsTable);
searchPaymentsInput.addEventListener("input", filterPaymentsTable);

export async function setUpPaymentsSection() {
  const defaultYear = await getDefaultYearSetting();
  const defaultTerm = await getDefaultTermSetting();
  await setUpAcademicYearsSelect(paymentAcademicYear, false);
  await setUpClassSelect(paymentClass, true);
  await setUpTermsSelect(paymentTerm, false);

  paymentAcademicYear.value = defaultYear.setting_value;
  paymentTerm.value = defaultTerm.setting_value;

  await displayPaymentsTable();
}

function filterPaymentsTable() {
  const searchValue = searchPaymentsInput.value.toLowerCase();
  const selectedClass = classSelect.value;
  const selectedTerm = termSelect.value;
  const selectedYear = yearSelect.value;

  const tableRows = tableBody.querySelectorAll("tr");
  tableRows.forEach((row) => {
    const rowName = row.getAttribute("data-name").toLowerCase();
    const rowClass = row.getAttribute("data-class-id");
    const rowTerm = row.getAttribute("data-term-id");
    const rowYear = row.getAttribute("data-year-id");

    const classMatch = selectedClass === "all" || rowClass.includes(selectedClass);
    const termMatch = selectedTerm === "all" || rowTerm.includes(selectedTerm);
    const yearMatch = selectedYear === "all" || rowYear.includes(selectedYear);

    // Show or hide row based on filter match
    if (classMatch && termMatch && yearMatch && rowName.includes(searchValue)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

export async function displayPaymentsTable() {
  // TODO: get payments for year and term getYearTermPayments
  // const response = await window.api.getAllPayments();
  const response = await window.api.getYearTermPayments({
    academicYearId: yearSelect.value,
    termId: termSelect.value,
  });
  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  const data = response.data;
  tableBody.innerHTML = "";
  data.forEach((payment, index) => {
    const row = tableBody.insertRow(index);

    // Add data-* attributes for filtering
    row.setAttribute("data-class-id", payment.class_id);
    row.setAttribute("data-year-id", payment.year_id);
    row.setAttribute("data-term-id", payment.term_id);
    row.setAttribute("data-name", payment.student_name);

    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${payment.student_name}</td>
        <td>${payment.class_name}</td>
        <td>${payment.academic_year}</td>
        <td>${payment.term}</td>
        <td class="color-blue bold-text">${fCurrency(payment.fee_amount)}</td>
        <td class="color-green bold-text">${fCurrency(payment.payment_amount)}</td>
        <td>${payment.payment_mode}</td>
        <td>${payment.payment_details}</td>
        <td>${formatDate(payment.date_paid)}</td>
        <td>
         <div style="display: flex; justify-content: center">
            <button id="btnPaymentView"  class="text-button" title="View Payment">
              <i class="fa-solid fa-eye color-green"></i>
            </button>

            <button id="btnPaymentEdit"  class="text-button" title="Edit Payment">
              <i class="fa-solid fa-edit"></i>
            </button>

            <button id="bntPaymentDelete"  class="text-button" title="Delete Payment">
              <i class="fa-solid fa-trash color-red"></i>
            </button>
          </div>
        </td>
      `;

    row.querySelector("#btnPaymentView").addEventListener("click", async () => {
      const classDetails = {
        className: payment.class_name,
        academicYear: payment.academic_year,
        term: payment.term,
      };
      await showPaymentHistoryModal(payment, classDetails);
    });

    row.querySelector("#btnPaymentEdit").addEventListener("click", () => {
      handleEditPayment(payment);
    });

    row.querySelector("#bntPaymentDelete").addEventListener("click", async () => {
      await handleDeletePayment(payment.payment_id);
    });
  });
}

const handleViewPayment = (payment) => {
  //   {
  //     "student_id": 4,
  //     "student_name": "Aminu  Dramani",
  //     "fees_id": 4,
  //     "fee_amount": 1000,
  //     "bill_id": 87,
  //     "total_payments": 1000,
  //     "balance": 0,
  //     "discount_amount": 0
  // }

  //   {
  //     "payment_id": 47,
  //     "bill_id": 99,
  //     "payment_amount": 500,
  //     "payment_mode": "MOMO",
  //     "payment_details": "55",
  //     "date_paid": "2025-02-19T10:59:00.238Z",
  //     "fees_id": 6,
  //     "student_id": 20,
  //     "student_name": "Triple 'H'  Big Man",
  //     "class_name": "Grade 3",
  //     "class_id": 3,
  //     "academic_year": "2024/2025",
  //     "year_id": 1,
  //     "term": "Third",
  //     "fee_amount": 1000,
  //     "term_id": 3
  // }

  console.log(payment);
};

const handleDeletePayment = async (paymentId) => {
  const confirmed = await window.dialog.showConfirmationDialog(
    "Do you really want to delete this payment?"
  );

  if (confirmed) {
    const response = await window.api.deletePayment(paymentId);
    if (!response.success) {
      showToast(response.message || "An error occurred", "error");
      return;
    }
    showToast(response.message || "Payment deleted successfully", "success");
    await displayPaymentsTable();
  }
};
