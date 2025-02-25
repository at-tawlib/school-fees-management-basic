const fs = require("fs");
const Database = require("better-sqlite3");

// Database file path
const dbPath = require("../file-paths").getDbPath();

//  Required tables for validation
const requiredTables = [
  "academicYears",
  "bills",
  "classes",
  "fees",
  "settings",
  "students",
  "studentClasses",
  "terms",
];

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
      throw new Error("Database integrity check failed. The database is corrupted.");
    }

    console.log("Database integrity check passed.");

    // **Step 2: Validate Required Tables**
    const existingTables = this.getExistingTables();
    const missingTables = requiredTables.filter((table) => !existingTables.includes(table));

    if (missingTables.length > 0) {
      throw new Error(`The following required tables are missing: ${missingTables.join(", ")}.`);
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

  saveSetting(key, value, text) {
    try {
      const existingSetting = this.db
        .prepare("SELECT COUNT(*) as count FROM settings WHERE setting_key = ?")
        .get(key);

      if (existingSetting.count > 0) {
        // Update if setting exists
        const updateStmt = this.db.prepare(
          "UPDATE settings SET setting_value = ?, setting_text = ? WHERE setting_key = ?"
        );
        updateStmt.run(value, text, key);
      } else {
        // Insert if setting doesn't exist
        const insertStmt = this.db.prepare(
          "INSERT INTO settings (setting_key, setting_value, setting_text) VALUES (?, ?, ?)"
        );
        insertStmt.run(key, value, text);
      }

      return { success: true, message: "Setting saved successfully." };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getAllSettings() {
    try {
      const stmt = this.db.prepare("SELECT * FROM settings");
      const records = stmt.all();
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  addClass(className) {
    try {
      const stmt = this.db.prepare(`
            INSERT INTO classes ( class_name, created_at) VALUES (?, ?);
        `);
      stmt.run(className, new Date().toISOString());
      return {
        success: true,
        message: "Class added successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getAllClasses() {
    try {
      const stmt = this.db.prepare(`SELECT * FROM classes`);
      const records = stmt.all();
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  addAcademicYear(academicYear) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO academicYears (year, created_at) VALUES (?, ?);
      `);
      stmt.run(academicYear, new Date().toISOString());
      return {
        success: true,
        message: "Academic year added successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getAllAcademicYears() {
    try {
      const stmt = this.db.prepare(`SELECT * FROM academicYears`);
      const records = stmt.all();
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getAllTerms() {
    try {
      const stmt = this.db.prepare(`SELECT * FROM terms`);
      const records = stmt.all();
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  insertStudent(student) {
    try {
      const stmt = this.db.prepare(`
            INSERT INTO students ( first_name, last_name, other_names, created_at)
            VALUES (?, ?, ?, ? )
          `);
      stmt.run(student.firstName, student.lastName, student.otherNames, new Date().toISOString());
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

  deleteStudent(studentId) {
    try {
      const stmt = this.db.prepare(`
          DELETE FROM students WHERE id = ?
      `);
      const result = stmt.run(studentId);

      if (result.changes === 0) {
        return {
          success: false,
          message: "No student found with the given ID.",
        };
      }

      return {
        success: true,
        message: "Student deleted successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);

      // Handle common SQLite errors
      if (error.message.includes("FOREIGN KEY constraint failed")) {
        return {
          success: false,
          message: "Cannot delete student. This student is linked to other records.",
        };
      } else if (error.message.includes("database is locked")) {
        return {
          success: false,
          message: "Database is currently in use. Please try again later.",
        };
      } else if (error.message.includes("SQLITE_CORRUPT")) {
        return {
          success: false,
          message: "Database file is corrupted. Please restore from backup.",
        };
      }

      return { success: false, message: "An unexpected error occurred." };
    }
  }

  getStudentsByYear(yearId) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          s.id AS student_id, s.first_name, s.last_name, s.other_names,
          c.class_name, ay.year AS academic_year
        FROM students s
        LEFT JOIN studentClasses sc ON s.id = sc.student_id AND sc.year_id = ?
        LEFT JOIN classes c ON sc.class_id = c.id
        LEFT JOIN academicYears ay ON sc.year_id = ay.id;
        `);
      const records = stmt.all(yearId);
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
      stmt.run(student.firstName, student.lastName, student.otherNames, student.id);
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
      const existingStudents = [];
      const db = this.db;

      // Start a transaction explicitly
      db.exec("BEGIN TRANSACTION");

      try {
        // Check each student and insert if not already assigned
        for (const studentId of data.studentIds) {
          const checkStmt = db.prepare(`
            SELECT 1 FROM studentClasses 
            WHERE student_id = ? AND year_id = ?
          `);
          const exists = checkStmt.get(studentId, data.academicYear);

          if (exists) {
            existingStudents.push(studentId); // Track existing students
          } else {
            const insertStmt = db.prepare(`
              INSERT INTO studentClasses (student_id, class_id, year_id, created_at)
              VALUES (?, ?, ?, ?)
            `);
            insertStmt.run(studentId, data.className, data.academicYear, new Date().toISOString());
          }
        }

        // If any students are already assigned, ROLLBACK and return
        if (existingStudents.length > 0) {
          db.exec("ROLLBACK");
          return {
            success: false,
            message: "Some students are already assigned to the class.",
            data: existingStudents,
          };
        }

        // If all students are new, COMMIT the transaction
        db.exec("COMMIT");
        return { success: true, message: "All students added to class." };
      } catch (error) {
        db.exec("ROLLBACK"); // Rollback on any error
        throw error; // Re-throw to handle in outer catch
      }
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  removeStudentFromClass(data) {
    try {
      const stmt = this.db.prepare(`
          DELETE FROM studentClasses WHERE student_id = ? AND year_id = ? AND class_id = ?
        `);
      const result = stmt.run(data.studentId, data.academicYearId, data.classId);
      if (result.changes === 0) {
        return {
          success: false,
          message: "No student found with the given ID.",
        };
      }

      return {
        success: true,
        message: "Student removed from class successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);
      // Handle common SQLite errors
      if (error.message.includes("FOREIGN KEY constraint failed")) {
        return {
          success: false,
          message: "Cannot delete student. This student is linked to other records.",
        };
      } else if (error.message.includes("database is locked")) {
        return {
          success: false,
          message: "Database is currently in use. Please try again later.",
        };
      } else if (error.message.includes("SQLITE_CORRUPT")) {
        return {
          success: false,
          message: "Database file is corrupted. Please restore from backup.",
        };
      }

      return { success: false, message: error.message };
    }
  }

  getStudentsByClass(filter) {
    try {
      const stmt = this.db.prepare(`
        SELECT s.id AS student_id, 
          s.first_name || ' ' || COALESCE(s.other_names, '') || ' ' || s.last_name  AS student_name,
          c.class_id, cl.class_name, c.year_id, ay.year 
        FROM students s
        JOIN studentClasses c ON s.id = c.student_id
        JOIN classes cl ON c.class_id = cl.id
        JOIN academicYears ay ON c.year_id = ay.id
        WHERE c.year_id = ? AND c.class_id = ?;
        `);
      const records = stmt.all(filter.academicYearId, filter.classId);
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getDistinctClasses(year) {
    try {
      const stmt = this.db.prepare(`
          SELECT DISTINCT c.id AS class_id,  c.class_name,  ay.id AS academic_year_id,  ay.year AS academic_year
          FROM studentClasses sc
          JOIN classes c ON sc.class_id = c.id
          JOIN academicYears ay ON sc.year_id = ay.id
          WHERE ay.id = ?;
      `);
      const records = stmt.all(year);
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  filterAllClassesStudents(filter) {
    try {
      const stmt = this.db.prepare(`
          SELECT s.id AS student_id, s.first_name, s.last_name, s.other_names, c.class_name, c.academic_year
          FROM  students s
          JOIN studentClasses c
          ON s.id = c.student_id
          WHERE c.class_name = ? AND c.academic_year = ?;
        `);
      const records = stmt.all(filter.className, filter.academicYear);
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
          FROM studentClasses 
          WHERE class_id = ? AND year_id = ?
        ) AS data_exists;
      `);
      const result = stmt.get(filter.classId, filter.academicYearId);
      return { success: true, exists: !!result.data_exists };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, error: error.message };
    }
  }

  getAllFees() {
    try {
      const stmt = this.db.prepare(`
          SELECT f.id, c.class_name, c.id AS class_id,  ay.year AS academic_year, ay.id AS year_id, t.id AS term_id, t.term, f.amount,
            COUNT(b.student_id) AS total_students_billed
          FROM fees f
          LEFT JOIN bills b ON f.id = b.fees_id
          JOIN classes c ON f.class_id = c.id
          JOIN academicYears ay ON f.year_id = ay.id
          JOIN terms t ON f.term_id = t.id
          GROUP BY f.id, c.class_name, ay.year, t.term, f.amount;
      `);
      const records = stmt.all();
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getSingleFee(fee) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM fees
        WHERE class_id = ? AND term_id = ? AND year_id = ?
        LIMIT 1
      `);

      const result = stmt.get(fee.classId, fee.termId, fee.academicYearId);
      if (!result) {
        return {
          success: false,
          message: `No fee found for the selected class, year and term.`,
        };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  addFees(data) {
    try {
      // Checks if fees exist for the class, term and academic year before adding
      const isFeesExists = this.getSingleFee(data);
      if (isFeesExists.success === true && isFeesExists.data) {
        return {
          success: false,
          message: "Fee already exists for the specified class, term, and academic year.",
        };
      }
      const stmt = this.db.prepare(`
          INSERT INTO fees (class_id, year_id, term_id, amount, created_at) VALUES (?, ?, ?, ?, ?)
        `);
      stmt.run(
        data.classId,
        data.academicYearId,
        data.termId,
        data.amount,
        new Date().toISOString()
      );
      return {
        success: true,
        message: "Fees added successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  updateFeeAmount(data) {
    try {
      const stmt = this.db.prepare(`
          UPDATE fees SET amount = ? WHERE id = ?
        `);
      stmt.run(data.amount, data.id);
      return {
        success: true,
        message: "Fee updated successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  deleteFee(id) {
    try {
      const stmt = this.db.prepare(`
          DELETE FROM fees WHERE id = ? 
        `);
      stmt.run(id);
      return {
        success: true,
        message: "Fees deleted successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);

      // Handle common SQLite errors
      if (error.message.includes("FOREIGN KEY constraint failed")) {
        return {
          success: false,
          message: "Cannot delete student. This student is linked to other records.",
        };
      } else if (error.message.includes("database is locked")) {
        return {
          success: false,
          message: "Database is currently in use. Please try again later.",
        };
      } else if (error.message.includes("SQLITE_CORRUPT")) {
        return {
          success: false,
          message: "Database file is corrupted. Please restore from backup.",
        };
      }

      return { success: false, message: "An unexpected error occurred." };
    }
  }

  // Check whether student has already been billed with the fees in question
  studentBillExist(studentId, feesId) {
    const stmt = this.db.prepare(`
        SELECT 1 FROM bills
        WHERE student_id = ? AND fees_id = ? 
        LIMIT 1
    `);

    const result = stmt.get(studentId, feesId);
    return result !== undefined; // Return true if a record exists
  }

  billStudent(data) {
    try {
      // check if student already billed
      if (this.studentBillExist(data.studentId, data.feesId)) {
        return {
          success: false,
          message: "Student has already been billed with this fees",
        };
      }

      const stmt = this.db.prepare(`
          INSERT INTO bills ( student_id, fees_id, created_at ) VALUES ( ?, ?, ?)
        `);
      stmt.run(data.studentId, data.feesId, new Date().toISOString());
      return {
        success: true,
        message: "Fees attached to student successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  deleteBill(billId) {
    try {
      const stmt = this.db.prepare(`
          DELETE FROM bills WHERE id = ?
        `);
      const result = stmt.run(billId);
      if (result.changes === 0) {
        return {
          success: false,
          message: "No bill found with the given ID.",
        };
      }

      return {
        success: true,
        message: "Bill deleted successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);
      // Handle common SQLite errors
      if (error.message.includes("FOREIGN KEY constraint failed")) {
        return {
          success: false,
          message: "Cannot unbill student. This student is linked to other records.",
        };
      } else if (error.message.includes("database is locked")) {
        return {
          success: false,
          message: "Database is currently in use. Please try again later.",
        };
      } else if (error.message.includes("SQLITE_CORRUPT")) {
        return {
          success: false,
          message: "Database file is corrupted. Please restore from backup.",
        };
      }

      return { success: false, message: "An unexpected error occurred." };
    }
  }

  applyDiscount(data) {
    try {
      const stmt = this.db.prepare(`
        UPDATE bills SET discount_amount = ? WHERE id = ?
      `);
      const result = stmt.run(data.discountAmount, data.billId);

      if (result.changes === 0) {
        return {
          success: false,
          message: "No matching bill found. Discount not applied.",
        };
      }

      return {
        success: true,
        message: "Discount applied successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  checkIfClassBilled(feesId) {
    try {
      const stmt = this.db.prepare(`
        SELECT EXISTS (
          SELECT 1 
          FROM bills 
          WHERE fees_id = ?
        ) AS data_exists;
      `);
      const result = stmt.get(feesId);
      return { success: true, exists: !!result.data_exists };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bills a list of students with the specified fees. Skips students who have already been billed.
   *
   * @param {Array<number>} idsArray - Array of student IDs to be billed.
   * @param {number} feesId - The ID of the fee to be billed to the students.
   * @returns {Object} - Returns an object containing:
   *   - `success` (boolean): Indicates if the operation was successful.
   *   - `message` (string): A summary message about the billing operation.
   *   - `data` (Object): Detailed results of the operation, containing:
   *     - `inserted` (Array<number>): List of student IDs successfully billed.
   *     - `skipped` (Array<number>): List of student IDs that were already billed and skipped.
   *
   * @throws {Error} If a database error occurs during the transaction.
   *
   * Example:
   * ```javascript
   * const result = billClassStudents([1, 2, 3, 4], 5);
   * console.log(result);
   * // {
   * //   success: true,
   * //   message: "2 student(s) billed successfully. 2 student(s) were already billed and skipped.",
   * //   data: { inserted: [2, 4], skipped: [1, 3] }
   * // }
   * ```
   */
  billClassStudents(idsArray, feesId) {
    try {
      const transaction = this.db.transaction(() => {
        const inserted = [];
        const skipped = [];

        const insertStmt = this.db.prepare(`
        INSERT INTO bills (student_id, fees_id, created_at)
        VALUES (?, ?, ?)
      `);

        idsArray.forEach((studentId) => {
          // Check if the student is already billed
          if (this.studentBillExist(studentId, feesId)) {
            skipped.push(studentId);
          } else {
            // Insert the new bill into the bills table
            insertStmt.run(studentId, feesId, new Date().toISOString());
            inserted.push(studentId);
          }
        });

        return { inserted, skipped };
      });

      const result = transaction();
      const message = `${result.inserted.length} student(s) billed successfully. ${
        result.skipped.length > 0
          ? `${result.skipped.length} student(s) were already billed and skipped.`
          : ""
      }`;
      return { success: true, message, data: result };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Retrieves detailed billing information for students based on the provided filters.
   *
   * @param {Object} filter - An object containing filtering criteria.
   * @param {string} filter.term - The academic term for which the details are fetched.
   * @param {string} filter.className - The class name to filter the students.
   * @param {string} filter.academicYear - The academic year to filter the students.
   * @returns {Object} - Returns an object containing:
   *   - `success` (boolean): Indicates if the query was successful.
   *   - `data` (Array|undefined): Array of billing details if successful.
   *   - `message` (string|undefined): Error message if the query fails.
   *
   * Each record in `data` contains:
   *   - `student_id` (number): ID of the student.
   *   - `student_name` (string): Full name of the student.
   *   - `fees_id` (number|null): ID of the associated fee structure.
   *   - `fee_amount` (number|null): Amount of the fee.
   *   - `bill_id` (number|null): ID of the bill, if issued.
   *   - `billed_status` (number): 1 if billed, 0 otherwise.
   *   - `total_payments` (number): Total payments made towards the bill.
   *
   * @throws {Error} If a database error occurs.
   */
  getBillDetails(filter) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
            s.id AS student_id, 
            s.first_name || ' ' || COALESCE(s.other_names, '') || ' ' || s.last_name  AS student_name,
            f.id AS fees_id, 
            (f.amount - COALESCE(b.discount_amount, 0)) AS fee_amount,
            b.id AS bill_id, 
            COALESCE(SUM(p.amount), 0) AS total_payments, 
            (f.amount - COALESCE(SUM(p.amount), 0) - COALESCE(b.discount_amount, 0)) AS balance,
            b.discount_amount AS discount_amount
        FROM students s
        JOIN studentClasses sc ON s.id = sc.student_id
        JOIN classes c ON sc.class_id = c.id
        JOIN academicYears ay ON sc.year_id = ay.id
        JOIN terms t ON f.term_id = t.id
        LEFT JOIN fees f ON sc.class_id = f.class_id  AND sc.year_id = f.year_id AND f.term_id = t.id
        LEFT JOIN bills b ON s.id = b.student_id AND b.fees_id = f.id
        LEFT JOIN payments p ON b.id = p.bill_id
        WHERE sc.class_id = ? AND ay.id = ? AND t.id = ?
        GROUP BY s.id, s.first_name, s.last_name, s.other_names, f.id, f.amount, b.id
        ORDER BY s.first_name, s.last_name
      `);

      const records = stmt.all(filter.classId, filter.yearId, filter.term);
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error in getBillDetails: ", error);
      return { success: false, message: error.message };
    }
  }

  getSingleBillDetails(filter) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          s.id AS student_id, 
          s.first_name || ' ' || COALESCE(s.other_names, '') || ' ' || s.last_name AS student_name,
          f.id AS fees_id, 
          (f.amount - COALESCE(b.discount_amount, 0)) AS fee_amount,
          b.id AS bill_id, 
          COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.bill_id = b.id), 0) AS total_payments, 
          (f.amount - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.bill_id = b.id), 0) - COALESCE(b.discount_amount, 0)) AS balance,
          b.discount_amount AS discount_amount
        FROM students s
        JOIN studentClasses sc ON s.id = sc.student_id
        JOIN fees f ON sc.class_id = f.class_id AND sc.year_id = f.year_id
        LEFT JOIN bills b ON s.id = b.student_id AND b.fees_id = f.id
        WHERE s.id = ? AND sc.class_id = ? AND f.year_id = ? AND f.term_id = ?
        ORDER BY s.first_name, s.last_name;
  `);

      const records = stmt.all(
        filter.studentId,
        filter.classId,
        filter.academicYearId,
        filter.termId
      );
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error in getBillDetails: ", error);
      return { success: false, message: error.message };
    }
  }

  makePayment(data) {
    try {
      const stmt = this.db.prepare(`
          INSERT INTO payments (student_id, bill_id, amount, payment_mode, payment_details, date_paid)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
      stmt.run(
        data.studentId,
        data.billId,
        data.amount,
        data.paymentMode,
        data.paymentDetails,
        new Date().toISOString()
      );
      return {
        success: true,
        message: "Payment made successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  updatePayment(data) {
    try {
      const stmt = this.db.prepare(`
          UPDATE payments SET amount = ?, payment_mode = ?, payment_details = ? WHERE id = ?
        `);
      stmt.run(data.amount, data.paymentMode, data.paymentDetails, data.paymentId);
      return {
        success: true,
        message: "Payment updated successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  deletePayment(paymentId) {
    try {
      const stmt = this.db.prepare(`
          DELETE FROM payments WHERE id = ?
        `);
      stmt.run(paymentId);
      return {
        success: true,
        message: "Payment deleted successfully.",
      };
    } catch (error) {
      console.error("Database Error: ", error);
      // Handle common SQLite errors
      if (error.message.includes("FOREIGN KEY constraint failed")) {
        return {
          success: false,
          message: "Cannot delete student. This student is linked to other records.",
        };
      } else if (error.message.includes("database is locked")) {
        return {
          success: false,
          message: "Database is currently in use. Please try again later.",
        };
      } else if (error.message.includes("SQLITE_CORRUPT")) {
        return {
          success: false,
          message: "Database file is corrupted. Please restore from backup.",
        };
      }

      return { success: false, message: "An unexpected error occurred." };
    }
  }

  // TODO: remove this function not use
  /**
   * Fetches detailed student billing information for a specific class, academic year, and term.
   *
   * This function retrieves a comprehensive list of students in a given class, along with their:
   * - Personal details (name, ID)
   * - Class and academic year information
   * - Fee details (term, amount)
   * - Billing status (whether they have been billed)
   * - Total payments made (if any)
   *
   * The query performs the following operations:
   * 1. Joins the `students` table with `studentClasses` to get class enrollment details.
   * 2. Left joins the `fees` table to retrieve fee details for the specified class, academic year, and term.
   * 3. Left joins the `bills` table to check if the student has been billed for the fee.
   * 4. Left joins the `payments` table to calculate the total payments made by the student for the bill.
   * 5. Groups the results by student and fee details to ensure accurate aggregation of payments.
   * 6. Orders the results by the student's first and last name for readability.
   *
   * @param {string} className - The name of the class to filter by (e.g., "Class 10").
   * @param {string} academicYear - The academic year to filter by (e.g., "2023").
   * @param {string} term - The term to filter by (e.g., "Term 1").
   * @returns {Array<Object>} - An array of objects containing the following fields:
   *   - student_id: The unique ID of the student.
   *   - student_name: The full name of the student (first name + last name + other names, if any).
   *   - class_name: The name of the class the student is enrolled in.
   *   - academic_year: The academic year of the class.
   *   - fees_id: The unique ID of the fee record (if applicable).
   *   - term: The term for which the fee applies.
   *   - fee_amount: The amount of the fee.
   *   - bill_id: The unique ID of the bill record (if the student has been billed).
   *   - is_billed: A count indicating whether the student has been billed (1 if billed, 0 otherwise).
   *   - total_payments: The total amount paid by the student for the bill (0 if no payments).
   *
   * Example Output:
   * [
   *   {
   *     student_id: 1,
   *     student_name: "John Doe Smith",
   *     class_name: "Class 10",
   *     academic_year: "2023",
   *     fees_id: 101,
   *     term: "Term 1",
   *     fee_amount: 500,
   *     bill_id: 201,
   *     is_billed: 1,
   *     total_payments: 300
   *   },
   *   ...
   * ]
   *
   * Notes:
   * - If a student has not been billed, `bill_id` and `total_payments` will be `null` or `0`.
   * - If a student has no payments, `total_payments` will be `0`.
   * - The `is_billed` field is derived from the count of bill records and will be `1` if the student has been billed.
   */
  getStudentsBillSummary(filter) {
    try {
      const stmt = this.db.prepare(`
          SELECT s.id AS student_id,
            s.first_name || ' ' || IFNULL(s.other_names, '') || ' ' || s.last_name AS student_name,
            c.class_name, c.academic_year,
            f.id AS fees_id, f.term, f.amount AS fee_amount,
            b.id AS bill_id, COUNT(b.id) AS is_billed,
            IFNULL(SUM(p.amount), 0) AS total_payments
          FROM students s
          JOIN studentClasses c ON s.id = c.student_id
          LEFT JOIN fees f ON c.class_name = f.class AND c.academic_year = f.academic_year
          LEFT JOIN bills b ON s.id = b.student_id AND b.fees_id = f.id
          LEFT JOIN payments p ON b.id = p.bill_id
          WHERE c.class_name = ? AND c.academic_year = ? AND f.term = ?
          GROUP BY s.id, s.first_name, s.last_name, s.other_names, c.class_name, c.academic_year, f.term, f.amount
          ORDER BY s.first_name, s.last_name;
    `);
      const records = stmt.all(filter.className, filter.academicYear, filter.term);
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getAllPayments() {
    try {
      const stmt = this.db.prepare(`
          SELECT 
              p.id AS payment_id, p.bill_id, p.amount AS payment_amount, 
              p.payment_mode, p.payment_details, p.date_paid,
              b.fees_id, 
              s.id AS student_id, 
              s.first_name || ' ' || IFNULL(s.other_names, '') || ' ' || s.last_name AS student_name,
              c.class_name, c.id AS class_id, 
              ay.year AS academic_year, ay.id AS year_id,
              t.term, f.amount AS fee_amount, t.id AS term_id
          FROM payments p
          JOIN bills b ON p.bill_id = b.id
          JOIN fees f ON b.fees_id = f.id
          JOIN students s ON b.student_id = s.id
          JOIN classes c ON f.class_id = c.id
          JOIN academicYears ay ON f.year_id = ay.id
          JOIN terms t ON f.term_id = t.id
          ORDER BY p.date_paid DESC, s.first_name, s.last_name;
     `);
      const records = stmt.all();
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getYearTermPayments(filter) {
    try {
      const stmt = this.db.prepare(`
            SELECT 
                p.id AS payment_id, p.bill_id, p.amount AS payment_amount, 
                p.payment_mode, p.payment_details, p.date_paid,
                b.fees_id, 
                s.id AS student_id, 
                s.first_name || ' ' || IFNULL(s.other_names, '') || ' ' || s.last_name AS student_name,
                c.class_name, c.id AS class_id, 
                ay.year AS academic_year, ay.id AS year_id,
                t.term, f.amount AS fee_amount, t.id AS term_id
            FROM payments p
            JOIN bills b ON p.bill_id = b.id
            JOIN fees f ON b.fees_id = f.id
            JOIN students s ON b.student_id = s.id
            JOIN classes c ON f.class_id = c.id
            JOIN academicYears ay ON f.year_id = ay.id
            JOIN terms t ON f.term_id = t.id
            WHERE ay.id = ? AND t.id = ?
            ORDER BY p.date_paid DESC, s.first_name, s.last_name;
     `);
      const records = stmt.all(filter.academicYearId, filter.termId);
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getStudentPayments(billId) {
    try {
      const stmt = this.db.prepare(`
            SELECT 
                p.id AS payment_id, p.bill_id, p.amount AS payment_amount, 
                p.payment_mode, p.payment_details, p.date_paid,
                b.fees_id, 
                s.id AS student_id, 
                s.first_name || ' ' || IFNULL(s.other_names, '') || ' ' ||  s.last_name AS student_name,
                c.class_name, c.id AS class_id, 
                ay.year AS academic_year, ay.id AS year_id,
                t.term, f.amount AS fee_amount, t.id AS term_id
            FROM payments p
            JOIN bills b ON p.bill_id = b.id
            JOIN fees f ON b.fees_id = f.id
            JOIN students s ON b.student_id = s.id
            JOIN classes c ON f.class_id = c.id
            JOIN academicYears ay ON f.year_id = ay.id
            JOIN terms t ON f.term_id = t.id
            WHERE p.bill_id = ?
            ORDER BY p.date_paid DESC;
        `);

      const records = stmt.all(billId);
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getStudentCount(yearId) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM students) AS total_students,
          (SELECT COUNT(DISTINCT student_id) FROM studentClasses WHERE year_id = ?) AS students_with_class;
        `);
      const record = stmt.get(yearId);
      return { success: true, data: record };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getYearClassCount(yearId) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          COUNT(DISTINCT class_id) AS total_classes
        FROM studentClasses
        WHERE year_id = ?;
      `);
      const record = stmt.get(yearId);
      return { success: true, data: record };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getTotalClassCount() {
    try {
      const stmt = this.db.prepare(`
        SELECT COUNT(*) AS total_classes FROM classes;
      `);
      const record = stmt.get();
      return { success: true, data: record };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getUnbilledClasses(filter) {
    try {
      const stmt = this.db.prepare(`
        SELECT c.id AS class_id, c.class_name, ay.id AS year_id, ay.year AS academic_year
        FROM classes c
        JOIN academicYears ay ON c.id = ay.id
        WHERE c.id NOT IN (
          SELECT DISTINCT f.class_id
          FROM fees f
          WHERE f.year_id = ? AND f.term_id = ?
        );
      `);
      const records = stmt.all(filter.academicYearId, filter.termId);
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getStudentBilledCount(filter) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          COUNT(DISTINCT b.student_id) AS total_students_billed, 
          COALESCE(SUM(f.amount), 0) AS total_amount_billed
        FROM bills b
        JOIN fees f ON b.fees_id = f.id
        WHERE f.term_id = ? AND f.year_id = ?;
      `);
      const record = stmt.get(filter.termId, filter.academicYearId);
      return { success: true, data: record };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getTotalDiscountGiven(filter) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          COALESCE(SUM(b.discount_amount), 0) AS total_discount
        FROM bills b
        JOIN fees f ON b.fees_id = f.id
        WHERE f.year_id = ? AND f.term_id = ?;
      `);
      const record = stmt.get(filter.academicYearId, filter.termId);
      return { success: true, data: record };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getTotalAmountPaid(filter) {
    try {
      const stmt = this.db.prepare(`
        SELECT COALESCE(SUM(p.amount), 0) AS total_amount_paid
        FROM payments p
        JOIN bills b ON p.bill_id = b.id
        JOIN fees f ON b.fees_id = f.id
        WHERE f.term_id = ? AND f.year_id = ?;
      `);
      const record = stmt.get(filter.termId, filter.academicYearId);
      return { success: true, data: record };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getClassSummary(filter) {
    try {
      const stmt = this.db.prepare(`
        SELECT c.class_name, 
          COUNT(DISTINCT sc.student_id) AS students_count, 
          COALESCE(f.amount, 0) AS class_fee, 
          COALESCE(SUM(p.amount), 0) AS total_paid, 
          COALESCE(COUNT(DISTINCT sc.student_id) * f.amount, 0) AS total_fees,
          COALESCE(SUM(b.discount_amount), 0) AS total_discount
        FROM classes c
        LEFT JOIN studentClasses sc ON c.id = sc.class_id AND sc.year_id = ? 
        LEFT JOIN fees f ON c.id = f.class_id AND f.term_id = ? AND f.year_id = ?
        LEFT JOIN bills b ON sc.student_id = b.student_id AND b.fees_id = f.id
        LEFT JOIN payments p ON b.id = p.bill_id
        GROUP BY c.id, f.amount;
        `);
      const records = stmt.all(filter.academicYearId, filter.termId, filter.academicYearId);
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  // Close the database connection
  close() {
    this.db.close();
  }
}

module.exports = DatabaseHandler;
