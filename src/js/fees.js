import { fCurrency } from "./utils/format-currency.js";
import { getDefaultTermSetting, getDefaultYearSetting } from "./utils/get-settings.js";
import { printPage } from "./utils/print-page.js";
import {
  setUpAcademicYearsSelect,
  setUpClassSelect,
  setUpTermsSelect,
} from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

// DOM elements
const elements = {
  // Tables
  feesTable: document.getElementById("feesTable"),
  feesTableBody: document.getElementById("feesTableBody"),

  // Modals
  addFeesModal: document.getElementById("addFeesModal"),
  editFeesModal: document.getElementById("editFeesModal"),

  // Filters
  filterFeesByAcademicYear: document.getElementById("filterFeesByAcademicYear"),
  filterFeesByTerm: document.getElementById("filterFeesByTerm"),

  // Add Fees Modal Elements
  addFeesModalClass: document.getElementById("feesClassSelect"),
  addFeesModalYear: document.getElementById("feesAcademicYear"),
  addFeesModalTerm: document.getElementById("feesTerm"),
  feesAmount: document.getElementById("feesAmount"),

  // Edit Fees Modal Elements
  editFeesId: document.getElementById("editFeesId"),
  editFeesClass: document.getElementById("editFeesClass"),
  editFeesAcademicYear: document.getElementById("editFeesAcademicYear"),
  editFeesTerm: document.getElementById("editFeesTerm"),
  editFeesAmount: document.getElementById("editFeesAmount"),

  // Buttons
  printFeesBtn: document.getElementById("printFeesBtn"),
  btnAddFees: document.getElementById("btnAddFees"),
  setFeesBtn: document.getElementById("setFeesBtn"),
  saveEditFeesBtn: document.getElementById("saveEditFeesBtn"),
};

// Event listeners setup
const setupEventListeners = () => {
  // Print functionality
  elements.printFeesBtn.addEventListener("click", handlePrintFees);

  // Add fees modal
  elements.btnAddFees.addEventListener("click", handleAddFeesClick);
  elements.setFeesBtn.addEventListener("click", handleSetFees);

  // Filter functionality
  elements.filterFeesByAcademicYear.addEventListener("change", filterFeesTable);
  elements.filterFeesByTerm.addEventListener("change", filterFeesTable);

  // Edit fees modal
  elements.saveEditFeesBtn.addEventListener("click", handleSaveEditFees);

  // Modal close buttons
  setupModalCloseButtons();

  // Event delegation for table actions
  elements.feesTableBody.addEventListener("click", handleTableActions);
};

// Setup modal close button event listeners
const setupModalCloseButtons = () => {
  const modalCloseButtons = [
    { selector: "#addFeesCloseXBtn", modal: elements.addFeesModal },
    { selector: "#cancelFeesModalBtn", modal: elements.addFeesModal },
    { selector: "#editFeesCloseXBtn", modal: elements.editFeesModal },
    { selector: "#cancelEditFeesModalBtn", modal: elements.editFeesModal },
  ];

  modalCloseButtons.forEach(({ selector, modal }) => {
    document.getElementById(selector.replace("#", "")).addEventListener("click", () => {
      modal.classList.remove("active");
      document.body.style.overflow = "auto";
    });
  });
};

// Handle print functionality
const handlePrintFees = async () => {
  if (!elements.feesTable) {
    showToast("No table found to print", "error");
    return;
  }

  try {
    const academicYearSetting = await getDefaultYearSetting();

    // Clone and prepare table for printing
    const tableClone = elements.feesTable.cloneNode(true);

    // Remove actions column (last column)
    tableClone.querySelectorAll("tr").forEach((row) => {
      if (row.cells[6]) {
        row.removeChild(row.cells[6]);
      }
    });

    // Remove background colors for printing
    tableClone.querySelectorAll("tr, td, th").forEach((el) => {
      el.style.backgroundColor = "white";
    });

    const heading = `<h2 style="text-align: center; margin-bottom: 10px;">School Fees - ${
      academicYearSetting?.setting_text || ""
    }</h2>`;

    printPage(heading, tableClone.outerHTML);
  } catch (error) {
    console.error("Error printing fees:", error);
    showToast("Failed to print fees", "error");
  }
};

// Validate current term and year for adding fees
const validateCurrentTermAndYear = async (academicYear, term) => {
  try {
    const [defaultTerm, defaultYear] = await Promise.all([
      getDefaultTermSetting(),
      getDefaultYearSetting(),
    ]);

    return (
      Number(defaultTerm.setting_value) === Number(term) &&
      Number(defaultYear.setting_value) === Number(academicYear)
    );
  } catch (error) {
    console.error("Error validating term and year:", error);
    return false;
  }
};

// Handle add fees button click
const handleAddFeesClick = async () => {
  try {
    const academicYear = elements.filterFeesByAcademicYear.value;
    const term = elements.filterFeesByTerm.value;

    const isCurrentTermAndYear = await validateCurrentTermAndYear(academicYear, term);

    if (!isCurrentTermAndYear) {
      showToast("You can only add fees for the current term and academic year", "error");
      return;
    }

    await Promise.all([
      setUpClassSelect(elements.addFeesModalClass),
      setUpAcademicYearsSelect(elements.addFeesModalYear, false, academicYear),
      setUpTermsSelect(elements.addFeesModalTerm, false, term),
    ]);

    // Disable year and term selects
    elements.addFeesModalYear.disabled = true;
    elements.addFeesModalTerm.disabled = true;

    elements.addFeesModal.classList.add("active");
    document.body.style.overflow = "hidden";
  } catch (error) {
    console.error("Error setting up add fees modal:", error);
    showToast("Failed to open add fees modal", "error");
  }
};

// Validate form inputs
const validateFormInputs = (inputs) => {
  return inputs.every((input) => input && input.trim() !== "");
};

// Handle setting fees
const handleSetFees = async () => {
  try {
    const studentClass = elements.addFeesModalClass.value;
    const academicYear = elements.addFeesModalYear.value;
    const term = elements.addFeesModalTerm.value;
    const feesAmount = elements.feesAmount.value;

    if (!validateFormInputs([studentClass, academicYear, term, feesAmount])) {
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

    // Reset form and close modal
    elements.feesAmount.value = "";
    elements.addFeesModal.classList.remove("active");
    document.body.style.overflow = "auto";

    await setUpFeesSection();
  } catch (error) {
    console.error("Error setting fees:", error);
    showToast("Failed to set fees", "error");
  }
};

// Handle saving edited fees
const handleSaveEditFees = async () => {
  try {
    const feeId = elements.editFeesId.value;
    const updatedAmount = elements.editFeesAmount.value;

    if (!updatedAmount || !updatedAmount.trim()) {
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
    elements.editFeesModal.style.display = "none";

    await setUpFeesSection();
  } catch (error) {
    console.error("Error updating fee:", error);
    showToast("Failed to update fee", "error");
  }
};

// Extract fee data from table row
const extractFeeDataFromRow = (row) => {
  const attributes = [
    "data-id",
    "data-class",
    "data-academic-year",
    "data-term",
    "data-amount",
    "data-total-students-billed",
  ];

  return attributes.reduce((fee, attr) => {
    const key = attr.replace("data-", "").replace("-", "_");
    fee[key] = row.getAttribute(attr);
    return fee;
  }, {});
};

// Handle table actions (edit/delete)
const handleTableActions = (event) => {
  const editButton = event.target.closest("#btnEditFees");
  const deleteButton = event.target.closest("#btnDeleteFees");

  if (editButton) {
    const row = editButton.closest("tr");
    const fee = extractFeeDataFromRow(row);
    handleEditFee(fee);
  }

  if (deleteButton) {
    const row = deleteButton.closest("tr");
    const fee = extractFeeDataFromRow(row);
    handleDeleteFee(fee);
  }
};

// Create fee table row
const createFeeTableRow = (record, index) => {
  const row = document.createElement("tr");
  const isBilled = record.total_students_billed > 0;

  // Set data attributes
  const attributes = {
    "data-id": record.id,
    "data-class-id": record.class_id,
    "data-year-id": record.year_id,
    "data-term-id": record.term_id,
    "data-class": record.class_name,
    "data-academic-year": record.academic_year,
    "data-term": record.term,
    "data-amount": record.amount,
    "data-total-students-billed": record.total_students_billed,
  };

  Object.entries(attributes).forEach(([key, value]) => {
    row.setAttribute(key, value);
  });

  row.innerHTML = `
    <td>${index + 1}</td>
    <td>${record.class_name}</td>
    <td>${record.academic_year}</td>
    <td>${record.term}</td>
    <td>${fCurrency(record.amount)}</td>
    <td>${record.total_students_billed}</td>
    <td>
      <div style="display: flex; justify-content: center; gap: 8px;">
        <button id="btnEditFees" class="text-button" title="Edit record" ${
          isBilled ? "disabled" : ""
        }>
          <i class="fa-solid fa-edit"></i> Edit
        </button>
        <button id="btnDeleteFees" class="text-button" title="Delete record" 
                ${isBilled ? "disabled" : ""} style="color: ${isBilled ? "" : "red"}">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>
    </td>
  `;

  return row;
};

// Display fees table
const displayFeesTable = async () => {
  try {
    const response = await window.api.getAllFees();

    if (!response.success) {
      showToast(response.message || "Failed to load fees", "error");
      return;
    }

    elements.feesTableBody.innerHTML = "";

    response.data.forEach((record, index) => {
      const row = createFeeTableRow(record, index);
      elements.feesTableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error displaying fees table:", error);
    showToast("Failed to load fees", "error");
  }
};

// Filter fees table
const filterFeesTable = () => {
  const year = elements.filterFeesByAcademicYear.value;
  const term = elements.filterFeesByTerm.value;

  const tableRows = elements.feesTableBody.querySelectorAll("tr");

  tableRows.forEach((row) => {
    const rowTerm = row.getAttribute("data-term-id");
    const rowYear = row.getAttribute("data-year-id");

    const yearMatch = year === "all" || (rowYear && rowYear === year);
    const termMatch = term === "all" || (rowTerm && rowTerm === term);

    row.style.display = yearMatch && termMatch ? "" : "none";
  });
};

// Handle editing fees
const handleEditFee = (fee) => {
  if (Number(fee.total_students_billed) > 0) {
    showToast("Cannot edit fee: Students have already been billed", "error");
    return;
  }

  elements.editFeesModal.style.display = "block";
  elements.editFeesId.value = fee.id;
  elements.editFeesClass.value = fee.class;
  elements.editFeesAcademicYear.value = fee.academic_year;
  elements.editFeesTerm.value = fee.term;
  elements.editFeesAmount.value = fee.amount;
};

// Handle deleting fees
const handleDeleteFee = async (fee) => {
  try {
    const userSession = await window.app.getSession();

    if (userSession !== "admin") {
      showToast("Only admin can delete a fee", "error");
      return;
    }

    if (Number(fee.total_students_billed) > 0) {
      showToast("Cannot delete fee: Students have already been billed", "error");
      return;
    }

    const confirmDelete = await window.dialog.showConfirmationDialog(
      "Are you sure you want to delete this fee?"
    );

    if (!confirmDelete) return;

    const response = await window.api.deleteFee(fee.id);

    if (!response.success) {
      showToast(response.message || "Failed to delete fee", "error");
      return;
    }

    showToast(response.message, "success");
    await setUpFeesSection();
  } catch (error) {
    console.error("Error deleting fee:", error);
    showToast("Failed to delete fee", "error");
  }
};

// Main setup function
export async function setUpFeesSection() {
  try {
    const [termSetting, yearSetting] = await Promise.all([
      getDefaultTermSetting(),
      getDefaultYearSetting(),
    ]);

    await Promise.all([
      setUpAcademicYearsSelect(elements.filterFeesByAcademicYear, true),
      setUpTermsSelect(elements.filterFeesByTerm, true),
    ]);

    elements.filterFeesByAcademicYear.value = yearSetting.setting_value;
    elements.filterFeesByTerm.value = termSetting.setting_value;

    await displayFeesTable();
    filterFeesTable();

    // Setup event listeners on first load
    if (!elements.feesTableBody.hasAttribute("data-listeners-setup")) {
      setupEventListeners();
      elements.feesTableBody.setAttribute("data-listeners-setup", "true");
    }
  } catch (error) {
    console.error("Error setting up fees section:", error);
    showToast("Failed to initialize fees section", "error");
  }
}
