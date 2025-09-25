import ExcelJS from "exceljs";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { pool } from "../config/db.js";

// Helper function to validate attendance data
const validateAttendanceRecord = (record, rowIndex) => {
  const errors = [];

  // Required field validation
  if (!record.employee_id || record.employee_id.trim() === "") {
    errors.push(`Row ${rowIndex}: Employee ID is required`);
  }

  if (!record.date || record.date.trim() === "") {
    errors.push(`Row ${rowIndex}: Date is required`);
  } else {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(record.date)) {
      errors.push(`Row ${rowIndex}: Date must be in YYYY-MM-DD format`);
    } else {
      const date = new Date(record.date);
      if (isNaN(date.getTime())) {
        errors.push(`Row ${rowIndex}: Invalid date`);
      }
    }
  }

  // Timestamp validation for time_in and time_out
  const timestampRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (record.time_in && record.time_in.trim() !== "") {
    if (!timestampRegex.test(record.time_in)) {
      errors.push(
        `Row ${rowIndex}: Time In must be in YYYY-MM-DD HH:MM:SS format`
      );
    }
  }

  if (record.time_out && record.time_out.trim() !== "") {
    if (!timestampRegex.test(record.time_out)) {
      errors.push(
        `Row ${rowIndex}: Time Out must be in YYYY-MM-DD HH:MM:SS format`
      );
    }
  }

  // Numeric validation
  if (record.total_hours && record.total_hours.trim() !== "") {
    const totalHours = parseFloat(record.total_hours);
    if (isNaN(totalHours) || totalHours < 0) {
      errors.push(`Row ${rowIndex}: Total hours must be a positive number`);
    }
  }

  if (record.overtime_hours && record.overtime_hours.trim() !== "") {
    const overtime = parseFloat(record.overtime_hours);
    if (isNaN(overtime) || overtime < 0) {
      errors.push(`Row ${rowIndex}: Overtime hours must be a positive number`);
    }
  }

  // Integer validation for IDs
  if (record.leave_type_id && record.leave_type_id.trim() !== "") {
    const leaveTypeId = parseInt(record.leave_type_id);
    if (isNaN(leaveTypeId)) {
      errors.push(`Row ${rowIndex}: Leave Type ID must be an integer`);
    }
  }

  if (record.leave_request_id && record.leave_request_id.trim() !== "") {
    const leaveRequestId = parseInt(record.leave_request_id);
    if (isNaN(leaveRequestId)) {
      errors.push(`Row ${rowIndex}: Leave Request ID must be an integer`);
    }
  }

  // Boolean field validation
  const booleanFields = [
    "is_present",
    "is_late",
    "is_absent",
    "on_leave",
    "is_undertime",
    "is_halfday",
    "is_dayoff",
    "is_regular_holiday",
    "is_special_holiday",
  ];
  booleanFields.forEach((field) => {
    if (record[field] && record[field].trim() !== "") {
      const value = record[field].toUpperCase();
      if (value !== "TRUE" && value !== "FALSE") {
        errors.push(`Row ${rowIndex}: ${field} must be TRUE or FALSE`);
      }
    }
  });

  // Business logic validation - Enhanced conflict detection
  const isPresent =
    record.is_present && record.is_present.toUpperCase() === "TRUE";
  const isAbsent =
    record.is_absent && record.is_absent.toUpperCase() === "TRUE";
  const onLeave = record.on_leave && record.on_leave.toUpperCase() === "TRUE";
  const isLate = record.is_late && record.is_late.toUpperCase() === "TRUE";
  const isUndertime =
    record.is_undertime && record.is_undertime.toUpperCase() === "TRUE";
  const isHalfday =
    record.is_halfday && record.is_halfday.toUpperCase() === "TRUE";
  const isDayOff =
    record.is_dayoff && record.is_dayoff.toUpperCase() === "TRUE";

  // Primary attendance state conflicts (mutually exclusive)
  const primaryStates = [
    { state: isPresent, name: "present" },
    { state: isAbsent, name: "absent" },
    { state: onLeave, name: "on leave" },
  ];
  const activePrimaryStates = primaryStates.filter((s) => s.state);

  if (activePrimaryStates.length > 1) {
    const stateNames = activePrimaryStates.map((s) => s.name).join(", ");
    errors.push(
      `Row ${rowIndex}: Cannot be ${stateNames} at the same time. Choose only one primary attendance state.`
    );
  }

  // Secondary state conflicts with primary states
  if (isAbsent || onLeave) {
    // If absent or on leave, shouldn't have work-related flags
    if (isLate) {
      errors.push(
        `Row ${rowIndex}: Cannot be late when ${
          isAbsent ? "absent" : "on leave"
        }`
      );
    }
    if (isUndertime) {
      errors.push(
        `Row ${rowIndex}: Cannot have undertime when ${
          isAbsent ? "absent" : "on leave"
        }`
      );
    }
    if (isHalfday) {
      errors.push(
        `Row ${rowIndex}: Cannot be halfday when ${
          isAbsent ? "absent" : "on leave"
        }`
      );
    }
  }

  // Day off conflicts
  if (isDayOff) {
    if (isPresent && !record.time_in && !record.time_out) {
      // Allow present on day off only if there are actual time entries (overtime work)
      errors.push(
        `Row ${rowIndex}: If present on day off, provide time in/out for overtime work`
      );
    }
    if (isAbsent) {
      errors.push(
        `Row ${rowIndex}: Cannot be absent on a scheduled day off. Use day off flag only.`
      );
    }
  }

  // Time-related conflicts
  if (isPresent && !isDayOff && !record.time_in) {
    errors.push(
      `Row ${rowIndex}: Time In is required when present (unless it's a day off with special arrangements)`
    );
  }

  // Late flag validation
  if (isLate && !isPresent) {
    errors.push(`Row ${rowIndex}: Cannot be late without being present`);
  }

  // Undertime flag validation
  if (isUndertime && !isPresent) {
    errors.push(`Row ${rowIndex}: Cannot have undertime without being present`);
  }

  // Halfday validation
  if (isHalfday && !isPresent) {
    errors.push(`Row ${rowIndex}: Cannot be halfday without being present`);
  }

  // Overtime validation
  if (record.overtime_hours && parseFloat(record.overtime_hours) > 0) {
    if (!isPresent) {
      errors.push(
        `Row ${rowIndex}: Cannot have overtime hours without being present`
      );
    }
  }

  // Total hours validation
  if (record.total_hours && parseFloat(record.total_hours) > 0) {
    if (!isPresent) {
      errors.push(
        `Row ${rowIndex}: Cannot have total hours without being present`
      );
    }
    if (isAbsent || onLeave) {
      errors.push(
        `Row ${rowIndex}: Total hours should be 0 when absent or on leave`
      );
    }
  }

  // Time consistency validation
  if (record.time_in && record.time_out && isPresent) {
    try {
      const timeIn = new Date(record.time_in);
      const timeOut = new Date(record.time_out);

      if (timeOut <= timeIn) {
        errors.push(`Row ${rowIndex}: Time out must be after time in`);
      }
    } catch (timeError) {
      // Time format validation is already handled above
    }
  }

  // Holiday work validation
  const isRegularHoliday =
    record.is_regular_holiday &&
    record.is_regular_holiday.toUpperCase() === "TRUE";
  const isSpecialHoliday =
    record.is_special_holiday &&
    record.is_special_holiday.toUpperCase() === "TRUE";

  if (isRegularHoliday && isSpecialHoliday) {
    errors.push(
      `Row ${rowIndex}: Cannot be both regular and special holiday on the same day`
    );
  }

  // If on leave, should have leave type
  if (
    onLeave &&
    (!record.leave_type_id || record.leave_type_id.trim() === "")
  ) {
    errors.push(
      `Row ${rowIndex}: Leave Type ID is required when On Leave is TRUE`
    );
  }

  // Leave request validation - if leave_request_id is provided, validate it exists and is approved
  if (record.leave_request_id && record.leave_request_id.trim() !== "") {
    const leaveRequestId = parseInt(record.leave_request_id);
    if (!isNaN(leaveRequestId)) {
      // Note: This validation will be performed during database processing
      // since we need async database calls which aren't suitable for this sync validation function
      // The actual validation will happen in validateAndProcessAttendanceData
    }
  }

  // If on leave but no leave_request_id provided, it should still be valid
  // (manual leave entry without formal request)
  if (
    onLeave &&
    record.leave_request_id &&
    record.leave_request_id.trim() !== ""
  ) {
    // Leave request ID validation will be handled in async processing
  }

  // Note: isDayOff is already declared above in the enhanced validation section

  return errors;
};

// Helper function to check for existing attendance records in database
const checkExistingAttendanceRecords = async (records) => {
  const duplicateWarnings = [];
  const existingRecords = [];

  // Group records by employee_id and date for efficient database lookup
  const recordMap = new Map();
  records.forEach((record, index) => {
    const key = `${record.employee_id}_${record.date}`;
    if (!recordMap.has(key)) {
      recordMap.set(key, []);
    }
    recordMap.get(key).push({ record, rowIndex: index + 2 });
  });

  // Check for duplicates within the file itself
  for (const [key, duplicateRecords] of recordMap.entries()) {
    if (duplicateRecords.length > 1) {
      const [employeeId, date] = key.split("_");
      const rowNumbers = duplicateRecords.map((dr) => dr.rowIndex);
      duplicateWarnings.push({
        type: "file_duplicate",
        employee_id: employeeId,
        date: date,
        message: `Employee ${employeeId} has multiple records for date ${date} in rows: ${rowNumbers.join(
          ", "
        )}`,
        rows: rowNumbers,
      });
    }
  }

  // Check for existing records in database
  const employeeDatePairs = Array.from(recordMap.keys()).map((key) => {
    const [employeeId, date] = key.split("_");
    return { employee_id: employeeId, date: date };
  });

  if (employeeDatePairs.length > 0) {
    // Build the query to check for existing records
    const conditions = employeeDatePairs
      .map(
        (_, index) =>
          `(employee_id = $${index * 2 + 1} AND date = $${index * 2 + 2})`
      )
      .join(" OR ");

    const values = employeeDatePairs.flatMap((pair) => [
      pair.employee_id,
      pair.date,
    ]);

    const existingQuery = `
      SELECT employee_id, date, attendance_id, is_present, is_absent, on_leave, 
             time_in, time_out, total_hours, created_at
      FROM attendance 
      WHERE ${conditions}
    `;

    try {
      const existingResult = await pool.query(existingQuery, values);

      for (const existing of existingResult.rows) {
        // Convert database date to YYYY-MM-DD format for consistent comparison
        const existingDate = new Date(existing.date);
        const formattedDate = existingDate.toISOString().split("T")[0];
        const key = `${existing.employee_id}_${formattedDate}`;
        const fileRecords = recordMap.get(key);

        console.log("Existing Dates:", formattedDate);

        if (fileRecords) {
          existingRecords.push({
            employee_id: existing.employee_id,
            date: formattedDate,
            existing_record: existing,
            file_records: fileRecords,
          });

          duplicateWarnings.push({
            type: "database_duplicate",
            employee_id: existing.employee_id,
            date: formattedDate,
            attendance_id: existing.attendance_id,
            message: `Employee ${existing.employee_id} already has an attendance record for ${formattedDate}. Uploading will overwrite the existing record.`,
            existing_data: {
              is_present: existing.is_present,
              is_absent: existing.is_absent,
              on_leave: existing.on_leave,
              time_in: existing.time_in,
              time_out: existing.time_out,
              total_hours: existing.total_hours,
              created_at: existing.created_at,
            },
            rows: fileRecords.map((fr) => fr.rowIndex),
          });
        }
      }
    } catch (dbError) {
      console.error("Error checking existing attendance records:", dbError);
      // Don't fail the entire process, just log the error
    }
  }

  return { duplicateWarnings, existingRecords };
};

// Helper function to validate and process attendance data without database insertion
const validateAndProcessAttendanceData = async (records) => {
  const processedRecords = [];
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowIndex = i + 2; // +2 because Excel/CSV is 1-indexed and row 1 is header

    try {
      // Validate the record
      const validationErrors = validateAttendanceRecord(record, rowIndex);
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
        continue;
      }

      // Helper function to convert TRUE/FALSE strings to boolean
      const stringToBoolean = (value) => {
        if (!value || value.trim() === "") return false;
        const result = value.toString().toUpperCase() === "TRUE";
        return result;
      };

      // Prepare the processed data (without inserting to database)
      const attendanceData = {
        employee_id: record.employee_id.trim(),
        date: record.date.trim(),
        time_in: record.time_in?.trim() || null,
        time_out: record.time_out?.trim() || null,
        total_hours: record.total_hours ? parseFloat(record.total_hours) : null,
        overtime_hours: record.overtime_hours
          ? parseFloat(record.overtime_hours)
          : null,
        notes: record.notes?.trim() || null,
        is_present: stringToBoolean(record.is_present),
        is_late: stringToBoolean(record.is_late),
        is_absent: stringToBoolean(record.is_absent),
        on_leave: stringToBoolean(record.on_leave),
        leave_type_id: record.leave_type_id
          ? parseInt(record.leave_type_id)
          : null,
        leave_request_id: record.leave_request_id
          ? parseInt(record.leave_request_id)
          : null,
        is_undertime: stringToBoolean(record.is_undertime),
        is_halfday: stringToBoolean(record.is_halfday),
        is_dayoff: stringToBoolean(record.is_dayoff),
        is_regular_holiday: stringToBoolean(record.is_regular_holiday),
        is_special_holiday: stringToBoolean(record.is_special_holiday),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Validate leave request if provided
      if (attendanceData.leave_request_id) {
        try {
          const leaveRequestResult = await pool.query(
            `SELECT lr.leave_request_id, lr.employee_id, lr.leave_type_id, lr.start_date, 
                    lr.end_date, lr.status, lt.name as leave_type_name
             FROM leave_requests lr
             JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
             WHERE lr.leave_request_id = $1`,
            [attendanceData.leave_request_id]
          );

          if (leaveRequestResult.rows.length === 0) {
            errors.push(
              `Row ${rowIndex}: Leave Request ID ${attendanceData.leave_request_id} does not exist`
            );
            continue;
          }

          const leaveRequest = leaveRequestResult.rows[0];

          // Check if leave request belongs to the same employee
          if (leaveRequest.employee_id !== attendanceData.employee_id) {
            errors.push(
              `Row ${rowIndex}: Leave Request ID ${attendanceData.leave_request_id} belongs to employee ${leaveRequest.employee_id}, not ${attendanceData.employee_id}`
            );
            continue;
          }

          // Check if leave request is approved
          if (leaveRequest.status !== "approved") {
            errors.push(
              `Row ${rowIndex}: Leave Request ID ${attendanceData.leave_request_id} is not approved (status: ${leaveRequest.status})`
            );
            continue;
          }

          // Check if the attendance date falls within the leave request period
          const attendanceDate = new Date(attendanceData.date);
          const leaveStartDate = new Date(leaveRequest.start_date);
          const leaveEndDate = new Date(leaveRequest.end_date);

          if (
            attendanceDate < leaveStartDate ||
            attendanceDate > leaveEndDate
          ) {
            errors.push(
              `Row ${rowIndex}: Attendance date ${attendanceData.date} is outside the leave request period (${leaveRequest.start_date} to ${leaveRequest.end_date})`
            );
            continue;
          }

          // Auto-set leave_type_id if not provided but leave_request_id is valid
          if (!attendanceData.leave_type_id) {
            attendanceData.leave_type_id = leaveRequest.leave_type_id;
          } else if (
            attendanceData.leave_type_id !== leaveRequest.leave_type_id
          ) {
            errors.push(
              `Row ${rowIndex}: Leave Type ID ${attendanceData.leave_type_id} does not match the leave request's type (${leaveRequest.leave_type_id} - ${leaveRequest.leave_type_name})`
            );
            continue;
          }
        } catch (dbError) {
          errors.push(
            `Row ${rowIndex}: Error validating leave request - ${dbError.message}`
          );
          continue;
        }
      }

      // Validate leave type if provided
      if (attendanceData.leave_type_id && attendanceData.on_leave) {
        try {
          const leaveTypeResult = await pool.query(
            "SELECT leave_type_id, name FROM leave_types WHERE leave_type_id = $1",
            [attendanceData.leave_type_id]
          );

          if (leaveTypeResult.rows.length === 0) {
            errors.push(
              `Row ${rowIndex}: Leave Type ID ${attendanceData.leave_type_id} does not exist`
            );
            continue;
          }
        } catch (dbError) {
          errors.push(
            `Row ${rowIndex}: Error validating leave type - ${dbError.message}`
          );
          continue;
        }
      }

      processedRecords.push(attendanceData);
    } catch (error) {
      errors.push(`Row ${rowIndex}: Unexpected error - ${error.message}`);
    }
  }

  return { processedRecords, errors };
};

// Helper function to process attendance data
const processAttendanceData = async (records) => {
  const results = {
    successful: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowIndex = i + 2; // +2 because Excel/CSV is 1-indexed and row 1 is header

    try {
      // Validate the record
      const validationErrors = validateAttendanceRecord(record, rowIndex);
      if (validationErrors.length > 0) {
        results.errors.push(...validationErrors);
        results.failed++;
        continue;
      }

      // Helper function to convert TRUE/FALSE strings to boolean
      const stringToBoolean = (value) => {
        if (!value || value.trim() === "") return false;
        return value.toUpperCase() === "TRUE";
      };

      // Prepare the data for insertion
      const attendanceData = {
        employee_id: record.employee_id.trim(),
        date: record.date.trim(),
        time_in: record.time_in?.trim() || null,
        time_out: record.time_out?.trim() || null,
        total_hours: record.total_hours ? parseFloat(record.total_hours) : null,
        overtime_hours: record.overtime_hours
          ? parseFloat(record.overtime_hours)
          : null,
        notes: record.notes?.trim() || null,
        is_present: stringToBoolean(record.is_present),
        is_late: stringToBoolean(record.is_late),
        is_absent: stringToBoolean(record.is_absent),
        on_leave: stringToBoolean(record.on_leave),
        leave_type_id: record.leave_type_id
          ? parseInt(record.leave_type_id)
          : null,
        leave_request_id: record.leave_request_id
          ? parseInt(record.leave_request_id)
          : null,
        is_undertime: stringToBoolean(record.is_undertime),
        is_halfday: stringToBoolean(record.is_halfday),
        is_dayoff: stringToBoolean(record.is_dayoff),
        is_regular_holiday: stringToBoolean(record.is_regular_holiday),
        is_special_holiday: stringToBoolean(record.is_special_holiday),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insert into database using raw SQL
      try {
        await pool.query(
          `INSERT INTO attendance (
            employee_id, date, time_in, time_out, total_hours, overtime_hours,
            notes, is_present, is_late, is_absent, on_leave, leave_type_id,
            leave_request_id, is_undertime, is_halfday, is_dayoff,
            is_regular_holiday, is_special_holiday, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
          )`,
          [
            attendanceData.employee_id,
            attendanceData.date,
            attendanceData.time_in,
            attendanceData.time_out,
            attendanceData.total_hours,
            attendanceData.overtime_hours,
            attendanceData.notes,
            attendanceData.is_present,
            attendanceData.is_late,
            attendanceData.is_absent,
            attendanceData.on_leave,
            attendanceData.leave_type_id,
            attendanceData.leave_request_id,
            attendanceData.is_undertime,
            attendanceData.is_halfday,
            attendanceData.is_dayoff,
            attendanceData.is_regular_holiday,
            attendanceData.is_special_holiday,
            attendanceData.created_at,
            attendanceData.updated_at,
          ]
        );
        results.successful++;
      } catch (dbError) {
        results.errors.push(
          `Row ${rowIndex}: Database error - ${dbError.message}`
        );
        results.failed++;
      }
    } catch (error) {
      results.errors.push(
        `Row ${rowIndex}: Unexpected error - ${error.message}`
      );
      results.failed++;
    }
  }

  return results;
};

const uploadAttendanceFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let records = [];

    // Parse the file based on extension
    if (fileExtension === ".xlsx" || fileExtension === ".xls") {
      // Parse Excel file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const worksheet = workbook.getWorksheet(1); // First worksheet
      const headers = [];

      // Get headers from first row
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.text.trim();
      });

      // Process data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          // Skip header row
          const record = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              // Map headers to expected field names
              const fieldMap = {
                "Employee ID": "employee_id",
                "Date (YYYY-MM-DD)": "date",
                "Time In (HH:MM)": "time_in",
                "Time Out (HH:MM)": "time_out",
                "Overtime Hours": "overtime_hours",
                "Break Duration (minutes)": "break_duration",
                "Is Day Off (TRUE/FALSE)": "is_dayoff",
                "Regular Holiday (TRUE/FALSE)": "is_regular_holiday",
                "Special Holiday (TRUE/FALSE)": "is_special_holiday",
                Notes: "notes",
              };

              const fieldName =
                fieldMap[header] || header.toLowerCase().replace(/\s+/g, "_");
              record[fieldName] = cell.text.trim();
            }
          });

          // Only add record if it has at least employee_id
          if (record.employee_id) {
            records.push(record);
          }
        }
      });
    } else if (fileExtension === ".csv") {
      // Parse CSV file
      return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => {
            records.push(data);
          })
          .on("end", async () => {
            try {
              await processUploadedRecords(records, res, filePath);
              resolve();
            } catch (error) {
              reject(error);
            }
          })
          .on("error", (error) => {
            reject(error);
          });
      });
    } else {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message:
          "Invalid file format. Please upload .xlsx, .xls, or .csv files only.",
      });
    }

    await processUploadedRecords(records, res, filePath);
  } catch (error) {
    console.error("Error processing upload:", error);

    // Clean up uploaded file with debugging
    if (req.file && req.file.path) {
      console.log(
        "Attempting cleanup - File path:",
        req.file.path,
        "Exists:",
        fs.existsSync(req.file.path)
      );
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log("File cleanup successful");
        } else {
          console.log("File doesn't exist for cleanup");
        }
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to process uploaded file",
      error: error.message,
    });
  }
};

const processUploadedRecords = async (records, res, filePath) => {
  try {
    // Process attendance data using the updated async function
    const results = await processAttendanceData(records);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Return response with results
    if (results.errors.length > 0 && results.successful === 0) {
      return res.status(400).json({
        success: false,
        message: "All records failed validation or processing",
        errors: results.errors,
        totalRecords: records.length,
        successfulRecords: results.successful,
        failedRecords: results.failed,
      });
    }

    res.json({
      success: true,
      message: "Bulk upload completed",
      totalRecords: records.length,
      successfulRecords: results.successful,
      failedRecords: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
      summary: {
        processedRecords: results.successful,
        skippedRecords: results.failed,
        hasErrors: results.errors.length > 0,
      },
    });
  } catch (error) {
    // Clean up uploaded file with debugging
    if (filePath) {
      console.log(
        "Attempting cleanup in submitAttendance - File path:",
        filePath,
        "Exists:",
        fs.existsSync(filePath)
      );
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("File cleanup successful in submitAttendance");
        } else {
          console.log("File doesn't exist for cleanup in submitAttendance");
        }
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }

    throw error;
  }
};

const generateSimpleAttendanceTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Simple Attendance Template");

    // Define columns with headers to match database schema
    // Width is header character count + 4 eg Employee ID has 11 characters so 15 is a good width
    worksheet.columns = [
      { header: "Employee ID", key: "employee_id", width: 16 },
      { header: "Date", key: "date", width: 16 },
      { header: "Time In", key: "time_in", width: 16 },
      { header: "Time Out", key: "time_out", width: 16 },
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    const dateCol = worksheet.getColumn("date");
    const timeInCol = worksheet.getColumn("time_in");
    const timeOutCol = worksheet.getColumn("time_out");
    headerRow.font = { color: { argb: "FFF0EDEE" } };
    headerRow.border = {
      top: { style: "thin", color: { argb: "FFF0EDEE" } },
      left: { style: "thin", color: { argb: "FFF0EDEE" } },
      bottom: { style: "thin", color: { argb: "FFF0EDEE" } },
      right: { style: "thin", color: { argb: "FFF0EDEE" } },
    };

    const idCell = headerRow.getCell(1);
    const dateCell = headerRow.getCell(2);
    const timeInCell = headerRow.getCell(3);
    const timeOutCell = headerRow.getCell(4);

    idCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2C666E" },
    };
    dateCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2C666E" },
    };
    timeInCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2C666E" },
    };
    timeOutCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2C666E" },
    };

    idCell.protection = { locked: true };
    dateCell.protection = { locked: true };
    timeInCell.protection = { locked: true };
    timeOutCell.protection = { locked: true };

    headerRow.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    dateCol.numFmt = "mm/dd/yyyy";
    timeInCol.numFmt = "hh:mm AM/PM";
    timeOutCol.numFmt = "hh:mm AM/PM";

    // Generate Instructions
    worksheet.getColumn("F").width = 80;
    worksheet.getCell("F1").value = "Instructions:";
    worksheet.getCell("F1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFF00" },
    };

    worksheet.getCell("F1").font = { bold: true, color: { argb: "FF000000" } };
    worksheet.getCell("F2").value =
      "1. Employee ID: Unique identifier for each employee (e.g., 2025-00001).";
    worksheet.getCell("F3").value =
      "2. Date: Format as MM/DD/YYYY (e.g., 09/14/2025).";
    worksheet.getCell("F4").value =
      "3. Time In: Format as HH:MM AM/PM (e.g., 08:00 AM).";
    worksheet.getCell("F5").value =
      "4. Time Out: Format as HH:MM AM/PM (e.g., 05:00 PM).";
    worksheet.getCell("F6").value =
      "5. Ensure no duplicate entries for the same employee on the same date.";
    worksheet.getCell("F7").value =
      "6. Leave blank if the employee is either ABSENT, ON LEAVE or DAY OFF that day.";

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance-upload-template.xlsx"
    );
    res.setHeader("Content-Length", buffer.length);

    // Send file
    res.send(buffer);
  } catch (error) {
    console.error("Error generating attendance template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate attendance template",
      error: error.message,
    });
  }
};

const generateAttendanceTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Template");

    // Define columns with headers to match database schema
    // Width is header character count + 4 eg Employee ID has 11 characters so 15 is a good width
    worksheet.columns = [
      { header: "Employee ID", key: "employee_id", width: 15 },
      { header: "Date (YYYY-MM-DD)", key: "date", width: 21 },
      { header: "Time In (YYYY-MM-DD HH:MM:SS)", key: "time_in", width: 33 },
      { header: "Time Out (YYYY-MM-DD HH:MM:SS)", key: "time_out", width: 34 },
      { header: "Total Hours", key: "total_hours", width: 15 },
      { header: "Overtime Hours", key: "overtime_hours", width: 18 },
      { header: "Notes", key: "notes", width: 32 },
      { header: "Is Present (TRUE/FALSE)", key: "is_present", width: 27 },
      { header: "Is Late (TRUE/FALSE)", key: "is_late", width: 24 },
      { header: "Is Absent (TRUE/FALSE)", key: "is_absent", width: 26 },
      { header: "On Leave (TRUE/FALSE)", key: "on_leave", width: 25 },
      { header: "Leave Type ID", key: "leave_type_id", width: 17 },
      { header: "Leave Request ID", key: "leave_request_id", width: 20 },
      { header: "Is Undertime (TRUE/FALSE)", key: "is_undertime", width: 29 },
      { header: "Is Halfday (TRUE/FALSE)", key: "is_halfday", width: 27 },
      { header: "Is Day Off (TRUE/FALSE)", key: "is_dayoff", width: 27 },
      {
        header: "Regular Holiday (TRUE/FALSE)",
        key: "is_regular_holiday",
        width: 32,
      },
      {
        header: "Special Holiday (TRUE/FALSE)",
        key: "is_special_holiday",
        width: 32,
      },
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFF0EDEE" } };
    headerRow.height = 25;
    headerRow.border = {
      top: { style: "thin", color: { argb: "FFF0EDEE" } },
      left: { style: "thin", color: { argb: "FFF0EDEE" } },
      bottom: { style: "thin", color: { argb: "FFF0EDEE" } },
      right: { style: "thin", color: { argb: "FFF0EDEE" } },
    };

    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2C666E" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Add sample data rows
    worksheet.addRow({
      employee_id: "EMP001",
      date: "2025-09-14",
      time_in: "2025-09-14 08:00:00",
      time_out: "2025-09-14 17:00:00",
      total_hours: "8.00",
      overtime_hours: "1.5",
      notes: "Regular working day with overtime",
      is_present: "TRUE",
      is_late: "FALSE",
      is_absent: "FALSE",
      on_leave: "FALSE",
      leave_type_id: "",
      leave_request_id: "",
      is_undertime: "FALSE",
      is_halfday: "FALSE",
      is_dayoff: "FALSE",
      is_regular_holiday: "FALSE",
      is_special_holiday: "FALSE",
    });

    worksheet.addRow({
      employee_id: "EMP002",
      date: "2025-09-15",
      time_in: "2025-09-15 08:30:00",
      time_out: "2025-09-15 17:30:00",
      total_hours: "8.00",
      overtime_hours: "0",
      notes: "Late arrival",
      is_present: "TRUE",
      is_late: "TRUE",
      is_absent: "FALSE",
      on_leave: "FALSE",
      leave_type_id: "",
      leave_request_id: "",
      is_undertime: "FALSE",
      is_halfday: "FALSE",
      is_dayoff: "FALSE",
      is_regular_holiday: "FALSE",
      is_special_holiday: "FALSE",
    });

    worksheet.addRow({
      employee_id: "EMP003",
      date: "2025-09-16",
      time_in: "",
      time_out: "",
      total_hours: "0",
      overtime_hours: "0",
      notes: "Day off - weekend",
      is_present: "FALSE",
      is_late: "FALSE",
      is_absent: "FALSE",
      on_leave: "FALSE",
      leave_type_id: "",
      leave_request_id: "",
      is_undertime: "FALSE",
      is_halfday: "FALSE",
      is_dayoff: "TRUE",
      is_regular_holiday: "FALSE",
      is_special_holiday: "FALSE",
    });

    worksheet.addRow({
      employee_id: "EMP004",
      date: "2025-12-25",
      time_in: "2025-12-25 08:00:00",
      time_out: "2025-12-25 17:00:00",
      total_hours: "8.00",
      overtime_hours: "0",
      notes: "Christmas Day - Holiday work",
      is_present: "TRUE",
      is_late: "FALSE",
      is_absent: "FALSE",
      on_leave: "FALSE",
      leave_type_id: "",
      leave_request_id: "",
      is_undertime: "FALSE",
      is_halfday: "FALSE",
      is_dayoff: "FALSE",
      is_regular_holiday: "TRUE",
      is_special_holiday: "FALSE",
    });

    // Add data validation with dropdowns
    // Boolean fields validation (TRUE/FALSE dropdown)
    const booleanColumns = ["H", "I", "J", "K", "N", "O", "P", "Q", "R"]; // All boolean columns
    booleanColumns.forEach((col) => {
      worksheet.dataValidations.add(`${col}2:${col}99999`, {
        type: "list",
        allowBlank: true,
        formulae: ['"TRUE,FALSE"'],
        showErrorMessage: true,
        errorTitle: "Invalid Value",
        error: "Please select TRUE or FALSE from the dropdown",
      });
    });

    // Fetch leave types from database for lookup table
    let leaveTypes = [];
    try {
      const leaveTypesResult = await pool.query(
        "SELECT leave_type_id, name, description FROM leave_types ORDER BY leave_type_id"
      );
      leaveTypes = leaveTypesResult.rows;
    } catch (dbError) {
      console.error("Error fetching leave types:", dbError);
      // Continue with empty array if database error
    }

    // Add Leave Types lookup worksheet
    const leaveTypesSheet = workbook.addWorksheet("Leave Types Lookup");

    // Set up leave types lookup table
    leaveTypesSheet.columns = [
      { header: "Leave Type ID", key: "leave_type_id", width: 15 },
      { header: "Leave Type Name", key: "name", width: 25 },
      { header: "Description", key: "description", width: 50 },
    ];

    // Style the header row for leave types
    const leaveHeaderRow = leaveTypesSheet.getRow(1);
    leaveHeaderRow.font = { bold: true, color: { argb: "FFF0EDEE" } };
    leaveHeaderRow.height = 25;
    leaveHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2C666E" },
    };
    leaveHeaderRow.alignment = { vertical: "middle", horizontal: "center" };

    // Add leave types data
    if (leaveTypes.length > 0) {
      leaveTypes.forEach((leaveType) => {
        leaveTypesSheet.addRow({
          leave_type_id: leaveType.leave_type_id,
          name: leaveType.name,
          description: leaveType.description || "No description available",
        });
      });
    } else {
      // Add sample data if no database connection
      leaveTypesSheet.addRow({
        leave_type_id: 1,
        name: "Sick Leave",
        description: "Medical related absences",
      });
      leaveTypesSheet.addRow({
        leave_type_id: 2,
        name: "Vacation Leave",
        description: "Personal time off for vacation",
      });
      leaveTypesSheet.addRow({
        leave_type_id: 3,
        name: "Emergency Leave",
        description: "Urgent personal matters",
      });
    }

    // Add instructions worksheet
    const instructionsSheet = workbook.addWorksheet("Instructions");
    const instructions = [
      "BULK ATTENDANCE UPLOAD INSTRUCTIONS",
      "",
      "1. REQUIRED FIELDS:",
      "   • Employee ID: Must match existing employee IDs in the system",
      "   • Date: Format YYYY-MM-DD (e.g., 2025-09-14)",
      "",
      "2. TIME FIELDS:",
      "   • Time In/Out: Format YYYY-MM-DD HH:MM:SS (e.g., 2025-09-14 08:30:00)",
      "   • Leave empty for absent days or day-offs",
      "   • Use 24-hour format",
      "",
      "3. NUMERIC FIELDS:",
      "   • Total Hours: Decimal format (e.g., 8.00, 4.50)",
      "   • Overtime Hours: Decimal format (e.g., 1.5 for 1 hour 30 minutes)",
      "   • Leave Type/Request IDs: Integer numbers only",
      "",
      "4. BOOLEAN FIELDS (Use dropdown - TRUE/FALSE):",
      "   • Is Present: TRUE if employee worked that day",
      "   • Is Late: TRUE if employee arrived late",
      "   • Is Absent: TRUE if employee was absent",
      "   • On Leave: TRUE if employee was on approved leave",
      "   • Is Undertime: TRUE if employee left early",
      "   • Is Halfday: TRUE if employee worked half day",
      "   • Is Day Off: TRUE for scheduled days off",
      "   • Regular Holiday: TRUE for double-pay holidays (Christmas, New Year, etc.)",
      "   • Special Holiday: TRUE for 1.3x pay holidays (EDSA Day, etc.)",
      "",
      "5. LEAVE FIELDS:",
      "   • Leave Type ID: Reference to leave_types table (see 'Leave Types Lookup' sheet)",
      "   • Leave Request ID: Reference to specific leave request if applicable",
      "   • Check the 'Leave Types Lookup' worksheet for valid Leave Type IDs",
      "",
      "6. PAYROLL FLAGS:",
      "   • Regular Holiday: Double pay (200% of daily rate)",
      "   • Special Holiday: 130% of daily rate",
      "   • Day Off: For scheduled rest days",
      "",
      "7. IMPORTANT NOTES:",
      "   • All boolean fields have dropdown menus - click to select TRUE/FALSE",
      "   • Leave time fields empty for absent/day-off records",
      "   • Total Hours will be auto-calculated if not provided",
      "   • Maximum 1000 records per upload",
      "   • Only one attendance flag should be TRUE per record (present/absent/leave)",
      "   • System will warn if employee already has attendance for the same date",
      "",
      "8. VALIDATION RULES:",
      "   • If Is Present = TRUE, Time In is usually required",
      "   • If On Leave = TRUE, provide Leave Type ID",
      "   • If Day Off = TRUE, set Is Present = FALSE",
      "   • Holiday flags can be combined with present/absent status",
      "   • One employee cannot have multiple records for the same date",
      "",
      "9. DUPLICATE RECORDS:",
      "   • Each employee can only have ONE record per date",
      "   • If employee already has attendance for a date, upload will overwrite it",
      "   • Review warnings carefully before confirming upload",
      "",
      "10. BEFORE UPLOADING:",
      "   • Remove sample data rows (rows 2-5)",
      "   • Verify all Employee IDs exist in system",
      "   • Check date and time formats are correct",
      "   • Ensure boolean fields use dropdown selections",
      "   • Refer to 'Leave Types Lookup' sheet for valid Leave Type IDs",
      "   • Save file as .xlsx format",
    ];

    instructions.forEach((instruction, index) => {
      const row = instructionsSheet.addRow([instruction]);
      if (index === 0) {
        row.font = { bold: true, size: 14 };
      } else if (instruction.match(/^\d+\./)) {
        row.font = { bold: true };
      }
    });

    instructionsSheet.getColumn(1).width = 80;

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance-upload-template.xlsx"
    );
    res.setHeader("Content-Length", buffer.length);

    // Send file
    res.send(buffer);
  } catch (error) {
    console.error("Error generating template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate template",
      error: error.message,
    });
  }
};

const generateCSVTemplate = async (req, res) => {
  try {
    const headers = [
      "employee_id",
      "date",
      "time_in",
      "time_out",
      "total_hours",
      "overtime_hours",
      "notes",
      "is_present",
      "is_late",
      "is_absent",
      "on_leave",
      "leave_type_id",
      "leave_request_id",
      "is_undertime",
      "is_halfday",
      "is_dayoff",
      "is_regular_holiday",
      "is_special_holiday",
    ];

    const sampleData = [
      [
        "EMP001",
        "2025-09-14",
        "2025-09-14 08:00:00",
        "2025-09-14 17:00:00",
        "8.00",
        "1.5",
        "Regular working day with overtime",
        "TRUE",
        "FALSE",
        "FALSE",
        "FALSE",
        "",
        "",
        "FALSE",
        "FALSE",
        "FALSE",
        "FALSE",
        "FALSE",
      ],
      [
        "EMP002",
        "2025-09-15",
        "2025-09-15 08:30:00",
        "2025-09-15 17:30:00",
        "8.00",
        "0",
        "Late arrival",
        "TRUE",
        "TRUE",
        "FALSE",
        "FALSE",
        "",
        "",
        "FALSE",
        "FALSE",
        "FALSE",
        "FALSE",
        "FALSE",
      ],
      [
        "EMP003",
        "2025-09-16",
        "",
        "",
        "0",
        "0",
        "Day off - weekend",
        "FALSE",
        "FALSE",
        "FALSE",
        "FALSE",
        "",
        "",
        "FALSE",
        "FALSE",
        "TRUE",
        "FALSE",
        "FALSE",
      ],
    ];

    const csvContent = [
      headers.join(","),
      ...sampleData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance-upload-template.csv"
    );
    res.send(csvContent);
  } catch (error) {
    console.error("Error generating CSV template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate CSV template",
      error: error.message,
    });
  }
};

// NEW WORKFLOW: Process file for preview (validate but don't insert)
const processAttendanceFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // console.log("File upload info:", {
    //   originalname: req.file.originalname,
    //   path: req.file.path,
    //   size: req.file.size,
    //   exists: fs.existsSync(req.file.path),
    // });

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let records = [];

    // Parse the file based on extension
    if (fileExtension === ".xlsx" || fileExtension === ".xls") {
      records = await parseExcelFile(filePath);
    } else if (fileExtension === ".csv") {
      records = await parseCSVFile(filePath);
    } else {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message:
          "Invalid file format. Please upload .xlsx, .xls, or .csv files only.",
      });
    }

    // Validate and process the records (but don't insert to database)
    const { processedRecords, errors } = await validateAndProcessAttendanceData(
      records
    );

    // Check for duplicate records (within file and in database)
    const { duplicateWarnings, existingRecords } =
      await checkExistingAttendanceRecords(processedRecords);

    // Separate file duplicates from database duplicates
    const fileDuplicateErrors = duplicateWarnings
      .filter((warning) => warning.type === "file_duplicate")
      .map((warning) => warning.message);

    const databaseDuplicateWarnings = duplicateWarnings.filter(
      (warning) => warning.type === "database_duplicate"
    );

    // File duplicates are errors (same employee multiple times in file for same date)
    // Database duplicates are warnings (will show overwrite option)
    const allErrors = [...errors, ...fileDuplicateErrors];

    if (allErrors.length > 0) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);

      return res.status(400).json({
        success: false,
        message: "Validation errors found",
        errors: allErrors,
        totalRecords: records.length,
        validRecords: processedRecords.length,
        errorCount: allErrors.length,
        duplicateWarnings:
          databaseDuplicateWarnings.length > 0
            ? databaseDuplicateWarnings
            : undefined,
      });
    }

    if (processedRecords.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);

      return res.status(400).json({
        success: false,
        message: "No valid records found in the uploaded file",
      });
    }

    // Check if employees exist and get their schedule information
    const employeeIds = [
      ...new Set(processedRecords.map((record) => record.employee_id)),
    ];
    const existingEmployees = await pool.query(
      `SELECT 
         e.employee_id, 
         e.first_name, 
         e.last_name, 
         p.title AS position,
         s.schedule_id,
         s.schedule_name,
         s.start_time,
         s.end_time
       FROM employees e 
       JOIN contracts c ON e.contract_id = c.contract_id
       JOIN positions p ON c.position_id = p.position_id
       LEFT JOIN schedules s ON e.schedule_id = s.schedule_id
       WHERE e.employee_id = ANY($1)`,
      [employeeIds]
    );

    const existingEmployeeIds = new Set(
      existingEmployees.rows.map((emp) => emp.employee_id)
    );
    const missingEmployeeIds = employeeIds.filter(
      (id) => !existingEmployeeIds.has(id)
    );

    // Check for employees without schedules
    const employeesWithoutSchedule = existingEmployees.rows.filter(
      (emp) => !emp.schedule_id
    );
    const employeesWithoutScheduleIds = employeesWithoutSchedule.map(
      (emp) => emp.employee_id
    );

    if (missingEmployeeIds.length > 0) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);

      return res.status(400).json({
        success: false,
        message: "Some employee IDs do not exist in the system",
        missingEmployeeIds: missingEmployeeIds,
        validEmployeeIds: employeeIds.filter((id) =>
          existingEmployeeIds.has(id)
        ),
      });
    }

    // Add employee information to records for preview
    const employeeMap = new Map(
      existingEmployees.rows.map((emp) => [emp.employee_id, emp])
    );
    const recordsWithEmployeeInfo = processedRecords.map((record) => ({
      ...record,
      employee_name: `${employeeMap.get(record.employee_id)?.first_name} ${
        employeeMap.get(record.employee_id)?.last_name
      }`,
      employee_position: employeeMap.get(record.employee_id)?.position,
      has_schedule: !!employeeMap.get(record.employee_id)?.schedule_id,
      schedule_name: employeeMap.get(record.employee_id)?.schedule_name,
    }));

    // Generate a temporary session ID to store the data for later submission
    const sessionId =
      Date.now() + "-" + Math.random().toString(36).substring(2);

    // Store the processed data temporarily (you might want to use Redis or a temp table for this)
    // For now, we'll include it in the response and let frontend handle it

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message:
        databaseDuplicateWarnings.length > 0
          ? "File processed successfully. Warning: Some records will overwrite existing data. Review before submitting."
          : "File processed successfully. Review the records before submitting.",
      sessionId: sessionId,
      totalRecords: processedRecords.length,
      records: recordsWithEmployeeInfo,
      duplicateWarnings:
        databaseDuplicateWarnings.length > 0
          ? databaseDuplicateWarnings
          : undefined,
      warnings: {
        ...(employeesWithoutScheduleIds.length > 0 && {
          employeesWithoutSchedule: {
            count: employeesWithoutScheduleIds.length,
            employeeIds: employeesWithoutScheduleIds,
            employees: employeesWithoutSchedule.map((emp) => ({
              employee_id: emp.employee_id,
              name: `${emp.first_name} ${emp.last_name}`,
              position: emp.position,
            })),
            message:
              "Some employees don't have schedules assigned. They may not appear in schedule-based reports.",
          },
        }),
        ...(databaseDuplicateWarnings.length > 0 && {
          duplicateRecords: {
            count: databaseDuplicateWarnings.length,
            warnings: databaseDuplicateWarnings,
            message:
              "Some records will overwrite existing attendance data in the database. Confirm to proceed.",
            requiresConfirmation: true,
          },
        }),
      },
      summary: {
        employeesAffected: employeeIds.length,
        recordsWithTimeIn: processedRecords.filter((r) => r.time_in).length,
        recordsWithTimeOut: processedRecords.filter((r) => r.time_out).length,
        dayOffRecords: processedRecords.filter((r) => r.is_dayoff).length,
        holidayRecords: processedRecords.filter(
          (r) => r.is_regular_holiday || r.is_special_holiday
        ).length,
        presentRecords: processedRecords.filter((r) => r.is_present).length,
        absentRecords: processedRecords.filter((r) => r.is_absent).length,
        leaveRecords: processedRecords.filter((r) => r.on_leave).length,
      },
    });
  } catch (error) {
    console.error("Error processing file:", error);

    // Clean up uploaded file with debugging
    if (req.file && req.file.path) {
      console.log(
        "Attempting cleanup in processAttendance - File path:",
        req.file.path,
        "Exists:",
        fs.existsSync(req.file.path)
      );
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log("File cleanup successful in processAttendance");
        } else {
          console.log("File doesn't exist for cleanup in processAttendance");
        }
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to process uploaded file",
      error: error.message,
    });
  }
};

// NEW WORKFLOW: Submit validated records to database
const submitAttendanceRecords = async (req, res) => {
  try {
    const { records, sessionId, overwriteExisting } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No records provided for submission",
      });
    }

    // Remove employee info fields that don't belong in database
    const cleanRecords = records.map((record) => {
      const {
        employee_name,
        employee_position,
        has_schedule,
        schedule_name,
        ...cleanRecord
      } = record;
      return cleanRecord;
    });

    // Check for existing records again before insertion
    const { duplicateWarnings, existingRecords } =
      await checkExistingAttendanceRecords(cleanRecords);

    // If there are database duplicates and user hasn't approved overwrite, return warning
    const hasDatabaseDuplicates = duplicateWarnings.some(
      (w) => w.type === "database_duplicate"
    );
    if (hasDatabaseDuplicates && !overwriteExisting) {
      return res.status(409).json({
        success: false,
        message:
          "Duplicate records found. Please confirm if you want to overwrite existing records.",
        duplicateWarnings: duplicateWarnings.filter(
          (w) => w.type === "database_duplicate"
        ),
        requiresConfirmation: true,
      });
    }

    // Insert or update attendance records using raw SQL
    let insertedCount = 0;
    let updatedCount = 0;
    const errors = [];
    const existingRecordIds = new Set(
      existingRecords.map((er) => `${er.employee_id}_${er.date}`)
    );

    // Also check for duplicates within the records being submitted
    const recordKeys = new Set();
    const duplicatesInSubmission = [];

    for (const record of cleanRecords) {
      const recordKey = `${record.employee_id}_${record.date}`;

      if (recordKeys.has(recordKey)) {
        duplicatesInSubmission.push(recordKey);
        continue; // Skip duplicate records within this submission
      }
      recordKeys.add(recordKey);

      try {
        if (existingRecordIds.has(recordKey) && overwriteExisting) {
          // Update existing record
          await pool.query(
            `UPDATE attendance SET 
              time_in = $3, time_out = $4, total_hours = $5, overtime_hours = $6,
              notes = $7, is_present = $8, is_late = $9, is_absent = $10, 
              on_leave = $11, leave_type_id = $12, leave_request_id = $13, 
              is_undertime = $14, is_halfday = $15, is_dayoff = $16,
              is_regular_holiday = $17, is_special_holiday = $18, updated_at = $19
             WHERE employee_id = $1 AND date = $2`,
            [
              record.employee_id,
              record.date,
              record.time_in,
              record.time_out,
              record.total_hours,
              record.overtime_hours,
              record.notes,
              record.is_present,
              record.is_late,
              record.is_absent,
              record.on_leave,
              record.leave_type_id,
              record.leave_request_id,
              record.is_undertime,
              record.is_halfday,
              record.is_dayoff,
              record.is_regular_holiday,
              record.is_special_holiday,
              new Date().toISOString(),
            ]
          );
          updatedCount++;
        } else if (!existingRecordIds.has(recordKey)) {
          // Insert new record with ON CONFLICT handling to prevent duplicates
          try {
            await pool.query(
              `INSERT INTO attendance (
                employee_id, date, time_in, time_out, total_hours, overtime_hours,
                notes, is_present, is_late, is_absent, on_leave, leave_type_id,
                leave_request_id, is_undertime, is_halfday, is_dayoff,
                is_regular_holiday, is_special_holiday, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
              )`,
              [
                record.employee_id,
                record.date,
                record.time_in,
                record.time_out,
                record.total_hours,
                record.overtime_hours,
                record.notes,
                record.is_present,
                record.is_late,
                record.is_absent,
                record.on_leave,
                record.leave_type_id,
                record.leave_request_id,
                record.is_undertime,
                record.is_halfday,
                record.is_dayoff,
                record.is_regular_holiday,
                record.is_special_holiday,
                record.created_at,
                record.updated_at,
              ]
            );
            insertedCount++;
          } catch (insertError) {
            // Check if it's a duplicate key error - if so, update instead
            if (insertError.code === "23505" && overwriteExisting) {
              // Unique constraint violation - try to update instead
              try {
                await pool.query(
                  `UPDATE attendance SET 
                    time_in = $3, time_out = $4, total_hours = $5, overtime_hours = $6,
                    notes = $7, is_present = $8, is_late = $9, is_absent = $10, 
                    on_leave = $11, leave_type_id = $12, leave_request_id = $13, 
                    is_undertime = $14, is_halfday = $15, is_dayoff = $16,
                    is_regular_holiday = $17, is_special_holiday = $18, updated_at = $19
                   WHERE employee_id = $1 AND date = $2`,
                  [
                    record.employee_id,
                    record.date,
                    record.time_in,
                    record.time_out,
                    record.total_hours,
                    record.overtime_hours,
                    record.notes,
                    record.is_present,
                    record.is_late,
                    record.is_absent,
                    record.on_leave,
                    record.leave_type_id,
                    record.leave_request_id,
                    record.is_undertime,
                    record.is_halfday,
                    record.is_dayoff,
                    record.is_regular_holiday,
                    record.is_special_holiday,
                    new Date().toISOString(),
                  ]
                );
                updatedCount++;
              } catch (updateError) {
                errors.push(
                  `Failed to update existing record for ${record.employee_id} on ${record.date}: ${updateError.message}`
                );
              }
            } else if (insertError.code === "23505") {
              // Duplicate without permission to overwrite
              errors.push(
                `Duplicate record detected for ${record.employee_id} on ${record.date}: Record already exists and overwrite not approved`
              );
            } else {
              throw insertError; // Re-throw if it's not a duplicate error
            }
          }
        } else {
          // Record exists but overwrite not approved
          errors.push(
            `Skipped record for ${record.employee_id} on ${record.date}: Record already exists and overwrite not approved`
          );
        }
      } catch (dbError) {
        errors.push(
          `Failed to process record for ${record.employee_id} on ${record.date}: ${dbError.message}`
        );
      }
    }

    // Add errors for duplicates within submission
    if (duplicatesInSubmission.length > 0) {
      duplicatesInSubmission.forEach((duplicate) => {
        const [employeeId, date] = duplicate.split("_");
        errors.push(
          `Duplicate record in submission for employee ${employeeId} on ${date}`
        );
      });
    }

    if (errors.length > 0 && insertedCount === 0 && updatedCount === 0) {
      return res.status(500).json({
        success: false,
        message: "All records failed to process",
        errors: errors,
        totalRecords: cleanRecords.length,
        insertedRecords: insertedCount,
        updatedRecords: updatedCount,
        failedRecords: errors.length,
      });
    }

    res.json({
      success: true,
      message: `Attendance records processed successfully. ${insertedCount} inserted, ${updatedCount} updated.`,
      totalRecords: cleanRecords.length,
      insertedRecords: insertedCount,
      updatedRecords: updatedCount,
      failedRecords: errors.length,
      sessionId: sessionId,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        employeesAffected: [...new Set(cleanRecords.map((r) => r.employee_id))]
          .length,
        recordsWithTimeIn: cleanRecords.filter((r) => r.time_in).length,
        recordsWithTimeOut: cleanRecords.filter((r) => r.time_out).length,
        dayOffRecords: cleanRecords.filter((r) => r.is_dayoff).length,
        holidayRecords: cleanRecords.filter(
          (r) => r.is_regular_holiday || r.is_special_holiday
        ).length,
      },
    });
  } catch (error) {
    console.error("Error submitting records:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit attendance records",
      error: error.message,
    });
  }
};

// Helper function to parse Excel files
const parseExcelFile = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet(1); // First worksheet
  const headers = [];
  const records = [];

  // Get headers from first row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = cell.text.trim();
  });

  // Process data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      // Skip header row
      const record = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          // Map headers to expected field names
          const fieldMap = {
            "Employee ID": "employee_id",
            "Date (YYYY-MM-DD)": "date",
            "Time In (YYYY-MM-DD HH:MM:SS)": "time_in",
            "Time Out (YYYY-MM-DD HH:MM:SS)": "time_out",
            "Total Hours": "total_hours",
            "Overtime Hours": "overtime_hours",
            Notes: "notes",
            "Is Present (TRUE/FALSE)": "is_present",
            "Is Late (TRUE/FALSE)": "is_late",
            "Is Absent (TRUE/FALSE)": "is_absent",
            "On Leave (TRUE/FALSE)": "on_leave",
            "Leave Type ID": "leave_type_id",
            "Leave Request ID": "leave_request_id",
            "Is Undertime (TRUE/FALSE)": "is_undertime",
            "Is Halfday (TRUE/FALSE)": "is_halfday",
            "Is Day Off (TRUE/FALSE)": "is_dayoff",
            "Regular Holiday (TRUE/FALSE)": "is_regular_holiday",
            "Special Holiday (TRUE/FALSE)": "is_special_holiday",
          };

          const fieldName =
            fieldMap[header] || header.toLowerCase().replace(/\s+/g, "_");
          record[fieldName] = cell.text.trim();
        }
      });

      // Only add record if it has at least employee_id
      if (record.employee_id) {
        records.push(record);
      }
    }
  });

  return records;
};

// Helper function to parse CSV files
const parseCSVFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const records = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        records.push(data);
      })
      .on("end", () => {
        resolve(records);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

export {
  generateSimpleAttendanceTemplate,
  generateAttendanceTemplate,
  generateCSVTemplate,
  uploadAttendanceFile,
  processAttendanceFile,
  submitAttendanceRecords,
};
