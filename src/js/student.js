import { getDefaultYearSetting } from "./utils/get-settings.js";
import { printPage } from "./utils/print-page.js";
import { setUpClassSelect } from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

// DOM Elements
const elements = {
  addStudentModal: document.getElementById("addStudentModal"),
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
};

// State
let editingStudentId = null;
let userSession;

// Event Listeners
function initializeEventListeners() {
  elements.addStudentBtn.addEventListener("click", handleAddStudentClick);
  elements.printStudentsBtn.addEventListener("click", handlePrintStudents);
  elements.addStudentCloseX.addEventListener("click", handleModalClose);
  elements.cancelStudentModalBtn.addEventListener("click", handleModalClose);
  elements.addStudentModalBtn.addEventListener("click", handleStudentSubmit);
  elements.searchStudentInput.addEventListener("input", filterStudentsTable);
  elements.studentClassFilter.addEventListener("change", filterStudentsTable);
}

// Modal Management
function showModal() {
  elements.addStudentModal.style.display = "block";
  elements.addStudentForm.reset();
}

function hideModal() {
  elements.addStudentModal.style.display = "none";
  editingStudentId = null;
}

function handleAddStudentClick() {
  showModal();
}

function handleModalClose() {
  hideModal();
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

function editStudentRecord(student) {
  elements.firstNameInput.value = student.first_name;
  elements.lastNameInput.value = student.last_name;
  elements.otherNamesInput.value = student.other_names;
  editingStudentId = student.student_id;
  elements.addStudentModal.style.display = "block";
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
    const processedTable = prepareTableForPrint(elements.studentsTable);
    const heading = createPrintHeading(academicYearSetting);

    printPage(heading, processedTable);
  } catch (error) {
    showToast("An error occurred while printing", "error");
    console.error("Error printing:", error);
  }
}

function prepareTableForPrint(table) {
  const tableClone = table.cloneNode(true);

  // Remove action column (last column)
  tableClone.querySelectorAll("tr").forEach((row) => {
    if (row.cells[5]) {
      row.removeChild(row.cells[5]);
    }
  });

  // Remove background colors for print
  tableClone.querySelectorAll("tr, td, th").forEach((el) => {
    el.style.backgroundColor = "white";
  });

  return tableClone.outerHTML;
}

function createPrintHeading(academicYearSetting) {
  const yearText = academicYearSetting?.setting_text || "";
  return `<h2 style="text-align: center; margin-bottom: 10px;">Students for ${yearText} Academic Year</h2>`;
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

    updateStudentCount(response.data.length);
    renderStudentRows(response.data);
    await displayClassStats(response.data);
  } catch (error) {
    showToast("An error occurred while loading students", "error");
    console.error("Error loading students:", error);
  }
}

function clearStudentDisplay() {
  elements.searchStudentInput.value = "";
  elements.studentsTableBody.innerHTML = "";
}

function updateStudentCount(count) {
  elements.totalStudentsNumber.textContent = `Total Number Of Students: ${count}`;
}

function renderStudentRows(students) {
  students.forEach((student, index) => {
    const row = createStudentRow(student, index);
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
    <td>${student.other_names}</td>
    <td>${className}</td>
    <td> 
      <div style="display: flex; justify-content: center">
        <button class="btn-edit-student text-button" title="Edit Student">
          <i class="fa-solid fa-pen-to-square"></i> Edit
        </button>
        <button class="btn-delete-student text-button" title="Delete Student" style="color:red">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>
    </td>
  `;
}

function attachRowEventListeners(row, student) {
  row.querySelector(".btn-edit-student").addEventListener("click", () => {
    editStudentRecord(student);
  });

  row.querySelector(".btn-delete-student").addEventListener("click", () => {
    deleteStudent(student);
  });
}

// Filtering
function filterStudentsTable() {
  const searchValue = elements.searchStudentInput.value.toLowerCase();
  const selectedClassText = getSelectedClassText();
  const tableRows = elements.studentsTableBody.querySelectorAll("tr");

  tableRows.forEach((row) => {
    const rowName = row.getAttribute("data-name").toLowerCase();
    const rowClass = row.getAttribute("data-class").toLowerCase();

    const classMatch = selectedClassText === "all" || rowClass.includes(selectedClassText);
    const nameMatch = rowName.includes(searchValue);

    row.style.display = classMatch && nameMatch ? "" : "none";
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
