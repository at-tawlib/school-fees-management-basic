const path = require("path");
require("dotenv").config();
const { app } = require("electron");

function getDbPath() {
  const isDev = process.env.NODE_ENV !== "production";

  // For production builds, you should store the database in the app's userData directory
  if (isDev)
    return path.join(__dirname, "../database/schoolFeesTracker.db");
  return path.join(app.getPath("userData"), "schoolFeesTracker.db");
}

module.exports = { getDbPath };
