import { fCurrency } from "./utils/format-currency.js";
import { getDefaultYearSetting } from "./utils/get-settings.js";
import { printPage } from "./utils/print-page.js";
import { setUpAcademicYearsSelect, setUpClassSelect } from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

// State management
let userSession;
let cachedArrearsData = [];

// DOM elements
const elements = {
  yearSelect: document.getElementById("arrearsYear"),
  classSelect: document.getElementById("arrearsClass"),
  searchInput: document.getElementById("searchArrearsInput"),
  tableBody: document.getElementById("arrearsTableBody"),
  classesList: document.getElementById("arrearsClassList"),
  printBtn: document.getElementById("printArrearsBtn"),
  arrearsTable: document.getElementById("arrearsTable"),
};

// Event listeners setup
const setupEventListeners = () => {
  elements.classSelect.addEventListener("change", filterArrearsTable);
  elements.searchInput.addEventListener("input", filterArrearsTable);
  elements.printBtn.addEventListener("click", handlePrintArrears);
};

// Filter table based on search and class selection
const filterArrearsTable = () => {
  const searchValue = elements.searchInput.value.toLowerCase().trim();
  const selectedClass = elements.classSelect.value;

  const tableRows = elements.tableBody.querySelectorAll("tr");

  tableRows.forEach((row) => {
    const rowName = row.getAttribute("data-name")?.toLowerCase() || "";
    const rowClass = row.getAttribute("data-class-id") || "";

    const classMatch = selectedClass === "all" || rowClass === selectedClass;
    const searchMatch = !searchValue || rowName.includes(searchValue);

    row.style.display = classMatch && searchMatch ? "" : "none";
  });
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

    cachedArrearsData = response.data;
    renderArrearsTable(cachedArrearsData);
    setupArrearsSidebar(cachedArrearsData);
  } catch (error) {
    console.error("Error loading arrears data:", error);
    showToast("An error occurred while loading data", "error");
  }
};

// Render table with data
const renderArrearsTable = (data) => {
  elements.tableBody.innerHTML = "";

  data.forEach((arrear, index) => {
    const row = elements.tableBody.insertRow(index);

    // Set data attributes for filtering
    row.setAttribute("data-class-id", arrear.class_id);
    row.setAttribute("data-year-id", arrear.year_id);
    row.setAttribute("data-term-id", arrear.term_id);
    row.setAttribute("data-name", arrear.student_name);

    row.innerHTML = createTableRow(arrear, index);
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
    filterArrearsTable();
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
      filterArrearsTable();
    });

    elements.classesList.appendChild(option);
  });
};

// Handle print functionality
const handlePrintArrears = async () => {
  if (!elements.arrearsTable) {
    showToast("No table found to print", "error");
    return;
  }

  try {
    const academicYearSetting = await getDefaultYearSetting();

    // Clone and modify table for printing
    const tableClone = elements.arrearsTable.cloneNode(true);

    // Remove action column (last column)
    tableClone.querySelectorAll("tr").forEach((row) => {
      if (row.cells[4]) {
        row.removeChild(row.cells[4]);
      }
    });

    // Remove background colors for printing
    tableClone.querySelectorAll("tr, td, th").forEach((el) => {
      el.style.backgroundColor = "white";
    });

    const heading = `
      <h2 style="text-align: center; margin-bottom: 10px;">
        Outstanding Arrears - ${academicYearSetting?.setting_text || "Academic Year"}
      </h2>
    `;

    printPage(heading, tableClone.outerHTML);
  } catch (error) {
    console.error("Error printing arrears:", error);
    showToast("Failed to print arrears", "error");
  }
};

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
