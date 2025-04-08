# Changelog

## [v1.1.0] - 2025-04-08

### 🚀 Added
- Admin section with dashboard and settings
- Login mechanism for admin
- Option for admin to update password
- Discount functionality for individual student bills
- View, edit, and delete options for payments
- Modal to update payments
- Print functionality for bills, students, and payments
- Column selection (show/hide) in the payments table
- Delete student option in the student section

### ⚙️ Improved
- UI redesign: switched from side navbar to top navbar
- Currency formatting: now uses `GH₵` symbol and conditionally displays decimals
- Amount view in fees now uses improved `fCurrency` formatting

### 🛠 Fixed
- Bug with billing using incorrect `classId` instead of `feeId`
- Prevent billing students if the selected term/year isn't the default
- Show modal with list of already billed students before proceeding
- Payment error handling to prevent amount exceeding arrears

