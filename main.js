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
