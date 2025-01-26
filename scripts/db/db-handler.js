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
            WHERE student_id = ? AND academic_year = ?
          `);
          const exists = checkStmt.get(studentId, data.academicYear);

          if (exists) {
            existingStudents.push(studentId); // Track existing students
          } else {
            const insertStmt = db.prepare(`
              INSERT INTO studentClasses (student_id, class_name, academic_year, created_at)
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

  getAllClassesStudents() {
    try {
      const stmt = this.db.prepare(`
          SELECT s.id AS student_id, s.first_name, s.last_name, s.other_names, c.class_name, c.academic_year
          FROM  students s
          JOIN studentClasses c
          ON s.id = c.student_id
        `);
      const records = stmt.all();
      return { success: true, data: records };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getDistinctClasses(year) {
    try {
      const stmt = this.db.prepare(`
        SELECT DISTINCT class_name, academic_year FROM studentClasses WHERE academic_year = ?;
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

  // TODO: not used anywhere remove
  feeExists(fee) {
    const stmt = this.db.prepare(`
        SELECT 1 FROM fees
        WHERE class = ? AND term = ? AND academic_year = ?
        LIMIT 1
    `);

    const result = stmt.get(fee.class, fee.term, fee.academicYear);
    return result !== undefined; // Return true if a record exists
  }

  getSingleFee(fee) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM fees
        WHERE class = ? AND term = ? AND academic_year = ?
        LIMIT 1
      `);

      const result = stmt.get(fee.class, fee.term, fee.academicYear);
      if (!result) {
        return { success: false, message: "Fee not found." };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Database Error: ", error);
      return { success: false, message: error.message };
    }
  }

  getAllFees() {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          fees.id,
          fees.class,
          fees.academic_year,
          fees.term,
          fees.amount,
          COUNT(bills.student_id) AS total_students_billed
        FROM fees
        LEFT JOIN bills ON fees.id = bills.fees_id
        GROUP BY fees.id
      `);
      const records = stmt.all();
      return { success: true, data: records };
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
        console.log("Fees already exists for the specified class, term, and academic year.");
        return {
          success: false,
          message: "Fee already exists for the specified class, term, and academic year.",
        };
      }
      const stmt = this.db.prepare(`
          INSERT INTO fees (class, academic_year, term, amount, created_at) VALUES (?, ?, ?, ?, ?)
        `);
      stmt.run(data.class, data.academicYear, data.term, data.amount, new Date().toISOString());
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
      return { success: false, message: error.message };
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

  // Bill multiple students for fees
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

        // message: "Fees attached to student successfully.",
        // message: "Student has already been billed with this fee.",

        return { inserted, skipped };
      });
      const result = transaction();
      console.log("Transaction Result: ", result);
      return { success: true, data: result };
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
          s.first_name || ' ' || s.last_name || ' ' || COALESCE(s.other_names, '') AS student_name,
          f.id AS fees_id, 
          f.amount AS fee_amount,
          b.id AS bill_id, 
          COUNT(b.id) AS billed_status,
          COALESCE(SUM(p.amount), 0) AS total_payments
        FROM students s
        JOIN studentClasses c ON s.id = c.student_id
        LEFT JOIN fees f ON c.class_name = f.class 
          AND c.academic_year = f.academic_year 
          AND f.term = ?
        LEFT JOIN bills b ON s.id = b.student_id AND b.fees_id = f.id
        LEFT JOIN payments p ON b.id = p.bill_id
        WHERE c.class_name = ? AND c.academic_year = ?
        GROUP BY s.id, s.first_name, s.last_name, s.other_names, f.id, f.amount, b.id
        ORDER BY s.first_name, s.last_name;
      `);
      const records = stmt.all(filter.term, filter.className, filter.academicYear);
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
            s.first_name || ' ' || s.last_name || ' ' || IFNULL(s.other_names, '') AS student_name,
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
          SELECT p.id AS payment_id, p.bill_id, p.amount AS payment_amount, p.payment_mode, p.payment_details, p.date_paid,
            b.fees_id, s.id AS student_id, s.first_name || ' ' || s.last_name || ' ' || IFNULL(s.other_names, '') AS student_name,
            f.class AS class_name, f.academic_year, f.term, f.amount AS fee_amount
          FROM payments p
          JOIN bills b ON p.bill_id = b.id
          JOIN fees f ON b.fees_id = f.id
          JOIN students s ON b.student_id = s.id
          ORDER BY p.date_paid DESC, s.first_name, s.last_name;
    `);
      const records = stmt.all();
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
