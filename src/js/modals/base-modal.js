/**
 * Base Modal Class - handles common modal functionality
 */
export class BaseModal {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    if (!this.modal) {
      console.warn(`Modal with id "${modalId}" not found`);
    }
  }

  show() {
    if (!this.modal) return;
    this.modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  hide() {
    if (!this.modal) return;
    this.modal.classList.remove("active");
    document.body.style.overflow = "auto";
  }

  isVisible() {
    return this.modal?.classList.contains("active") || false;
  }
}
