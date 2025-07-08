import { showPaymentHistoryModal } from "./modals/payment-history-modal.js";
import { fCurrency } from "./utils/format-currency.js";
import { getDefaultYearSetting } from "./utils/get-settings.js";
import { printPage } from "./utils/print-page.js";
import { setUpAcademicYearsSelect, setUpClassSelect } from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

let userSession;
const yearSelect = document.getElementById("arrearsYear");
const classSelect = document.getElementById("arrearsClass");
const searchInput = document.getElementById("searchArrearsInput");
const tableBody = document.getElementById("arrearsTableBody");

classSelect.addEventListener("change", () => filterArrearsTable());
// yearSelect.addEventListener("change", () => filterArrearsTable());
searchInput.addEventListener("input", () => filterArrearsTable());

export const setUpArrearsSection = async () => {
  userSession = await window.app.getSession();
  const defaultYear = await getDefaultYearSetting();
  await setUpAcademicYearsSelect(yearSelect, false);
  await setUpClassSelect(classSelect, true);

  yearSelect.value = defaultYear.setting_value;

  await displayArrearsTable();
};

const filterArrearsTable = () => {
  const searchValue = searchInput.value.toLowerCase();
  const selectedClass = classSelect.value;

  const tableRows = tableBody.querySelectorAll("tr");
  tableRows.forEach((row) => {
    const rowName = row.getAttribute("data-name").toLowerCase();
    const rowClass = row.getAttribute("data-class-id");

    const classMatch = selectedClass === "all" || rowClass.includes(selectedClass);

    // Show or hide row based on filter match
    if (classMatch && rowName.includes(searchValue)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
};

export const displayArrearsTable = async () => {
  const response = await window.api.getAllOutstandingBalances();

  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  const data = response.data;
  tableBody.innerHTML = "";
  data.forEach((arrear, index) => {
    const row = tableBody.insertRow(index);

    // Add data-* attributes for filtering
    row.setAttribute("data-class-id", arrear.class_id);
    row.setAttribute("data-year-id", arrear.year_id);
    row.setAttribute("data-term-id", arrear.term_id);
    row.setAttribute("data-name", arrear.student_name);

    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${arrear.student_name}</td>
        <td>${arrear.class_name}</td>
        <td>${fCurrency(arrear.outstanding_balance)}</td>
        <td>
         <div style="display: flex; justify-content: center">
            <button id="btnPaymentView"  class="text-button" title="View Payment">
              <i class="fa-solid fa-eye color-green"></i> View
            </button>
          </div>
        </td>
      `;
  });

  // calculateStats(data);
  setupArrearsSidebar(data);
};

const setupArrearsSidebar = (data) => {
  const classesList = document.getElementById("arrearsClassList");
  classesList.innerHTML = "";

  const classStats = {};
  for (const student of data) {
    const cls = student.class_name;
    if (!classStats[cls]) {
      classStats[cls] = {
        class_id: student.class_id,
        class_name: student.class_name,
        student_count: 0,
        total_outstanding: 0,
      };
    }
    classStats[cls].student_count++;
    classStats[cls].total_outstanding += student.outstanding_balance;
  }

  const allOption = document.createElement("div");
  allOption.className = "class-item";
  allOption.textContent = `All (${data.length} students)`;
  classesList.appendChild(allOption);
  allOption.addEventListener("click", () => {
    classSelect.value = "all";
    filterArrearsTable();
  });

  Object.entries(classStats).forEach(([key, value]) => {
    const option = document.createElement("div");
    option.className = "class-item";
    option.textContent = `${value.class_name} (${value.student_count} students)`;
    option.setAttribute("data-class-name", value.class_name);
    option.setAttribute("data-class-id", value.class_id);
    classesList.appendChild(option);

    option.addEventListener("click", () => {
      classSelect.value = value.class_id;
      filterArrearsTable();
    });
  });
};

// const calculateStats = (data) => {
//   const classStats = {};
//   for (const student of data) {
//     const cls = student.class_name;
//     if (!classStats[cls]) {
//       classStats[cls] = {
//         class_id: student.class_id,
//         class_name: student.class_name,
//         student_count: 0,
//         total_outstanding: 0,
//       };
//     }
//     classStats[cls].student_count++;
//     classStats[cls].total_outstanding += student.outstanding_balance;
//   }

//   const totalStudents = data.length;
//   const totalOutstanding = data.reduce((sum, s) => sum + s.outstanding_balance, 0);
//   const highestOutstanding = Math.max(...data.map((s) => s.outstanding_balance));
//   const lowestOutstanding = Math.min(...data.map((s) => s.outstanding_balance));

//   // 4. Top 3 debtors
//   const topDebtors = [...data]
//     .sort((a, b) => b.outstanding_balance - a.outstanding_balance)
//     .slice(0, 3);

//   // Display
//   console.log("📊 Class-wise Stats:");
//   console.table(classStats);

//   console.log("📈 Overall Stats:");
//   console.log("Total Students:", totalStudents);
//   console.log("Total Outstanding:", totalOutstanding);
//   console.log("Highest Single Outstanding:", highestOutstanding);
//   console.log("Lowest Single Outstanding:", lowestOutstanding);

//   console.log("🔥 Top 3 Students With Highest Outstanding:");
//   console.table(topDebtors);

//   console.log(classStats);
// };

document.getElementById("printArrearsBtn").addEventListener("click", async () => {
  const arrearsTable = document.getElementById("arrearsTable");

  if (!arrearsTable) {
    showToast("No table found to print", "error");
    return;
  }

  const academicYearSetting = await getDefaultYearSetting();

  // Clone the table to modify it without affecting the original
  const tableClone = arrearsTable.cloneNode(true);
  tableClone.querySelectorAll("tr").forEach((row, index) => {
    if (row.cells[4]) row.removeChild(row.cells[4]);
  });

  // Remove background colors
  tableClone.querySelectorAll("tr, td, th").forEach((el) => {
    el.style.backgroundColor = "white";
  });

  // Add a heading above the table
  const heading = `<h2 style="text-align: center; margin-bottom: 10px;">Payments for ${
    academicYearSetting?.setting_text || ""
  } Academic Year</h2>`;

  printPage(heading, tableClone.outerHTML);
});
