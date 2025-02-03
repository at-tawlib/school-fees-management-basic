import { CONTAINERS } from "./constants/constants.js";
import { initSettings } from "./settings.js";
import { fCurrency } from "./utils/format-currency.js";
import { formatDate } from "./utils/format-date.js";
import { getDefaultTermSetting, getDefaultYearSetting } from "./utils/get-settings.js";
import { showHideFeesContainer } from "./utils/show-hide-container.js";
import { showToast } from "./utils/toast.js";

let academicYearSetting;
let termSetting;

document.getElementById("dashboardChangeYearTermBtn").addEventListener("click", function () {
  showHideFeesContainer(CONTAINERS.SETTINGS_VIEW);
  sectionHeaderTitle.textContent = "Settings";
  initSettings();
});

export async function initDashboard() {
  academicYearSetting = await getDefaultYearSetting();
  termSetting = await getDefaultTermSetting();

  const resultText = `${academicYearSetting.setting_text} Academic year, ${termSetting.setting_text} Term`;
  document.getElementById("dashboardTermYearTitle").textContent = resultText;

  const metricsData = await getMetricsData();
  await setUpMetrics(metricsData);
  await setUpOverview(metricsData);
  await setUpClassSummary();
  await setUpRecentPayments();
}

function setUpMetrics(metricsData) {
  document.getElementById("totalStudentsMetric").textContent = metricsData.totalStudents;

  document.getElementById("totalFeesBilledMetric").textContent = fCurrency(
    metricsData.totalFeesBilled
  );

  document.getElementById("totalFeesCollectedMetric").textContent = fCurrency(
    metricsData.totalAmountPaid
  );

  document.getElementById("pendingPaymentsMetric").textContent = fCurrency(
    metricsData.totalFeesBilled - metricsData.totalAmountPaid
  );
}

async function setUpOverview(metricsData) {
  // Student overview summary
  document.getElementById("totalStudentsOverview").textContent = metricsData.totalStudents;
  document.getElementById("studentsWithClassOverview").textContent = metricsData.studentsWithClass;
  document.getElementById("studentsWithoutClassOverview").textContent =
    metricsData.totalStudents - metricsData.studentsWithClass;

  // Class overview summary
  document.getElementById("totalClassesOverview").textContent = metricsData.totalClasses;
  document.getElementById("classesWithStudentsOverview").textContent = metricsData.yearClasses;
  document.getElementById("classesWithoutStudentsOverview").textContent =
    metricsData.totalClasses - metricsData.yearClasses;

  // Fees Overview summary
  document.getElementById("totalFeesBilledOverview").textContent = fCurrency(
    metricsData.totalFeesBilled
  );
  document.getElementById("totalFeesCollectedOverview").textContent = fCurrency(
    metricsData.totalAmountPaid
  );
  document.getElementById("pendingPaymentsOverview").textContent = fCurrency(
    metricsData.totalFeesBilled - metricsData.totalAmountPaid
  );

  // Billed students overview summary
  document.getElementById("studentsBilledUnbilledOverview").textContent = `${
    metricsData.totalStudentsBilled
  } / ${metricsData.studentsWithClass - metricsData.totalStudentsBilled}`;
  document.getElementById("classesBilledUnbilledOverview").textContent = `${
    metricsData.totalClasses - metricsData.unbilledClassesCount
  } / ${metricsData.unbilledClassesCount}`;
}

async function setUpClassSummary() {
  const classSummaryResp = await window.api.getClassSummary({
    academicYearId: academicYearSetting.setting_value,
    termId: termSetting.setting_value,
  });

  console.log(classSummaryResp);

  if (!classSummaryResp.success) {
    showToast(classSummaryResp.message, "error");
    return;
  }

  if (classSummaryResp.data.length === 0) {
    return;
  }

  const classSummary = classSummaryResp.data;
  const classSummaryTable = document.getElementById("dashboardClassSummaryTableBody");
  classSummaryTable.innerHTML = "";

  classSummary.forEach((item) => {
    const row = classSummaryTable.insertRow();
    row.insertCell().textContent = item.class_name;
    row.insertCell().textContent = item.students_count;
    row.insertCell().textContent = item.class_fee === 0 ? "No Fee" : fCurrency(item.class_fee);
  });
}

async function setUpRecentPayments() {
  const recentPaymentsResp = await window.api.getYearTermPayments({
    academicYearId: academicYearSetting.setting_value,
    termId: termSetting.setting_value,
  });

  if (!recentPaymentsResp.success) {
    showToast(recentPaymentsResp.message, "error");
    return;
  }

  const recentPayments = recentPaymentsResp.data.splice(0, 10);
  const recentPaymentsTable = document.getElementById("dashboardRecentPaymentsTableBody");
  recentPaymentsTable.innerHTML = "";

  if (recentPaymentsResp.data.length === 0) {
    recentPaymentsTable.insertRow().insertCell().textContent = "No recent payments";
    return;
  }

  recentPayments.forEach((item) => {
    const row = recentPaymentsTable.insertRow();
    row.insertCell().textContent = formatDate(item.date_paid);
    row.insertCell().textContent = item.student_name;
    row.insertCell().textContent = item.class_name;
    row.insertCell().textContent = fCurrency(item.payment_amount);
    row.insertCell().textContent = item.payment_mode;
    row.insertCell().textContent = item.payment_details;
  });
}

async function getMetricsData() {
  const { setting_value: termId } = termSetting;
  const { setting_value: academicYearId } = academicYearSetting;

  try {
    // Fetch student count data
    const studentCountResp = await window.api.getStudentCount(academicYearId);
    if (!studentCountResp.success) {
      throw new Error(studentCountResp.message);
    }
    const { total_students: totalStudents, students_with_class: studentsWithClass } =
      studentCountResp.data;

    // Fetch total class count data
    const totalClassCountResp = await window.api.getTotalClassCount();
    if (!totalClassCountResp.success) {
      throw new Error(totalClassCountResp.message);
    }
    const totalClasses = totalClassCountResp.data.total_classes;

    // Fetch year class count data
    const yearClassCountResp = await window.api.getYearClassCount(academicYearId);
    if (!yearClassCountResp.success) {
      throw new Error(yearClassCountResp.message);
    }
    const yearClasses = yearClassCountResp.data.total_classes;

    // Fetch billed students count data
    const billedCountResp = await window.api.getStudentBilledCount({ termId, academicYearId });
    if (!billedCountResp.success) {
      throw new Error(billedCountResp.message);
    }
    const { total_amount_billed: totalFeesBilled, total_students_billed: totalStudentsBilled } =
      billedCountResp.data;

    // Fetch unbilled classes data
    const unbilledClassesResp = await window.api.getUnbilledClasses({ termId, academicYearId });
    if (!unbilledClassesResp.success) {
      throw new Error(unbilledClassesResp.message);
    }
    const unbilledClasses = unbilledClassesResp.data;

    // Fetch total amount paid data
    const totalAmountPaidResp = await window.api.getTotalAmountPaid({ termId, academicYearId });
    if (!totalAmountPaidResp.success) {
      throw new Error(totalAmountPaidResp.message);
    }
    const { total_amount_paid: totalAmountPaid } = totalAmountPaidResp.data;

    // Return the metrics data
    return {
      totalStudents,
      studentsWithClass,
      totalFeesBilled,
      totalStudentsBilled,
      totalAmountPaid,
      totalClasses,
      yearClasses,
      unbilledClassesCount: unbilledClasses.length,
      unbilledClasses,
    };
  } catch (error) {
    showToast(error.message, "error");
    console.error("Error fetching metrics data:", error);
    return null;
  }
}
