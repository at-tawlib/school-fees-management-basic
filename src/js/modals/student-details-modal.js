import { formatDateShortMonth } from "../utils/format-date.js";
import { scrollToTop } from "../utils/scroll-to-top.js";
import { showToast } from "../utils/toast.js";
import { BaseModal } from "./base-modal.js";

/**
 * View Student Details Modal Class
 */
export class ViewStudentModal extends BaseModal {
  constructor() {
    super("viewStudentModal");

    this.elements = {
      closeButton: document.getElementById("viewStudentCloseX"),
      contentContainer: document.getElementById("studentDetailsContent"),
    };

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.elements.closeButton?.addEventListener("click", () => this.hide());
  }

  /**
   * Display student details in the modal
   */
  async displayStudentDetails(student, fetchStudentData) {
    if (!student || !fetchStudentData) return;

    try {
      const response = await fetchStudentData(student.student_id);

      if (!response.success || !response.data || response.data.length === 0) {
        showToast(`Error loading student details: ${response.message}`, "error");
        return;
      }

      this.renderStudentDetails(response.data, student);
      this.show();
      scrollToTop(this.modal, ".modal");
    } catch (error) {
      showToast("An error occurred while loading student details", "error");
      console.error("Error loading student details:", error);
    }
  }

  /**
   * Render student details HTML
   */
  renderStudentDetails(studentData, studentInfo) {
    if (!this.elements.contentContainer) {
      showToast("Student details container not found", "error");
      return;
    }

    try {
      if (studentData.length === 0) {
        this.elements.contentContainer.innerHTML = "<p>No details found for this student.</p>";
      } else {
        this.elements.contentContainer.innerHTML = this.generateStudentDetailsHTML(
          studentData,
          studentInfo
        );
      }
    } catch (error) {
      showToast("Error displaying student details", "error");
      console.error("Error in renderStudentDetails:", error);
    }
  }

  /**
   * Generate HTML for student details
   */
  generateStudentDetailsHTML(studentData, studentInfo) {
    const billsMap = this.groupBillData(studentData);
    const bills = Array.from(billsMap.values());

    return `
      <div class="details-container">
        <!-- Student Information Section -->
        <div style="margin-bottom: 1rem;">
          <h4 class="details-section-title">
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
        <h4 class="details-section-title">
          <i class="fa-solid fa-receipt"></i>
          Billing History
        </h4>

        <div class="details-section">
          ${
            bills.length === 0
              ? '<div class="no-data">No billing records found.</div>'
              : this.generateBillsHTML(bills)
          }
        </div>
      </div>
    `;
  }

  /**
   * Group bill data by bill_id
   */
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

  /**
   * Generate HTML for bills
   */
  generateBillsHTML(bills) {
    // Filter out bills without valid bill_id
    const validBills = bills.filter((bill) => bill.bill_id != null && bill.bill_id !== undefined);

    // If no valid bills, return empty message
    if (validBills.length === 0) {
      return '<div class="no-data">No bills found for this student.</div>';
    }

    return validBills
      .map((bill) => {
        const statusColor = this.getStatusColor(bill.bill_status);

        return `
          <div class="bill-section" style="background-color: ${statusColor}">
            <h4 class="details-section-title">
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
                  : this.generatePaymentsHTML(bill.payments)
              }
            </div>
          </div>
        `;
      })
      .join("");
  }

  /**
   * Generate HTML for payments
   */
  generatePaymentsHTML(payments) {
    return payments
      .map((payment) => {
        return `
        <div class="payment-row">
          <span>${formatDateShortMonth(payment.date_paid)}</span>
          <span>₵${payment.payment_amount.toFixed(2)}</span>
          <span>${payment.payment_mode.toUpperCase()}</span>
        </div>
      `;
      })
      .join("");
  }

  /**
   * Get status color based on bill status
   */
  getStatusColor(status) {
    const statusColors = {
      "fully paid": "#d1fae5",
      "partially paid": "#fef3c7",
      unpaid: "#fee2e2",
      overdue: "#fecaca",
    };
    return statusColors[status.toLowerCase()] || "#f3f4f6";
  }
}
