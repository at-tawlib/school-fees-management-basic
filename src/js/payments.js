import { fCurrency } from "./utils/format-currency.js";
import { formatDate } from "./utils/format-date.js";
import {
  setUpAcademicYearsSelect,
  setUpClassSelect,
  setUpTermsSelect,
} from "./utils/setup-select-inputs.js";

const tableBody = document.getElementById("paymentsTableBody");
const classSelect = document.getElementById("paymentClass");
const termSelect = document.getElementById("paymentTerm");
const yearSelect = document.getElementById("paymentAcademicYear");

const searchPaymentsInput = document.getElementById("searchPaymentsInput");

classSelect.addEventListener("change", filterPaymentsTable);
termSelect.addEventListener("change", filterPaymentsTable);
yearSelect.addEventListener("change", filterPaymentsTable);
searchPaymentsInput.addEventListener("input", filterPaymentsTable);

function filterPaymentsTable() {
  const searchValue = searchPaymentsInput.value.toLowerCase();
  const selectedClass = classSelect.value;
  const selectedTerm = termSelect.value;
  const selectedYear = yearSelect.value;

  const tableRows = tableBody.querySelectorAll("tr");

  tableRows.forEach((row) => {
    const rowName = row.getAttribute("data-name").toLowerCase();
    const rowClass = row.getAttribute("data-class");
    const rowTerm = row.getAttribute("data-term");
    const rowYear = row.getAttribute("data-year");

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
  const response = await window.api.getAllPayments();

  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  const data = response.data;
  setUpAcademicYearsSelect(paymentAcademicYear, true);
  setUpClassSelect(paymentClass, true);
  setUpTermsSelect(paymentTerm, true);

  tableBody.innerHTML = "";
  data.forEach((payment, index) => {
    const row = tableBody.insertRow(index);

    // Add data-* attributes for filtering
    row.setAttribute("data-class", payment.class_name);
    row.setAttribute("data-name", payment.student_name);
    row.setAttribute("data-term", payment.term);
    row.setAttribute("data-year", payment.academic_year);

    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${payment.student_name}</td>
        <td>${payment.class_name}</td>
        <td>${payment.academic_year}</td>
        <td>${payment.term}</td>
        <td>${fCurrency(payment.fee_amount)}</td>
        <td>${fCurrency(payment.payment_amount)}</td>
        <td>${payment.payment_mode}</td>
        <td>${payment.payment_details}</td>
        <td>${formatDate(payment.date_paid)}</td>
        <td></td>
      `;
  });
}
