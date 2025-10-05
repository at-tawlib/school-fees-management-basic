import { getDefaultYearSetting } from "./utils/get-settings.js";
import { printPage } from "./utils/print-page.js";
import { setUpClassSelect } from "./utils/setup-select-inputs.js";
import { showToast } from "./utils/toast.js";

class StudentManager {
  constructor() {
    // Constants
    this.DEFAULT_PAGE_SIZE = 10;
    this.MOBILE_BREAKPOINT = 768;
    this.NO_CLASS_HIGHLIGHT_COLOR = "#ffe6e6";

    // DOM Elements
    this.elements = {
      toggleSidebar: document.getElementById("studentToggleSidebar"),
      addStudentModal: document.getElementById("addStudentModal"),
      viewStudentModal: document.getElementById("viewStudentModal"),
      firstNameInput: document.getElementById("studentFirstNameInput"),
      lastNameInput: document.getElementById("studentLastNameInput"),
      otherNamesInput: document.getElementById("studentOtherNameInput"),
      totalStudentsNumber: document.getElementById("totalStudentsNumber"),
      searchStudentInput: document.getElementById("searchStudentInput"),
      studentsTableBody: document.getElementById("studentsTableBody"),
      studentClassFilter: document.getElementById("studentClassFilter"),
      addStudentBtn: document.getElementById("addStudentBtn"),
      printStudentsBtn: document.getElementById("printStudentsBtn"),
      addStudentCloseX: document.getElementById("addStudentCloseX"),
      cancelStudentModalBtn: document.getElementById("cancelStudentModalBtn"),
      addStudentModalBtn: document.getElementById("addStudentModalBtn"),
      addStudentForm: document.getElementById("addStudentForm"),
      studentsTable: document.getElementById("studentsTable"),
      studentsClassSummaryTableBody: document.getElementById("studentsClassSummaryTableBody"),
      viewStudentCloseX: document.getElementById("viewStudentCloseX"),
      studentDetailsContent: document.getElementById("studentDetailsContent"),
      // Pagination elements
      paginationContainer: document.getElementById("paginationContainer"),
      pageInfo: document.getElementById("pageInfo"),
      pageSizeSelect: document.getElementById("pageSizeSelect"),
      prevPageBtn: document.getElementById("prevPageBtn"),
      nextPageBtn: document.getElementById("nextPageBtn"),
      firstPageBtn: document.getElementById("firstPageBtn"),
      lastPageBtn: document.getElementById("lastPageBtn"),
    };

    // State
    this.editingStudentId = null;
    this.userSession = null;
    this.currentPage = 1;
    this.pageSize = this.DEFAULT_PAGE_SIZE;
    this.totalStudents = 0;
    this.totalPages = 0;
    this.allStudents = [];
    this.filteredStudents = [];

    // Initialize event listeners
    this.initializeEventListeners();
  }

  // ==================== Event Listeners ====================
  initializeEventListeners() {
    this.elements.toggleSidebar?.addEventListener("click", () => this.handleToggleSidebar());
    this.elements.addStudentBtn?.addEventListener("click", () => this.handleAddStudentClick());
    this.elements.printStudentsBtn?.addEventListener("click", () => this.handlePrintStudents());
    this.elements.addStudentCloseX?.addEventListener("click", () => this.handleModalClose());
    this.elements.cancelStudentModalBtn?.addEventListener("click", () => this.handleModalClose());
    this.elements.addStudentModalBtn?.addEventListener("click", () => this.handleStudentSubmit());
    this.elements.searchStudentInput?.addEventListener("input", () => this.handleSearchAndFilter());
    this.elements.studentClassFilter?.addEventListener("change", () =>
      this.handleSearchAndFilter()
    );
    this.elements.viewStudentCloseX?.addEventListener("click", () => this.handleViewModalClose());

    // Pagination event listeners
    this.elements.prevPageBtn?.addEventListener("click", () => this.goToPage(this.currentPage - 1));
    this.elements.nextPageBtn?.addEventListener("click", () => this.goToPage(this.currentPage + 1));
    this.elements.firstPageBtn?.addEventListener("click", () => this.goToPage(1));
    this.elements.lastPageBtn?.addEventListener("click", () => this.goToPage(this.totalPages));
    this.elements.pageSizeSelect?.addEventListener("change", () => this.handlePageSizeChange());

    // Event delegation for table actions
    this.elements.studentsTableBody?.addEventListener("click", (e) => this.handleTableActions(e));
  }

  handleTableActions(e) {
    const button = e.target.closest("button");
    if (!button) return;

    const row = button.closest("tr");
    const studentId = parseInt(row.getAttribute("data-student-id"));
    const student = this.allStudents.find((s) => s.student_id === studentId);

    if (!student) return;

    if (button.classList.contains("btn-view-student")) {
      this.viewStudentDetails(student);
    } else if (button.classList.contains("btn-edit-student")) {
      this.editStudentRecord(student);
    } else if (button.classList.contains("btn-delete-student")) {
      this.deleteStudent(student);
    }
  }

  handleToggleSidebar() {
    const sidebarContent = document.getElementById("studentsSidebar");
    const studentContent = document.getElementById("studentContent");

    if (window.innerWidth <= this.MOBILE_BREAKPOINT) {
      sidebarContent?.classList.toggle("show");
    } else {
      sidebarContent?.classList.toggle("hidden");
    }

    studentContent?.classList.toggle("expanded");
  }

  // ==================== Pagination ====================
  handlePageSizeChange() {
    this.pageSize = parseInt(this.elements.pageSizeSelect.value);
    this.currentPage = 1;
    this.displayCurrentPage();
  }

  goToPage(page) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.displayCurrentPage();
    }
  }

  calculatePagination() {
    this.totalStudents = this.filteredStudents.length;
    this.totalPages = Math.ceil(this.totalStudents / this.pageSize);

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  displayCurrentPage() {
    this.calculatePagination();

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const currentStudents = this.filteredStudents.slice(startIndex, endIndex);

    this.renderStudentRows(currentStudents, startIndex);
    this.updatePaginationControls();
    this.updateStudentCount();
  }

  updatePaginationControls() {
    if (!this.elements.paginationContainer) return;

    const startRecord = this.totalStudents > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
    const endRecord = Math.min(this.currentPage * this.pageSize, this.totalStudents);

    if (this.elements.pageInfo) {
      this.elements.pageInfo.textContent = `Showing ${startRecord}-${endRecord} of ${this.totalStudents} students`;
    }

    if (this.elements.prevPageBtn) this.elements.prevPageBtn.disabled = this.currentPage <= 1;
    if (this.elements.nextPageBtn)
      this.elements.nextPageBtn.disabled = this.currentPage >= this.totalPages;
    if (this.elements.firstPageBtn) this.elements.firstPageBtn.disabled = this.currentPage <= 1;
    if (this.elements.lastPageBtn)
      this.elements.lastPageBtn.disabled = this.currentPage >= this.totalPages;
  }

  // ==================== Search and Filter ====================
  handleSearchAndFilter() {
    const searchValue = this.elements.searchStudentInput.value.toLowerCase().trim();
    const selectedClassText = this.getSelectedClassText();

    // Early return optimization
    if (!searchValue && selectedClassText === "all") {
      this.filteredStudents = [...this.allStudents];
      this.currentPage = 1;
      this.displayCurrentPage();
      return;
    }

    this.filteredStudents = this.allStudents.filter((student) => {
      const className = (student.class_name || "No Class").toLowerCase();
      const classMatch = selectedClassText === "all" || className.includes(selectedClassText);

      if (!searchValue) return classMatch;

      const studentName = `${student.first_name} ${student.last_name} ${
        student.other_names || ""
      }`.toLowerCase();
      return classMatch && studentName.includes(searchValue);
    });

    this.currentPage = 1;
    this.displayCurrentPage();
  }

  getSelectedClassText() {
    const selectedOption =
      this.elements.studentClassFilter.options[this.elements.studentClassFilter.selectedIndex];
    return selectedOption.text.toLowerCase();
  }

  // ==================== Modal Management ====================
  showModal() {
    this.toggleModal(this.elements.addStudentModal, true);
    this.elements.addStudentForm.reset();
  }

  hideModal() {
    this.toggleModal(this.elements.addStudentModal, false);
    this.editingStudentId = null;
  }

  hideViewModal() {
    this.toggleModal(this.elements.viewStudentModal, false);
  }

  toggleModal(modal, show) {
    if (!modal) return;

    if (show) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    } else {
      modal.classList.remove("active");
      document.body.style.overflow = "auto";
    }
  }

  handleAddStudentClick() {
    this.showModal();
  }

  handleModalClose() {
    this.hideModal();
  }

  handleViewModalClose() {
    this.hideViewModal();
  }

  // ==================== Student Operations ====================
  async handleStudentSubmit() {
    const studentData = this.getStudentFormData();

    if (!this.validateStudentData(studentData)) {
      return;
    }

    try {
      const result = this.editingStudentId
        ? await this.updateStudent(studentData)
        : await this.createStudent(studentData);

      if (result.success) {
        showToast(result.message, "success");
        this.hideModal();
        await this.init();
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("An error occurred while saving student", "error");
      console.error("Error saving student:", error);
    }
  }

  getStudentFormData() {
    return {
      firstName: this.elements.firstNameInput.value.trim(),
      lastName: this.elements.lastNameInput.value.trim(),
      otherNames: this.elements.otherNamesInput.value.trim(),
    };
  }

  validateStudentData({ firstName, lastName }) {
    if (!firstName || !lastName) {
      showToast("Please provide the student's first and last name.", "error");
      return false;
    }
    return true;
  }

  async createStudent(studentData) {
    return await window.api.insertStudent(studentData);
  }

  async updateStudent(studentData) {
    return await window.api.updateStudent({
      ...studentData,
      id: this.editingStudentId,
    });
  }

  async viewStudentDetails(student) {
    try {
      const response = await window.api.getCompleteStudentRecord(student.student_id);

      if (!response.success) {
        showToast(`Error loading student details: ${response.message}`, "error");
        return;
      }

      this.displayStudentDetailsModal(response.data, student);
    } catch (error) {
      showToast("An error occurred while loading student details", "error");
      console.error("Error loading student details:", error);
    }
  }

  displayStudentDetailsModal(studentData, studentInfo) {
    if (!this.elements.viewStudentModal || !this.elements.studentDetailsContent) {
      showToast("Student details modal not found", "error");
      return;
    }

    try {
      if (studentData.length === 0) {
        this.elements.studentDetailsContent.innerHTML = "<p>No details found for this student.</p>";
      } else {
        this.elements.studentDetailsContent.innerHTML = this.generateStudentDetailsHTML(
          studentData,
          studentInfo
        );
      }

      this.toggleModal(this.elements.viewStudentModal, true);

      // Reset scroll position to top
      const modalContainer = this.elements.viewStudentModal.querySelector(".modal");
      if (modalContainer) {
        modalContainer.scrollTop = 0;
      }
    } catch (error) {
      showToast("Error displaying student details", "error");
      console.error("Error in displayStudentDetailsModal:", error);
    }
  }

  editStudentRecord(student) {
    this.elements.firstNameInput.value = student.first_name;
    this.elements.lastNameInput.value = student.last_name;
    this.elements.otherNamesInput.value = student.other_names || "";
    this.editingStudentId = student.student_id;

    this.toggleModal(this.elements.addStudentModal, true);
  }

  async deleteStudent(student) {
    if (this.userSession !== "admin") {
      showToast("Only admin can delete student", "error");
      return;
    }

    if (student.class_name) {
      showToast(
        "Student is already assigned to a class. Please remove student from class before deleting.",
        "error"
      );
      return;
    }

    const confirmDelete = await window.dialog.showConfirmationDialog(
      "Are you sure you want to delete this student?"
    );

    if (!confirmDelete) return;

    try {
      const result = await window.api.deleteStudent(student.student_id);
      if (result.success) {
        showToast(result.message, "success");
        await this.init();
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("An error occurred while deleting student", "error");
      console.error("Error deleting student:", error);
    }
  }

  // ==================== HTML Generation ====================
  generateStudentDetailsHTML(studentData, studentInfo) {
    const billsMap = this.groupBillData(studentData);
    const bills = Array.from(billsMap.values());

    return `
      <div class="details-container">
        <!-- Student Information Section -->
        <div class="section">
          <h4 class="section-title">
            <i class="fa-solid fa-user"></i>
            Student Information
          </h4>

          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">STUDENT NAME</span>
              <span class="detail-value">${studentInfo.first_name} ${studentInfo.last_name}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">OTHER NAMES</span>
              <span class="detail-value">${studentInfo.other_names || "-"}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">CURRENT CLASS</span>
              <span class="detail-value">${studentInfo.class_name || "Not Assigned"}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">CURRENT YEAR</span>
              <span class="detail-value">${studentInfo.academic_year || "N/A"}</span>
            </div>
          </div>
        </div>

        <!-- Billing History Section -->
        <h4 class="section-title">
          <i class="fa-solid fa-receipt"></i>
          Billing History
        </h4>

        <div class="details-section">
          ${
            bills.length === 0
              ? '<div class="no-data">No billing records found.</div>'
              : this.generateMinimalBillsHTML(bills)
          }
        </div>
      </div>
 <style>
        .section {
          margin-bottom: 32px;
        }

        .section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #718096;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-icon {
          width: 12px;
          height: 12px;
          opacity: 0.7;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: #718096;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 14px;
          color: #2d3748;
          font-weight: 500;
        }

        .detail-value.highlight {
          color: #667eea;
          font-weight: 600;
        }
      </style>
    `;
  }

  groupBillData(studentData) {
    return studentData.reduce((billsMap, record) => {
      if (!billsMap.has(record.bill_id)) {
        billsMap.set(record.bill_id, {
          bill_id: record.bill_id,
          bill_class: record.bill_class,
          term: record.term,
          bill_year: record.bill_year,
          original_fee: record.original_fee,
          discount_amount: record.discount_amount,
          net_amount: record.net_amount,
          bill_date: record.bill_date,
          bill_total_paid: record.bill_total_paid,
          bill_balance: record.bill_balance,
          bill_status: record.bill_status,
          payments: [],
        });
      }

      if (record.payment_id) {
        billsMap.get(record.bill_id).payments.push({
          payment_id: record.payment_id,
          payment_amount: record.payment_amount,
          payment_mode: record.payment_mode,
          date_paid: record.date_paid,
          payment_details: record.payment_details,
        });
      }

      return billsMap;
    }, new Map());
  }

  generateMinimalBillsHTML(bills) {
    return bills
      .map((bill) => {
        const statusColor = this.getStatusColor(bill.bill_status);

        return `
          <div class="section bill-section" style="background-color: ${statusColor}">
            <h4 class="section-title">
              ${bill.bill_class} - ${bill.term} Term (${bill.bill_year})
              <span class="status-badge" style="background-color: ${statusColor}">
                ${bill.bill_status.toUpperCase()}
              </span>
            </h4>

            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">ORIGINAL FEE</span>
                <span class="detail-value">₵${bill.original_fee.toFixed(2)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">DISCOUNT</span>
                <span class="detail-value">₵${bill.discount_amount.toFixed(2)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">NET AMOUNT</span>
                <span class="detail-value">₵${bill.net_amount.toFixed(2)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">TOTAL PAID</span>
                <span class="detail-value">₵${bill.bill_total_paid.toFixed(2)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">BALANCE</span>
                <span class="detail-value">₵${bill.bill_balance.toFixed(2)}</span>
              </div>
            </div>

            <!-- Payments Subsection -->
            <div>
              <br />
              <h4>
                <i class="fa-solid fa-credit-card"></i>
                Payments
              </h4>
              ${
                bill.payments.length === 0
                  ? '<div class="no-payments">No payments recorded.</div>'
                  : this.generateMinimalPaymentsHTML(bill.payments)
              }
            </div>
          </div>
          <style>
            .bill-section {
              margin-bottom: 30px;
              padding: 20px;
              background-color: #f8f9fa;
              border-radius: 8px;
              border-left: 4px solid #007bff;
            }
          </style>
      `;
      })
      .join("");
  }

  generateMinimalPaymentsHTML(payments) {
    return payments
      .map((payment) => {
        return `
        <div class="payment-row">
          <span>${this.formatDate(payment.date_paid)}</span>
          <span>₵${payment.payment_amount.toFixed(2)}</span>
          <span>${payment.payment_mode.toUpperCase()}</span>
        </div>
        <style>
          .payment-row {
            display: flex;
            flex-direction: row;
            gap: 1rem;
            padding: 0.2rem 0;
          }
        </style>
      `;
      })
      .join("");
  }

  getStatusColor(status) {
    const statusColors = {
      "fully paid": "#d1fae5",
      "partially paid": "#fef3c7",
      unpaid: "#fee2e2",
      overdue: "#fecaca",
    };
    return statusColors[status.toLowerCase()] || "#f3f4f6";
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // ==================== Print Functionality ====================
  async handlePrintStudents() {
    if (!this.elements.studentsTable) {
      showToast("No table found to print", "error");
      return;
    }

    try {
      const academicYearSetting = await getDefaultYearSetting();
      const processedTable = this.prepareTableForPrint(
        this.elements.studentsTable,
        this.filteredStudents
      );
      const heading = this.createPrintHeading(academicYearSetting);

      printPage(heading, processedTable);
    } catch (error) {
      showToast("An error occurred while printing", "error");
      console.error("Error printing:", error);
    }
  }

  prepareTableForPrint(table, studentsToPrint) {
    const tableClone = table.cloneNode(true);
    const tbody = tableClone.querySelector("tbody");

    tbody.innerHTML = "";

    studentsToPrint.forEach((student, index) => {
      const row = document.createElement("tr");
      const className = student?.class_name || "No Class";

      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${student.first_name}</td>
        <td>${student.last_name}</td>
        <td>${student.other_names || "-"}</td>
        <td>${className}</td>
      `;

      tbody.appendChild(row);
    });

    // Remove action column header
    const headerRow = tableClone.querySelector("thead tr");
    if (headerRow.cells[5]) {
      headerRow.removeChild(headerRow.cells[5]);
    }

    // Remove background colors for print
    tableClone.querySelectorAll("tr, td, th").forEach((el) => {
      el.style.backgroundColor = "white";
    });

    return tableClone.outerHTML;
  }

  createPrintHeading(academicYearSetting) {
    const yearText = academicYearSetting?.setting_text || "";
    const totalFiltered = this.filteredStudents.length;
    const totalAll = this.allStudents.length;

    let subtitle = "";
    if (totalFiltered !== totalAll) {
      subtitle = `<p style="text-align: center; margin: 5px 0;">Showing ${totalFiltered} of ${totalAll} students</p>`;
    }

    return `
      <h2 style="text-align: center; margin-bottom: 10px;">Students for ${yearText} Academic Year</h2>
      ${subtitle}
    `;
  }

  // ==================== Display Functions ====================
  async displayStudents(yearId) {
    try {
      const response = await window.api.getStudentsByYear(yearId);

      this.clearStudentDisplay();

      if (!response.success) {
        showToast(`An error occurred: ${response.message}`, "error");
        return;
      }

      if (response.data.length === 0) {
        showToast("No data found", "error");
        return;
      }

      this.allStudents = response.data;
      this.filteredStudents = [...this.allStudents];
      this.currentPage = 1;

      this.displayCurrentPage();
      await this.displayClassStats(response.data);
    } catch (error) {
      showToast("An error occurred while loading students", "error");
      console.error("Error loading students:", error);
    }
  }

  clearStudentDisplay() {
    this.elements.searchStudentInput.value = "";
    this.elements.studentsTableBody.innerHTML = "";
    this.allStudents = [];
    this.filteredStudents = [];
    this.currentPage = 1;
  }

  updateStudentCount() {
    const totalAll = this.allStudents.length;
    this.elements.totalStudentsNumber.textContent = `Total Number Of Students: ${totalAll}`;
  }

  renderStudentRows(students, startIndex = 0) {
    this.elements.studentsTableBody.innerHTML = "";

    students.forEach((student, index) => {
      const row = this.createStudentRow(student, startIndex + index);
      this.elements.studentsTableBody.appendChild(row);
    });
  }

  createStudentRow(student, index) {
    const row = document.createElement("tr");
    const className = student?.class_name || "No Class";

    row.setAttribute("data-student-id", student.student_id);
    row.setAttribute(
      "data-name",
      `${student.first_name} ${student.last_name} ${student.other_names || ""}`
    );
    row.setAttribute("data-class", className);

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${student.first_name}</td>
      <td>${student.last_name}</td>
      <td>${student.other_names || "-"}</td>
      <td>${className}</td>
      <td> 
        <div style="display: flex; justify-content: center">
          <button class="btn-view-student text-button" title="View Student">
            <i class="fa-solid fa-eye color-green"></i>
          </button>
          <button class="btn-edit-student text-button" title="Edit Student">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-delete-student text-button" title="Delete Student" style="color:red">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;

    // Highlight students without class
    if (!student.class_name) {
      row.style.backgroundColor = this.NO_CLASS_HIGHLIGHT_COLOR;
    }

    return row;
  }

  // ==================== Class Statistics ====================
  async displayClassStats(studentData) {
    try {
      this.userSession = await window.app.getSession();
      const classResp = await window.api.getAllClass();

      if (!classResp.success) {
        showToast(classResp.message, "error");
        return;
      }

      const groupedStudents = this.groupStudentsByClass(studentData);
      const arrangedClasses = this.arrangeClassStats(classResp.data, groupedStudents);

      this.renderClassStats(arrangedClasses);
    } catch (error) {
      showToast("An error occurred while loading class statistics", "error");
      console.error("Error loading class stats:", error);
    }
  }

  groupStudentsByClass(students) {
    return students.reduce((acc, student) => {
      const className = student.class_name || "No Class";
      acc[className] = (acc[className] || 0) + 1;
      return acc;
    }, {});
  }

  arrangeClassStats(classData, groupedStudents) {
    const arrangedClasses = classData.map((cls) => ({
      class_name: cls.class_name,
      student_count: groupedStudents[cls.class_name] || 0,
    }));

    arrangedClasses.push({
      class_name: "No Class",
      student_count: groupedStudents["No Class"] || 0,
    });

    return arrangedClasses;
  }

  renderClassStats(classStats) {
    this.elements.studentsClassSummaryTableBody.innerHTML = "";

    classStats.forEach((item) => {
      const row = this.elements.studentsClassSummaryTableBody.insertRow();
      row.insertCell().textContent = item.class_name;
      row.insertCell().textContent = item.student_count;
    });
  }

  // ==================== Initialization ====================
  async init() {
    try {
      const academicYearSetting = await getDefaultYearSetting();

      await this.setupClassFilter();
      await this.displayStudents(academicYearSetting.setting_value);
    } catch (error) {
      showToast("An error occurred while initializing students section", "error");
      console.error("Error initializing students section:", error);
    }
  }

  async setupClassFilter() {
    await setUpClassSelect(this.elements.studentClassFilter, true);

    const noClassOption = document.createElement("option");
    noClassOption.value = "none";
    noClassOption.text = "No Class";
    this.elements.studentClassFilter.appendChild(noClassOption);
  }
}

// Create singleton instance
const studentManager = new StudentManager();

// Export initialization function
export async function initStudentsSection() {
  await studentManager.init();
}
