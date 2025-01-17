import { CONTAINERS } from "./constants/constants.js";
import { showToast } from "./utils/toast.js";
import { showHideFeesContainer } from "./utils/show-fees-container.js";

const billClassTableContainer = document.getElementById(
  "billClassTableContainer"
);
const billClassTable = document.getElementById("billClassTable");
const billClassTableBody = document.getElementById("billClassTableBody");
const billClassTitle = document.getElementById("billClassTitle");
const billByClassSelect = document.getElementById("billByClassSelect");
const billAcademicYearInput = document.getElementById("billAcademicYearInput");
const billByTermSelect = document.getElementById("billByTermSelect");

document
  .getElementById("billClassButton")
  .addEventListener("click", async () => {
    showHideFeesContainer(CONTAINERS.BILL_CLASS);
    // const response = await window.api.getAllFees();

    // if (!response.success) {
    //     showToast("Error occurred", "error");
    //     return;
    // }

    // feesTableHead.innerHTML = "";
    // feesTableBody.innerHTML = "";
    // feesTable.innerHTML = "";

    // const tableHeadRow = document.createElement("tr");
    // tableHeadRow.innerHTML = `
    //     <th>Number</th>
    //     <th>Class</th>
    //     <th>Academic Year</th>
    //     <th>Term</th>
    //     <th>Fees</th>
    //     <th>Actions</th>
    // `;
    // feesTableHead.appendChild(tableHeadRow);
    // feesTable.appendChild(feesTableHead);
  });

document
  .getElementById("billClassOkBtn")
  .addEventListener("click", async () => {
    const className = billByClassSelect.value;
    const academicYear = billAcademicYearInput.value;
    const term = billByTermSelect.value;

    const response = await window.api.filterAllClassesStudents({
      className,
      academicYear,
    });

    if (!response.success) {
      showToast(response.message || "An error occurred", "error");
      return;
    }

    billClassTable.style.display = "table";

    console.log(response);

    displayBillStudents(response.data);
  });

document
  .getElementById("billSelectAllStudents")
  .addEventListener("click", () => {
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

document
  .getElementById("billStudentsSubmitButton")
  .addEventListener("click", async () => {
    const selectedIds = Array.from(
      document.querySelectorAll(".student-checkbox:checked")
    ).map((checkbox) => checkbox.value);

    console.log("Selected Student IDs:", selectedIds);
  });

function displayBillStudents(data) {
  const selectedClass = billByClassSelect.value;
  const academicYear = billAcademicYearInput.value;

  billClassTitle.innerHTML = "";
  billClassTitle.innerHTML = `Class ${selectedClass} - ${academicYear}`;

  billClassTableBody.innerHTML = "";
  data.forEach((student, index) => {
    billClassTableBody.innerHTML += `
        <tr>
            <td>${index + 1}</td>
            <td id="studentId" style="display:none">${student.student_id}</td>
            <td>${student.first_name} ${student.other_names} ${
      student.last_name
    }</td>
            <td><input type="checkbox" class="student-checkbox" value=${
              student.student_id
            } /></td>
            <td></td>
        </tr>
        `;
  });
}
