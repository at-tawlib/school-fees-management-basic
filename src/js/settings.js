import { showToast } from "./utils/toast.js";

const classInput = document.getElementById("settingsClass");
const academicYearInput = document.getElementById("settingsAcademicYear");

document.getElementById("settingsAddClass").addEventListener("click", async function () {
  const className = classInput.value;
  classInput.style.background = "";

  if (!className) {
    showToast("Please enter a class name", "error");
    classInput.style.background = "red";
    return;
  }

  const response = await window.api.addClass(className);
  if (!response.success) {
    showToast(response.message, "error");
    return;
  }

  showToast("Class added successfully", "success");
  classInput.value = "";
  classInput.style.background = "";
});

document.getElementById("settingsAddYears").addEventListener("click", async function () {
  const academicYear = academicYearInput.value;
  academicYearInput.style.background = "";

  if (!academicYear) {
    showToast("Please enter an academic year", "error");
    academicYearInput.style.background = "red";
    return;
  }

  const response = await window.api.addAcademicYear(academicYear);
  if (!response.success) {
    showToast(response.message, "error");
    return;
  }

  showToast("Academic year added successfully", "success");
  academicYearInput.value = "";
  academicYearInput.style.background = "";
});

export async function displayClassSettingsTable() {
  const response = await window.api.getAllClass();
  if (!response.success) {
    showToast(response.message, "error");
    return;
  }

  console.log(response);

  const tableBody = document.getElementById("settingsClassTableBody");
  tableBody.innerHTML = "";

  response.data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${item.id}</td>
        <td>${item.class_name}</td>
        <td><button class="btn btn-danger">Delete</button></td>
    `;
    tableBody.appendChild(row);
  });
}

export async function displayAcademicYearSettingsTable() {
  const response = await window.api.getAllAcademicYears();

  console.log(response);
  if (!response.success) {
    showToast(response.message, "error");
    return;
  }

  const tableBody = document.getElementById("settingsAcademicYearsTableBody");
  tableBody.innerHTML = "";

  response.data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.year}</td>
            <td>${item.is_active}</td>
            <td><button class="btn btn-danger">Delete</button></td>
        `;
    tableBody.appendChild(row);
  });
}
