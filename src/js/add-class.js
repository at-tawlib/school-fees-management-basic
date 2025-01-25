import { setUpAcademicYearsSelect, setUpClassSelect } from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

const addClassTable = document.getElementById("addClassTable");
const addStudentClassForm = document.getElementById("addStudentClassForm");
const addClassFormClass = document.getElementById("addClassFormClass");
const addClassFormYear = document.getElementById("addClassFormYear");
const setClassButton = document.getElementById("setClassButton");
const changeClassButton = document.getElementById("setChangeClassButton");
const sectionHeaderTitle = document.getElementById("sectionHeaderTitle");
const addClassForm = document.getElementById("addClassForm");

let studentsData = [];

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
  setupClassesSection();
});


document.getElementById("clearAddStudentsForm").addEventListener("click", () => {
  addStudentClassForm.innerHTML = "";
  addClassRowToForm(5);
});

document.getElementById("cancelAddStudentsForm").addEventListener("click", () => {
  setupClassesSection();
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

export async function setupClassesSection() {
  sectionHeaderTitle.textContent = "Students Classes";
  addClassForm.style.display = "none";
  const classesResp = await window.api.getDistinctClasses();

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
        fetchAndDisplayStudents(cls.class_name, cls.academic_year);
      });

      classesList.appendChild(option);
    });
  }
}

function resetAddStudentForm() {
  addClassForm.style.display = "block";
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

// Call this function when the page loads
function fetchAndDisplayStudents() {}
