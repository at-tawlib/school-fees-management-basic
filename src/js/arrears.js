import { fCurrency } from "./utils/format-currency.js";
import { getDefaultYearSetting } from "./utils/get-settings.js";
import { printPage } from "./utils/print-page.js";
import { setUpAcademicYearsSelect, setUpClassSelect } from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

// State management
let userSession;
let cachedArrearsData = [];

// Pagination State
let currentPage = 1;
let pageSize = 10;
let totalArrears = 0;
let totalPages = 0;
let allArrearsData = []; // Store all arrears data
let filteredArrearsData = []; // Store filtered arrears data

// DOM elements
const elements = {
  toggleSidebar: document.getElementById("arrearsToggleSidebar"),
  yearSelect: document.getElementById("arrearsYear"),
  classSelect: document.getElementById("arrearsClass"),
  searchInput: document.getElementById("searchArrearsInput"),
  tableBody: document.getElementById("arrearsTableBody"),
  classesList: document.getElementById("arrearsClassList"),
  printBtn: document.getElementById("printArrearsBtn"),
  arrearsTable: document.getElementById("arrearsTable"),
  // Pagination elements
  paginationContainer: document.getElementById("arrearsPaginationContainer"),
  pageInfo: document.getElementById("arrearsPageInfo"),
  pageSizeSelect: document.getElementById("arrearsPageSizeSelect"),
  prevPageBtn: document.getElementById("arrearsPrevPageBtn"),
  nextPageBtn: document.getElementById("arrearsNextPageBtn"),
  firstPageBtn: document.getElementById("arrearsFirstPageBtn"),
  lastPageBtn: document.getElementById("arrearsLastPageBtn"),
  totalArrearsNumber: document.getElementById("totalArrearsNumber"),
};

// Event listeners setup
const setupEventListeners = () => {
  elements.toggleSidebar.addEventListener("click", handleToggleSidebar);
  elements.classSelect.addEventListener("change", handleSearchAndFilter);
  elements.searchInput.addEventListener("input", handleSearchAndFilter);
  elements.printBtn.addEventListener("click", handlePrintArrears);

  // Pagination event listeners
  elements.prevPageBtn?.addEventListener("click", () => goToPage(currentPage - 1));
  elements.nextPageBtn?.addEventListener("click", () => goToPage(currentPage + 1));
  elements.firstPageBtn?.addEventListener("click", () => goToPage(1));
  elements.lastPageBtn?.addEventListener("click", () => goToPage(totalPages));
  elements.pageSizeSelect?.addEventListener("change", handlePageSizeChange);
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

  renderArrearsTable(currentArrears, startIndex);
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

function updateArrearsCount() {
  const totalAll = allArrearsData.length;
  let countText = `Total Arrears: ${totalAll}`;

  if (elements.totalArrearsNumber) {
    elements.totalArrearsNumber.textContent = countText;
  }
}

// Filter arrears based on search and class selection
const handleSearchAndFilter = () => {
  const searchValue = elements.searchInput.value.toLowerCase().trim();
  const selectedClass = elements.classSelect.value;

  filteredArrearsData = allArrearsData.filter((arrear) => {
    const studentName = arrear.student_name.toLowerCase();
    const classId = arrear.class_id.toString();

    const classMatch = selectedClass === "all" || classId === selectedClass;
    const searchMatch = !searchValue || studentName.includes(searchValue);

    return classMatch && searchMatch;
  });

  currentPage = 1; // Reset to first page when filtering
  displayCurrentPage();
};

// Create table row HTML
const createTableRow = (arrear, index) => `
  <td>${index + 1}</td>
  <td>${arrear.student_name}</td>
  <td>${arrear.class_name}</td>
  <td>${fCurrency(arrear.outstanding_balance)}</td>
  <td>
    <div style="display: flex; justify-content: center">
      <button id="btnArrearsView" class="text-button" title="View Arrears">
        <i class="fa-solid fa-eye color-green"></i> View
      </button>
    </div>
  </td>
`;

// Display arrears table
export const displayArrearsTable = async () => {
  try {
    const response = await window.api.getAllOutstandingBalances();

    if (!response.success) {
      showToast(response.message || "Failed to load arrears data", "error");
      return;
    }

    // Store all arrears data and initialize pagination
    allArrearsData = response.data;
    filteredArrearsData = [...allArrearsData];
    cachedArrearsData = response.data; // Keep for backward compatibility
    currentPage = 1;

    console.log(response.data);
    displayCurrentPage();
    setupArrearsSidebar(response.data);
  } catch (error) {
    console.error("Error loading arrears data:", error);
    showToast("An error occurred while loading data", "error");
  }
};

// Render table with data - Updated to handle pagination
const renderArrearsTable = (data, startIndex = 0) => {
  elements.tableBody.innerHTML = "";

  data.forEach((arrear, index) => {
    const row = elements.tableBody.insertRow();

    // Set data attributes for filtering (keeping for compatibility)
    row.setAttribute("data-class-id", arrear.class_id);
    row.setAttribute("data-year-id", arrear.year_id);
    row.setAttribute("data-term-id", arrear.term_id);
    row.setAttribute("data-name", arrear.student_name);

    row.innerHTML = createTableRow(arrear, startIndex + index);
  });
};

// Calculate class statistics
const calculateClassStats = (data) => {
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
};

// Create sidebar class item
const createClassItem = (text, classId = null) => {
  const item = document.createElement("div");
  item.className = "class-item";
  item.textContent = text;

  if (classId) {
    item.setAttribute("data-class-id", classId);
  }

  return item;
};

// Setup sidebar with class statistics
const setupArrearsSidebar = (data) => {
  elements.classesList.innerHTML = "";

  const classStats = calculateClassStats(data);

  // Add "All" option
  const allOption = createClassItem(`All (${data.length} students)`);
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
};

function handleToggleSidebar() {
  const sidebar = document.getElementById("arrearsSidebar");
  const studentContent = document.getElementById("arrearsContent");

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("show");
  } else {
    sidebar.classList.toggle("hidden");
  }

  studentContent.classList.toggle("expanded");
}

// Handle print functionality - Updated to print filtered data
const handlePrintArrears = async () => {
  if (!elements.arrearsTable) {
    showToast("No table found to print", "error");
    return;
  }

  try {
    const academicYearSetting = await getDefaultYearSetting();
    const processedTable = prepareArrearsTableForPrint(elements.arrearsTable, filteredArrearsData);
    const heading = createArrearssPrintHeading(academicYearSetting);

    printPage(heading, processedTable);
  } catch (error) {
    console.error("Error printing arrears:", error);
    showToast("Failed to print arrears", "error");
  }
};

function prepareArrearsTableForPrint(table, arrearsToPrint) {
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
      <td>${arrear.class_name}</td>
      <td>${fCurrency(arrear.outstanding_balance)}</td>
    `;

    tbody.appendChild(row);
  });

  // Remove action column header (last column)
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

function createArrearssPrintHeading(academicYearSetting) {
  const yearText = academicYearSetting?.setting_text || "Academic Year";
  const totalFiltered = filteredArrearsData.length;
  const totalAll = allArrearsData.length;

  let subtitle = "";
  if (totalFiltered !== totalAll) {
    subtitle = `<p style="text-align: center; margin: 5px 0;">Showing ${totalFiltered} of ${totalAll} arrears</p>`;
  }

  return `
    <h2 style="text-align: center; margin-bottom: 10px;">
      Outstanding Arrears - ${yearText}
    </h2>
    ${subtitle}
  `;
}

// Main setup function
export const setUpArrearsSection = async () => {
  try {
    userSession = await window.app.getSession();
    const defaultYear = await getDefaultYearSetting();

    await setUpAcademicYearsSelect(elements.yearSelect, false);
    await setUpClassSelect(elements.classSelect, true);

    elements.yearSelect.value = defaultYear.setting_value;

    setupEventListeners();
    await displayArrearsTable();
  } catch (error) {
    console.error("Error setting up arrears section:", error);
    showToast("Failed to initialize arrears section", "error");
  }
};
