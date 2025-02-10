const path = require("path");
const fs = require("fs");
const { app } = require("electron");

let cachedDbPath = null;

function getDbPath() {
  const dbFileName = "schoolFeesTracker.db";
  if (cachedDbPath) return cachedDbPath;

  if (app.isPackaged) {
    // Paths for production
    const sourceDbPath = path.join(process.resourcesPath, dbFileName);
    cachedDbPath = path.join(app.getPath("userData"), dbFileName);

    // Copy the database file only if it doesn't already exist in the target directory
    if (!fs.existsSync(cachedDbPath)) {
      try {
        fs.copyFileSync(sourceDbPath, cachedDbPath);
        console.log("Database copied to:", cachedDbPath);
      } catch (err) {
        console.error("Failed to copy database:", err);
        throw err; // Rethrow the error to handle it in the calling code
      }
    }
  } else {
    // Paths for development
    cachedDbPath = path.join(__dirname, "../database", dbFileName);
  }

  return cachedDbPath;
}

module.exports = { getDbPath };
