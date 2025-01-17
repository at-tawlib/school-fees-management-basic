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
