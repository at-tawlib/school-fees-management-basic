import { openStudentPaymentModal } from "./modals/make-payment-modal.js";
import { showPaymentHistoryModal } from "./modals/payment-history-modal.js";
import { openUpdatePaymentModal } from "./modals/update-payment-modal.js";
import { fCurrency } from "./utils/format-currency.js";
import { formatDate } from "./utils/format-date.js";
import { getDefaultTermSetting, getDefaultYearSetting } from "./utils/get-settings.js";
import { printPage } from "./utils/print-page.js";
import {
  setUpAcademicYearsSelect,
  setUpClassSelect,
  setUpTermsSelect,
} from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

// State management
let userSession;

// Pagination State
let currentPage = 1;
let pageSize = 10;
let totalPayments = 0;
let totalPages = 0;
let allPaymentsData = []; // Store all payments data
let filteredPaymentsData = []; // Store filtered payments data

// DOM Elements
const elements = {
  tableBody: document.getElementById("paymentsTableBody"),
  paymentTable: document.getElementById("paymentsTable"),
  classSelect: document.getElementById("paymentClass"),
  termSelect: document.getElementById("paymentTerm"),
  yearSelect: document.getElementById("paymentAcademicYear"),
  searchPaymentsInput: document.getElementById("searchPaymentsInput"),
  // Pagination elements
  paginationContainer: document.getElementById("paymentsPaginationContainer"),
  pageInfo: document.getElementById("paymentsPageInfo"),
  pageSizeSelect: document.getElementById("paymentsPageSizeSelect"),
  prevPageBtn: document.getElementById("paymentsPrevPageBtn"),
  nextPageBtn: document.getElementById("paymentsNextPageBtn"),
  firstPageBtn: document.getElementById("paymentsFirstPageBtn"),
  lastPageBtn: document.getElementById("paymentsLastPageBtn"),
  totalPaymentsNumber: document.getElementById("totalPaymentsNumber"),
};

const columnCheckboxes = document.querySelectorAll(".toggle-column");

// Event Listeners Setup
const setupEventListeners = () => {
  elements.classSelect.addEventListener("change", () => handleSearchAndFilter());
  elements.termSelect.addEventListener("change", () => displayPaymentsTable());
  elements.yearSelect.addEventListener("change", () => displayPaymentsTable());
  elements.searchPaymentsInput.addEventListener("input", () => handleSearchAndFilter());

  // Pagination event listeners
  elements.prevPageBtn?.addEventListener("click", () => goToPage(currentPage - 1));
  elements.nextPageBtn?.addEventListener("click", () => goToPage(currentPage + 1));
  elements.firstPageBtn?.addEventListener("click", () => goToPage(1));
  elements.lastPageBtn?.addEventListener("click", () => goToPage(totalPages));
  elements.pageSizeSelect?.addEventListener("change", handlePageSizeChange);

  // Column visibility checkboxes
  columnCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      updateTable();
      saveCheckboxState();
    });
  });

  // Print button
  document.getElementById("printPaymentsBtn").addEventListener("click", handlePrintPayments);
};

// Pagination Functions
function handlePageSizeChange() {
  pageSize = parseInt(elements.pageSizeSelect.value);
  currentPage = 1; // Reset to first page when changing page size
  displayCurrentPage();
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    displayCurrentPage();
  }
}

function calculatePagination() {
  totalPayments = filteredPaymentsData.length;
  totalPages = Math.ceil(totalPayments / pageSize);

  // Ensure current page is valid
  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  } else if (currentPage < 1) {
    currentPage = 1;
  }
}

function displayCurrentPage() {
  calculatePagination();

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPayments = filteredPaymentsData.slice(startIndex, endIndex);

  renderPaymentsTable(currentPayments, startIndex);
  updatePaginationControls();
  updatePaymentsCount();
}

function updatePaginationControls() {
  if (!elements.paginationContainer) return;

  // Update page info
  const startRecord = totalPayments > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, totalPayments);

  if (elements.pageInfo) {
    elements.pageInfo.textContent = `Showing ${startRecord}-${endRecord} of ${totalPayments} payments`;
  }

  // Update button states
  if (elements.prevPageBtn) {
    elements.prevPageBtn.disabled = currentPage <= 1;
  }
  if (elements.nextPageBtn) {
    elements.nextPageBtn.disabled = currentPage >= totalPages;
  }
  if (elements.firstPageBtn) {
    elements.firstPageBtn.disabled = currentPage <= 1;
  }
  if (elements.lastPageBtn) {
    elements.lastPageBtn.disabled = currentPage >= totalPages;
  }
}

function updatePaymentsCount() {
  const totalAll = allPaymentsData.length;
  let countText = `Total Payments: ${totalAll}`;

  if (elements.totalPaymentsNumber) {
    elements.totalPaymentsNumber.textContent = countText;
  }
}

// Filter payments based on search and selections
const handleSearchAndFilter = () => {
  const searchValue = elements.searchPaymentsInput.value.toLowerCase();
  const selectedClass = elements.classSelect.value;

  filteredPaymentsData = allPaymentsData.filter((payment) => {
    const studentName = payment.student_name.toLowerCase();
    const classId = payment.class_id.toString();

    const classMatch = selectedClass === "all" || classId === selectedClass;
    const searchMatch = !searchValue || studentName.includes(searchValue);

    return classMatch && searchMatch;
  });

  currentPage = 1; // Reset to first page when filtering
  displayCurrentPage();
};

// Main setup function
export const setUpPaymentsSection = async () => {
  try {
    userSession = await window.app.getSession();
    const defaultYear = await getDefaultYearSetting();
    const defaultTerm = await getDefaultTermSetting();

    await setUpAcademicYearsSelect(elements.yearSelect, false);
    await setUpClassSelect(elements.classSelect, true);
    await setUpTermsSelect(elements.termSelect, false);

    elements.yearSelect.value = defaultYear.setting_value;
    elements.termSelect.value = defaultTerm.setting_value;

    setupEventListeners();
    await displayPaymentsTable();
  } catch (error) {
    console.error("Error setting up payments section:", error);
    showToast("Failed to initialize payments section", "error");
  }
};

// Display payments table - Updated for pagination
export const displayPaymentsTable = async () => {
  try {
    const response = await window.api.getYearTermPayments({
      academicYearId: elements.yearSelect.value,
      termId: elements.termSelect.value,
    });

    if (!response.success) {
      showToast(response.message || "An error occurred", "error");
      return;
    }

    // Store all payments data and initialize pagination
    allPaymentsData = response.data;
    filteredPaymentsData = [...allPaymentsData];
    currentPage = 1;

    displayCurrentPage();
    await loadCheckboxState();
    updateTable();
  } catch (error) {
    console.error("Error loading payments data:", error);
    showToast("An error occurred while loading payments", "error");
  }
};

// Render payments table with pagination
const renderPaymentsTable = (data, startIndex = 0) => {
  elements.tableBody.innerHTML = "";

  data.forEach((payment, index) => {
    const row = elements.tableBody.insertRow();

    // Add data-* attributes for filtering (keeping for compatibility)
    row.setAttribute("data-class-id", payment.class_id);
    row.setAttribute("data-year-id", payment.year_id);
    row.setAttribute("data-term-id", payment.term_id);
    row.setAttribute("data-name", payment.student_name);

    row.innerHTML = `
      <td>${startIndex + index + 1}</td>
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

    // Add event listeners for action buttons
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
};

// Payment operations
const handleEditPayment = (payment) => {
  openUpdatePaymentModal(payment);
};

const handleDeletePayment = async (paymentId) => {
  if (userSession !== "admin") {
    showToast("Only admin can delete a payment", "error");
    return;
  }

  const confirmed = await window.dialog.showConfirmationDialog(
    "Do you really want to delete this payment?"
  );

  if (confirmed) {
    try {
      const response = await window.api.deletePayment(paymentId);
      if (!response.success) {
        showToast(response.message || "An error occurred", "error");
        return;
      }
      showToast(response.message || "Payment deleted successfully", "success");
      await displayPaymentsTable();
    } catch (error) {
      console.error("Error deleting payment:", error);
      showToast("An error occurred while deleting payment", "error");
    }
  }
};

// Column visibility functions
const updateTable = () => {
  columnCheckboxes.forEach((checkbox) => {
    const columnIndex = parseInt(checkbox.dataset.column);
    const isChecked = checkbox.checked;

    elements.paymentTable
      .querySelectorAll(`td:nth-child(${columnIndex}), th:nth-child(${columnIndex})`)
      .forEach((cell) => {
        cell.style.display = isChecked ? "" : "none";
      });
  });
};

const saveCheckboxState = () => {
  const state = {};
  columnCheckboxes.forEach((checkbox) => {
    state[checkbox.dataset.column] = checkbox.checked;
  });

  window.app.savePaymentsColumnVisibility(state);
};

const loadCheckboxState = async () => {
  try {
    const savedState = await window.app.getPaymentsColumnVisibility();

    if (savedState) {
      columnCheckboxes.forEach((checkbox) => {
        const columnIndex = checkbox.getAttribute("data-column");
        checkbox.checked = savedState[columnIndex] !== undefined ? savedState[columnIndex] : true;
      });
    } else {
      // If no saved data, check all by default
      columnCheckboxes.forEach((checkbox) => (checkbox.checked = true));
    }
  } catch (error) {
    console.error("Error loading checkbox state:", error);
    // Default to all checked if error
    columnCheckboxes.forEach((checkbox) => (checkbox.checked = true));
  }
};

const handlePrintPayments = async () => {
  if (!elements.paymentTable) {
    showToast("No table found to print", "error");
    return;
  }

  try {
    const academicYearSetting = await getDefaultYearSetting();
    const processedTable = preparePaymentsTableForPrint(
      elements.paymentTable,
      filteredPaymentsData
    );
    const heading = createPaymentsPrintHeading(academicYearSetting);

    printPage(heading, processedTable);
  } catch (error) {
    console.error("Error printing payments:", error);
    showToast("An error occurred while printing", "error");
  }
};

function preparePaymentsTableForPrint(table, paymentsToPrint) {
  const tableClone = table.cloneNode(true);
  const tbody = tableClone.querySelector("tbody");

  // Clear existing rows
  tbody.innerHTML = "";

  // Add all filtered payments to print table
  paymentsToPrint.forEach((payment, index) => {
    const row = document.createElement("tr");

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
    `;

    tbody.appendChild(row);
  });

  // Remove action column header (last column)
  const headerRow = tableClone.querySelector("thead tr");
  if (headerRow.cells[10]) {
    headerRow.removeChild(headerRow.cells[10]);
  }

  // Remove background colors for print
  tableClone.querySelectorAll("tr, td, th").forEach((el) => {
    el.style.backgroundColor = "white";
  });

  return tableClone.outerHTML;
}

function createPaymentsPrintHeading(academicYearSetting) {
  const yearText = academicYearSetting?.setting_text || "Academic Year";
  const totalFiltered = filteredPaymentsData.length;
  const totalAll = allPaymentsData.length;

  let subtitle = "";
  if (totalFiltered !== totalAll) {
    subtitle = `<p style="text-align: center; margin: 5px 0;">Showing ${totalFiltered} of ${totalAll} payments</p>`;
  }

  return `
    <h2 style="text-align: center; margin-bottom: 10px;">
      Payments for ${yearText}
    </h2>
    ${subtitle}
  `;
}
