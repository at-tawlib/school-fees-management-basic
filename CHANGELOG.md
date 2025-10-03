# Changelog

All notable changes to this project will be documented in this file.

## [v1.3.0] - 2025-10-03

This is the third stable release of the School Fees Management System. It provides a complete foundational feature set for managing student records, billing, and payment tracking.

### Added

* **Student Management:** Core functionality to add, edit, and remove student records.
* **Academic Structure:** Implemented management for Classes, Terms, and Academic Years.
* **Core Billing System:**
    * Ability to define and manage custom Fee structures (`fees` table) per class, term, and year.
    * Functionality to generate and track individual student bills (`bills` table).
* **Payment Tracking:** Records and tracks all payments made against student bills (`payments` table).
* **Arrears Management:** Integrated system for calculating and managing outstanding balances (`arrears` table).
* **Settings:** Added configuration options to set the default Academic Year and Term.
* **Data Retrieval:** Implemented comprehensive filtering, search, and table views for students, payments, and bills.

### Technical

* **Platform:** Built using **Electron.js** for cross-platform desktop compatibility.
* **Database:** Utilizes **SQLite** (via `better-sqlite3`) for robust local data storage.
* **Performance:** Implemented Local Storage Caching for static data (Classes, Terms) to improve application speed.