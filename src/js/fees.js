import { fCurrency } from "./utils/format-currency.js";
import { getDefaultTermSetting, getDefaultYearSetting } from "./utils/get-settings.js";
import { printPage } from "./utils/print-page.js";
import {
  setUpAcademicYearsSelect,
  setUpClassSelect,
  setUpTermsSelect,
} from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

const feesTableBody = document.getElementById("feesTableBody");
const addFeesModal = document.getElementById("addFeesModal");
const filterFeesByAcademicYear = document.getElementById("filterFeesByAcademicYear");
const filterFeesByTerm = document.getElementById("filterFeesByTerm");
const addFeesModalClass = document.getElementById("feesClassSelect");
const addFeesModalYear = document.getElementById("feesAcademicYear");
const addFeesModalTerm = document.getElementById("feesTerm");

const editFeesModal = document.getElementById("editFeesModal");

document.getElementById("printFeesBtn").addEventListener("click", async () => {
  const feesTable = document.getElementById("feesTable");

  if (!feesTable) {
    showToast("No table found to print", "error");
    return;
  }

  const academicYearSetting = await getDefaultYearSetting();

  // Clone the table to modify it without affecting the original
  const tableClone = feesTable.cloneNode(true);
  tableClone.querySelectorAll("tr").forEach((row, index) => {
    if (row.cells[6]) row.removeChild(row.cells[6]);
  });

  // Remove background colors
  tableClone.querySelectorAll("tr, td, th").forEach((el) => {
    el.style.backgroundColor = "white";
  });

  // Add a heading above the table
  const heading = `<h2 style="text-align: center; margin-bottom: 10px;">School Fees</h2>`;

  printPage(heading, tableClone.outerHTML);
});

// Event Listeners for Add Fees Modal
document.getElementById("btnAddFees").addEventListener("click", async () => {
  const academicYear = filterFeesByAcademicYear.value;
  const term = filterFeesByTerm.value;

  const defaultTerm = await getDefaultTermSetting();
  const defaultYear = await getDefaultYearSetting();

  if (
    Number(defaultTerm.setting_value) !== Number(term) ||
    Number(defaultYear.setting_value) !== Number(academicYear)
  ) {
    showToast("You can only add fees current term and academic year", "error");
    return;
  }

  setUpClassSelect(addFeesModalClass);
  setUpAcademicYearsSelect(addFeesModalYear, false, academicYear);
  setUpTermsSelect(addFeesModalTerm, false, term);

  addFeesModalYear.disabled = true;
  addFeesModalTerm.disabled = true;
  addFeesModal.style.display = "block";
});

document.getElementById("addFeesCloseXBtn").addEventListener("click", function () {
  addFeesModal.style.display = "none";
});

document.getElementById("cancelFeesModalBtn").addEventListener("click", function () {
  addFeesModal.style.display = "none";
});

// Event Listener for Adding Fees
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
    classId: studentClass,
    academicYearId: academicYear,
    termId: term,
    amount: feesAmount,
  });

  if (!response.success) {
    showToast(response.message || "Failed to set fees", "error");
    return;
  }

  showToast(response.message, "success");
  document.getElementById("feesAmount").value = "";
  addFeesModal.style.display = "none";
  await setUpFeesSection();
});

// Event Listeners for Filtering
filterFeesByAcademicYear.addEventListener("change", filterFeesTable);
filterFeesByTerm.addEventListener("change", filterFeesTable);

// Event Listener for Saving Edited Fees
document.getElementById("saveEditFeesBtn").addEventListener("click", async () => {
  const feeId = document.getElementById("editFeesId").value;
  const updatedAmount = document.getElementById("editFeesAmount").value;

  if (!updatedAmount) {
    showToast("Please enter a valid amount", "error");
    return;
  }

  const response = await window.api.updateFeeAmount({
    id: feeId,
    amount: updatedAmount,
  });

  if (!response.success) {
    showToast(response.message || "Failed to update fee", "error");
    return;
  }

  showToast(response.message, "success");
  document.getElementById("editFeesModal").style.display = "none";
  await setUpFeesSection();
});

// Event Listeners for Edit Fees Modal
document.getElementById("editFeesCloseXBtn").addEventListener("click", function () {
  document.getElementById("editFeesModal").style.display = "none";
});

document.getElementById("cancelEditFeesModalBtn").addEventListener("click", function () {
  document.getElementById("editFeesModal").style.display = "none";
});

// Event Delegation for Edit and Delete Buttons
feesTableBody.addEventListener("click", (event) => {
  const editButton = event.target.closest("#btnEditFees");
  const deleteButton = event.target.closest("#btnDeleteFees");

  if (editButton) {
    const row = editButton.closest("tr");
    const fee = {
      id: row.getAttribute("data-id"),
      class: row.getAttribute("data-class"),
      academic_year: row.getAttribute("data-academic-year"),
      term: row.getAttribute("data-term"),
      amount: row.getAttribute("data-amount"),
      total_students_billed: row.getAttribute("data-total-students-billed"),
    };
    handleEditFee(fee);
  }

  if (deleteButton) {
    const row = deleteButton.closest("tr");
    const fee = {
      id: row.getAttribute("data-id"),
      total_students_billed: row.getAttribute("data-total-students-billed"),
    };
    handleDeleteFee(fee);
  }
});

// Function to Display Fees Table
async function displayFeesTable() {
  // TODO: get fees for a particular year and term, and display them in the table
  const response = await window.api.getAllFees();

  if (!response.success) {
    showToast("Error occurred", "error");
    return;
  }

  feesTableBody.innerHTML = "";
  response.data.forEach((record, index) => {
    const row = document.createElement("tr");

    // Add data attributes to the row
    row.setAttribute("data-id", record.id);
    row.setAttribute("data-class-id", record.class_id);
    row.setAttribute("data-year-id", record.year_id);
    row.setAttribute("data-term-id", record.term_id);
    row.setAttribute("data-class", record.class_name);
    row.setAttribute("data-academic-year", record.academic_year);
    row.setAttribute("data-term", record.term);
    row.setAttribute("data-amount", record.amount);
    row.setAttribute("data-total-students-billed", record.total_students_billed);

    const isBilled = record.total_students_billed > 0;

    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${record.class_name} </td>
        <td>${record.academic_year} </td>
        <td>${record.term} </td>
        <td>${fCurrency(record.amount)} </td>
        <td>${record.total_students_billed} </td>
        <td>
          <div style="display: flex; justify-content: center">
            <button id="btnEditFees" class="text-button" title="Edit record" ${
              isBilled ? "disabled" : ""
            }>
              <i class="fa-solid fa-edit"></i>
              Edit
            </button>
            <button id="btnDeleteFees" class="text-button" title="Delete record" ${
              isBilled ? "disabled" : ""
            } style="color: ${isBilled ? "" : "red"}">
              <i class="fa-solid fa-trash"></i>
              Delete
            </button>
          </div>
        </td>
      `;

    feesTableBody.appendChild(row);
  });
}

// Function to Filter Fees Table
function filterFeesTable() {
  const year = filterFeesByAcademicYear.value;
  const term = filterFeesByTerm.value;

  const tableRows = feesTableBody.querySelectorAll("tr");

  tableRows.forEach((row) => {
    const rowTerm = row.getAttribute("data-term-id");
    const rowYear = row.getAttribute("data-year-id");

    // Handle cases where rowTerm or rowYear is null or undefined
    const yearMatch = year === "all" || (rowYear && rowYear.includes(year));
    const termMatch = term === "all" || (rowTerm && rowTerm.includes(term));

    // Show or hide row based on filter match
    if (yearMatch && termMatch) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

// Function to Handle Editing Fees
function handleEditFee(fee) {
  if (fee.total_students_billed > 0) {
    showToast("Cannot edit fee: Students have already been billed", "error");
    return;
  }

  editFeesModal.style.display = "block";
  document.getElementById("editFeesId").value = fee.id;
  document.getElementById("editFeesClass").value = fee.class;
  document.getElementById("editFeesAcademicYear").value = fee.academic_year;
  document.getElementById("editFeesTerm").value = fee.term;
  document.getElementById("editFeesAmount").value = fee.amount;
}

// Function to Handle Deleting Fees
async function handleDeleteFee(fee) {
  const userSession = await window.app.getSession();
  if (userSession !== "admin") {
    showToast("Only admin can delete a fee", "error");
    return;
  }

  if (fee.total_students_billed > 0) {
    showToast("Cannot delete fee: Students have already been billed", "error");
    return;
  }

  const confirmDelete = await window.dialog.showConfirmationDialog(
    "Are you sure you want to delete this fee?"
  );
  if (!confirmDelete) return;

  const deleteResponse = await window.api.deleteFee(fee.id);

  if (!deleteResponse.success) {
    showToast(deleteResponse.message || "Failed to delete fee", "error");
    return;
  }

  showToast(deleteResponse.message, "success");
  await setUpFeesSection();
}

export async function setUpFeesSection() {
  const termSetting = await getDefaultTermSetting();
  const yearSetting = await getDefaultYearSetting();

  await setUpAcademicYearsSelect(filterFeesByAcademicYear, true);
  await setUpTermsSelect(filterFeesByTerm, true);
  filterFeesByAcademicYear.value = yearSetting.setting_value;
  filterFeesByTerm.value = termSetting.setting_value;

  await displayFeesTable();
  filterFeesTable();
}
