import { AddStudentModal } from "./modals/add-student-modal.js";
import { ViewStudentModal } from "./modals/student-details-modal.js";
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
      totalStudentsNumber: document.getElementById("totalStudentsNumber"),
      searchStudentInput: document.getElementById("searchStudentInput"),
      studentsTableBody: document.getElementById("studentsTableBody"),
      studentClassFilter: document.getElementById("studentClassFilter"),
      addStudentBtn: document.getElementById("addStudentBtn"),
      printStudentsBtn: document.getElementById("printStudentsBtn"),
      studentsTable: document.getElementById("studentsTable"),
      studentsClassSummaryTableBody: document.getElementById("studentsClassSummaryTableBody"),
      // Pagination elements
      paginationContainer: document.getElementById("paginationContainer"),
      pageInfo: document.getElementById("pageInfo"),
      pageSizeSelect: document.getElementById("pageSizeSelect"),
      prevPageBtn: document.getElementById("prevPageBtn"),
      nextPageBtn: document.getElementById("nextPageBtn"),
      firstPageBtn: document.getElementById("firstPageBtn"),
      lastPageBtn: document.getElementById("lastPageBtn"),
    };

    // Modal instances
    this.addStudentModal = new AddStudentModal();
    this.viewStudentModal = new ViewStudentModal();

    // State
    this.userSession = null;
    this.currentPage = 1;
    this.pageSize = this.DEFAULT_PAGE_SIZE;
    this.totalStudents = 0;
    this.totalPages = 0;
    this.allStudents = [];
    this.filteredStudents = [];

    // Initialize event listeners
    this.initializeEventListeners();
    this.setupModalCallbacks();
  }

  // ==================== Event Listeners ====================
  initializeEventListeners() {
    this.elements.toggleSidebar?.addEventListener("click", () => this.handleToggleSidebar());
    this.elements.addStudentBtn?.addEventListener("click", () => this.handleAddStudentClick());
    this.elements.printStudentsBtn?.addEventListener("click", () => this.handlePrintStudents());
    this.elements.searchStudentInput?.addEventListener("input", () => this.handleSearchAndFilter());
    this.elements.studentClassFilter?.addEventListener("change", () =>
      this.handleSearchAndFilter()
    );

    // Pagination event listeners
    this.elements.prevPageBtn?.addEventListener("click", () => this.goToPage(this.currentPage - 1));
    this.elements.nextPageBtn?.addEventListener("click", () => this.goToPage(this.currentPage + 1));
    this.elements.firstPageBtn?.addEventListener("click", () => this.goToPage(1));
    this.elements.lastPageBtn?.addEventListener("click", () => this.goToPage(this.totalPages));
    this.elements.pageSizeSelect?.addEventListener("change", () => this.handlePageSizeChange());

    // Event delegation for table actions
    this.elements.studentsTableBody?.addEventListener("click", (e) => this.handleTableActions(e));
  }

  /**
   * Setup callbacks for modal interactions
   */
  setupModalCallbacks() {
    // Add/Edit student modal submit callback
    this.addStudentModal.onSubmit(async (formData, editingId) => {
      try {
        const result = editingId
          ? await this.updateStudent(formData, editingId)
          : await this.createStudent(formData);

        if (result.success) {
          showToast(result.message, "success");
          this.addStudentModal.hide();
          await this.init();
        } else {
          showToast(result.message, "error");
        }
      } catch (error) {
        showToast("An error occurred while saving student", "error");
        console.error("Error saving student:", error);
      }
    });
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
  handleAddStudentClick() {
    this.addStudentModal.openForAdd();
  }

  // ==================== Student Operations ====================
  async createStudent(studentData) {
    return await window.api.insertStudent(studentData);
  }

  async updateStudent(studentData, studentId) {
    return await window.api.updateStudent({
      ...studentData,
      id: studentId,
    });
  }

  async viewStudentDetails(student) {
    await this.viewStudentModal.displayStudentDetails(student, (studentId) =>
      window.api.getCompleteStudentRecord(studentId)
    );
  }

  editStudentRecord(student) {
    this.addStudentModal.openForEdit(student);
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
