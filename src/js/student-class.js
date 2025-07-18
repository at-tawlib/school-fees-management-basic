import { openBillClassModal } from "./modals/bill-class-modal.js";
import { openApplyDiscountModal } from "./modals/discount-modal.js";
import { openStudentPaymentModal } from "./modals/make-payment-modal.js";
import { showPaymentHistoryModal } from "./modals/payment-history-modal.js";
import { fCurrency } from "./utils/format-currency.js";
import { getDefaultTermSetting, getDefaultYearSetting } from "./utils/get-settings.js";
import { printPage } from "./utils/print-page.js";
import { setUpAcademicYearsSelect, setUpClassSelect } from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

const addClassTable = document.getElementById("addClassTable");
const addStudentClassForm = document.getElementById("addStudentClassForm");
const addClassFormClass = document.getElementById("addClassFormClass");
const setClassButton = document.getElementById("setClassButton");
const changeClassButton = document.getElementById("setChangeClassButton");
const addClassForm = document.getElementById("addClassForm");

const studentClassTitle = document.getElementById("studentClassTitle");
const filterStudentsByAcademicYear = document.getElementById("filterStudentsByAcademicYear");

const studentClassTableContainer = document.getElementById("studentClassContainer");
const studentClassTable = document.getElementById("studentClassTable");
const studentClassTableBody = document.getElementById("studentClassTableBody");
const studentClassTableFoot = document.getElementById("studentClassTableFoot");
const notBilledStudentClassTable = document.getElementById("notBilledStudentClassTable");
const notBilledStudentClassTableBody = document.getElementById("notBilledStudentClassTableBody");

const searchStudentClassInput = document.getElementById("searchStudentClassInput");

const addStudentsToClassModal = document.getElementById("addStudentsToClassModal");
const studentsToAddTableBody = document.getElementById("studentsToAddTableBody");
const studentToAddInput = document.getElementById("studentToAddInput");
const studentToAddId = document.getElementById("studentToAddId");
const studentToAddSuggestionList = document.getElementById("studentToAddSuggestionList");
const paidStatusSelect = document.getElementById("paidStatusSelect");

let studentsData = [];
export let currentClass = {};
export let classTerm = {};
export let currentFees = {};
let defaultTerm;
let defaultYear;
let userSession;

export async function setupStudentsClassSection() {
  defaultYear = await getDefaultYearSetting();
  defaultTerm = await getDefaultTermSetting();
  classTerm = { text: defaultTerm.setting_text, value: defaultTerm.setting_value };

  userSession = await window.app.getSession();

  addClassForm.style.display = "none";
  studentClassTableContainer.style.display = "none";
  await setUpAcademicYearsSelect(filterStudentsByAcademicYear);
  filterStudentsByAcademicYear.value = defaultYear.setting_value;
  await setupClassesSidebar(defaultYear.setting_value);
}

export const resetCurrentFees = () => (currentFees = {});

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
      option.textContent = cls.class_name;
      option.setAttribute("data-class-name", cls.class_name);
      option.setAttribute("data-academic-year", cls.academic_year);

      // Add click event to fetch students for the selected class
      option.addEventListener("click", async () => {
        currentClass = {
          classId: cls.class_id,
          className: cls.class_name,
          academicYear: cls.academic_year,
          academicYearId: cls.academic_year_id,
        };
        await displayClassStudentsTable();
      });

      classesList.appendChild(option);
    });
  }

  const classItems = document.querySelectorAll(".class-item");
  classItems.forEach((item) => {
    // Remove 'active' class from all items and add to the clicked item
    item.addEventListener("click", function () {
      classItems.forEach((el) => el.classList.remove("active"));
      this.classList.add("active");
    });
  });
}

filterStudentsByAcademicYear.addEventListener("change", async function () {
  await setupClassesSidebar(this.value);
  addClassForm.style.display = "none";
  studentClassTableContainer.style.display = "none";
});

paidStatusSelect.addEventListener("change", async function () {
  if (this.value === "all") {
    await displayClassStudentsTable();
    return;
  }

  const rows = studentClassTableBody.getElementsByTagName("tr");
  for (let row of rows) {
    const arrears = Number(row.getAttribute("data-arrears"));
    if (this.value === "withArrears" && arrears > 0) {
      row.style.display = "";
    } else if (this.value === "fullyPaid" && arrears <= 0) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  }
});

document.getElementById("printBillBtn").addEventListener("click", () => {
  if (!studentClassTable) {
    alert("No table found to print!");
    return;
  }

  // Clone the table to modify it without affecting the original
  const tableClone = studentClassTable.cloneNode(true);

  // Remove the last two column (status and actions column)
  const columnsToRemove = [6, 5];
  tableClone.querySelectorAll("tr").forEach((row) => {
    columnsToRemove.forEach((index) => {
      if (row.cells[index]) row.removeChild(row.cells[index]);
    });
  });

  // Remove last cell of last child (footer)
  const tableFootRow = tableClone.querySelector("tfoot tr");
  tableFootRow.removeChild(tableFootRow.cells[4]);

  // Remove background colors
  tableClone.querySelectorAll("tr, td, th").forEach((el) => {
    el.style.backgroundColor = "white";
  });

  // Add a heading above the table
  const billHeader = `${currentClass.className} (${currentClass.academicYear}) - ${classTerm.text} term`;
  const heading = `<h2 style="text-align: center; margin-bottom: 4px;">Student Fees Bill for ${billHeader}</h2>`;

  printPage(heading, tableClone.outerHTML);
});

// ************************** ADD STUDENTS TO CLASS FORM *******************************
document.getElementById("addClassButton").addEventListener("click", resetAddStudentForm);

setClassButton.addEventListener("click", async function () {
  clearInputStyles(addClassFormClass);

  if (addClassFormClass.value === "") {
    showToast("Please select a class", "error");
    addClassFormClass.style.border = "1px solid red";
    addClassFormClass.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
    return;
  }

  const resp = await window.api.checkClassExists({
    classId: addClassFormClass.value,
    academicYearId: filterStudentsByAcademicYear.value,
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
  await setupNoClassStudentsTable();

  setClassButton.style.display = "none";
  changeClassButton.style.display = "block";
  addClassFormClass.disabled = true;
  addClassTable.style.display = "block";
});

changeClassButton.addEventListener("click", resetAddStudentForm);

document.getElementById("addOneStudentRow").addEventListener("click", () => addClassRowToForm(1));
document.getElementById("addTwoStudentRows").addEventListener("click", () => addClassRowToForm(2));
document.getElementById("addFiveStudentRows").addEventListener("click", () => addClassRowToForm(5));

document.getElementById("addStudentsSaveBtn").addEventListener("click", async function () {
  const records = [];
  const studentClass = addClassFormClass.value;
  const rows = addStudentClassForm.getElementsByTagName("tr");

  // Collect student IDs
  for (let row of rows) {
    // TODO: use the getAttribute method to get the student ID
    row.style.background = "transparent"; // Reset row background
    const studentId = row.querySelector("input[name=studentId]").value;
    const studentName = row.querySelector("input[name=studentName]").value;

    if (!row || !studentId || !studentName) {
      row.style.background = "red";
      row.getElementsByTagName("i")[0].style.color = "white";
      showToast("Please select a student", "error");
      return;
    }

    if (studentId) records.push(studentId);
  }

  // Send data to backend
  const response = await window.api.addStudentToClass({
    studentIds: records,
    className: studentClass,
    academicYear: filterStudentsByAcademicYear.value,
  });

  if (!response.success) {
    if (response.data) {
      // Highlight rows for existing students
      for (let row of rows) {
        const studentId = row.querySelector("input[name=studentId]").value;
        if (response.data.includes(studentId)) {
          row.style.background = "red"; // Highlight row in red
          row.getElementsByTagName("i")[0].style.color = "white";
        }
      }
      showToast(response.message, "error");
    } else {
      showToast(response.message || "An error occurred while saving records", "error");
    }
    return;
  }

  showToast("Records saved successfully", "success");
  setupStudentsClassSection();
});

document.getElementById("clearAddStudentsForm").addEventListener("click", () => {
  addStudentClassForm.innerHTML = "";
  addClassRowToForm(5);
});

document
  .getElementById("cancelAddStudentsForm")
  .addEventListener("click", async () => await setupStudentsClassSection());

function openAddStudentsToClassModal() {
  addStudentsToClassModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeAddStudentsToClassModal() {
  addStudentsToClassModal.classList.remove("active");
  document.body.style.overflow = "auto";
}

function addClassRowToForm(rowCount) {
  for (let i = 0; i < rowCount; i++) {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${addStudentClassForm.rows.length + 1}</td>
        <td style="position: relative;">
          <div class="flex-column full-width" style="position: relative">
            <input type="text" name="studentName" placeholder="Name" required />
            <ul class="suggestion-list"></ul>
          </div>
          <input type="hidden" name="studentId" />
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
  const response = await window.api.getStudentsByYear(filterStudentsByAcademicYear.value);

  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  if (response.data.length === 0) {
    showToast("No students found for this academic year", "error");
    return;
  }

  const studentsWithoutClass = response.data.filter((student) => student.class_name === null);
  studentsData = studentsWithoutClass;
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
        const fullName = `${student.first_name} ${student.other_names ?? ""} ${student.last_name}`;
        return fullName.toLowerCase().includes(query);
      });

      // Display suggestions
      suggestionList.innerHTML = "";
      if (matches.length > 0) {
        matches.forEach((match) => {
          const li = document.createElement("li");
          const fullName = `${match.first_name} ${match.other_names ?? ""} ${match.last_name}`;
          li.textContent = fullName;
          li.style.padding = "5px";
          li.style.cursor = "pointer";

          // Add click event to populate input and hide suggestions
          li.addEventListener("click", function () {
            input.value = fullName; // Set the input value
            hiddenInput.value = match.student_id; // Set the hidden id value
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

async function setupNoClassStudentsTable() {
  const tableBody = document.getElementById("noClassStudentsTableBody");
  tableBody.innerHTML = "";
  studentsData.forEach((student, index) => {
    const row = document.createElement("tr");
    row.setAttribute("data-student-id", student.id);
    row.innerHTML = `
      <td>${student.first_name} ${student.other_names ?? ""} ${student.last_name}</td>
    `;
    tableBody.appendChild(row);
  });
}

function resetAddStudentForm() {
  addClassForm.style.display = "block";
  studentClassTableContainer.style.display = "none";

  setUpClassSelect(addClassFormClass);
  addClassFormClass.disabled = false;
  clearInput(addClassFormClass);
  setClassButton.style.display = "block";
  changeClassButton.style.display = "none";
  addClassTable.style.display = "none";
  addStudentClassForm.innerHTML = "";
}

// ******************************** STUDENT CLASS TABLE ********************************
searchStudentClassInput.addEventListener("input", filterStudentsClassTable);

export async function displayClassStudentsTable() {
  addClassForm.style.display = "none";
  studentClassTableContainer.style.display = "block";
  studentClassTableBody.innerHTML = "";
  studentClassTableFoot.innerHTML = "";
  notBilledStudentClassTableBody.innerHTML = "";
  studentClassTitle.textContent = "";
  studentClassTitle.textContent = `${currentClass.className} (${currentClass.academicYear}) - ${classTerm.text} term`;

  let notBilledCount = 0;
  let billedCount = 0;

  await createTermButtons(Number(classTerm.value));

  const response = await window.api.getBillDetails({
    classId: currentClass.classId,
    yearId: currentClass.academicYearId,
    term: classTerm.value,
  });

  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  // If data is not available get students by class and display them
  if (response.data.length === 0) {
    const studentsResp = await window.api.getStudentsByClass({
      classId: currentClass.classId,
      academicYearId: currentClass.academicYearId,
    });

    if (!studentsResp.success) {
      showToast(studentsResp.message || "An error occurred", "error");
      return;
    }

    if (studentsResp.data.length === 0) {
      studentClassTable.style.display = "none";
      notBilledStudentClassTable.style.display = "none";
      studentClassTitle.textContent = `No students found for ${currentClass.className} for ${currentClass.academicYear} academic year.`;
      showToast("No students found for this class", "error");
      return;
    }

    studentClassTable.style.display = "none";
    notBilledStudentClassTable.style.display = "";
    studentsResp.data.forEach((item, index) => {
      const row = document.createElement("tr");
      row.setAttribute("data-student-id", item.student_id);
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.student_name}</td>
        <td>
          <button id="btnRemoveStudent" class="text-button" title="Remove student from class">
            <i class="fa-solid fa-user-slash color-red"></i>
            <span class="color-red">Remove Student from class</span>
          </button>
        </td>
      `;

      row
        .querySelector("#btnRemoveStudent")
        .addEventListener("click", () => removeStudentFromClass(item));

      notBilledStudentClassTableBody.appendChild(row);
    });
    return;
  }

  response.data.forEach((item, index) => {
    const arrears = item.fee_amount - (item.total_payments ?? 0);
    const row = document.createElement("tr");

    if (item.bill_id) {
      row.setAttribute("data-arrears", arrears);
      row.dataset.student = JSON.stringify(item);
      row.innerHTML = `
        <td>${billedCount + 1}</td>
        <td>${item.student_name}</td>
        <td class="color-blue bold-text">${fCurrency(item.fee_amount)}</td>
        <td class="color-green bold-text">${fCurrency(item.total_payments)}</td>
        <td class="color-red bold-text">${fCurrency(arrears)}</td>
        <td>${arrears <= 0 ? '<i class="fa-regular fa-circle-check color-green"></i>' : ""}</td>
        <td>
          <div style="display: flex; justify-content: center">
            <button id="btnPayFees"  class="text-button" title="Pay school fees">
              <i class="fa-brands fa-amazon-pay color-blue"></i>
            </button>

            <button id="btnPaymentsHistory"  class="text-button" title="Payment history">
              <i class="fa-solid fa-eye color-green"></i>
            </button>

            <button id="btnApplyDiscount"  class="text-button" title="Apply Discount">
              <i class="fa-solid fa-percent color-yellow"></i>
            </button>

            <button id="btnUnbillStudent" title="Unbill student" class="text-button">
              <i class="fa-solid fa-link-slash color-red"></i>
            </button>
          </div>
        </td>
    `;

      row.querySelector("#btnPayFees").addEventListener("click", () => {
        openStudentPaymentModal(item, currentClass, classTerm);
      });

      row
        .querySelector("#btnPaymentsHistory")
        .addEventListener("click", async () => await showPaymentHistoryModal(item));

      row.querySelector("#btnApplyDiscount").addEventListener("click", () => {
        if (userSession !== "admin") {
          showToast("Only admin can add student discount", "error");
          return;
        }
        openApplyDiscountModal(item, currentClass, classTerm);
      });

      row.querySelector("#btnUnbillStudent").addEventListener("click", async () => {
        if (userSession !== "admin") {
          showToast("Only admin can remove student bill", "error");
          return;
        }

        const confirmDelete = await window.dialog.showConfirmationDialog(
          `Are you sure you want to unbill ${item.student_name}?`
        );
        if (!confirmDelete) return;

        const response = await window.api.deleteBill(item.bill_id);
        if (!response.success) {
          showToast(response.message || "An error occurred", "error");
          return;
        }

        showToast(response.message || "Student unbilled successfully", "success");
        await displayClassStudentsTable();
      });

      if (item.discount_amount > 0) row.style.background = "rgba(0, 255, 0, 0.1)";

      studentClassTableBody.appendChild(row);
      billedCount += 1;
    } else {
      row.setAttribute("data-student-id", item.student_id);
      row.setAttribute("data-student-name", item.student_name);
      row.innerHTML = `
        <td>${notBilledCount + 1}</td>
        <td>${item.student_name}</td>
        <td>
          <button class="bg-green text-button" title="Bill student">
            <i class="fa-solid fa-money-bill-wave"></i> Bill Student
          </button>
          <button id="btnRemoveStudent" class="text-button" title="Remove student from class">
            <i class="fa-solid fa-user-slash color-red"></i>
            <span class="color-red">Remove Student from class</span>
          </button>
        </td>
      `;

      row.querySelector("button").addEventListener("click", () => {
        billSingleStudent(item.student_id, item.fees_id);
      });

      row
        .querySelector("#btnRemoveStudent")
        .addEventListener("click", () => removeStudentFromClass(item));

      notBilledStudentClassTableBody.appendChild(row);
      notBilledCount += 1;
    }
  });

  // Calculate the totals and display in the table foot
  // Only sum if bill_id is not null or undefined
  const totals = response.data.reduce(
    (acc, curr) => {
      if (curr.bill_id) {
        acc.totalFeeAmount += curr.fee_amount;
        acc.totalPayments += curr.total_payments;
        acc.totalBalance += curr.balance;
      }
      return acc;
    },
    { totalFeeAmount: 0, totalPayments: 0, totalBalance: 0 }
  );

  studentClassTableFoot.innerHTML = `
    <tr>
      <th colspan="2" class="bold-text">Totals</th>
      <th class="color-blue bold-text">${fCurrency(totals.totalFeeAmount)}</th>
      <th class="color-green bold-text">${fCurrency(totals.totalPayments)}</th>
      <th class="color-red bold-text">${fCurrency(totals.totalBalance)}</th>
      <th></th>
      <th></th>
    </tr>
  `;

  if (billedCount > 0) studentClassTable.style.display = "";
  else studentClassTable.style.display = "none";

  if (notBilledCount <= 0) notBilledStudentClassTable.style.display = "none";
  else notBilledStudentClassTable.style.display = "";
}

async function createTermButtons(activeTermId) {
  const terms = await window.store.getStoreTerms();

  const termButtonsContainer = document.getElementById("term-buttons");
  termButtonsContainer.innerHTML = "";

  terms.forEach((t) => {
    const button = document.createElement("button");
    button.classList.add("toggle-btn");
    button.dataset.term = t.id;
    button.textContent = `${t.term} Term`;
    if (t.id === activeTermId) button.classList.add("active");

    // Event listener
    button.addEventListener("click", async () => {
      document.querySelectorAll(".toggle-btn").forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      classTerm = { text: t.term, value: t.id };
      await displayClassStudentsTable();
    });

    termButtonsContainer.appendChild(button);
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

async function billSingleStudent(studentId, feesId) {
  // To bill a student, first check if the selected term and academic year is the current term and academic year
  const defaultTerm = await getDefaultTermSetting();
  const defaultYear = await getDefaultYearSetting();

  if (
    Number(defaultTerm.setting_value) !== Number(classTerm.value) ||
    Number(defaultYear.setting_value) !== Number(currentClass.academicYearId)
  ) {
    showToast("You can only bill students for the current term and academic year", "error");
    return;
  }

  const billResp = await window.api.billStudent({ studentId, feesId });
  if (!billResp.success) {
    showToast(billResp.message || "An error occurred", "error");
    return;
  }

  await displayClassStudentsTable();
  showToast(billResp.message || "Student billed successfully", "success");
}

const removeStudentFromClass = async (student) => {
  if (userSession !== "admin") {
    showToast("Only admin can remove student from class", "error");
    return;
  }

  if (
    currentClass.academicYear !== defaultYear.setting_text ||
    classTerm.text !== defaultTerm.setting_text
  ) {
    showToast("You can only remove student in the current term and year", "error");
    return;
  }

  const studentBillExist = await window.api.checkStudentBillExist(student.student_id);
  if (!studentBillExist.success) {
    showToast("An error occurred", "error");
    return;
  }

  if (studentBillExist.success && studentBillExist.exists) {
    showToast("Student has an active bill, remove bill first", "error");
    return;
  }

  const confirmRemove = await window.dialog.showConfirmationDialog(
    `Are you sure you want to remove ${student.student_name} from this class?`
  );
  if (!confirmRemove) return;

  const response = await window.api.removeStudentFromClass({
    studentId: student.student_id,
    classId: currentClass.classId,
    academicYearId: currentClass.academicYearId,
  });

  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  showToast(response.message || "Student removed successfully", "success");
  await displayClassStudentsTable();
};

document.getElementById("billClassBtn").addEventListener("click", async function () {
  if (!currentClass.className || !currentClass.academicYear || !classTerm.text) {
    showToast("Please select a class, academic year and term", "error");
    return;
  }

  // To bill a class, first check if the selected term and academic year is the current term and academic year
  const defaultTerm = await getDefaultTermSetting();
  const defaultYear = await getDefaultYearSetting();

  if (
    Number(defaultTerm.setting_value) !== Number(classTerm.value) ||
    Number(defaultYear.setting_value) !== Number(currentClass.academicYearId)
  ) {
    showToast("You can only bill students for the current term and academic year", "error");
    return;
  }

  const response = await window.api.getSingleFee({
    classId: currentClass.classId,
    academicYearId: currentClass.academicYearId,
    termId: classTerm.value,
  });

  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  if (response.data.length === 0) {
    showToast("No fee details found for the selected class", "error");
    return;
  }

  currentClass.id = response.data.class_id;
  currentClass.amount = response.data.amount;
  currentFees = response.data;

  // Check if some students in the class has already been billed
  const checkBilled = await window.api.checkIfClassBilled(currentFees.id);
  if (!checkBilled.success) {
    showToast(checkBilled.message || "An error occurred", "error");
    return;
  }

  if (checkBilled.exists) {
    const rows = notBilledStudentClassTableBody.getElementsByTagName("tr");
    if (rows.length === 0) {
      showToast("All students in this class have been billed", "error");
      return;
    }

    const namesArray = Array.from(rows).map((row) => row.getAttribute("data-student-name"));
    const message = `
    <p>Some students in <strong>${
      currentClass.className
    }</strong> have already been billed for the selected term and academic year.</p>
    <p>The following students however have not been billed:</p>
    <ul>
      ${namesArray.map((name) => `<li class="color-green">${name}</li>`).join("")}
    </ul>

    <p><strong>Do you want to proceed?</strong></p>
  `;

    openBillClassModal(message);
    return;
  }

  const message = `
      <p>You are about to bill students in <strong>${currentClass.className}</strong> with the following details:</p>
      <ul>
        <li><strong>Academic Year:</strong> ${currentClass.academicYear}</li>
        <li><strong>Term:</strong> ${classTerm.text}</li>
        <li><strong>Fee Amount:</strong> GH₵${currentClass.amount}</li>
      </ul>
      <p><strong>Do you want to proceed?</strong></p>
  `;
  openBillClassModal(message);
});

export const submitBill = async () => {
  // get student ids from the table
  const rows = notBilledStudentClassTableBody.getElementsByTagName("tr");
  const idsArray = Array.from(rows).map((row) => row.getAttribute("data-student-id"));

  const response = await window.api.billClassStudents(idsArray, currentFees.id);
  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  showToast(response.message || "Students billed successfully", "success");
  currentFees = {};
};

// **************** ADD STUDENTS TO CLASS MODAL ************************
document.getElementById("addStudentToClassBtn").addEventListener("click", async function () {
  openAddStudentsToClassModal();
  document.getElementById(
    "addStudentsToClassTitle"
  ).textContent = `Add Students to ${currentClass.className}`;
  studentToAddId.value = "";
  studentToAddInput.value = "";

  if (!studentsData || studentsData.length === 0) {
    await setStudentsData();
  }

  attachAutoSuggestEventListeners(
    studentToAddInput,
    studentToAddId,
    studentToAddSuggestionList,
    studentsData
  );
});

document.getElementById("addStudentsToClassCloseX").addEventListener("click", () => {
  resetStudentToAddModal();
  closeAddStudentsToClassModal();
});

document.getElementById("cancelAddStudentToClassModalBtn").addEventListener("click", () => {
  resetStudentToAddModal();
  closeAddStudentsToClassModal();
});

document.getElementById("addStudentToList").addEventListener("click", () => {
  const studentId = studentToAddId.value;
  const studentName = studentToAddInput.value;

  if (!studentId || !studentName) {
    showToast("Please select a student", "error");
    return;
  }

  const row = document.createElement("tr");
  row.setAttribute("data-student-id", studentId);
  row.innerHTML = `
    <td>${studentName}</td>
    <td>
      <button class="text-button" title="Remove student">
        <i class="fa-solid fa-trash color-red"></i>
      </button>
    </td>
  `;

  row.querySelector("button").addEventListener("click", () => {
    row.remove();
  });

  studentToAddId.value = "";
  studentToAddInput.value = "";

  studentsToAddTableBody.appendChild(row);
});

document.getElementById("addStudentsToClassModalBtn").addEventListener("click", async () => {
  const rows = studentsToAddTableBody.getElementsByTagName("tr");
  const studentIds = Array.from(rows).map((row) => row.getAttribute("data-student-id"));

  if (studentIds.length === 0) {
    showToast("No students selected to be added", "error");
    return;
  }

  const response = await window.api.addStudentToClass({
    studentIds: studentIds,
    className: currentClass.classId,
    academicYear: currentClass.academicYearId,
  });

  if (!response.success) {
    if (response.data) {
      // Highlight rows for existing students
      for (let row of rows) {
        row.style.background = "";
        row.getElementsByTagName("i")[0].style.color = "";
        const studentId = row.getAttribute("data-student-id");
        if (response.data.includes(studentId)) {
          row.style.background = "red";
          row.getElementsByTagName("i")[0].style.color = "white";
        }
      }
      showToast(response.message, "error");
    } else {
      showToast(response.message || "An error occurred while saving records", "error");
    }
    return;
  }

  closeAddStudentsToClassModal();
  resetStudentToAddModal();
  showToast("Records saved successfully", "success");
  await displayClassStudentsTable();
});

function resetStudentToAddModal() {
  studentToAddId.value = "";
  studentToAddInput.value = "";
  studentsToAddTableBody.innerHTML = "";
}
