const studentClassTableBody = document.getElementById("studentClassTableBody");

function addStudentRow(rowCount) {
  // Create and insert an editable row
  const row = document.createElement("tr");
  row.innerHTML = `
          <td></td>
          <td><input type="number" id="bloodGroup"></td>
          <td><input type="number" id="crossmatch"></td>
          <td><input type="number" id="issued"></td>
          <td><input type="number" id="returned"></td>
          <td>
            <button class="btn-delete" type="button" tabindex="-1" title="Remove row" onclick="removeDailyStatsFormRow(this)">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
       `;
  studentClassTableBody.appendChild(row);
}
