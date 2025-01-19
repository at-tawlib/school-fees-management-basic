import { CONTAINERS } from "./constants/constants.js";
import { showToast } from "./utils/toast.js";
import { showHideFeesContainer } from "./utils/show-fees-container.js";
import { clearInputsStyles } from "./utils/clear-input-styles.js";
import { openStudentPaymentModal } from "./modals/make-payment-modal.js";

const classSelect = document.getElementById("viewBillClassSelect");
const academicYearInput = document.getElementById("viewBillAcademicYear");
const termSelect = document.getElementById("viewBillTermSelect");
const billDetailsText = document.getElementById("viewBillDetailsText");
const billClassTableContainer = document.getElementById("viewBillClassTableContainer");
const billClassTable = document.getElementById("viewBillClassTable");
const billTableHeader = document.getElementById("viewBillClassTitle");
const billClassTableBody = document.getElementById("viewBillClassTableBody");

document.getElementById("viewBillOkButton").addEventListener("click", async () => {
  const className = classSelect.value;
  const academicYear = academicYearInput.value;
  const term = termSelect.value;

  clearInputsStyles([classSelect, academicYearInput, termSelect, billDetailsText]);

  if (!className) {
    classSelect.style.backgroundColor = "red";
    classSelect.style.color = "white";
    showToast("Select a class", "error");
    return;
  }

  if (!academicYear) {
    showToast("Select an academic year", "error");
    academicYearInput.style.backgroundColor = "red";
    academicYearInput.style.color = "white";
    return;
  }

  const response = await window.api.getBillByClassYear({ className, academicYear });
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
  const academicYear = academicYearInput.value;
  const term = termSelect.value;

  billClassTableContainer.style.display = "block";
  billTableHeader.textContent = `Class ${className} for ${academicYear} ${term} term`;
  billClassTableBody.innerHTML = "";

  data.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${index + 1}</td>
        <td style="display:none">${item.student_id}</td>
        <td style="display:none">${item.bill_id}</td>
        <td>${item.student_name}</td>
        <td>${item.class_name}</td>
        <td>${item.academic_year}</td>
        <td>${item.term}</td>
        <td>${item.fees_amount}</td>
        <td>0</td>
        <td>${item.fees_amount}</td>
        <td>
          <button id="btnPayFees"  title="Pay school fees">
            <i class="fa-solid fa-edit"></i>
            Pay fees
          </button>
        </td>
    `;

    row.querySelector("#btnPayFees").addEventListener("click", () => {
      // currentStudent = student;
      // openStudentPaymentModal(student);
      openStudentPaymentModal(item);
    });

    billClassTableBody.appendChild(row);
  });
}
