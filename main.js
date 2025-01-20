const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const DatabaseHandler = require("./scripts/db/db-handler");

let mainWindow;
let dbHandler;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "School Fees Tracker",
    fullscreen: true,
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

// get all students
ipcMain.handle("get-all-students", async () => {
  try {
    const result = dbHandler.getAllStudents();

    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Add student to class
ipcMain.handle("add-student-to-class", (event, data) => {
  try {
    const result = dbHandler.addStudentToClass(data);

    if (!result.success) {
      throw new Error(result.message);
    }
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

// Get all classes students
ipcMain.handle("get-all-classes-students", () => {
  try {
    const result = dbHandler.getAllClassesStudents();
    if (!result.success) {
      throw new Error(result.error); // Rethrow the error for consistent error propagation
    }
    return result; // Send success response to the UI
  } catch (error) {
    console.error("Main Process Error: ", error);
    return { success: false, error: error.message };
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

// Bill class students
ipcMain.handle("bill-class-students", async (_, dataArray, feesId) => {
  console.log("In main process: ", dataArray, feesId);
  try {
    const result = await dbHandler.billClassStudents(dataArray, feesId);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Get bill by class and academic year
ipcMain.handle("get-bill-by-class-year", async (_, data) => {
  try {
    const result = await dbHandler.getBillByClassYear(data);
    if (!result.success) {
      throw new Error(result.message);
    }
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

// app.whenReady().then(createWindow);
app.whenReady().then(() => {
  try {
    dbHandler = new DatabaseHandler();
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
