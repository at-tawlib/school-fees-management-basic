import { showToast } from "../utils/toast.js";
import { BaseModal } from "./base-modal.js";

/**
 * Add/Edit Student Modal Class
 * Handles both adding new students and editing existing ones
 */
export class BackupModal extends BaseModal {
  constructor() {
    super("backupModal");

    this.elements = {
      closeButton: document.getElementById("backupCloseX"),
      cancelButton: document.getElementById("cancelBackupModalBtn"),
      backupBtn: document.getElementById("backupDataBtn"),
      progressBar: document.getElementById("progress-bar"),
      statusMessage: document.getElementById("status-message"),
    };

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.elements.closeButton?.addEventListener("click", () => this.hide());
    this.elements.cancelButton?.addEventListener("click", () => this.hide());
    // this.elements.backupBtn?.addEventListener("click", async () => await this.backupData());
    if (this.elements.backupBtn) {
      this.elements.backupBtn.addEventListener("click", async () => {
        console.log("Button clicked!"); // Add this to confirm click is firing
        await this.backupData();
      });
    } else {
      console.error("Backup button not found!");
    }
  }

  show() {
    super.show();
  }

  hide() {
    super.hide();
  }

  async backupData() {
    try {
      // Check internet connectivity first
      if (!navigator.onLine) {
        console.log("no internet");
        showToast("No internet connection. Please check your network and try again.", "error");
        this.elements.statusMessage.textContent = "Backup failed: No internet connection";
        this.elements.statusMessage.className = "status-error";
        return;
      }

      console.log("forget there is network");

      // Disable button during backup
      this.elements.backupBtn.disabled = true;
      this.elements.backupBtn.textContent = "Backing up...";
      this.elements.statusMessage.textContent = "Starting backup...";
      this.elements.statusMessage.className = "status-info";

      // Show progress bar
      this.elements.progressBar.style.display = "block";
      this.elements.progressBar.value = 0;

      // Perform backup with progress tracking
      const result = await window.backup.start((percentage) => {
        this.elements.progressBar.value = percentage;
        this.elements.statusMessage.textContent = `Uploading... ${percentage}%`;
      });

      if (!result.success) throw new Error(result.error);

      // Success
      this.elements.progressBar.style.display = "none";
      this.elements.statusMessage.textContent = `Backup successful! File: ${result.fileName}`;
      this.elements.statusMessage.className = "status-success";

      showToast("Backup completed successfully!", "success");
    } catch (error) {
      // Error
      this.elements.progressBar.style.display = "none";
      this.elements.statusMessage.textContent = `Backup failed: ${error.message}`;
      this.elements.statusMessage.className = "status-error";

      showToast(`Backup failed: ${error.message}`, "error");
    } finally {
      // Re-enable button
      this.elements.backupBtn.disabled = false;
      this.elements.backupBtn.textContent = "Backup Now";
    }
  }
}
