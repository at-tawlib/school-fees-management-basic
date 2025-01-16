const fs = require("fs");
const Database = require("better-sqlite3");

// Database file path
const dbPath = require("../file-paths").getDbPath();

//  Required tables for validation
const requiredTables = ["students", "classes"];

class DatabaseHandler {
  constructor() {
    if (!fs.existsSync(dbPath)) {
      throw new Error("Database file not found. Please check the database.");
    }

    // Initialize database connection
    this.db = new Database(dbPath);
    this.validateDatabase();
  }

  // Method to validate the database
  validateDatabase() {
    // **Step 1: Check Database Integrity**
    const integrityCheck = this.db.pragma("integrity_check");
    if (integrityCheck[0].integrity_check !== "ok") {
      throw new Error(
        "Database integrity check failed. The database is corrupted."
      );
    }

    console.log("Database integrity check passed.");

    // **Step 2: Validate Required Tables**
    const existingTables = this.getExistingTables();
    const missingTables = requiredTables.filter(
      (table) => !existingTables.includes(table)
    );

    if (missingTables.length > 0) {
      throw new Error(
        `The following required tables are missing: ${missingTables.join(
          ", "
        )}.`
      );
    }
    console.log("All required tables are present.");
  }

  // Utility method to get existing tables in the database
  getExistingTables() {
    const query = `
          SELECT name 
          FROM sqlite_master 
          WHERE type='table'
        `;
    const rows = this.db.prepare(query).all();
    return rows.map((row) => row.name);
  }

  insertStudent(student) {
    try {
      const stmt = this.db.prepare(`
            INSERT INTO students ( first_name, last_name, other_names, created_at)
            VALUES (?, ?, ?, ? )
          `);
      stmt.run(
        student.firstName,
        student.lastName,
        student.otherNames,
        new Date().toISOString()
      );
      return {
        success: true,
        message: "Student added successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);
      // TODO: log error here
      return { success: false, message: error.message };
    }
  }

  getAllStudents() {
    try {
      const stmt = this.db.prepare(`SELECT * FROM students`);
      const records = stmt.all();
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  updateStudent(student) {
    try {
      const stmt = this.db.prepare(`
            UPDATE students SET first_name = ?, last_name = ?, other_names = ? WHERE id = ?
            `);
      stmt.run(
        student.firstName,
        student.lastName,
        student.otherNames,
        student.id
      );
      return {
        success: true,
        message: "Student updated successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);
      // TODO: log error here
      return { success: false, message: error.message };
    }
  }

  addStudentToClass(data) {
    try {
      // Check if the record already exists
      const checkStmt = this.db.prepare(`
        SELECT 1 FROM classes 
        WHERE student_id = ? AND class_name = ? AND academic_year = ?
      `);
      const exists = checkStmt.get(
        data.studentId,
        data.className,
        data.academicYear
      );

      if (exists) {
        return {
          success: false,
          message:
            "Student is already assigned to this class for the academic year.",
        };
      }

      // If not, insert the new record
      const insertStmt = this.db.prepare(`
        INSERT INTO classes ( student_id, class_name, academic_year, created_at )
        VALUES ( ?, ?, ?, ? )
      `);
      insertStmt.run(
        data.studentId,
        data.className,
        data.academicYear,
        new Date().toISOString()
      );

      return {
        success: true,
        message: "Student added to class.",
      };
    } catch (error) {
      console.error("Database Error: ", error);
      // TODO: log error here
      return { success: false, message: error.message };
    }
  }

  getAllClassesStudents() {
    try {
      const stmt = this.db.prepare(`
          SELECT s.id AS student_id, s.first_name, s.last_name, s.other_names, c.class_name, c.academic_year
          FROM  students s
          JOIN classes c
          ON s.id = c.student_id
        `);
      const records = stmt.all();
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  checkClassExists(filter) {
    try {
      const stmt = this.db.prepare(`
        SELECT EXISTS (
          SELECT 1 
          FROM classes 
          WHERE class_name = ? AND academic_year = ?
        ) AS data_exists;
      `);
      const result = stmt.get(filter.className, filter.academicYear);
      return { success: true, exists: !!result.data_exists };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, error: error.message };
    }
  }

  // Close the database connection
  close() {
    this.db.close();
  }
}

module.exports = DatabaseHandler;
