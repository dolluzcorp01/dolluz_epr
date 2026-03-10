// ─────────────────────────────────────────────────────────────────────────────
//  utils/excel.js
//  • importEmployees(buffer)  — parse uploaded .xlsx, validate, return rows
//  • exportReviews(rows)      — generate Excel buffer for download
// ─────────────────────────────────────────────────────────────────────────────

const XLSX = require("xlsx");

// ── Expected column headers for employee import ───────────────────────────────
const REQUIRED_COLUMNS = [
  "employee_code", "first_name", "last_name", "official_email",
  "designation", "department", "joining_date",
];

const OPTIONAL_COLUMNS = [
  "primary_phone", "secondary_phone", "personal_email",
  "gender", "dob", "blood_group", "nationality",
  "aadhaar_number", "pan_number",
  "curr_addr_line1", "curr_addr_line2", "curr_addr_city", "curr_addr_state", "curr_addr_pincode",
  "ec_name", "ec_relation", "ec_phone",
  "reporting_manager", "base_ctc_usd",
];

/**
 * Parse an uploaded employee Excel file.
 * @param {Buffer} buffer  Raw file buffer from multer memoryStorage
 * @returns {{ valid: object[], errors: object[] }}
 */
function importEmployees(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const valid  = [];
  const errors = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // Account for header row
    const rowErrors = [];

    // Normalise keys: trim, lowercase, replace spaces with underscores
    const normalised = {};
    Object.entries(row).forEach(([k, v]) => {
      normalised[k.trim().toLowerCase().replace(/\s+/g, "_")] = typeof v === "string" ? v.trim() : v;
    });

    // Check required columns
    REQUIRED_COLUMNS.forEach(col => {
      if (!normalised[col] && normalised[col] !== 0) {
        rowErrors.push(`Missing required field: ${col}`);
      }
    });

    // Validate email format
    if (normalised.official_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised.official_email)) {
      rowErrors.push(`Invalid official_email: ${normalised.official_email}`);
    }

    // Validate joining_date
    if (normalised.joining_date && isNaN(new Date(normalised.joining_date).getTime())) {
      rowErrors.push(`Invalid joining_date format: ${normalised.joining_date}`);
    }

    if (rowErrors.length) {
      errors.push({ row: rowNum, employee_code: normalised.employee_code || "—", errors: rowErrors });
    } else {
      valid.push(normalised);
    }
  });

  return { valid, errors, total: rows.length };
}

/**
 * Generate an Excel file buffer from review data for download.
 * @param {object[]} rows  Array of review/score objects
 * @param {string} sheetName
 * @returns {Buffer}
 */
function exportToExcel(rows, sheetName = "Report") {
  const workbook  = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns
  const cols = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length + 2, 14),
  }));
  worksheet["!cols"] = cols;

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

module.exports = { importEmployees, exportToExcel };
