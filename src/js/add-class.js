import { CONTAINERS } from "./constants/constants.js";
import { showHideFeesContainer } from "./utils/show-fees-container.js";
import { showToast } from "./utils/toast.js";

const addClassTables = document.getElementById("addClassTables");
const addStudentClassForm = document.getElementById("addStudentClassForm");
const addClassFormClass = document.getElementById("addClassFormClass");
const addClassFormYear = document.getElementById("addClassFormYear");
const setClassButton = document.getElementById("setClassButton");
const changeClassButton = document.getElementById("setChangeClassButton");
const studentListTableBody = document.getElementById("studentsListTableBody");

let studentsData = [];

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
    showToast(
      resp.message || "Class already exists for the academic year",
      "error"
    );
    return;
  }

  await setStudentsData();
  displayStudentsList();
  addStudentClassForm.innerHTML = "";
  addClassRowToForm(5);

  setClassButton.style.display = "none";
  changeClassButton.style.display = "block";
  addClassFormClass.disabled = true;
  addClassFormYear.disabled = true;
  addClassTables.style.display = "flex";
});

changeClassButton.addEventListener("click", function () {
  resetAddStudentForm();
});

document
  .getElementById("newClassButton")
  .addEventListener("click", function () {
    showHideFeesContainer(CONTAINERS.CLASS_FORM);
    resetAddStudentForm();
  });

document
  .getElementById("addOneStudentRow")
  .addEventListener("click", () => addClassRowToForm(1));
document
  .getElementById("addTwoStudentRows")
  .addEventListener("click", () => addClassRowToForm(2));
document
  .getElementById("addFiveStudentRows")
  .addEventListener("click", () => addClassRowToForm(5));

document
  .getElementById("addStudentsSaveBtn")
  .addEventListener("click", async function () {
    const records = [];
    const studentClass = addClassFormClass.value;
    const academicYear = addClassFormYear.value;
    const rows = addStudentClassForm.getElementsByTagName("tr");

    for (let row of rows) {
      row.style.background = "transparent";
      const studentId = row.querySelector("input[name=studentId]").value;
      const studentName = row.querySelector("input[name=studentName]").value;

      if (!row || !studentId || !studentName) {
        row.style.background = "red";
        showToast("Please select a student", "error");
        return;
      }

      if (studentId) records.push(studentId);
    }

    for (const record of records) {
      const response = await window.api.addStudentToClass({
        studentId: record,
        className: studentClass,
        academicYear: academicYear,
      });
      if (!response.success) {
        showToast(
          response.message || "An error occurred while saving records",
          "error"
        );
        return;
      }
    }

    showToast("Records saved successfully", "success");
    resetAddStudentForm();
  });

document
  .getElementById("clearAddStudentsForm")
  .addEventListener("click", () => {
    addStudentClassForm.innerHTML = "";
    addClassRowToForm(5);
  });

document
  .getElementById("cancelAddStudentsForm")
  .addEventListener("click", () => {
    resetAddStudentForm();
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
                <button class="btn-delete" type="button" tabindex="-1" title="Remove row">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
            `;

    const deleteButton = row.querySelector("button");
    deleteButton.addEventListener("click", function () {
      removeStudentRow(deleteButton);
    });
    addStudentClassForm.appendChild(row);

    // Add event listener to the input element for auto-suggestions
    const input = row.querySelector("input[name=studentName]");
    const hiddenInput = row.querySelector("input[name=studentId]");
    const suggestionList = row.querySelector(".suggestion-list");
    attachAutoSuggestEventListeners(
      input,
      hiddenInput,
      suggestionList,
      studentsData
    );
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

async function displayStudentsList() {
  const response = await window.api.getAllStudents();
  studentListTableBody.innerHTML = "";

  if (response.success === false) {
    showToast(`An error occurred ${response.message}`, "error");
    return;
  }

  if (response.data.length === 0) {
    showToast("No data found", "error");
    return;
  }

  response.data.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${student.id}</td>
        <td>${student.first_name} ${student.other_names} ${student.last_name}</td>
      `;
    studentListTableBody.appendChild(row);
  });
}

function attachAutoSuggestEventListeners(
  input,
  hiddenInput,
  suggestionList,
  data
) {
  input.addEventListener("input", function () {
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
  });

  // Hide suggestions when clicking outside the input
  document.addEventListener("click", function (event) {
    if (
      !input.contains(event.target) &&
      !suggestionList.contains(event.target)
    ) {
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
  addClassFormClass.disabled = false;
  addClassFormYear.disabled = false;
  clearInput(addClassFormClass);
  clearInput(addClassFormYear);
  setClassButton.style.display = "block";
  changeClassButton.style.display = "none";
  addClassTables.style.display = "none";
  addStudentClassForm.innerHTML = "";
}
