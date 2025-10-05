import { showToast } from "../utils/toast.js";
import { BaseModal } from "./base-modal.js";

/**
 * Add/Edit Student Modal Class
 * Handles both adding new students and editing existing ones
 */
export class AddStudentModal extends BaseModal {
  constructor() {
    super("addStudentModal");

    this.elements = {
      form: document.getElementById("addStudentForm"),
      firstNameInput: document.getElementById("studentFirstNameInput"),
      lastNameInput: document.getElementById("studentLastNameInput"),
      otherNamesInput: document.getElementById("studentOtherNameInput"),
      closeButton: document.getElementById("addStudentCloseX"),
      cancelButton: document.getElementById("cancelStudentModalBtn"),
      submitButton: document.getElementById("addStudentModalBtn"),
      modalTitle: document.getElementById("addStudentModalTitle"), // Optional: for changing title
    };

    this.editingStudentId = null;
    this.onSubmitCallback = null;

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.elements.closeButton?.addEventListener("click", () => this.hide());
    this.elements.cancelButton?.addEventListener("click", () => this.hide());
    this.elements.submitButton?.addEventListener("click", () => this.handleSubmit());
  }

  show() {
    super.show();
  }

  hide() {
    super.hide();
    this.editingStudentId = null;
    this.elements.form?.reset();
  }

  /**
   * Open modal for adding a new student
   */
  openForAdd() {
    this.editingStudentId = null;
    this.elements.form?.reset();

    // Update modal title if element exists
    if (this.elements.modalTitle) {
      this.elements.modalTitle.textContent = "Add New Student";
    }

    // Update button text if needed
    if (this.elements.submitButton) {
      this.elements.submitButton.textContent = "Add Student";
    }

    this.show();
  }

  /**
   * Open modal for editing an existing student
   */
  openForEdit(student) {
    if (!student) return;

    this.editingStudentId = student.student_id;

    // Populate form with student data
    this.elements.firstNameInput.value = student.first_name || "";
    this.elements.lastNameInput.value = student.last_name || "";
    this.elements.otherNamesInput.value = student.other_names || "";

    // Update modal title if element exists
    if (this.elements.modalTitle) {
      this.elements.modalTitle.textContent = "Edit Student";
    }

    // Update button text if needed
    if (this.elements.submitButton) {
      this.elements.submitButton.textContent = "Update Student";
    }

    this.show();
  }

  /**
   * Get form data
   */
  getFormData() {
    return {
      firstName: this.elements.firstNameInput?.value.trim() || "",
      lastName: this.elements.lastNameInput?.value.trim() || "",
      otherNames: this.elements.otherNamesInput?.value.trim() || "",
    };
  }

  /**
   * Validate form data
   */
  validateFormData({ firstName, lastName }) {
    if (!firstName || !lastName) {
      showToast("Please provide the student's first and last name.", "error");
      return false;
    }
    return true;
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    const formData = this.getFormData();

    if (!this.validateFormData(formData)) {
      return;
    }

    if (this.onSubmitCallback) {
      try {
        await this.onSubmitCallback(formData, this.editingStudentId);
      } catch (error) {
        showToast("An error occurred while saving student", "error");
        console.error("Error in modal submit:", error);
      }
    }
  }

  /**
   * Set callback for form submission
   */
  onSubmit(callback) {
    this.onSubmitCallback = callback;
  }

  /**
   * Check if currently editing
   */
  isEditing() {
    return this.editingStudentId !== null;
  }
}
