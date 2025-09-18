import { getDefaultYearSetting } from "./utils/get-settings.js";
import { printPage } from "./utils/print-page.js";
import { setUpClassSelect } from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

// DOM Elements
const elements = {
  addStudentModal: document.getElementById("addStudentModal"),
  viewStudentModal: document.getElementById("viewStudentModal"),
  firstNameInput: document.getElementById("studentFirstNameInput"),
  lastNameInput: document.getElementById("studentLastNameInput"),
  otherNamesInput: document.getElementById("studentOtherNameInput"),
  totalStudentsNumber: document.getElementById("totalStudentsNumber"),
  searchStudentInput: document.getElementById("searchStudentInput"),
  studentsTableBody: document.getElementById("studentsTableBody"),
  studentClassFilter: document.getElementById("studentClassFilter"),
  addStudentBtn: document.getElementById("addStudentBtn"),
  printStudentsBtn: document.getElementById("printStudentsBtn"),
  addStudentCloseX: document.getElementById("addStudentCloseX"),
  cancelStudentModalBtn: document.getElementById("cancelStudentModalBtn"),
  addStudentModalBtn: document.getElementById("addStudentModalBtn"),
  addStudentForm: document.getElementById("addStudentForm"),
  studentsTable: document.getElementById("studentsTable"),
  studentsClassSummaryTableBody: document.getElementById("studentsClassSummaryTableBody"),
  viewStudentCloseX: document.getElementById("viewStudentCloseX"),
  studentDetailsContent: document.getElementById("studentDetailsContent"),
  // Pagination elements
  paginationContainer: document.getElementById("paginationContainer"),
  pageInfo: document.getElementById("pageInfo"),
  pageSizeSelect: document.getElementById("pageSizeSelect"),
  prevPageBtn: document.getElementById("prevPageBtn"),
  nextPageBtn: document.getElementById("nextPageBtn"),
  firstPageBtn: document.getElementById("firstPageBtn"),
  lastPageBtn: document.getElementById("lastPageBtn"),
};

// State
let editingStudentId = null;
let userSession;

// Pagination State
let currentPage = 1;
let pageSize = 10;
let totalStudents = 0;
let totalPages = 0;
let allStudents = []; // Store all students for filtering
let filteredStudents = []; // Store filtered students

// Event Listeners
function initializeEventListeners() {
  elements.addStudentBtn.addEventListener("click", handleAddStudentClick);
  elements.printStudentsBtn.addEventListener("click", handlePrintStudents);
  elements.addStudentCloseX.addEventListener("click", handleModalClose);
  elements.cancelStudentModalBtn.addEventListener("click", handleModalClose);
  elements.addStudentModalBtn.addEventListener("click", handleStudentSubmit);
  elements.searchStudentInput.addEventListener("input", handleSearchAndFilter);
  elements.studentClassFilter.addEventListener("change", handleSearchAndFilter);
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
  totalStudents = filteredStudents.length;
  totalPages = Math.ceil(totalStudents / pageSize);

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
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  renderStudentRows(currentStudents, startIndex);
  updatePaginationControls();
  updateStudentCount();
}

function updatePaginationControls() {
  if (!elements.paginationContainer) return;

  // Update page info
  const startRecord = totalStudents > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, totalStudents);

  if (elements.pageInfo) {
    elements.pageInfo.textContent = `Showing ${startRecord}-${endRecord} of ${totalStudents} students`;
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
  const searchValue = elements.searchStudentInput.value.toLowerCase();
  const selectedClassText = getSelectedClassText();

  filteredStudents = allStudents.filter((student) => {
    const studentName = `${student.first_name} ${student.last_name} ${
      student.other_names || ""
    }`.toLowerCase();
    const className = (student.class_name || "No Class").toLowerCase();

    const classMatch = selectedClassText === "all" || className.includes(selectedClassText);
    const nameMatch = studentName.includes(searchValue);

    return classMatch && nameMatch;
  });

  currentPage = 1; // Reset to first page when filtering
  displayCurrentPage();
}

// Modal Management
function showModal() {
  elements.addStudentModal.classList.add("active");
  document.body.style.overflow = "hidden";
  elements.addStudentForm.reset();
}

function hideModal() {
  elements.addStudentModal.classList.remove("active");
  document.body.style.overflow = "auto";
  editingStudentId = null;
}

function handleAddStudentClick() {
  showModal();
}

function handleModalClose() {
  hideModal();
}

function handleViewModalClose() {
  hideViewModal();
}

function hideViewModal() {
  if (elements.viewStudentModal) {
    elements.viewStudentModal.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

// Student Operations
async function handleStudentSubmit() {
  const studentData = getStudentFormData();

  if (!validateStudentData(studentData)) {
    return;
  }

  try {
    const result = editingStudentId
      ? await updateStudent(studentData)
      : await createStudent(studentData);

    if (result.success) {
      showToast(result.message, "success");
      hideModal();
      await initStudentsSection();
    } else {
      showToast(result.message, "error");
    }
  } catch (error) {
    showToast("An error occurred while saving student", "error");
    console.error("Error saving student:", error);
  }
}

function getStudentFormData() {
  return {
    firstName: elements.firstNameInput.value.trim(),
    lastName: elements.lastNameInput.value.trim(),
    otherNames: elements.otherNamesInput.value.trim(),
  };
}

function validateStudentData({ firstName, lastName }) {
  if (!firstName || !lastName) {
    showToast("Please provide the student's first and last name.", "error");
    return false;
  }
  return true;
}

async function createStudent(studentData) {
  return await window.api.insertStudent(studentData);
}

async function updateStudent(studentData) {
  return await window.api.updateStudent({
    ...studentData,
    id: editingStudentId,
  });
}

// Student Details View
async function viewStudentDetails(student) {
  try {
    const response = await window.api.getCompleteStudentRecord(student.student_id);

    if (!response.success) {
      showToast(`Error loading student details: ${response.message}`, "error");
      return;
    }

    displayStudentDetailsModal(response.data);
  } catch (error) {
    showToast("An error occurred while loading student details", "error");
    console.error("Error loading student details:", error);
  }
}

function displayStudentDetailsModal(studentData) {
  if (!elements.viewStudentModal || !elements.studentDetailsContent) {
    showToast("Student details modal not found", "error");
    return;
  }

  if (studentData.length === 0) {
    elements.studentDetailsContent.innerHTML = "<p>No details found for this student.</p>";
  } else {
    elements.studentDetailsContent.innerHTML = generateStudentDetailsHTML(studentData);
  }

  elements.viewStudentModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function generateStudentDetailsHTML(studentData) {
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
            <strong>Name:</strong> ${student.student_name}
          </div>
          <div class="info-item">
            <strong>Other Names:</strong> ${student.other_names || ""}
          </div>
          <div class="info-item">
            <strong>Registration Date:</strong> ${formatDate(student.registration_date)}
          </div>
          <div class="info-item">
            <strong>Current Class:</strong> ${student.current_class || "Not Assigned"}
          </div>
          <div class="info-item">
            <strong>Current Year:</strong> ${student.current_year || "N/A"}
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

function editStudentRecord(student) {
  elements.firstNameInput.value = student.first_name;
  elements.lastNameInput.value = student.last_name;
  elements.otherNamesInput.value = student.other_names;
  editingStudentId = student.student_id;

  elements.addStudentModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

async function deleteStudent(student) {
  if (userSession !== "admin") {
    showToast("Only admin can delete student", "error");
    return;
  }

  if (student.class_name) {
    showToast(
      "Student is already assigned to a class. Please remove student from class before deleting.",
      "error"
    );
    return;
  }

  const confirmDelete = await window.dialog.showConfirmationDialog(
    "Are you sure you want to delete this student?"
  );

  if (!confirmDelete) return;

  try {
    const result = await window.api.deleteStudent(student.student_id);
    if (result.success) {
      showToast(result.message, "success");
      await initStudentsSection();
    } else {
      showToast(result.message, "error");
    }
  } catch (error) {
    showToast("An error occurred while deleting student", "error");
    console.error("Error deleting student:", error);
  }
}

// Print Functionality
async function handlePrintStudents() {
  if (!elements.studentsTable) {
    showToast("No table found to print", "error");
    return;
  }

  try {
    const academicYearSetting = await getDefaultYearSetting();
    const processedTable = prepareTableForPrint(elements.studentsTable, filteredStudents);
    const heading = createPrintHeading(academicYearSetting);

    printPage(heading, processedTable);
  } catch (error) {
    showToast("An error occurred while printing", "error");
    console.error("Error printing:", error);
  }
}

function prepareTableForPrint(table, studentsToPrint) {
  const tableClone = table.cloneNode(true);
  const tbody = tableClone.querySelector("tbody");

  // Clear existing rows
  tbody.innerHTML = "";

  // Add all filtered students to print table
  studentsToPrint.forEach((student, index) => {
    const row = document.createElement("tr");
    const className = student?.class_name || "No Class";

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${student.first_name}</td>
      <td>${student.last_name}</td>
      <td>${student.other_names || "-"}</td>
      <td>${className}</td>
    `;

    tbody.appendChild(row);
  });

  // Remove action column header
  const headerRow = tableClone.querySelector("thead tr");
  if (headerRow.cells[5]) {
    headerRow.removeChild(headerRow.cells[5]);
  }

  // Remove background colors for print
  tableClone.querySelectorAll("tr, td, th").forEach((el) => {
    el.style.backgroundColor = "white";
  });

  return tableClone.outerHTML;
}

function createPrintHeading(academicYearSetting) {
  const yearText = academicYearSetting?.setting_text || "";
  const totalFiltered = filteredStudents.length;
  const totalAll = allStudents.length;

  let subtitle = "";
  if (totalFiltered !== totalAll) {
    subtitle = `<p style="text-align: center; margin: 5px 0;">Showing ${totalFiltered} of ${totalAll} students</p>`;
  }

  return `
    <h2 style="text-align: center; margin-bottom: 10px;">Students for ${yearText} Academic Year</h2>
    ${subtitle}
  `;
}

// Display Functions
async function displayStudents(yearId) {
  try {
    const response = await window.api.getStudentsByYear(yearId);

    clearStudentDisplay();

    if (!response.success) {
      showToast(`An error occurred: ${response.message}`, "error");
      return;
    }

    if (response.data.length === 0) {
      showToast("No data found", "error");
      return;
    }

    // Store all students and initialize pagination
    allStudents = response.data;
    filteredStudents = [...allStudents];
    currentPage = 1;

    displayCurrentPage();
    await displayClassStats(response.data);
  } catch (error) {
    showToast("An error occurred while loading students", "error");
    console.error("Error loading students:", error);
  }
}

function clearStudentDisplay() {
  elements.searchStudentInput.value = "";
  elements.studentsTableBody.innerHTML = "";
  allStudents = [];
  filteredStudents = [];
  currentPage = 1;
}

function updateStudentCount() {
  const totalAll = allStudents.length;
  let countText = `Total Number Of Students: ${totalAll}`;

  elements.totalStudentsNumber.textContent = countText;
}

function renderStudentRows(students, startIndex = 0) {
  elements.studentsTableBody.innerHTML = "";

  students.forEach((student, index) => {
    const row = createStudentRow(student, startIndex + index);
    elements.studentsTableBody.appendChild(row);
  });
}

function createStudentRow(student, index) {
  const row = document.createElement("tr");
  const className = student?.class_name || "No Class";

  setRowAttributes(row, student, className);
  setRowContent(row, student, index, className);

  // Highlight students without class
  if (!student.class_name) {
    row.style.backgroundColor = "#ffe6e6";
  }

  attachRowEventListeners(row, student);

  return row;
}

function setRowAttributes(row, student, className) {
  row.setAttribute("data-id", student.id);
  row.setAttribute(
    "data-name",
    `${student.first_name} ${student.last_name} ${student.other_names}`
  );
  row.setAttribute("data-class", className);
}

function setRowContent(row, student, index, className) {
  row.innerHTML = `
    <td>${index + 1}</td>
    <td>${student.first_name}</td>
    <td>${student.last_name}</td>
    <td>${student.other_names || "-"}</td>
    <td>${className}</td>
    <td> 
      <div style="display: flex; justify-content: center">
        <button class="btn-view-student text-button" title="View Student">
          <i class="fa-solid fa-eye color-green"></i> View |
        </button>
        <button class="btn-edit-student text-button" title="Edit Student">
          <i class="fa-solid fa-pen-to-square"></i> Edit |
        </button>
        <button class="btn-delete-student text-button" title="Delete Student" style="color:red">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>
    </td>
  `;
}

function attachRowEventListeners(row, student) {
  row.querySelector(".btn-view-student").addEventListener("click", () => {
    viewStudentDetails(student);
  });

  row.querySelector(".btn-edit-student").addEventListener("click", () => {
    editStudentRecord(student);
  });

  row.querySelector(".btn-delete-student").addEventListener("click", () => {
    deleteStudent(student);
  });
}

function getSelectedClassText() {
  const selectedOption =
    elements.studentClassFilter.options[elements.studentClassFilter.selectedIndex];
  return selectedOption.text.toLowerCase();
}

// Class Statistics
async function displayClassStats(studentData) {
  try {
    userSession = await window.app.getSession();
    const classResp = await window.api.getAllClass();

    if (!classResp.success) {
      showToast(classResp.message, "error");
      return;
    }

    const groupedStudents = groupStudentsByClass(studentData);
    const arrangedClasses = arrangeClassStats(classResp.data, groupedStudents);

    renderClassStats(arrangedClasses);
  } catch (error) {
    showToast("An error occurred while loading class statistics", "error");
    console.error("Error loading class stats:", error);
  }
}

function groupStudentsByClass(students) {
  return students.reduce((acc, student) => {
    const className = student.class_name || "No Class";
    acc[className] = (acc[className] || 0) + 1;
    return acc;
  }, {});
}

function arrangeClassStats(classData, groupedStudents) {
  const arrangedClasses = classData.map((cls) => ({
    class_name: cls.class_name,
    student_count: groupedStudents[cls.class_name] || 0,
  }));

  // Add "No Class" category
  arrangedClasses.push({
    class_name: "No Class",
    student_count: groupedStudents["No Class"] || 0,
  });

  return arrangedClasses;
}

function renderClassStats(classStats) {
  elements.studentsClassSummaryTableBody.innerHTML = "";

  classStats.forEach((item) => {
    const row = elements.studentsClassSummaryTableBody.insertRow();
    row.insertCell().textContent = item.class_name;
    row.insertCell().textContent = item.student_count;
  });
}

// Initialization
export async function initStudentsSection() {
  try {
    const academicYearSetting = await getDefaultYearSetting();

    await setupClassFilter();
    await displayStudents(academicYearSetting.setting_value);
  } catch (error) {
    showToast("An error occurred while initializing students section", "error");
    console.error("Error initializing students section:", error);
  }
}

async function setupClassFilter() {
  await setUpClassSelect(elements.studentClassFilter, true);

  const noClassOption = document.createElement("option");
  noClassOption.value = "none";
  noClassOption.text = "No Class";
  elements.studentClassFilter.appendChild(noClassOption);
}

// Initialize event listeners when module loads
initializeEventListeners();
