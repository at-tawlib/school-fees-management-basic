const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  saveSetting: (key, value, text) => ipcRenderer.invoke("save-setting", key, value, text),
  getAllSettings: () => ipcRenderer.invoke("get-all-settings"),
  getStudentsByYear: (year) => ipcRenderer.invoke("get-students-by-year", year),
  insertStudent: (student) => ipcRenderer.invoke("insert-student", student),
  deleteStudent: (id) => ipcRenderer.invoke("delete-student", id),
  updateStudent: (student) => ipcRenderer.invoke("update-student", student),
  addStudentToClass: (data) => ipcRenderer.invoke("add-student-to-class", data),
  checkClassExists: (data) => ipcRenderer.invoke("check-class-exists", data),
  getStudentsByClass: (data) => ipcRenderer.invoke("get-students-by-class", data),
  addFees: (data) => ipcRenderer.invoke("add-fees", data),
  getAllFees: (data) => ipcRenderer.invoke("get-all-fees", data),
  billStudent: (data) => ipcRenderer.invoke("bill-student", data),
  filterAllClassesStudents: (data) => ipcRenderer.invoke("filter-all-classes-students", data),
  billClassStudents: (data, feesId) => ipcRenderer.invoke("bill-class-students", data, feesId),
  getSingleFee: (data) => ipcRenderer.invoke("get-single-fee", data),
  getBillDetails: (data) => ipcRenderer.invoke("get-bill-details", data),
  makePayment: (data) => ipcRenderer.invoke("make-payment", data),
  updatePayment: (data) => ipcRenderer.invoke("update-payment", data),
  getStudentsBillSummary: (data) => ipcRenderer.invoke("get-students-bill-summary", data),
  getAllPayments: () => ipcRenderer.invoke("get-all-payments"),
  getYearTermPayments: (data) => ipcRenderer.invoke("get-year-term-payments", data),
  getStudentPayments: (data) => ipcRenderer.invoke("get-student-payments", data),
  addClass: (data) => ipcRenderer.invoke("add-class", data),
  getAllClass: () => ipcRenderer.invoke("get-all-classes"),
  addAcademicYear: (data) => ipcRenderer.invoke("add-academic-year", data),
  getAllAcademicYears: () => ipcRenderer.invoke("get-all-academic-years"),
  deleteFee: (data) => ipcRenderer.invoke("delete-fees", data),
  updateFeeAmount: (data) => ipcRenderer.invoke("update-fee-amount", data),
  getDistinctClasses: (data) => ipcRenderer.invoke("get-distinct-classes", data),
  getClassSummary: (data) => ipcRenderer.invoke("get-class-summary", data),
  getStudentCount: (data) => ipcRenderer.invoke("get-student-count", data),
  getStudentBilledCount: (data) => ipcRenderer.invoke("get-student-billed-count", data),
  getTotalAmountPaid: (data) => ipcRenderer.invoke("get-total-amount-paid", data),
  getYearClassCount: (data) => ipcRenderer.invoke("get-year-class-count", data),
  getTotalClassCount: (data) => ipcRenderer.invoke("get-total-class-count", data),
  getUnbilledClasses: (data) => ipcRenderer.invoke("get-unbilled-classes", data),
  checkIfClassBilled: (data) => ipcRenderer.invoke("check-class-billed", data),
  applyDiscount: (data) => ipcRenderer.invoke("apply-discount", data),
  getTotalDiscountGiven: (data) => ipcRenderer.invoke("get-total-discount-given", data),
  deletePayment: (data) => ipcRenderer.invoke("delete-payment", data),
  getSingleBillDetails: (data) => ipcRenderer.invoke("get-single-bill-details", data),
});

contextBridge.exposeInMainWorld("store", {
  // TODO: remove this it is not needed
  getInitialData: async () => {
    return await ipcRenderer.invoke("get-initial-data");
  },
  reloadStore: async () => {
    return await ipcRenderer.invoke("reload-store-data");
  },
  getStoreClasses: async () => {
    return await ipcRenderer.invoke("get-store-classes");
  },
  getStoreAcademicYears: async () => {
    return await ipcRenderer.invoke("get-store-years");
  },
  getStoreTerms: async () => {
    return await ipcRenderer.invoke("get-store-terms");
  },
  getStoreSettings: async () => {
    return await ipcRenderer.invoke("get-store-settings");
  },
  setStoreClasses: async (data) => {
    return await ipcRenderer.invoke("update-store-classes", data);
  },
  // For use in dev to clear the store data
  clearStore: async () => {
    return await ipcRenderer.invoke("clear-store");
  },
});

contextBridge.exposeInMainWorld("app", {
  reloadApp: () => ipcRenderer.send("reload-app"),
});

contextBridge.exposeInMainWorld("dialog", {
  showConfirmationDialog: async (message) => {
    return await ipcRenderer.invoke("show-confirmation-dialog", message);
  },
});
