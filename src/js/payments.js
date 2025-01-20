import { formatDate } from "./utils/format-date.js";

const tableBody = document.getElementById("paymentsTableBody");
const academicYearSelect = document.getElementById("paymentAcademicYear");

academicYearSelect.addEventListener("change", (event) => {
    console.log(academicYearSelect.value)

})

export function displayPaymentsTable(data) {
  tableBody.innerHTML = "";
  data.forEach((payment, index) => {
    const row = tableBody.insertRow(index);
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
