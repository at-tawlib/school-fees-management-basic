import { getDefaultYearSetting } from "./utils/get-settings.js";
import { setUpClassSelect } from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

const addStudentModal = document.getElementById("addStudentModal");
const firstNameInput = document.getElementById("studentFirstNameInput");
const lastNameInput = document.getElementById("studentLastNameInput");
const otherNamesInput = document.getElementById("studentOtherNameInput");
const totalStudentsNumber = document.getElementById("totalStudentsNumber");
const searchStudentInput = document.getElementById("searchStudentInput");
const studentsTableBody = document.getElementById("studentsTableBody");
const studentClassFilter = document.getElementById("studentClassFilter");
let editingStudentId = null;

document.getElementById("addStudentBtn").addEventListener("click", function () {
  addStudentModal.style.display = "block";
  document.getElementById("addStudentForm").reset();
});

document.getElementById("addStudentCloseX").addEventListener("click", function () {
  addStudentModal.style.display = "none";
  editingStudentId = null;
});

document.getElementById("cancelStudentModalBtn").addEventListener("click", function () {
  addStudentModal.style.display = "none";
  editingStudentId = null;
});

document.getElementById("addStudentModalBtn").addEventListener("click", async function () {
  const firstName = document.getElementById("studentFirstNameInput").value;
  const lastName = document.getElementById("studentLastNameInput").value;
  const otherNames = document.getElementById("studentOtherNameInput").value;

  if (!firstName || !lastName) {
    showToast("Please provide the student's first and last name.", "error");
    return;
  }

  if (editingStudentId) {
    // Update student record
    const result = await window.api.updateStudent({
      firstName,
      lastName,
      otherNames,
      id: editingStudentId,
    });

    if (result.success) {
      showToast(result.message, "success");
      editingStudentId = null;
      addStudentModal.style.display = "none";
      initStudentsSection();
      return;
    }

    showToast(result.message, "error");
    return;
  }

  const result = await window.api.insertStudent({
    firstName,
    lastName,
    otherNames,
  });

  if (result.success) {
    showToast(result.message, "success");
    addStudentModal.style.display = "none";
    initStudentsSection();
    return;
  }
  showToast(result.message, "error");
});

searchStudentInput.addEventListener("input", filterStudentsTable);
studentClassFilter.addEventListener("change", filterStudentsTable);

function editStudentRecord(student) {
  addStudentModal.style.display = "block";

  firstNameInput.value = student.first_name;
  lastNameInput.value = student.last_name;
  otherNamesInput.value = student.other_names;
  editingStudentId = student.student_id;
}

export async function initStudentsSection() {
  const academicYearSetting = await getDefaultYearSetting();

  await setUpClassSelect(studentClassFilter, true);
  const noClassOption = document.createElement("option");
  noClassOption.value = "none";
  noClassOption.text = "No Class";
  studentClassFilter.appendChild(noClassOption);

  await displayStudents(academicYearSetting.setting_value);
}

async function displayStudents(yearId) {
  const response = await window.api.getStudentsByYear(yearId);
  document.getElementById("searchStudentInput").value = "";
  studentsTableBody.innerHTML = "";

  if (response.success === false) {
    showToast(`An error occurred ${response.message}`, "error");
    return;
  }

  if (response.data.length === 0) {
    showToast("No data found", "error");
    return;
  }

  totalStudentsNumber.textContent = `Total Number Of Students: ${response.data.length}`;

  response.data.forEach((student, index) => {
    const row = document.createElement("tr");
    row.setAttribute("data-id", student.id);
    row.setAttribute(
      "data-name",
      `${student.first_name} ${student.last_name} ${student.other_names}`
    );
    row.setAttribute("data-class", student?.class_name || "No Class");
    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${student.first_name}</td>
        <td>${student.last_name}</td>
        <td>${student.other_names}</td>
        <td>${student?.class_name ? student.class_name : "No Class"}</td>
        <td> 
          <div style="display: flex; justify-content: center">
            <button id="btnEditStudent" class="text-button" title="Edit Student">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            <button id="btnDeleteStudent" class="text-button" title="Delete Student" style="color:red">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </td>
      `;

    // Add background colour if class_name is null
    if (!student.class_name) row.style.backgroundColor = "#ffe6e6";

    row.querySelector("#btnEditStudent").addEventListener("click", () => {
      editStudentRecord(student);
    });

    row.querySelector("#btnDeleteStudent").addEventListener("click", async () => {
      if (student.class_name) {
        showToast(
          "Student is already assigned to a class. Please remove student from class before deleting.",
          "error"
        );
        return;
      }

      const confirmDelete = confirm("Are you sure you want to delete this student?");
      if (!confirmDelete) return;

      const result = await window.api.deleteStudent(student.student_id);
      console.log(result);
      if (result.success) {
        showToast(result.message, "success");
        initStudentsSection();
        return;
      }
      showToast(result.message, "error");
    });

    studentsTableBody.appendChild(row);
  });

  await displayClassStats(response.data);
}

function filterStudentsTable() {
  const searchValue = searchStudentInput.value.toLowerCase();

  const tableRows = studentsTableBody.querySelectorAll("tr");
  const selectedClassOption = studentClassFilter.options[studentClassFilter.selectedIndex];
  const selectedClassText = selectedClassOption.text.toLowerCase();

  tableRows.forEach((row) => {
    const rowName = row.getAttribute("data-name").toLowerCase();
    const rowClass = row.getAttribute("data-class").toLowerCase();

    const classMatch = selectedClassText === "all" || rowClass.includes(selectedClassText);
    const nameMatch = rowName.includes(searchValue);

    // Show or hide row based on filter match
    if (classMatch && nameMatch) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

async function displayClassStats(data) {
  const classResp = await window.api.getAllClass();
  if (!classResp.success) {
    showToast(classResp.message, "error");
    return;
  }

  const classData = classResp.data;
  const groupedStudents = data.reduce((acc, student) => {
    const className = student.class_name || "No Class";
    if (acc[className]) {
      acc[className]++;
    } else {
      acc[className] = 1;
    }
    return acc;
  }, {});

  // Arrange grouped data to match class order from the database
  const arrangedClasses = classData.map((cls) => ({
    class_name: cls.class_name,
    student_count: groupedStudents[cls.class_name] || 0,
  }));

  // Include "No Class" separately
  arrangedClasses.push({ class_name: "No Class", student_count: groupedStudents["No Class"] || 0 });

  const classStatsTable = document.getElementById("studentsClassSummaryTableBody");
  classStatsTable.innerHTML = "";
  arrangedClasses.forEach((item) => {
    const row = classStatsTable.insertRow();
    row.insertCell().textContent = item.class_name;
    row.insertCell().textContent = item.student_count;
  });
}
