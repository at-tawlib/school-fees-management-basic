const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const DatabaseHandler = require("./scripts/db/db-handler");

let mainWindow;
let adminWindow;
let dbHandler;

let store; // Declare `store` at the top for global access

// Dynamically load `electron-store`
async function loadStore() {
  const { default: Store } = await import("electron-store");
  store = new Store();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "School Fees Tracker",
    height: 800,
    width: 1200,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "src/html/index.html"));
}

function createAdminWindow() {
  adminWindow = new BrowserWindow({
    title: "School Fees Tracker | Admin",
    height: 600,
    width: 1000,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  adminWindow.loadFile(path.join(__dirname, "src/html/admin.html"));
}
// Get all classes, academic years and terms from the database and save to local storage
async function loadInitialData() {
  try {
    await loadStore();
    const classes = await dbHandler.getAllClasses();
    const academicYears = await dbHandler.getAllAcademicYears();
    const terms = await dbHandler.getAllTerms();
    const settings = await dbHandler.getAllSettings();

    // Save data in electron-store
    store.set("classes", classes.data);
    store.set("academicYears", academicYears.data);
    store.set("terms", terms.data);
    store.set("settings", settings.data);
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }
}

// IPC to clear store
ipcMain.handle("clear-store", () => {
  store.clear();
});

// Reload store data
ipcMain.handle("reload-store-data", async () => {
  await loadInitialData();
});

ipcMain.on("save-payments-column-visibility", (_, data) =>
  store.set("paymentsColumnVisibility", data)
);

ipcMain.handle("get-payments-column-visibility", () => store.get("paymentsColumnVisibility", {}));

// update store classes
ipcMain.handle("update-store-classes", (_, data) => {
  store.delete("classes");
  store.set("classes", data);
});

ipcMain.handle("get-initial-data", (_) => {
  return {
    classes: store.get("classes") || [],
    academicYears: store.get("academicYears") || [],
    terms: store.get("terms") || [],
    settings: store.get("settings") || [],
  };
});

ipcMain.handle("get-store-settings", (_) => {
  return store.get("settings") || [];
});

ipcMain.on("reload-app", () => {
  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach((win) => win.reload());
});

// Open admin page
ipcMain.on("open-admin-page", () => createAdminWindow());

ipcMain.handle("get-store-classes", (_) => {
  return store.get("classes") || [];
});

ipcMain.handle("get-store-years", (_) => {
  return store.get("academicYears") || [];
});

ipcMain.handle("get-store-terms", (_) => {
  return store.get("terms") || [];
});

// Set settings key, value
ipcMain.handle("save-setting", (_, key, value, text) => {
  try {
    const result = dbHandler.saveSetting(key, value, text);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Login user
ipcMain.handle("login", async (_, user) => {
  try {
    const result = await dbHandler.login(user);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Update password
ipcMain.handle("change-password", async (_, data)=> {
  try {
    const result = await dbHandler.updatePassword(data);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
})

// Get user
ipcMain.handle("get-user", async (_, data)=> {
  try {
    const result = await dbHandler.getUser(data);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
})

// Add class
ipcMain.handle("add-class", (event, data) => {
  try {
    const result = dbHandler.addClass(data);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Get all classes
ipcMain.handle("get-all-classes", () => {
  try {
    const result = dbHandler.getAllClasses();
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Get distinct classes
ipcMain.handle("get-distinct-classes", (_, data) => {
  try {
    const result = dbHandler.getDistinctClasses(data);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Add academic year
ipcMain.handle("add-academic-year", (event, data) => {
  try {
    const result = dbHandler.addAcademicYear(data);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Get all academic years
ipcMain.handle("get-all-academic-years", () => {
  try {
    const result = dbHandler.getAllAcademicYears();
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Insert student to the database
ipcMain.handle("insert-student", (event, student) => {
  try {
    const result = dbHandler.insertStudent(student);

    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Delete student
ipcMain.handle("delete-student", (event, studentId) => {
  try {
    const result = dbHandler.deleteStudent(studentId);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Update student
ipcMain.handle("update-student", (event, student) => {
  try {
    const result = dbHandler.updateStudent(student);

    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// get students by year
ipcMain.handle("get-students-by-year", async (_, year) => {
  try {
    const result = dbHandler.getStudentsByYear(year);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Add student to class
// TODO: remove the try-catch block and handle errors in the renderer process
ipcMain.handle("add-student-to-class", (_, data) => {
  try {
    const result = dbHandler.addStudentToClass(data);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Remove student from class
ipcMain.handle("remove-student-from-class", (_, data) => {
  try {
    const result = dbHandler.removeStudentFromClass(data);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Check if class exists
ipcMain.handle("check-class-exists", (event, data) => {
  try {
    const result = dbHandler.checkClassExists(data);
    if (!result.success) {
      throw new Error(result.error); // Rethrow the error for consistent error propagation
    }
    return result; // Send success response to the UI
  } catch (error) {
    console.error("Main Process Error: ", error);
    return { success: false, error: error.message };
  }
});

// Get students in a class
ipcMain.handle("get-students-by-class", async (_, data) => {
  try {
    const result = dbHandler.getStudentsByClass(data);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Filter all classes students
ipcMain.handle("filter-all-classes-students", async (_, filter) => {
  try {
    const result = dbHandler.filterAllClassesStudents(filter);

    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Add fees
ipcMain.handle("add-fees", async (_, data) => {
  try {
    const result = await dbHandler.addFees(data);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Update fee amount
ipcMain.handle("update-fee-amount", async (_, data) => {
  try {
    const result = await dbHandler.updateFeeAmount(data);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Delete fees
ipcMain.handle("delete-fees", async (_, data) => {
  try {
    const result = await dbHandler.deleteFee(data);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Check if class has been billed
ipcMain.handle("check-class-billed", async (_, data) => {
  try {
    const result = await dbHandler.checkIfClassBilled(data);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Bill class students
ipcMain.handle("bill-class-students", async (_, dataArray, feesId) => {
  try {
    const result = await dbHandler.billClassStudents(dataArray, feesId);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Delete bill
ipcMain.handle("delete-bill", async (_, data) => {
  try {
    const result = await dbHandler.deleteBill(data);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Get bill by class and academic year
ipcMain.handle("get-bill-details", async (_, data) => {
  try {
    const result = await dbHandler.getBillDetails(data);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Get single bill details
ipcMain.handle("get-single-bill-details", async (_, data) => {
  try {
    const result = await dbHandler.getSingleBillDetails(data);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// get all student fees
ipcMain.handle("get-all-fees", async () => {
  try {
    const result = dbHandler.getAllFees();

    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// get single fee
ipcMain.handle("get-single-fee", async (_, data) => {
  try {
    const result = dbHandler.getSingleFee(data);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Bill student
ipcMain.handle("bill-student", async (_, data) => {
  try {
    const result = await dbHandler.billStudent(data);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Make payment
ipcMain.handle("make-payment", async (_, data) => {
  try {
    const result = await dbHandler.makePayment(data);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Update payment
ipcMain.handle("update-payment", async (_, data) => {
  try {
    const result = await dbHandler.updatePayment(data);
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Delete payment
ipcMain.handle("delete-payment", async (_, data) => {
  try {
    const result = await dbHandler.deletePayment(data);
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Get students bill summary
ipcMain.handle("get-students-bill-summary", async (_, data) => {
  try {
    const result = await dbHandler.getStudentsBillSummary(data);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Get all payments
ipcMain.handle("get-all-payments", async () => {
  try {
    const result = await dbHandler.getAllPayments();
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Get year term payments
ipcMain.handle("get-year-term-payments", async (_, data) => {
  try {
    const result = await dbHandler.getYearTermPayments(data);
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Get student payments
ipcMain.handle("get-student-payments", async (_, data) => {
  try {
    const result = await dbHandler.getStudentPayments(data);
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Get class summary
ipcMain.handle("get-class-summary", async (_, data) => {
  try {
    const result = await dbHandler.getClassSummary(data);
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Get student count
ipcMain.handle("get-student-count", async (_, data) => {
  try {
    const result = await dbHandler.getStudentCount(data);
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Get student billed count
ipcMain.handle("get-student-billed-count", async (_, data) => {
  try {
    const result = await dbHandler.getStudentBilledCount(data);
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Get total amount paid
ipcMain.handle("get-total-amount-paid", async (_, data) => {
  try {
    const result = await dbHandler.getTotalAmountPaid(data);
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Get class count
ipcMain.handle("get-year-class-count", async (_, data) => {
  try {
    const result = await dbHandler.getYearClassCount(data);
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Get total class count
ipcMain.handle("get-total-class-count", async (_, data) => {
  try {
    const result = await dbHandler.getTotalClassCount(data);
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Get unbilled classes
ipcMain.handle("get-unbilled-classes", async (_, data) => {
  try {
    const result = await dbHandler.getUnbilledClasses(data);
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Apply discount
ipcMain.handle("apply-discount", async (_, data) => {
  try {
    const result = await dbHandler.applyDiscount(data);

    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Get total discount given
ipcMain.handle("get-total-discount-given", async (_, data) => {
  try {
    const result = await dbHandler.getTotalDiscountGiven(data);
    return result;
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
});

// Handle confirmation dialog with custom message
ipcMain.handle("show-confirmation-dialog", async (_, message) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: "question",
    buttons: ["No", "Yes"],
    defaultId: 1,
    title: "Confirmation",
    message: message || "Are you sure you want to proceed?", // Default message
  });

  return result.response === 1; // Returns true if "Yes" is clicked, otherwise false
});

// app.whenReady().then(createWindow);
app.whenReady().then(async () => {
  try {
    dbHandler = new DatabaseHandler();
    await loadInitialData();
    createWindow();
  } catch (error) {
    console.error(error.message);
    dialog.showErrorBox(
      "Database Error",
      `An error occurred while initializing the database:\n\n${error.message}`
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
