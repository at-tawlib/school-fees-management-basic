// backupManager.js - Use this in your Electron app
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const dbPath = require("./file-paths").getDbPath();
const BACKUP_URL = "https://school-system-backup-server.onrender.com";

class BackupManager {
  constructor() {
    this.dbPath = dbPath;
    this.backupServerUrl = BACKUP_URL;
  }

  /**
   * Upload database to backup server
   * @param {Function} onProgress - Callback for progress updates (percentage)
   * @returns {Promise} Resolves with backup details
   */
  async backup(onProgress = null) {
    return new Promise((resolve, reject) => {
      // Check if database file exists
      if (!fs.existsSync(this.dbPath)) {
        console.error("Database file not found:", this.dbPath);
        return reject(new Error("Database file not found"));
      }

      // Read the database file
      const dbData = fs.readFileSync(this.dbPath);
      const fileName = path.basename(this.dbPath);

      // Create multipart form data
      const boundary = "----WebKitFormBoundary" + Math.random().toString(36);
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const headers = [
        `Content-Disposition: form-data; name="database"; filename="${fileName}"`,
        "Content-Type: application/x-sqlite3",
      ];

      const multipartBody = Buffer.concat([
        Buffer.from(delimiter + headers.join("\r\n") + "\r\n\r\n"),
        dbData,
        Buffer.from(closeDelimiter),
      ]);

      // Parse URL
      const url = new URL(this.backupServerUrl + "/backup");
      const protocol = url.protocol === "https:" ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": multipartBody.length,
        },
      };

      const req = protocol.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          try {
            const result = JSON.parse(responseData);

            if (res.statusCode === 200) {
              resolve(result);
            } else {
              reject(new Error(result.error || "Backup failed"));
            }
          } catch (err) {
            reject(new Error("Invalid response from server"));
          }
        });
      });

      req.on("error", (err) => {
        reject(new Error(`Network error: ${err.message}`));
      });

      // Track upload progress
      let uploaded = 0;
      const totalSize = multipartBody.length;

      req.on("drain", () => {
        uploaded = req.writableLength || 0;
        if (onProgress) {
          const percentage = Math.round((uploaded / totalSize) * 100);
          onProgress(percentage);
        }
      });

      // Send the request
      req.write(multipartBody);
      req.end();

      // Simulate progress since Node.js doesn't provide exact upload progress
      if (onProgress) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progress >= 90) {
            clearInterval(interval);
          } else {
            onProgress(progress);
          }
        }, 200);

        req.on("finish", () => {
          clearInterval(interval);
          onProgress(100);
        });
      }
    });
  }
}

module.exports = BackupManager;
