import { showToast } from "./utils/toast.js";
import { clearInputsStyles } from "./utils/clear-input-styles.js";
import { openStudentPaymentModal } from "./modals/make-payment-modal.js";
import {
  setUpAcademicYearsSelect,
  setUpClassSelect,
  setUpTermsSelect,
} from "./utils/setup-select-inputs.js";

const classSelect = document.getElementById("viewBillClassSelect");
const academicYearSelect = document.getElementById("viewBillAcademicYear");
const termSelect = document.getElementById("viewBillTermSelect");
const billDetailsText = document.getElementById("viewBillDetailsText");
const billClassTableContainer = document.getElementById("viewBillClassTableContainer");
const billClassTable = document.getElementById("viewBillClassTable");
const billTableHeader = document.getElementById("viewBillClassTitle");
const billClassTableBody = document.getElementById("viewBillClassTableBody");

document.getElementById("viewBillOkButton").addEventListener("click", async () => {
  const className = classSelect.value;
  const academicYear = academicYearSelect.value;
  const term = termSelect.value;

  clearInputsStyles([classSelect, academicYearSelect, termSelect, billDetailsText]);

  if (!className) {
    classSelect.style.backgroundColor = "red";
    classSelect.style.color = "white";
    showToast("Select a class", "error");
    return;
  }

  if (!academicYear) {
    showToast("Select an academic year", "error");
    academicYearSelect.style.backgroundColor = "red";
    academicYearSelect.style.color = "white";
    return;
  }

  const response = await window.api.getStudentsBillSummary({ className, academicYear, term });
  console.log(response);

  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  if (response.data.length === 0) {
    billClassTableContainer.style.display = "none";
    billDetailsText.textContent = `No students found for Class ${className} for ${academicYear} academic year.`;
    billFeesId.textContent = "";
    showToast("No students found for this class", "error");
    return;
  }

  displayViewBillTable(response.data);
});

function displayViewBillTable(data) {
  const className = classSelect.value;
  const academicYear = academicYearSelect.value;
  const term = termSelect.value;
  billDetailsText.textContent = "";

  billClassTableContainer.style.display = "block";
  billTableHeader.textContent = `Class ${className} for ${academicYear} ${term} term`;
  billClassTableBody.innerHTML = "";

  data.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${index + 1}</td>
        <td style="display:none">${item.student_id}</td>
        <td style="display:none">${item.bill_id}</td>
        <td style="display:none">${item.fees_id}</td>
        <td>${item.student_name}</td>
        <td>${item?.bill_id ? "Billed" : "Not Billed"}</td>
        <td>${item.fee_amount}</td>
        <td>${item.total_payments}</td>
        <td>${item.fee_amount - item.total_payments}</td>
        <td>
          <button id="btnPayFees"  title="Pay school fees">
            <i class="fa-solid fa-edit"></i>
            Pay fees
          </button>
        </td>
    `;

    row.querySelector("#btnPayFees").addEventListener("click", () => {
      openStudentPaymentModal(item);
    });

    billClassTableBody.appendChild(row);
  });
}

export function setUpViewBills() {
  classSelect.innerHTML = "";
  academicYearSelect.innerHTML = "";
  termSelect.innerHTML = "";
  billDetailsText.textContent = "";
  billClassTableContainer.style.display = "none";
  billClassTableBody.innerHTML = "";
  billTableHeader.textContent = "";

  setUpClassSelect(classSelect, true);
  setUpAcademicYearsSelect(academicYearSelect, true);
  setUpTermsSelect(termSelect, true);
}
