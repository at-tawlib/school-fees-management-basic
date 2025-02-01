# School Fees Management System

## Overview

The **School Fees Management System** is a desktop application built with **Electron.js** and **SQLite**. It allows school administrators to manage student records, track fee payments, handle billing, and manage arrears efficiently.

## Features

- **Student Management**: Add, edit, and remove student records.
- **Class & Academic Year Management**: Assign students to classes and academic years.
- **Billing System**: Generate and manage student bills for different terms and academic years.
- **Payments Tracking**: Record payments and track outstanding balances.
- **Settings Management**: Configure default academic year and term.
- **Filtering & Search**: Search for students, filter payments, and track arrears.
- **Local Storage Caching**: Store static data (e.g., classes, terms) in local storage for efficiency.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Electron.js
- **Database**: SQLite (Better-SQLite3)

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/at-tawlib/school-fees-management-basic
   cd school-fees-management-basic
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the application:
   ```sh
   npm start
   ```

## Database Schema

The application consists of multiple related tables:

- **students**: Stores student details.
- **classes**: Stores class names.
- **academicYears**: Manages academic years.
- **terms**: Stores term information.
- **fees**: Defines fees for different classes, terms, and years.
- **bills**: Tracks student fee allocations.
- **payments**: Stores payment records.
- **arrears**: Manages outstanding balances.
- **settings**: Stores app configurations (e.g., default academic year and term).

## API & Functions

### **Main Functions**

- **Student Management**

  - `addStudent(studentData)` - Adds a new student.
  - `getAllStudents()` - Retrieves all students.
  - `assignStudentToClass(studentId, classId, yearId)` - Assigns a student to a class.

- **Billing & Payments**

  - `billClassStudents(studentIds, feesId)` - Bills students for a selected class and term.
  - `getBillDetails(classId, yearId, termId)` - Retrieves student billing details.
  - `getStudentPayments(billId)` - Fetches payments for a particular bill.
  - `recordPayment(paymentData)` - Inserts a new payment record.

- **Settings Management**

  - `setSetting(key, value)` - Updates or inserts a setting.
  - `getSetting(key)` - Retrieves a setting value.

## UI Components

- **Sidebar Navigation**: Provides access to different sections (students, fees, payments, settings, etc.).
- **Term Toggle Buttons**: Allows users to switch between terms.
- **Tables with Filters**: Display student records, bills, and payments with sorting and filtering options.

## Deployment

To package the application for production:

```sh
npm run make
```

To create a macOS build (from macOS machine):

```sh
npm run make -- --platform=darwin
```

## Troubleshooting

- **`ReferenceError: localStorage is not defined`**
  - Ensure `localStorage` is accessed only in the renderer process.
- **`Error: FOREIGN KEY constraint failed`**
  - Ensure referenced records exist before inserting related data.
- **`Error while executing SQL query on database`**
  - Check for missing parameters or incorrect joins.

## Future Improvements

- Add user authentication.
- Implement role-based access control.
- Improve UI with animations and themes.

## License

This project is licensed under the **MIT License**.

---

Developed by **Abdul-Fatahu Hardi**

