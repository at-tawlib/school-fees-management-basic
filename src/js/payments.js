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
        <td></td>
      `;
  });
}
