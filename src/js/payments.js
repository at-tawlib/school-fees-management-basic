import { formatDate } from "./utils/format-date.js";

const tableBody = document.getElementById("paymentsTableBody");
const classSelect = document.getElementById("paymentClass");
const termSelect = document.getElementById("paymentTerm");

classSelect.addEventListener("change", filterPaymentsTable);
termSelect.addEventListener("change", filterPaymentsTable);

function filterPaymentsTable() {
  const selectedClass = classSelect.value;
  const selectedTerm = termSelect.value;

  console.log(selectedClass, selectedTerm)

  const tableRows = tableBody.querySelectorAll("tr");

  tableRows.forEach((row) => {
    const rowClass = row.getAttribute("data-class");
    const rowTerm = row.getAttribute("data-term");
    // const rowYear = row.getAttribute("data-year");

    console.log("rowClass: ", rowClass)
    console.log("rowTerm: ", rowTerm)

    const classMatch = selectedClass === "all" || rowClass.includes(selectedClass);
    const termMatch = selectedTerm === "all" || rowTerm.includes(selectedTerm);

    console.log("classMatch: ", classMatch)
    console.log("termMatch: ", termMatch)

    // Show or hide row based on filter match
    if (classMatch && termMatch) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

export function displayPaymentsTable(data) {
  tableBody.innerHTML = "";
  data.forEach((payment, index) => {
    const row = tableBody.insertRow(index);

    // Add data-* attributes for filtering
    row.setAttribute("data-class", payment.class_name);
    row.setAttribute("data-term", payment.term);
    row.setAttribute("data-year", payment.academic_year);

    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${payment.student_name}</td>
        <td>${payment.class_name}</td>
        <td>${payment.academic_year}</td>
        <td>${payment.term}</td>
        <td>${payment.fee_amount}</td>
        <td>${payment.payment_amount}</td>
        <td>${payment.payment_mode}</td>
        <td>${payment.payment_details}</td>
        <td>${formatDate(payment.date_paid)}</td>
        <td></td>
      `;
  });
}
