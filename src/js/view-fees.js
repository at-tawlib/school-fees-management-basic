import {
  setUpAcademicYearsSelect,
  setUpClassSelect,
  setUpTermsSelect,
} from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

const feesTable = document.getElementById("feesTable");
const feesTableHead = document.getElementById("feesTableHead");
const feesTableBody = document.getElementById("feesTableBody");
const addFeesModal = document.getElementById("addFeesModal");
const filterFeesByClassSelect = document.getElementById("filterFeesByClassSelect");
const filterFeesByAcademicYear = document.getElementById("filterFeesByAcademicYear");
const filterFeesByTerm = document.getElementById("filterFeesByTerm");
const addFeesModalClass = document.getElementById("feesClassSelect");
const addFeesModalYear = document.getElementById("feesAcademicYear");
const addFeesModalTerm = document.getElementById("feesTerm");

document.getElementById("btnAddFees").addEventListener("click", function () {
  setUpClassSelect(addFeesModalClass);
  setUpAcademicYearsSelect(addFeesModalYear);
  setUpTermsSelect(addFeesModalTerm);
  addFeesModal.style.display = "block";
});

document.getElementById("addFeesCloseXBtn").addEventListener("click", function () {
  addFeesModal.style.display = "none";
});

document.getElementById("cancelFeesModalBtn").addEventListener("click", function () {
  addFeesModal.style.display = "none";
});

document.getElementById("setFeesBtn").addEventListener("click", async () => {
  const studentClass = document.getElementById("feesClassSelect").value;
  const academicYear = document.getElementById("feesAcademicYear").value;
  const term = document.getElementById("feesTerm").value;
  const feesAmount = document.getElementById("feesAmount").value;

  if (!academicYear || !studentClass || !term || !feesAmount) {
    showToast("Please fill all the fields", "error");
    return;
  }

  const response = await window.api.addFees({
    class: studentClass,
    academicYear,
    term,
    amount: feesAmount,
  });

  if (!response.success) {
    showToast(response.message || "Failed to set fees", "error");
    return;
  }

  showToast(response.message, "success");
  document.getElementById("feesAmount").value = "";
  addFeesModal.style.display = "none";
});

export async function displayFeesTable() {
  const response = await window.api.getAllFees();

  if (!response.success) {
    showToast("Error occurred", "error");
    return;
  }

  setUpClassSelect(filterFeesByClassSelect, true);
  setUpAcademicYearsSelect(filterFeesByAcademicYear, true);
  setUpTermsSelect(filterFeesByTerm, true);

  feesTableHead.innerHTML = "";
  feesTableBody.innerHTML = "";
  feesTable.innerHTML = "";

  const tableHeadRow = document.createElement("tr");
  tableHeadRow.innerHTML = `
        <th>#</th>
        <th>Class</th>
        <th>Academic Year</th>
        <th>Term</th>
        <th>Fees</th>
        <th>Actions</th>
    `;
  feesTableHead.appendChild(tableHeadRow);
  feesTable.appendChild(feesTableHead);

  // TODO: add filters and search functionality and option to update amount
  response.data.forEach((record, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${record.class} </td>
        <td>${record.academic_year} </td>
        <td>${record.term} </td>
        <td>${record.amount} </td>
        <td>
          <div style="display: flex; justify-content: center">
           <button id="btnEditDailyStats" class="text-button" title="Edit record">
            <i class="fa-solid fa-edit"></i>
            Edit
          </button>
          </div>
        </td>
      `;
    feesTableBody.appendChild(row);
  });

  feesTable.appendChild(feesTableBody);
}
