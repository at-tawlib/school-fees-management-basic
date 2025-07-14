import { fCurrency } from "./utils/format-currency.js";
import { formatDate } from "./utils/format-date.js";
import { getDefaultTermSetting, getDefaultYearSetting } from "./utils/get-settings.js";
import { showToast } from "./utils/toast.js";

// State management
let academicYearSetting;
let termSetting;

// DOM elements
const elements = {
  termYearTitle: document.getElementById("dashboardTermYearTitle"),
  navAcademicYear: document.getElementById("navAcademicYear"),
  navTerm: document.getElementById("navTerm"),
  recentPaymentsTable: document.getElementById("dashboardRecentPaymentsTableBody"),
  classSummaryTable: document.getElementById("dashboardClassSummaryTableBody"),

  // Metrics elements
  totalStudentsMetric: document.getElementById("totalStudentsMetric"),
  totalFeesBilledMetric: document.getElementById("totalFeesBilledMetric"),
  totalFeesCollectedMetric: document.getElementById("totalFeesCollectedMetric"),
  pendingPaymentsMetric: document.getElementById("pendingPaymentsMetric"),
  discountGivenMetrics: document.getElementById("discountGivenMetrics"),

  // Overview elements
  totalStudentsOverview: document.getElementById("totalStudentsOverview"),
  studentsWithClassOverview: document.getElementById("studentsWithClassOverview"),
  studentsWithoutClassOverview: document.getElementById("studentsWithoutClassOverview"),
  totalClassesOverview: document.getElementById("totalClassesOverview"),
  classesWithStudentsOverview: document.getElementById("classesWithStudentsOverview"),
  classesWithoutStudentsOverview: document.getElementById("classesWithoutStudentsOverview"),
  totalFeesBilledOverview: document.getElementById("totalFeesBilledOverview"),
  totalFeesCollectedOverview: document.getElementById("totalFeesCollectedOverview"),
  pendingPaymentsOverview: document.getElementById("pendingPaymentsOverview"),
  studentsBilledUnbilledOverview: document.getElementById("studentsBilledUnbilledOverview"),
  classesBilledUnbilledOverview: document.getElementById("classesBilledUnbilledOverview"),
};

// Constants
const MAX_RECENT_PAYMENTS = 10;

// Initialize dashboard
export async function initDashboard() {
  try {
    await loadSettings();

    if (!academicYearSetting || !termSetting) {
      showToast("Set up the current term and academic year.", "error");
      return;
    }

    updateNavigationHeaders();

    const metricsData = await getMetricsData();
    if (!metricsData) return;

    await Promise.all([
      setUpMetrics(metricsData),
      setUpOverview(metricsData),
      setUpClassSummary(),
      setUpRecentPayments(),
    ]);
  } catch (error) {
    console.error("Error initializing dashboard:", error);
    showToast("Failed to initialize dashboard", "error");
  }
}

// Load settings from API
async function loadSettings() {
  try {
    [academicYearSetting, termSetting] = await Promise.all([
      getDefaultYearSetting(),
      getDefaultTermSetting(),
    ]);
  } catch (error) {
    console.error("Error loading settings:", error);
    throw error;
  }
}

// Update navigation headers
function updateNavigationHeaders() {
  const resultText = `${academicYearSetting.setting_text} Academic year, ${termSetting.setting_text} Term`;
  elements.termYearTitle.textContent = resultText;
  elements.navAcademicYear.textContent = `${academicYearSetting.setting_text} Academic year`;
  elements.navTerm.textContent = `${termSetting.setting_text} Term`;
}

// Calculate financial metrics
function calculateFinancialMetrics(data) {
  const netFeesBilled = data.totalFeesBilled - data.totalDiscountGiven;
  const pendingPayments = data.totalFeesBilled - data.totalAmountPaid - data.totalDiscountGiven;

  return {
    netFeesBilled,
    pendingPayments,
    totalAmountPaid: data.totalAmountPaid,
    totalDiscountGiven: data.totalDiscountGiven,
  };
}

// Set up metrics display
function setUpMetrics(metricsData) {
  const financialMetrics = calculateFinancialMetrics(metricsData);

  elements.totalStudentsMetric.textContent = metricsData.totalStudents;
  elements.totalFeesBilledMetric.textContent = fCurrency(financialMetrics.netFeesBilled);
  elements.totalFeesCollectedMetric.textContent = fCurrency(financialMetrics.totalAmountPaid);
  elements.pendingPaymentsMetric.textContent = fCurrency(financialMetrics.pendingPayments);
  elements.discountGivenMetrics.textContent = fCurrency(financialMetrics.totalDiscountGiven);
}

// Set up overview display
function setUpOverview(metricsData) {
  const financialMetrics = calculateFinancialMetrics(metricsData);

  // Student overview
  elements.totalStudentsOverview.textContent = metricsData.totalStudents;
  elements.studentsWithClassOverview.textContent = metricsData.studentsWithClass;
  elements.studentsWithoutClassOverview.textContent =
    metricsData.totalStudents - metricsData.studentsWithClass;

  // Class overview
  elements.totalClassesOverview.textContent = metricsData.totalClasses;
  elements.classesWithStudentsOverview.textContent = metricsData.yearClasses;
  elements.classesWithoutStudentsOverview.textContent =
    metricsData.totalClasses - metricsData.yearClasses;

  // Fees overview
  elements.totalFeesBilledOverview.textContent = fCurrency(financialMetrics.netFeesBilled);
  elements.totalFeesCollectedOverview.textContent = fCurrency(financialMetrics.totalAmountPaid);
  elements.pendingPaymentsOverview.textContent = fCurrency(financialMetrics.pendingPayments);

  // Billed/Unbilled overview
  const unbilledStudents = metricsData.studentsWithClass - metricsData.totalStudentsBilled;
  const billedClasses = metricsData.totalClasses - metricsData.unbilledClassesCount;

  elements.studentsBilledUnbilledOverview.textContent = `${metricsData.totalStudentsBilled} / ${unbilledStudents}`;
  elements.classesBilledUnbilledOverview.textContent = `${billedClasses} / ${metricsData.unbilledClassesCount}`;
}

// Create class summary table row
function createClassSummaryRow(item) {
  const row = elements.classSummaryTable.insertRow();
  const cells = [
    item.class_name,
    item.students_count,
    item.class_fee === 0 ? "No Fee" : fCurrency(item.class_fee),
    fCurrency(item.total_fees - item.total_discount),
    fCurrency(item.total_discount),
    fCurrency(item.total_paid),
    fCurrency(item.total_fees - item.total_paid - item.total_discount),
  ];

  cells.forEach((content) => {
    row.insertCell().textContent = content;
  });
}

// Set up class summary table
async function setUpClassSummary() {
  try {
    const response = await window.api.getClassSummary({
      academicYearId: academicYearSetting.setting_value,
      termId: termSetting.setting_value,
    });

    if (!response.success) {
      showToast(response.message, "error");
      return;
    }

    if (response.data.length === 0) {
      return;
    }

    elements.classSummaryTable.innerHTML = "";
    response.data.forEach(createClassSummaryRow);
  } catch (error) {
    console.error("Error setting up class summary:", error);
    showToast("Failed to load class summary", "error");
  }
}

// Create recent payments table row
function createRecentPaymentRow(payment) {
  const row = elements.recentPaymentsTable.insertRow();
  const cells = [
    formatDate(payment.date_paid),
    payment.student_name,
    payment.class_name,
    fCurrency(payment.payment_amount),
    payment.payment_mode,
    payment.payment_details,
  ];

  cells.forEach((content) => {
    row.insertCell().textContent = content;
  });
}

// Set up recent payments table
async function setUpRecentPayments() {
  try {
    const response = await window.api.getYearTermPayments({
      academicYearId: academicYearSetting.setting_value,
      termId: termSetting.setting_value,
    });

    if (!response.success) {
      showToast(response.message, "error");
      return;
    }

    let recentPayments = response.data;

    if (recentPayments.length === 0) {
      const row = elements.recentPaymentsTable.insertRow();
      row.insertCell().textContent = "No recent payments";
      return;
    }

    // Limit to recent payments
    if (recentPayments.length > MAX_RECENT_PAYMENTS) {
      recentPayments = recentPayments.slice(0, MAX_RECENT_PAYMENTS);
    }

    elements.recentPaymentsTable.innerHTML = "";
    recentPayments.forEach(createRecentPaymentRow);
  } catch (error) {
    console.error("Error setting up recent payments:", error);
    showToast("Failed to load recent payments", "error");
  }
}

// API call helper with error handling
async function makeApiCall(apiCall, errorMessage) {
  try {
    const response = await apiCall();
    if (!response.success) {
      throw new Error(response.message || errorMessage);
    }
    return response.data;
  } catch (error) {
    console.error(errorMessage, error);
    throw error;
  }
}

// Get all metrics data
async function getMetricsData() {
  const { setting_value: termId } = termSetting;
  const { setting_value: academicYearId } = academicYearSetting;

  try {
    // Fetch all required data in parallel
    const [
      studentCountData,
      totalClassesData,
      yearClassesData,
      billedCountData,
      unbilledClassesData,
      totalAmountPaidData,
      totalDiscountData,
    ] = await Promise.all([
      makeApiCall(() => window.api.getStudentCount(academicYearId), "Failed to get student count"),
      makeApiCall(() => window.api.getTotalClassCount(), "Failed to get total class count"),
      makeApiCall(
        () => window.api.getYearClassCount(academicYearId),
        "Failed to get year class count"
      ),
      makeApiCall(
        () => window.api.getStudentBilledCount({ termId, academicYearId }),
        "Failed to get billed count"
      ),
      makeApiCall(
        () => window.api.getUnbilledClasses({ termId, academicYearId }),
        "Failed to get unbilled classes"
      ),
      makeApiCall(
        () => window.api.getTotalAmountPaid({ termId, academicYearId }),
        "Failed to get total amount paid"
      ),
      makeApiCall(
        () => window.api.getTotalDiscountGiven({ termId, academicYearId }),
        "Failed to get total discount"
      ),
    ]);

    return {
      totalStudents: studentCountData.total_students,
      studentsWithClass: studentCountData.students_with_class,
      totalClasses: totalClassesData.total_classes,
      yearClasses: yearClassesData.total_classes,
      totalFeesBilled: billedCountData.total_amount_billed,
      totalStudentsBilled: billedCountData.total_students_billed,
      totalAmountPaid: totalAmountPaidData.total_amount_paid,
      totalDiscountGiven: totalDiscountData.total_discount,
      unbilledClassesCount: unbilledClassesData.length,
      unbilledClasses: unbilledClassesData,
    };
  } catch (error) {
    showToast("Failed to load dashboard metrics", "error");
    console.error("Error fetching metrics data:", error);
    return null;
  }
}
