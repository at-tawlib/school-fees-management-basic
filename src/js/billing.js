import { showToast } from "./utils/toast.js";
import { clearInputsStyles } from "./utils/clear-input-styles.js";
import { setUpAcademicYearsSelect, setUpClassSelect, setUpTermsSelect } from "./utils/setup-select-inputs.js";

const billClassTableContainer = document.getElementById("billClassTableContainer");
const billClassTableBody = document.getElementById("billClassTableBody");
const billClassTitle = document.getElementById("billClassTitle");
const billByClassSelect = document.getElementById("billByClassSelect");
const billAcademicYearSelect = document.getElementById("billAcademicYearSelect");
const billByTermSelect = document.getElementById("billByTermSelect");
const billDetailsText = document.getElementById("billDetailsText");
const billFeesId = document.getElementById("billFeesId");

document.getElementById("billClassOkBtn").addEventListener("click", async () => {
  const className = billByClassSelect.value;
  const academicYear = billAcademicYearSelect.value;
  const term = billByTermSelect.value;
  billDetailsText.textContent = "";
  billFeesId.textContent = "";

  clearInputsStyles([billByClassSelect, billAcademicYearSelect, billByTermSelect, billDetailsText]);

  if (!className) {
    billByClassSelect.style.backgroundColor = "red";
    billByClassSelect.style.color = "white";
    showToast("Select a class", "error");
    return;
  }

  if (!academicYear) {
    showToast("Select an academic year", "error");
    billAcademicYearSelect.style.backgroundColor = "red";
    billAcademicYearSelect.style.color = "white";
    return;
  }

  if (!term) {
    billByTermSelect.style.backgroundColor = "red";
    billByTermSelect.style.color = "white";
    showToast("Select a term", "error");
    return;
  }

  console.log(className, academicYear, term);

  const response = await window.api.filterAllClassesStudents({
    className,
    academicYear,
  });

  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  if (response.data.length === 0) {
    billClassTableContainer.style.display = "none";
    billDetailsText.textContent = `No students found for Class ${className} for ${academicYear} academic year.`;
    billFeesId.textContent = "";
    showToast("No students found for this class", "error");
    return;
  }

  billClassTableContainer.style.display = "block";
  displayBillStudents(response.data);

  const feesResp = await window.api.getSingleFee({
    class: className,
    term,
    academicYear,
  });

  const feeText = feesResp.data;
  if (feesResp.success === false) {
    billDetailsText.textContent = `No fees found for class ${className}, ${academicYear}(${term} term).`;
    billDetailsText.style.color = "red";
    billFeesId.textContent = "";
    return;
  }

  billDetailsText.textContent = `Billing students for Class ${feeText.class}, ${feeText.academic_year}(${feeText.term} term) - GH.${feeText.amount}.`;
  billDetailsText.style.color = "green";
  billFeesId.textContent = feeText.id;
});

document.getElementById("billSelectAllStudents").addEventListener("click", () => {
  const checkBoxes = document.querySelectorAll(".student-checkbox");
  checkBoxes.forEach((checkbox) => {
    checkbox.checked = true;
  });
});

document.getElementById("billClearSelection").addEventListener("click", () => {
  const checkBoxes = document.querySelectorAll(".student-checkbox");
  checkBoxes.forEach((checkbox) => {
    checkbox.checked = false;
  });
});

document.getElementById("billStudentsSubmitButton").addEventListener("click", async () => {
  const selectedIds = Array.from(document.querySelectorAll(".student-checkbox:checked")).map(
    (checkbox) => checkbox.value
  );

  if (selectedIds.length === 0) {
    showToast("Select students to bill", "error");
    return;
  }

  const resp = await window.api.billClassStudents(selectedIds, billFeesId.textContent);
  if (resp.success === false) {
    showToast(resp.message || "An error occurred", "error");
    return;
  }

  showToast("Students billed successfully", "success");
  billFeesId.textContent = "";
});

function displayBillStudents(data) {
  const selectedClass = billByClassSelect.value;
  const academicYear = billAcademicYearSelect.value;
  const term = billByTermSelect.value;

  billClassTitle.innerHTML = "";
  billClassTitle.innerHTML = `Class ${selectedClass} - ${academicYear} (${term} term)`;

  billClassTableContainer.style.display = "block";
  billClassTableBody.innerHTML = "";
  data.forEach((student, index) => {
    billClassTableBody.innerHTML += `
        <tr>
            <td>${index + 1}</td>
            <td id="studentId" style="display:none">${student.student_id}</td>
            <td>${student.first_name} ${student.other_names} ${student.last_name}</td>
            <td><input type="checkbox" class="student-checkbox" value=${student.student_id} /></td>
            <td></td>
        </tr>
        `;
  });
}

export function setUpBillStudentsSection() {
  billByClassSelect.innerHTML = "";
  billAcademicYearSelect.innerHTML = "";
  billByTermSelect.innerHTML = "";

  setUpClassSelect(billByClassSelect);
  setUpAcademicYearsSelect(billAcademicYearSelect);
  setUpTermsSelect(billByTermSelect);
}