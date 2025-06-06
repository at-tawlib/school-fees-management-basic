import { ACADEMIC_YEAR, TERM } from "./constants/constants.js";
import { getDefaultTermSetting, getDefaultYearSetting } from "./utils/get-settings.js";
import { setUpAcademicYearsSelect, setUpTermsSelect } from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

const changeYearTermContainer = document.getElementById("changeYearTermContainer");
const defaultYearTermTextContainer = document.getElementById("defaultYearTermTextContainer");
const classInput = document.getElementById("newClassInput");
const academicYearInput = document.getElementById("newAcademicYear");

document.getElementById("changeYearTermBtn").addEventListener("click", async function () {
  let academicYearSetting = (await getDefaultYearSetting()) || null;
  let termSetting = (await getDefaultTermSetting()) || null;

  if (!academicYearSetting) {
    const yearResp = await window.api.getAllAcademicYears();
    if (!yearResp.success) {
      showToast(yearResp.message, "error");
      return;
    }

    if (yearResp.data.length === 0) {
      showToast("Add an academic year first.", "error");
      return;
    }
  }

  changeYearTermContainer.style.display = "";
  defaultYearTermTextContainer.style.display = "none";

  setUpAcademicYearsSelect(
    document.getElementById("settingsDefaultAcademicYear"),
    false,
    academicYearSetting?.setting_value || null
  );
  setUpTermsSelect(
    document.getElementById("settingsDefaultTerm"),
    false,
    termSetting?.setting_value || null
  );
});

document.getElementById("currentYearTermCancelBtn").addEventListener("click", function () {
  changeYearTermContainer.style.display = "none";
  defaultYearTermTextContainer.style.display = "";
});

document.getElementById("currentYearTermSaveBtn").addEventListener("click", async function () {
  const year = document.getElementById("settingsDefaultAcademicYear").value;
  const term = document.getElementById("settingsDefaultTerm").value;

  if (!year || !term) {
    showToast("Please select a year and term", "error");
    return;
  }

  const yearText = document.getElementById("settingsDefaultAcademicYear").options[
    document.getElementById("settingsDefaultAcademicYear").selectedIndex
  ].text;

  const yearRes = await window.api.saveSetting(ACADEMIC_YEAR, year, yearText);

  if (!yearRes.success) {
    showToast(yearRes.message, "error");
    return;
  }

  const termText =
    document.getElementById("settingsDefaultTerm").options[
      document.getElementById("settingsDefaultTerm").selectedIndex
    ].text;

  const termRes = await window.api.saveSetting(TERM, term, termText);
  if (!termRes.success) {
    showToast(termRes.message, "error");
    return;
  }

  showToast("Year and term set successfully", "success");
  changeYearTermContainer.style.display = "none";
  defaultYearTermTextContainer.style.display = "";

  const reload = await window.store.reloadStore();
  window.app.reloadApp()
  initSettings();
});

document.getElementById("settingsAddClassBtn").addEventListener("click", async function () {
  classInput.style.background = "";
  const className = classInput.value;

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

  const reload = await window.store.reloadStore();
  initSettings();
});

document.getElementById("settingsAddYearBtn").addEventListener("click", async function () {
  academicYearInput.style.background = "";
  const academicYear = academicYearInput.value;

  if (!academicYear) {
    showToast("Please enter a class name", "error");
    academicYearInput.style.background = "red";
    return;
  }

  const response = await window.api.addAcademicYear(academicYear);
  if (!response.success) {
    showToast(response.message, "error");
    return;
  }

  showToast(response.message, "success");
  academicYearInput.value = "";
  academicYearInput.style.background = "";

  const reload = await window.store.reloadStore();
  initSettings();
});

export function initSettings() {
  clearFields();
  displayClassSettingsTable();
  displayAcademicYearSettingsTable();
  setUpDefaultValues();
}

async function setUpDefaultValues() {
  const academicYearSetting = await getDefaultYearSetting();
  const termSetting = await getDefaultTermSetting();

  if (!academicYearSetting || !termSetting) {
    return;
  }

  const resultText = `${academicYearSetting.setting_text} Academic year, ${termSetting.setting_text} Term`;
  document.getElementById("defaultYearTermText").textContent = resultText;
}

async function displayClassSettingsTable() {
  const response = await window.api.getAllClass();

  if (!response.success) {
    showToast(response.message, "error");
    return;
  }

  const tableBody = document.getElementById("settingsClassTableBody");
  tableBody.innerHTML = "";

  response.data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${item.id}</td>
        <td>${item.class_name}</td>
        <td>
          <div>
            <button class="text-button">
              <i class="fa-solid fa-edit"></i> Edit Class
            </button>
            <button class="text-button" style="color: red">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </td>
    `;
    tableBody.appendChild(row);
  });
}

async function displayAcademicYearSettingsTable() {
  const response = await window.api.getAllAcademicYears();

  if (!response.success) {
    showToast(response.message, "error");
    return;
  }

  const tableBody = document.getElementById("settingsYearTableBody");
  tableBody.innerHTML = "";

  response.data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
          <td>${item.id}</td>
          <td>${item.year}</td>
          <td>
          <div>
              <button class="text-button">
                <i class="fa-solid fa-edit"></i> Edit Class
              </button>
              <button class="text-button" style="color: red">
                <i class="fa-solid fa-trash"></i> Delete
              </button>
            </div>
          </td>
        `;
    tableBody.appendChild(row);
  });
}

async function clearFields() {
  classInput.style.background = "";
  classInput.value = "";
  academicYearInput.style.background = "";
  academicYearInput.value = "";
  changeYearTermContainer.style.display = "none";
  defaultYearTermTextContainer.style.display = "";
}
