import { fCurrency } from "./utils/format-currency.js";
import { getDefaultYearSetting } from "./utils/get-settings.js";
import { printPage } from "./utils/print-page.js";
import { setUpAcademicYearsSelect, setUpClassSelect } from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

// DOM Elements
const elements = {
  toggleSidebar: document.getElementById("arrearsToggleSidebar"),
  yearSelect: document.getElementById("arrearsYear"),
  classSelect: document.getElementById("arrearsClass"),
  searchInput: document.getElementById("searchArrearsInput"),
  tableBody: document.getElementById("arrearsTableBody"),
  classesList: document.getElementById("arrearsClassList"),
  printBtn: document.getElementById("printArrearsBtn"),
  arrearsTable: document.getElementById("arrearsTable"),
  totalArrearsNumber: document.getElementById("totalArrearsNumber"),
  // Student details modal elements (shared with student.js)
  viewStudentModal: document.getElementById("viewStudentModal"),
  studentDetailsContent: document.getElementById("studentDetailsContent"),
  viewStudentCloseX: document.getElementById("viewStudentCloseX"),
  // Pagination elements
  paginationContainer: document.getElementById("arrearsPaginationContainer"),
  pageInfo: document.getElementById("arrearsPageInfo"),
  pageSizeSelect: document.getElementById("arrearsPageSizeSelect"),
  prevPageBtn: document.getElementById("arrearsPrevPageBtn"),
  nextPageBtn: document.getElementById("arrearsNextPageBtn"),
  firstPageBtn: document.getElementById("arrearsFirstPageBtn"),
  lastPageBtn: document.getElementById("arrearsLastPageBtn"),
};

// State
let userSession;
let cachedArrearsData = [];

// Pagination State
let currentPage = 1;
let pageSize = 10;
let totalArrears = 0;
let totalPages = 0;
let allArrearsData = []; // Store all arrears data
let filteredArrearsData = []; // Store filtered arrears data

// Event Listeners
function initializeEventListeners() {
  elements.toggleSidebar.addEventListener("click", handleToggleSidebar);
  elements.classSelect.addEventListener("change", handleSearchAndFilter);
  elements.searchInput.addEventListener("input", handleSearchAndFilter);
  elements.printBtn.addEventListener("click", handlePrintArrears);
  elements.viewStudentCloseX?.addEventListener("click", handleViewModalClose);

  // Pagination event listeners
  elements.prevPageBtn?.addEventListener("click", () => goToPage(currentPage - 1));
  elements.nextPageBtn?.addEventListener("click", () => goToPage(currentPage + 1));
  elements.firstPageBtn?.addEventListener("click", () => goToPage(1));
  elements.lastPageBtn?.addEventListener("click", () => goToPage(totalPages));
  elements.pageSizeSelect?.addEventListener("change", handlePageSizeChange);
}

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
  totalArrears = filteredArrearsData.length;
  totalPages = Math.ceil(totalArrears / pageSize);

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
  const currentArrears = filteredArrearsData.slice(startIndex, endIndex);

  renderArrearsRows(currentArrears, startIndex);
  updatePaginationControls();
  updateArrearsCount();
}

function updatePaginationControls() {
  if (!elements.paginationContainer) return;

  // Update page info
  const startRecord = totalArrears > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, totalArrears);

  if (elements.pageInfo) {
    elements.pageInfo.textContent = `Showing ${startRecord}-${endRecord} of ${totalArrears} arrears`;
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

function handleSearchAndFilter() {
  const searchValue = elements.searchInput.value.toLowerCase().trim();
  const selectedClass = elements.classSelect.value;

  filteredArrearsData = allArrearsData.filter((arrear) => {
    const studentName = arrear.student_name.toLowerCase();
    const classMatch =
      selectedClass === "all" || arrear.class_ids.includes(parseInt(selectedClass));
    const searchMatch = !searchValue || studentName.includes(searchValue);

    return classMatch && searchMatch;
  });

  currentPage = 1; // Reset to first page when filtering
  displayCurrentPage();
}

function handleToggleSidebar() {
  const sidebar = document.getElementById("arrearsSidebar");
  const arrearsContent = document.getElementById("arrearsContent");

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("show");
  } else {
    sidebar.classList.toggle("hidden");
  }

  arrearsContent.classList.toggle("expanded");
}

// Modal Management
function handleViewModalClose() {
  hideViewModal();
}

function hideViewModal() {
  if (elements.viewStudentModal) {
    elements.viewStudentModal.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

// Student Details View (shared functionality with student.js)
async function viewStudentDetails(studentId) {
  try {
    const response = await window.api.getCompleteStudentRecord(studentId);

    if (!response.success) {
      showToast(`Error loading student details: ${response.message}`, "error");
      return;
    }

    // Find student info from arrears data
    const studentInfo = findStudentInfoById(studentId);
    displayStudentDetailsModal(response.data, studentInfo);
  } catch (error) {
    showToast("An error occurred while loading student details", "error");
    console.error("Error loading student details:", error);
  }
}

function findStudentInfoById(studentId) {
  const arrearRecord = allArrearsData.find((arrear) => arrear.student_id === studentId);
  if (!arrearRecord) return null;

  // Create a student info object similar to student.js format
  return {
    student_id: arrearRecord.student_id,
    first_name: arrearRecord.student_name.split(" ")[0] || "",
    last_name: arrearRecord.student_name.split(" ").slice(1).join(" ") || "",
    other_names: "", // Not available in arrears data
    class_name: arrearRecord.classes.join(", "),
    academic_year: "", // Not available in arrears data
  };
}

function displayStudentDetailsModal(studentData, studentInfo) {
  if (!elements.viewStudentModal || !elements.studentDetailsContent) {
    showToast("Student details modal not found", "error");
    return;
  }

  if (studentData.length === 0) {
    elements.studentDetailsContent.innerHTML = "<p>No details found for this student.</p>";
  } else {
    elements.studentDetailsContent.innerHTML = generateStudentDetailsHTML(studentData, studentInfo);
  }

  elements.viewStudentModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function generateStudentDetailsHTML(studentData, studentInfo) {
  const student = studentData[0]; // Get student basic info from first record

  // Group data by bills
  const billsMap = new Map();
  studentData.forEach((record) => {
    if (!billsMap.has(record.bill_id)) {
      billsMap.set(record.bill_id, {
        bill_id: record.bill_id,
        bill_class: record.bill_class,
        term: record.term,
        bill_year: record.bill_year,
        original_fee: record.original_fee,
        discount_amount: record.discount_amount,
        net_amount: record.net_amount,
        bill_date: record.bill_date,
        bill_total_paid: record.bill_total_paid,
        bill_balance: record.bill_balance,
        bill_status: record.bill_status,
        payments: [],
      });
    }

    // Add payment if it exists
    if (record.payment_id) {
      billsMap.get(record.bill_id).payments.push({
        payment_id: record.payment_id,
        payment_amount: record.payment_amount,
        payment_mode: record.payment_mode,
        date_paid: record.date_paid,
        payment_details: record.payment_details,
      });
    }
  });

  const bills = Array.from(billsMap.values());

  return `
    <div class="student-details-container">
      <div class="student-basic-info">
        <h3>Student Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Name:</strong> ${studentInfo.first_name} ${studentInfo.last_name} 
          </div>
          <div class="info-item">
            <strong>Other Names:</strong> ${studentInfo.other_names || ""}
          </div>
          <div class="info-item">
            <strong>Registration Date:</strong> ${formatDate(student.registration_date)}
          </div>
          <div class="info-item">
            <strong>Current Class:</strong> ${studentInfo.class_name || "Not Assigned"}
          </div>
          <div class="info-item">
            <strong>Current Year:</strong> ${studentInfo.academic_year || "N/A"}
          </div>
        </div>
      </div>

      <div class="student-billing-info">
        <h3>Billing & Payment History</h3>
        ${bills.length === 0 ? "<p>No billing records found.</p>" : generateBillsHTML(bills)}
      </div>
    </div>
  `;
}

function generateBillsHTML(bills) {
  return bills
    .map(
      (bill) => `
    <div class="bill-card">
      <div class="bill-header">
        <h4>${bill.bill_class} - ${bill.term} Term (${bill.bill_year})</h4>
        <span class="bill-status ${bill.bill_status.toLowerCase().replace(/\s+/g, "-")}">${
        bill.bill_status
      }</span>
      </div>
      
      <div class="bill-details">
        <div class="bill-amounts">
          <div class="amount-item">
            <strong>Original Fee:</strong> ₵${bill.original_fee.toFixed(2)}
          </div>
          <div class="amount-item">
            <strong>Discount:</strong> ₵${bill.discount_amount.toFixed(2)}
          </div>
          <div class="amount-item">
            <strong>Net Amount:</strong> ₵${bill.net_amount.toFixed(2)}
          </div>
          <div class="amount-item">
            <strong>Total Paid:</strong> ₵${bill.bill_total_paid.toFixed(2)}
          </div>
          <div class="amount-item">
            <strong>Balance:</strong> ₵${bill.bill_balance.toFixed(2)}
          </div>
        </div>

        <div class="payments-section">
          <h5>Payments</h5>
          ${
            bill.payments.length === 0
              ? "<p>No payments recorded.</p>"
              : generatePaymentsHTML(bill.payments)
          }
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

function generatePaymentsHTML(payments) {
  return `
    <div class="payments-list">
      ${payments
        .map(
          (payment) => `
        <div class="payment-item">
          <div class="payment-details">
            <strong>₵${payment.payment_amount.toFixed(2)}</strong>
            <span class="payment-mode">${payment.payment_mode}</span>
            <span class="payment-date">${formatDate(payment.date_paid)}</span>
          </div>
          <div class="payment-ref">${payment.payment_details}</div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Print Functionality
async function handlePrintArrears() {
  if (!elements.arrearsTable) {
    showToast("No table found to print", "error");
    return;
  }

  try {
    const academicYearSetting = await getDefaultYearSetting();
    const processedTable = prepareTableForPrint(elements.arrearsTable, filteredArrearsData);
    const heading = createPrintHeading(academicYearSetting);

    printPage(heading, processedTable);
  } catch (error) {
    showToast("An error occurred while printing", "error");
    console.error("Error printing:", error);
  }
}

function prepareTableForPrint(table, arrearsToPrint) {
  const tableClone = table.cloneNode(true);
  const tbody = tableClone.querySelector("tbody");

  // Clear existing rows
  tbody.innerHTML = "";

  // Add all filtered arrears to print table
  arrearsToPrint.forEach((arrear, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${arrear.student_name}</td>
      <td>${arrear.classes.join(", ")}</td>
      <td>${fCurrency(arrear.total_outstanding_balance)}</td>
    `;

    tbody.appendChild(row);
  });

  // Remove action column header
  const headerRow = tableClone.querySelector("thead tr");
  if (headerRow.cells[4]) {
    headerRow.removeChild(headerRow.cells[4]);
  }

  // Remove background colors for print
  tableClone.querySelectorAll("tr, td, th").forEach((el) => {
    el.style.backgroundColor = "white";
  });

  return tableClone.outerHTML;
}

function createPrintHeading(academicYearSetting) {
  const yearText = academicYearSetting?.setting_text || "Academic Year";
  const totalFiltered = filteredArrearsData.length;
  const totalAll = allArrearsData.length;

  let subtitle = "";
  if (totalFiltered !== totalAll) {
    subtitle = `<p style="text-align: center; margin: 5px 0;">Showing ${totalFiltered} of ${totalAll} arrears</p>`;
  }

  return `
    <h2 style="text-align: center; margin-bottom: 10px;">Outstanding Arrears - ${yearText}</h2>
    ${subtitle}
  `;
}

// Display Functions
async function displayArrears() {
  try {
    const response = await window.api.getAllOutstandingBalances();

    clearArrearsDisplay();

    if (!response.success) {
      showToast(`An error occurred: ${response.message}`, "error");
      return;
    }

    if (response.data.length === 0) {
      showToast("No arrears data found", "error");
      return;
    }

    // Store all arrears and initialize pagination
    const groupedData = groupStudentsById(response.data);
    allArrearsData = groupedData;
    filteredArrearsData = [...allArrearsData];
    cachedArrearsData = groupedData; // Keep for backward compatibility
    currentPage = 1;

    displayCurrentPage();
    setupArrearsSidebar(response.data);
  } catch (error) {
    showToast("An error occurred while loading arrears", "error");
    console.error("Error loading arrears:", error);
  }
}

function clearArrearsDisplay() {
  elements.searchInput.value = "";
  elements.tableBody.innerHTML = "";
  allArrearsData = [];
  filteredArrearsData = [];
  currentPage = 1;
}

function updateArrearsCount() {
  const totalAll = allArrearsData.length;
  let countText = `Total Arrears: ${totalAll}`;

  if (elements.totalArrearsNumber) {
    elements.totalArrearsNumber.textContent = countText;
  }
}

function renderArrearsRows(arrears, startIndex = 0) {
  elements.tableBody.innerHTML = "";

  arrears.forEach((arrear, index) => {
    const row = createArrearsRow(arrear, startIndex + index);
    elements.tableBody.appendChild(row);
  });
}

function createArrearsRow(arrear, index) {
  const row = document.createElement("tr");

  setRowAttributes(row, arrear);
  setRowContent(row, arrear, index);
  attachRowEventListeners(row, arrear);

  return row;
}

function setRowAttributes(row, arrear) {
  row.setAttribute("data-student-id", arrear.student_id);
  row.setAttribute("data-name", arrear.student_name);
  row.setAttribute("data-class-ids", arrear.class_ids.join(","));
}

function setRowContent(row, arrear, index) {
  row.innerHTML = `
    <td>${index + 1}</td>
    <td>${arrear.student_name}</td>
    <td>${arrear.classes.join(", ")}</td>
    <td>${fCurrency(arrear.total_outstanding_balance)}</td>
    <td>
      <div style="display: flex; justify-content: center">
        <button class="btn-view-arrears text-button" title="View Student Details">
          <i class="fa-solid fa-eye color-green"></i> View
        </button>
      </div>
    </td>
  `;
}

function attachRowEventListeners(row, arrear) {
  row.querySelector(".btn-view-arrears").addEventListener("click", () => {
    viewStudentDetails(arrear.student_id);
  });
}

// Group students by ID (utility function)
function groupStudentsById(students) {
  const grouped = students.reduce((acc, student) => {
    const { student_id, student_name, class_name, class_id, outstanding_balance } = student;

    if (!acc[student_id]) {
      acc[student_id] = {
        student_id,
        student_name,
        total_outstanding_balance: 0,
        classes: [],
        class_ids: [],
      };
    }

    // Add to total outstanding balance
    acc[student_id].total_outstanding_balance += outstanding_balance;

    // Add class name if not already present
    if (!acc[student_id].classes.includes(class_name)) {
      acc[student_id].classes.push(class_name);
    }

    // Add class ID if not already present
    if (!acc[student_id].class_ids.includes(class_id)) {
      acc[student_id].class_ids.push(class_id);
    }

    return acc;
  }, {});

  // Convert object to array
  return Object.values(grouped);
}

// Sidebar Functions
function setupArrearsSidebar(data) {
  elements.classesList.innerHTML = "";

  const classStats = calculateClassStats(data);

  // Add "All" option
  const allOption = createClassItem(
    `All (${Object.values(classStats).reduce((sum, cls) => sum + cls.student_count, 0)} students)`
  );
  allOption.addEventListener("click", () => {
    elements.classSelect.value = "all";
    handleSearchAndFilter();
  });
  elements.classesList.appendChild(allOption);

  // Add class-specific options
  Object.values(classStats).forEach((classData) => {
    const option = createClassItem(
      `${classData.class_name} (${classData.student_count} students)`,
      classData.class_id
    );

    option.addEventListener("click", () => {
      elements.classSelect.value = classData.class_id;
      handleSearchAndFilter();
    });

    elements.classesList.appendChild(option);
  });
}

function calculateClassStats(data) {
  const classStats = {};

  data.forEach((student) => {
    const className = student.class_name;

    if (!classStats[className]) {
      classStats[className] = {
        class_id: student.class_id,
        class_name: student.class_name,
        student_count: 0,
        total_outstanding: 0,
      };
    }

    classStats[className].student_count++;
    classStats[className].total_outstanding += student.outstanding_balance;
  });

  return classStats;
}

function createClassItem(text, classId = null) {
  const item = document.createElement("div");
  item.className = "class-item";
  item.textContent = text;

  if (classId) {
    item.setAttribute("data-class-id", classId);
  }

  return item;
}

// Initialization
export async function initArrearsSection() {
  try {
    userSession = await window.app.getSession();
    const defaultYear = await getDefaultYearSetting();

    await setupArrearsFilters();
    await displayArrears();
  } catch (error) {
    showToast("An error occurred while initializing arrears section", "error");
    console.error("Error initializing arrears section:", error);
  }
}

async function setupArrearsFilters() {
  await setUpAcademicYearsSelect(elements.yearSelect, false);
  await setUpClassSelect(elements.classSelect, true);
}

// Initialize event listeners when module loads
initializeEventListeners();

// Backward compatibility exports
export const displayArrearsTable = displayArrears;
export const setUpArrearsSection = initArrearsSection;
