import { openStudentPaymentModal } from "./modals/make-payment-modal.js";
import { fCurrency } from "./utils/format-currency.js";
import {
  setUpAcademicYearsSelect,
  setUpClassSelect,
  setUpTermsSelect,
} from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

const addClassTable = document.getElementById("addClassTable");
const addStudentClassForm = document.getElementById("addStudentClassForm");
const addClassFormClass = document.getElementById("addClassFormClass");
const addClassFormYear = document.getElementById("addClassFormYear");
const setClassButton = document.getElementById("setClassButton");
const changeClassButton = document.getElementById("setChangeClassButton");
const addClassForm = document.getElementById("addClassForm");
const studentClassTitle = document.getElementById("studentClassTitle");
const billStudentsMessage = document.getElementById("billStudentsMessage");

const studentClassTableContainer = document.getElementById("studentClassContainer");
const searchStudentClassInput = document.getElementById("searchStudentClassInput");
const buttons = document.querySelectorAll("#term-buttons button");

const billClassModal = document.getElementById("billClassModal");
const paymentHistoryModal = document.getElementById("paymentHistoryModal");

let studentsData = [];
let currentFee = {};

export async function setupStudentsClassSection() {
  addClassForm.style.display = "none";
  studentClassTableContainer.style.display = "none";
  await setUpAcademicYearsSelect(filterStudentsByAcademicYear);
  filterStudentsByAcademicYear.value = "2024"; // TODO: get current year
  setupClassesSidebar("2024");
}

filterStudentsByAcademicYear.addEventListener("change", async function () {
  await setupClassesSidebar(this.value);
});

async function setupClassesSidebar(year) {
  const classesResp = await window.api.getDistinctClasses(year);
  const classesList = document.getElementById("classesList");
  classesList.innerHTML = "";

  if (!classesResp.success) {
    showToast("An error occurred while fetching classes", "error");
    return;
  }

  if (classesResp.success) {
    classesResp.data.forEach((cls) => {
      const option = document.createElement("div");
      option.className = "class-item";
      option.textContent = `${cls.class_name} (${cls.academic_year})`;
      option.setAttribute("data-class-name", cls.class_name);
      option.setAttribute("data-academic-year", cls.academic_year);

      // Add click event to fetch students for the selected class
      option.addEventListener("click", () => {
        displayClassStudentsTable(cls.class_name, cls.academic_year);
        resetTermButtons();
      });

      classesList.appendChild(option);
    });
  }
}

// ************************** ADD STUDENTS TO CLASS FORM *******************************
document.getElementById("addClassButton").addEventListener("click", resetAddStudentForm);

setClassButton.addEventListener("click", async function () {
  clearInputStyles(addClassFormClass);
  clearInputStyles(addClassFormYear);

  if (addClassFormClass.value === "") {
    showToast("Please select a class", "error");
    addClassFormClass.style.border = "1px solid red";
    addClassFormClass.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
    return;
  }

  if (addClassFormYear.value === "") {
    showToast("Please enter an academic year", "error");
    addClassFormYear.style.border = "1px solid red";
    addClassFormYear.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
    return;
  }

  const resp = await window.api.checkClassExists({
    className: addClassFormClass.value,
    academicYear: addClassFormYear.value,
  });

  if (!resp.success) {
    showToast(resp.message, "error");
    return;
  }

  if (resp.success && resp.exists) {
    showToast(resp.message || "Class already exists for the academic year", "error");
    return;
  }

  await setStudentsData();
  addStudentClassForm.innerHTML = "";
  addClassRowToForm(5);

  setClassButton.style.display = "none";
  changeClassButton.style.display = "block";
  addClassFormClass.disabled = true;
  addClassFormYear.disabled = true;
  addClassTable.style.display = "block";
});

changeClassButton.addEventListener("click", function () {
  resetAddStudentForm();
});

document.getElementById("addOneStudentRow").addEventListener("click", () => addClassRowToForm(1));
document.getElementById("addTwoStudentRows").addEventListener("click", () => addClassRowToForm(2));
document.getElementById("addFiveStudentRows").addEventListener("click", () => addClassRowToForm(5));

document.getElementById("addStudentsSaveBtn").addEventListener("click", async function () {
  const records = [];
  const studentClass = addClassFormClass.value;
  const academicYear = addClassFormYear.value;
  const rows = addStudentClassForm.getElementsByTagName("tr");

  // Collect student IDs
  for (let row of rows) {
    row.style.background = "transparent"; // Reset row background
    const studentId = row.querySelector("input[name=studentId]").value;
    const studentName = row.querySelector("input[name=studentName]").value;

    if (!row || !studentId || !studentName) {
      row.style.background = "red";
      showToast("Please select a student", "error");
      return;
    }

    if (studentId) records.push(studentId);
  }

  // Send data to backend
  const response = await window.api.addStudentToClass({
    studentIds: records, // Pass all student IDs at once
    className: studentClass,
    academicYear: academicYear,
  });

  if (!response.success) {
    if (response.data) {
      // Highlight rows for existing students
      for (let row of rows) {
        const studentId = row.querySelector("input[name=studentId]").value;
        if (response.data.includes(studentId)) {
          row.style.background = "red"; // Highlight row in red
        }
      }
      showToast(response.message, "error");
    } else {
      showToast(response.message || "An error occurred while saving records", "error");
    }
    return;
  }

  showToast("Records saved successfully", "success");
  setupClassesSidebar();
});

document.getElementById("clearAddStudentsForm").addEventListener("click", () => {
  addStudentClassForm.innerHTML = "";
  addClassRowToForm(5);
});

document.getElementById("cancelAddStudentsForm").addEventListener("click", () => {
  setupClassesSidebar();
});

function addClassRowToForm(rowCount) {
  for (let i = 0; i < rowCount; i++) {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${addStudentClassForm.rows.length + 1}</td>
        <td style="position: relative;">
          <input type="text" name="studentName" placeholder="Name" required />
          <input type="hidden" name="studentId" />
          <ul class="suggestion-list"></ul>
        </td>
        <td>
          <button class="outlined-button" tabindex="-1" title="Remove row" style="color:red; border-color: red;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;

    const deleteButton = row.querySelector("button");
    deleteButton.addEventListener("click", function () {
      removeStudentRow(deleteButton);
    });

    // Add event listener to the input element for auto-suggestions
    const input = row.querySelector("input[name=studentName]");
    const hiddenInput = row.querySelector("input[name=studentId]");
    const suggestionList = row.querySelector(".suggestion-list");
    attachAutoSuggestEventListeners(input, hiddenInput, suggestionList, studentsData);

    addStudentClassForm.appendChild(row);
  }
}

function removeStudentRow(button) {
  const row = button.closest("tr");
  row.remove();
  resetAddStudentsFormRowNumbers();
}

function resetAddStudentsFormRowNumbers() {
  const rows = addStudentClassForm.getElementsByTagName("tr");
  for (let i = 0; i < rows.length; i++) {
    rows[i].cells[0].textContent = i + 1;
  }
}

async function setStudentsData() {
  const response = await window.api.getAllStudents();
  studentsData = response.data;
}

function attachAutoSuggestEventListeners(input, hiddenInput, suggestionList, data) {
  let timeout;

  input.addEventListener("input", function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const query = input.value.trim().toLowerCase();

      // Hide suggestions if less than 3 characters
      if (query.length < 3) {
        suggestionList.style.display = "none";
        return;
      }

      // Filter data based on the query
      const matches = data.filter((student) => {
        const fullName = `${student.first_name} ${student.other_names} ${student.last_name}`;
        return fullName.toLowerCase().includes(query);
      });

      // Display suggestions
      suggestionList.innerHTML = "";
      if (matches.length > 0) {
        matches.forEach((match) => {
          const li = document.createElement("li");
          const fullName = `${match.first_name} ${match.other_names} ${match.last_name}`;
          li.textContent = fullName;
          li.style.padding = "5px";
          li.style.cursor = "pointer";

          // Add click event to populate input and hide suggestions
          li.addEventListener("click", function () {
            input.value = fullName; // Set the input value
            hiddenInput.value = match.id; // Set the hidden id value
            suggestionList.style.display = "none"; // Hide suggestions
          });

          suggestionList.appendChild(li);
        });

        // Show the suggestion list
        suggestionList.style.display = "block";
      } else {
        suggestionList.style.display = "none";
      }
    }, 300);
  });

  // Hide suggestions when clicking outside the input
  document.addEventListener("click", function (event) {
    if (!input.contains(event.target) && !suggestionList.contains(event.target)) {
      suggestionList.style.display = "none";
    }
  });
}

// TODO: move to utils
function clearInputStyles(input) {
  input.style.border = "1px solid #ccc";
  input.style.backgroundColor = "white";
}

// TODO: move to utils
function clearInput(input) {
  input.value = "";
  input.disabled = false;
}

function resetAddStudentForm() {
  addClassForm.style.display = "block";
  studentClassTableContainer.style.display = "none";

  setUpClassSelect(addClassFormClass);
  setUpAcademicYearsSelect(addClassFormYear);
  addClassFormClass.disabled = false;
  addClassFormYear.disabled = false;
  clearInput(addClassFormClass);
  clearInput(addClassFormYear);
  setClassButton.style.display = "block";
  changeClassButton.style.display = "none";
  addClassTable.style.display = "none";
  addStudentClassForm.innerHTML = "";
}

// ******************************** STUDENT CLASS TABLE ********************************
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    currentFee.term = button.dataset.term;
    displayClassStudentsTable(currentFee.className, currentFee.academicYear, currentFee.term);
  });
});

document.getElementById("allClassesDiv").addEventListener("click", async function () {
  addClassForm.style.display = "none";
  studentClassTableContainer.style.display = "block";

  const response = await window.api.getAllClassesStudents();

  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  studentClassTitle.textContent = "All Classes";
  studentClassTableBody.innerHTML = "";
  response.data.forEach((student, index) => {
    const row = document.createElement("tr");

    // Add data attributes to the row
    row.setAttribute("data-id", student.student_id);
    row.setAttribute("data-class", student.class_name);
    row.setAttribute("data-academic-year", student.academic_year);

    row.innerHTML = `
          <td>${index + 1}</td>
          <td>${student.first_name} ${student.other_names} ${student.last_name}</td>
          <td>${student.class_name}</td>
          <td>${student.academic_year}</td>  
          <td></td>
        `;

    studentClassTableBody.appendChild(row);
  });
});

searchStudentClassInput.addEventListener("input", function () {
  filterStudentsClassTable();
});

async function displayClassStudentsTable(className, academicYear, term = "first") {
  addClassForm.style.display = "none";
  studentClassTableContainer.style.display = "block";
  studentClassTitle.textContent = "";
  studentClassTitle.textContent = `${className} (${academicYear}) - ${term} term`;

  const response = await window.api.getBillDetails({ className, academicYear, term });

  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  if (response.data.length === 0) {
    studentClassTableBody.innerHTML = "";
    studentClassTitle.textContent = `No students found for ${className} for ${academicYear} academic year.`;
    showToast("No students found for this class", "error");
    return;
  }

  currentFee = { className, academicYear, term };

  studentClassTableBody.innerHTML = "";
  response.data.forEach((item, index) => {
    const arrears = item.fee_amount - (item.total_payments ?? 0);
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.student_name}</td>
        <td style="display:none">${item.bill_id}</td>
        <td style="display:none">${item.student_id}</td>
        <td style="display:none">${item.fees_id}</td>
        <td>${item?.bill_id ? "Billed" : "Not Billed"}</td>
        <td class="color-blue">${fCurrency(item.fee_amount)}</td>
        <td class="color-green">${fCurrency(item.total_payments)}</td>
        <td class="color-red">${fCurrency(arrears)}</td>
        <td>
          <div style="display: flex; justify-content: center">
            <button id="btnPayFees"  class="text-button" title="Pay school fees">
              <i class="fa-brands fa-amazon-pay"></i>
            </button>

            <div style="border-left: 1px solid #ccc; height: 24px;"></div>

            <button id="btnPaymentsHistory"  class="text-button" title="Payment history">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </td>
    `;

    row.querySelector("#btnPayFees").addEventListener("click", () => {
      openStudentPaymentModal(item, currentFee);
    });

    row.querySelector("#btnPaymentsHistory").addEventListener("click", () => {
      showPaymentHistoryModal(item, currentFee);
    });

    studentClassTableBody.appendChild(row);
  });
}

function filterStudentsClassTable() {
  const searchValue = searchStudentClassInput.value.toLowerCase();
  const tableRows = studentClassTableBody.getElementsByTagName("tr");

  for (let row of tableRows) {
    const cells = row.getElementsByTagName("td");
    const firstNameCell = cells[1]?.textContent.toLowerCase();
    const lastNameCell = cells[2]?.textContent.toLowerCase();
    const otherNamesCell = cells[3]?.textContent.toLowerCase();

    if (!firstNameCell && !lastNameCell && !otherNamesCell) return;

    // Check if search value is included in the name
    if (
      firstNameCell.includes(searchValue) ||
      lastNameCell.includes(searchValue) ||
      otherNamesCell.includes(searchValue)
    ) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  }
}

function resetTermButtons() {
  buttons.forEach((btn) => btn.classList.remove("active"));
  document.getElementById("firstTerm").classList.add("active"); // Set "First Term" active
}

// ************************** BILL CLASS MODAL *******************************
document.getElementById("billClassBtn").addEventListener("click", async function () {
  if (!currentFee.className || !currentFee.academicYear || !currentFee.term) {
    showToast("Please select a class, academic year and term", "error");
    return;
  }

  const response = await window.api.getSingleFee({ ...currentFee });

  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  currentFee.id = response.data.id;
  currentFee.amount = response.data.amount;

  const message = `
      <p>You are about to bill students in <strong>${currentFee.className}</strong> with the following details:</p>
      <ul>
        <li><strong>Academic Year:</strong> ${currentFee.academicYear}</li>
        <li><strong>Term:</strong> ${currentFee.term}</li>
        <li><strong>Fee Amount:</strong> GH₵${currentFee.amount}</li>
      </ul>
      <p><strong>Do you want to proceed?</strong></p>
  `;

  billStudentsMessage.innerHTML = message;
  billClassModal.style.display = "block";
});

document.getElementById("billClassCloseXBtn").addEventListener("click", function () {
  billClassModal.style.display = "none";
});

document.getElementById("cancelBillClassModalBtn").addEventListener("click", function () {
  billClassModal.style.display = "none";
});

document.getElementById("submitBillClassModalBtn").addEventListener("click", async function () {
  // get student ids from the table
  const rows = studentClassTableBody.getElementsByTagName("tr");
  const idsArray = Array.from(rows).map((row) => row.children[3].textContent);

  const response = await window.api.billClassStudents(idsArray, currentFee.id);

  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  showToast(response.message || "Students billed successfully", "success");

  billClassModal.style.display = "none";
  displayClassStudentsTable(currentFee.className, currentFee.academicYear, currentFee.term);
});

// *********************** PAYMENT HISTORY MODAL ***************************
document.getElementById("paymentHistoryClassCloseXBtn").addEventListener("click", function () {
  paymentHistoryModal.style.display = "none";
});

document.getElementById("paymentHistoryOkModalBtn").addEventListener("click", function () {
  paymentHistoryModal.style.display = "none";
});

function showPaymentHistoryModal(data, currentFee) {
  console.log(data, currentFee);
  paymentHistoryModal.style.display = "block";
  document.getElementById("paymentHistoryStudentName").textContent = data.student_name;
  document.getElementById(
    "paymentHistoryFeesText"
  ).textContent = `${currentFee.className} - ${currentFee.term} Term, ${currentFee.academicYear}`;
}

// {
//   "student_id": 1,
//   "student_name": "Abubakari Abdul-Fatahu Wunitira",
//   "fees_id": 1,
//   "fee_amount": 200,
//   "bill_id": 1,
//   "billed_status": 1,
//   "total_payments": 200
// }

// {
//   "className": "Class One",
//   "academicYear": "2024",
//   "term": "first"
// }
