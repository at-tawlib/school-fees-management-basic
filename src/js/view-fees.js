import { CONTAINERS } from "./constants/constants.js";
import { showToast } from "./utils/toast.js";
import { showHideFeesContainer } from "./utils/show-fees-container.js";

const feesTable = document.getElementById("feesTable");
const feesTableHead = document.getElementById("feesTableHead");
const feesTableBody = document.getElementById("feesTableBody");

document
  .getElementById("viewFeesButton")
  .addEventListener("click", async () => {
    showHideFeesContainer(CONTAINERS.FEES_TABLE);
    const response = await window.api.getAllFees();

    if (!response.success) {
      showToast("Error occurred", "error");
      return;
    }

    feesTableHead.innerHTML = "";
    feesTableBody.innerHTML = "";
    feesTable.innerHTML = "";

    const tableHeadRow = document.createElement("tr");
    tableHeadRow.innerHTML = `
        <th>Number</th>
        <th>Class</th>
        <th>Academic Year</th>
        <th>Term</th>
        <th>Fees</th>
        <th>Actions</th>
    `;
    feesTableHead.appendChild(tableHeadRow);
    feesTable.appendChild(feesTableHead);

    // TODO: add filters and search functionality and option to update amount
    response.data.forEach((record, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${record.class} </td>
        <td>${record.academic_year} </td>
        <td>${record.term} </td>
        <td>${record.amount} </td>
        <td>
          <div style="display: flex; justify-content: center">
           <button id="btnEditDailyStats" class="btn-edit-record" title="Edit record">
            <i class="fa-solid fa-edit"></i>
            Edit
          </button>
          </div>
        </td>
      `;
      feesTableBody.appendChild(row);
    });

    feesTable.appendChild(feesTableBody);
  });
