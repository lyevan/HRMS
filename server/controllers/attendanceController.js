import { pool } from "../config/db.js";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import path from "path";
import fs from "fs";
import {
  getHolidayInfo,
  enhancedClockInCalculation,
  enhancedClockOutCalculation,
  updateAttendanceWithEnhancedCalculations,
  roundToPayrollIncrement,
} from "../utils/attendanceCalculations.js";
import {
  normalizeToPhilippineDate,
  normalizeToPhilippineDateTime,
  createDateRangeQuery,
  debugDateFormats,
} from "../utils/dateUtils.js";
import ExcelJS from "exceljs";

dayjs.extend(utc);
dayjs.extend(timezone);

// DANGER: Debug mode - use fixed date/time for testing
const isDebugMode = false;
const isDebugDayoff = false;
const isDebugNightDiff = false;

// Helper function to check if a date is a holiday (deprecated - use getHolidayInfo from utils)
const checkHolidayStatus = async (date) => {
  try {
    // Use the enhanced holiday info function
    const holidayInfo = await getHolidayInfo(date);
    return {
      isRegularHoliday: holidayInfo.isRegularHoliday,
      isSpecialHoliday: holidayInfo.isSpecialHoliday,
      holidayName: holidayInfo.holidayName,
    };
  } catch (error) {
    console.error("Error checking holiday status:", error);
    return {
      isRegularHoliday: false,
      isSpecialHoliday: false,
      holidayName: null,
    };
  }
};

// Payroll-friendly hour rounding function
// const roundToPayrollIncrement = (hours) => {
//   const wholeHours = Math.floor(hours);
//   const minutes = (hours - wholeHours) * 60;

//   if (minutes <= 15) {
//     // 0-15 minutes: round down
//     return wholeHours;
//   } else if (minutes <= 45) {
//     // 16-45 minutes: round to 30 minutes (0.5 hours)
//     return wholeHours + 0.5;
//   } else {
//     // 46-59 minutes: round up to next hour
//     return wholeHours + 1;
//   }
// };

//     CASE WHEN a.total_hours IS NOT NULL THEN a.total_hours * e.hourly_rate ELSE NULL END AS daily_pay,
//     CASE WHEN a.overtime_hours IS NOT NULL THEN a.overtime_hours * e.hourly_rate * 1.5 ELSE NULL END AS overtime_pay

// Get all attendance records with calculated hours
export const getAllAttendance = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.*, e.first_name, e.last_name,
        COALESCE(a.total_hours, 0) as calculated_total_hours,
        COALESCE(a.overtime_hours, 0) as overtime_hours,
        s.start_time,
        s.end_time,
        s.days_of_week,
        s.break_duration,
        s.break_start,
        s.break_end,
        ts.start_date as timesheet_start_date,
        ts.end_date as timesheet_end_date,
        ts.is_consumed as is_timesheet_consumed
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      LEFT JOIN schedules s ON e.schedule_id = s.schedule_id
      LEFT JOIN timesheets ts ON a.timesheet_id = ts.timesheet_id
      ORDER BY a.date DESC, a.time_in DESC
    `);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployeeAttendance = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const result = await pool.query(
      `
      SELECT 
        a.*, e.first_name, e.last_name,
        COALESCE(a.total_hours, 0) as calculated_total_hours,
        COALESCE(a.overtime_hours, 0) as overtime_hours,
        s.break_duration,
        s.break_start,
        s.break_end
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      LEFT JOIN schedules s ON e.schedule_id = s.schedule_id
      WHERE a.employee_id = $1
      ORDER BY a.date DESC, a.time_in DESC
    `,
      [employee_id]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTodayAllAttendance = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.*, e.first_name, e.last_name,
        COALESCE(a.total_hours, 0) as calculated_total_hours,
        COALESCE(a.overtime_hours, 0) as overtime_hours,
        s.break_duration,
        s.break_start,
        s.break_end
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      LEFT JOIN schedules s ON e.schedule_id = s.schedule_id
      WHERE a.date = CURRENT_DATE
      ORDER BY a.time_in DESC
    `);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clockIn = async (req, res) => {
  try {
    const { employee_id, rfid } = req.body;

    // DEBUG block using UTC instead of dayjs
    let debugDate = null;
    let debugTime = null;
    let debugDayOfWeek = null;

    // if (isDebugDayoff) {
    //   // Sunday 8AM Manila = 2025-09-28T00:00:00Z in UTC
    //   debugTime = new Date(Date.UTC(2025, 8, 28, 0, 0, 0));
    //   debugDate = debugTime.toISOString().split("T")[0]; // "2025-09-28"
    //   debugDayOfWeek = debugTime
    //     .toLocaleDateString("en-US", {
    //       weekday: "long",
    //       timeZone: "Asia/Manila",
    //     })
    //     .toLowerCase();
    // } else if (isDebugNightDiff) {
    //   // Friday 7PM Manila = 11:00 UTC
    //   debugTime = new Date(Date.UTC(2025, 8, 29, 10, 0, 0));
    //   debugDate = debugTime.toISOString().split("T")[0]; // "2025-09-29"
    //   debugDayOfWeek = debugTime
    //     .toLocaleDateString("en-US", {
    //       weekday: "long",
    //       timeZone: "Asia/Manila",
    //     })
    //     .toLowerCase();
    // } else {
    //   // Monday 8AM Manila = 2025-09-29T00:00:00Z in UTC
    //   debugTime = new Date(Date.UTC(2025, 8, 29, 0, 0, 0));
    //   debugDate = debugTime.toISOString().split("T")[0];
    //   debugDayOfWeek = debugTime
    //     .toLocaleDateString("en-US", {
    //       weekday: "long",
    //       timeZone: "Asia/Manila",
    //     })
    //     .toLowerCase();
    // }

    // Always anchor "now" in UTC
    const now = new Date();
    const today = isDebugMode ? debugDate : now.toISOString().split("T")[0];
    const currentTime = isDebugMode
      ? debugTime.toISOString()
      : now.toISOString();
    const currentDayOfWeek = isDebugMode
      ? debugDayOfWeek
      : now
          .toLocaleDateString("en-US", {
            weekday: "long",
            timeZone: "Asia/Manila",
          })
          .toLowerCase();

    console.log(
      "Today:",
      today,
      "Current Time:",
      currentTime,
      "Day:",
      currentDayOfWeek
    );

    // Find employee by either employee_id or RFID
    let employee;
    if (employee_id) {
      employee = await pool.query(
        `SELECT e.*, s.start_time, s.end_time, s.days_of_week, s.schedule_name 
         FROM employees e 
         LEFT JOIN schedules s ON e.schedule_id = s.schedule_id 
         WHERE e.employee_id = $1 AND e.status = 'active'`,
        [employee_id]
      );
    } else if (rfid) {
      employee = await pool.query(
        `SELECT e.*, s.start_time, s.end_time, s.days_of_week, s.schedule_name 
         FROM employees e 
         LEFT JOIN schedules s ON e.schedule_id = s.schedule_id 
         WHERE e.rfid = $1 AND e.status = 'active'`,
        [rfid]
      );
    } else {
      return res.status(400).json({
        success: false,
        message: "Either employee_id or rfid is required",
      });
    }

    if (employee.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Active employee not found",
      });
    }

    const foundEmployee = employee.rows[0];
    const actualEmployeeId = foundEmployee.employee_id;

    // Check if employee has an assigned schedule
    if (!foundEmployee.schedule_id) {
      return res.status(400).json({
        success: false,
        message: "You do not have an assigned schedule",
        info: "Please contact HR for schedule assignment.",
      });
    }

    // Check if today is a working day according to schedule
    const workingDays = foundEmployee.days_of_week || [];
    const isScheduledDayOff = !workingDays.includes(currentDayOfWeek);

    // Note: We allow clocking in on day off (for approved overtime/emergency work)
    // This will be flagged as is_dayoff=true for proper payroll processing

    // Check if employee has approved leave for today
    const leaveCheck = await pool.query(
      `SELECT lr.*, lt.name as leave_type_name 
       FROM leave_requests lr 
       JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
       WHERE lr.employee_id = $1 
       AND lr.status = 'approved' 
       AND $2 BETWEEN lr.start_date AND lr.end_date`,
      [actualEmployeeId, today]
    );

    if (leaveCheck.rows.length > 0) {
      const leave = leaveCheck.rows[0];
      return res.status(400).json({
        success: false,
        message:
          "Cannot clock in - You have approved leave for today - Contact HR for manual attendance",
        info: `Leave Type: ${leave.leave_type_name} (${leave.start_date} to ${leave.end_date})`,
        leave_details: leave,
      });
    }

    // Check if already clocked in today
    const existingRecord = await pool.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2",
      [actualEmployeeId, today]
    );

    if (existingRecord.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Employee already clocked in today",
      });
    }

    // Get enhanced holiday information
    const holidayInfo = await getHolidayInfo(currentTime);

    // Calculate enhanced clock-in data
    const enhancedCalcs = await enhancedClockInCalculation(
      actualEmployeeId,
      currentTime,
      {
        start_time: foundEmployee.start_time,
        end_time: foundEmployee.end_time,
      },
      holidayInfo
    );

    console.log("Enhanced Clock-in Calculations:", enhancedCalcs);

    // Insert attendance record with enhanced calculations
    const result = await pool.query(
      `INSERT INTO attendance (
        employee_id, date, time_in, is_present, is_late, is_absent, 
        is_dayoff, is_regular_holiday, is_special_holiday, late_minutes, is_entitled_holiday
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        actualEmployeeId,
        today,
        currentTime,
        true,
        enhancedCalcs.is_late,
        false,
        isScheduledDayOff,
        enhancedCalcs.is_regular_holiday,
        enhancedCalcs.is_special_holiday,
        enhancedCalcs.late_minutes,
        enhancedCalcs.is_entitled_holiday,
      ]
    );

    res.status(201).json({
      success: true,
      message: `Clocked in successfully - ${foundEmployee.first_name} ${
        foundEmployee.last_name
      }${
        enhancedCalcs.is_late
          ? ` (Late by ${enhancedCalcs.late_minutes} min)`
          : ""
      }${isScheduledDayOff ? " (Day Off Work)" : ""}${
        enhancedCalcs.is_regular_holiday ? " (Regular Holiday)" : ""
      }${enhancedCalcs.is_special_holiday ? " (Special Holiday)" : ""}`,
      data: {
        ...result.rows[0],
        employee_name: `${foundEmployee.first_name} ${foundEmployee.last_name}`,
        schedule_name: foundEmployee.schedule_name,
        scheduled_start_time: foundEmployee.start_time,
        late_minutes: enhancedCalcs.late_minutes,
        is_late: enhancedCalcs.is_late,
        is_dayoff: isScheduledDayOff,
        is_regular_holiday: enhancedCalcs.is_regular_holiday,
        is_special_holiday: enhancedCalcs.is_special_holiday,
        is_entitled_holiday: enhancedCalcs.is_entitled_holiday,
        holiday_name: holidayInfo.holidayName,
        method: rfid ? "RFID" : "Manual",
        payroll_note:
          isScheduledDayOff ||
          enhancedCalcs.is_regular_holiday ||
          enhancedCalcs.is_special_holiday
            ? "Special pay rate applies"
            : "Regular pay rate applies",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clockOut = async (req, res) => {
  try {
    const { employee_id, rfid, notes } = req.body;

    let debugDate = null;
    let debugTime = null;

    if (isDebugDayoff) {
      // Sunday 5PM Manila = 9AM UTC
      debugTime = new Date(Date.UTC(2025, 8, 28, 9, 0, 0));
      debugDate = debugTime.toISOString().split("T")[0]; // "2025-09-28"
    } else if (isDebugNightDiff) {
      // Friday 4AM Manila = 23:00 UTC
      debugTime = new Date(Date.UTC(2025, 8, 29, 22, 0, 0));
      debugDate = debugTime.toISOString().split("T")[0]; // "2025-09-29"
    } else {
      // Monday 5PM Manila = 9AM UTC
      debugTime = new Date(Date.UTC(2025, 8, 29, 9, 0, 0));
      debugDate = debugTime.toISOString().split("T")[0]; // "2025-09-29"
    }

    // Always use UTC internally
    const now = new Date();

    const today = isDebugMode ? debugDate : now.toISOString().split("T")[0];
    const currentTime = isDebugMode
      ? debugTime.toISOString() // "2025-09-28T09:00:00.000Z"
      : now.toISOString();

    // Find employee by either employee_id or RFID
    let actualEmployeeId = employee_id;
    let employeeName = "";

    if (!employee_id && rfid) {
      const employee = await pool.query(
        "SELECT employee_id, first_name, last_name FROM employees WHERE rfid = $1 AND status = 'active'",
        [rfid]
      );
      if (employee.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Active employee not found",
        });
      }
      actualEmployeeId = employee.rows[0].employee_id;
      employeeName = `${employee.rows[0].first_name} ${employee.rows[0].last_name}`;
    } else if (employee_id) {
      const employee = await pool.query(
        "SELECT first_name, last_name FROM employees WHERE employee_id = $1 AND status = 'active'",
        [employee_id]
      );
      if (employee.rows.length > 0) {
        employeeName = `${employee.rows[0].first_name} ${employee.rows[0].last_name}`;
      }
    }

    if (!actualEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "Either employee_id or rfid is required",
      });
    }

    // Get attendance record for today - also check previous day for overnight shifts
    let attendanceRecord = await pool.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2",
      [actualEmployeeId, today]
    );

    // If no record found for today, check previous day for overnight shifts
    if (attendanceRecord.rows.length === 0) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split("T")[0];

      attendanceRecord = await pool.query(
        "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 AND time_out IS NULL",
        [actualEmployeeId, yesterdayDate]
      );
    }

    if (attendanceRecord.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No open clock-in record found for today or yesterday",
      });
    }

    const record = attendanceRecord.rows[0];

    if (record.time_out) {
      return res.status(400).json({
        success: false,
        message: "Employee already clocked out today",
      });
    }

    // Get employee schedule information
    const scheduleQuery = await pool.query(
      `SELECT s.break_duration, s.break_start, s.break_end, s.start_time, s.end_time, s.days_of_week
       FROM employees e 
       JOIN schedules s ON e.schedule_id = s.schedule_id 
       WHERE e.employee_id = $1`,
      [actualEmployeeId]
    );

    const scheduleInfo =
      scheduleQuery.rows.length > 0
        ? scheduleQuery.rows[0]
        : {
            break_duration: 60, // Default 1 hour break
            break_start: "12:00:00", // Default lunch break start
            break_end: "13:00:00", // Default lunch break end
            start_time: "08:00:00",
            end_time: "17:00:00",
            days_of_week: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
            ],
          };

    // Use enhanced clock-out calculations
    const enhancedCalcs = await enhancedClockOutCalculation(
      record,
      currentTime,
      scheduleInfo
    );

    // Update attendance record with enhanced calculations
    const result = await pool.query(
      `UPDATE attendance 
       SET time_out = $1, total_hours = $2, notes = $3, updated_at = $4, 
           is_undertime = $5, is_halfday = $6, undertime_minutes = $7, 
           night_differential_hours = $8, rest_day_hours_worked = $9, overtime_hours = $10,
           regular_holiday_hours_worked = $11, special_holiday_hours_worked = $12,
           payroll_breakdown = $13
       WHERE attendance_id = $14
       RETURNING *`,
      [
        currentTime,
        enhancedCalcs.total_hours,
        notes || null,
        currentTime,
        enhancedCalcs.is_undertime,
        enhancedCalcs.is_halfday,
        enhancedCalcs.undertime_minutes,
        enhancedCalcs.night_differential_hours,
        enhancedCalcs.rest_day_hours_worked,
        enhancedCalcs.overtime_hours,
        enhancedCalcs.regular_holiday_hours_worked || 0,
        enhancedCalcs.special_holiday_hours_worked || 0,
        JSON.stringify(enhancedCalcs.payroll_breakdown),
        record.attendance_id,
      ]
    );
    console.log(
      "[--BREAKDOWN--] Detailed Attendance Record:",
      enhancedCalcs.payroll_breakdown
    );
    res.status(200).json({
      success: true,
      message: `Clocked out successfully - ${employeeName}${
        enhancedCalcs.is_undertime ? " (Undertime)" : ""
      }${enhancedCalcs.is_halfday ? " (Half-day)" : ""}${
        enhancedCalcs.night_differential_hours > 0
          ? " (Night Differential)"
          : ""
      }${enhancedCalcs.overtime_hours > 0 ? " (Overtime)" : ""}${
        enhancedCalcs.rest_day_hours_worked > 0 ? " (Rest Day)" : ""
      }${
        enhancedCalcs.regular_holiday_hours_worked > 0
          ? " (Regular Holiday)"
          : ""
      }${
        enhancedCalcs.special_holiday_hours_worked > 0
          ? " (Special Holiday)"
          : ""
      }`,
      data: {
        ...result.rows[0],
        employee_name: employeeName,
        hours_worked: enhancedCalcs.total_hours,
        overtime_hours: enhancedCalcs.overtime_hours,
        break_duration_hours:
          scheduleInfo.break_start && scheduleInfo.break_end
            ? (() => {
                const [startH, startM] = scheduleInfo.break_start
                  .split(":")
                  .map(Number);
                const [endH, endM] = scheduleInfo.break_end
                  .split(":")
                  .map(Number);
                return (endH * 60 + endM - (startH * 60 + startM)) / 60;
              })()
            : (scheduleInfo.break_duration || 0) / 60,
        break_start: scheduleInfo.break_start,
        break_end: scheduleInfo.break_end,
        is_undertime: enhancedCalcs.is_undertime,
        is_halfday: enhancedCalcs.is_halfday,
        undertime_minutes: enhancedCalcs.undertime_minutes,
        night_differential_hours: enhancedCalcs.night_differential_hours,
        rest_day_hours_worked: enhancedCalcs.rest_day_hours_worked,
        regular_holiday_hours_worked:
          enhancedCalcs.regular_holiday_hours_worked || 0,
        special_holiday_hours_worked:
          enhancedCalcs.special_holiday_hours_worked || 0,
        method: rfid ? "RFID" : "Manual",
        payroll_summary: {
          // Simple totals for basic queries
          regular_hours: enhancedCalcs.payroll_breakdown.regular_hours,
          night_diff_hours: enhancedCalcs.night_differential_hours,
          rest_day_hours: enhancedCalcs.rest_day_hours_worked,
          overtime_hours: enhancedCalcs.overtime_hours,
          regular_holiday_hours:
            enhancedCalcs.regular_holiday_hours_worked || 0,
          special_holiday_hours:
            enhancedCalcs.special_holiday_hours_worked || 0,
          undertime_deduction: enhancedCalcs.undertime_minutes / 60,

          // Detailed breakdown from JSON
          detailed_breakdown: enhancedCalcs.payroll_breakdown,

          // Edge case summary for payroll processing
          edge_cases: enhancedCalcs.payroll_breakdown.edge_case_flags,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkExcelAttendance = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please select an Excel or CSV file.",
      });
    }

    console.log(
      `🚀 [BULK] Processing attendance file: ${req.file.originalname}`
    );
    // For memory storage, we work with the buffer directly
    const fileBuffer = req.file.buffer;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let attendanceData = [];

    try {
      // Parse the file based on extension
      if (fileExtension === ".xlsx" || fileExtension === ".xls") {
        attendanceData = await parseExcelAttendanceFileFromBuffer(fileBuffer);
      } else if (fileExtension === ".csv") {
        attendanceData = await parseCSVAttendanceFileFromBuffer(fileBuffer);
      } else {
        throw new Error(
          "Invalid file format. Please upload .xlsx, .xls, or .csv files only."
        );
      }

      console.log(
        `📊 [BULK] Parsed ${attendanceData.length} records from file`
      );

      if (attendanceData.length === 0) {
        throw new Error("No valid attendance data found in the file");
      }

      // Limit file size to prevent timeout
      if (attendanceData.length > 500) {
        throw new Error(
          "File too large. Maximum 500 records allowed for bulk upload."
        );
      }

      // Batch fetch all employees with their schedules
      const employeeIds = [
        ...new Set(attendanceData.map((record) => record.employee_id)),
      ];

      console.log(
        `👥 [BULK] Fetching data for ${employeeIds.length} employees`
      );

      const employeesResult = await pool.query(
        `SELECT e.*, s.start_time, s.end_time, s.days_of_week, s.schedule_name,
                s.break_duration, s.break_start, s.break_end
         FROM employees e
         LEFT JOIN schedules s ON e.schedule_id = s.schedule_id
         WHERE e.employee_id = ANY($1::text[]) AND e.status = 'active'`,
        [employeeIds]
      );

      const employeeMap = new Map();
      employeesResult.rows.forEach((emp) => {
        employeeMap.set(emp.employee_id, emp);
      });

      // Pre-fetch all existing attendance records for the date range
      const dates = [...new Set(attendanceData.map((record) => record.date))];
      const existingAttendance = await pool.query(
        `SELECT employee_id, date FROM attendance
         WHERE employee_id = ANY($1::text[]) AND date = ANY($2::date[])`,
        [employeeIds, dates]
      );

      const existingAttendanceMap = new Map();
      existingAttendance.rows.forEach((record) => {
        const key = `${record.employee_id}-${record.date}`;
        existingAttendanceMap.set(key, record);
      });

      // Pre-fetch all approved leaves for the date range
      const leaveRecords = await pool.query(
        `SELECT lr.employee_id, lr.start_date, lr.end_date, lt.name as leave_type_name
         FROM leave_requests lr
         JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
         WHERE lr.employee_id = ANY($1::text[]) AND lr.status = 'approved'
         AND (lr.start_date <= ANY($2::date[]) OR lr.end_date >= ANY($2::date[]))`,
        [employeeIds, dates]
      );

      const leaveMap = new Map();
      leaveRecords.rows.forEach((leave) => {
        if (!leaveMap.has(leave.employee_id)) {
          leaveMap.set(leave.employee_id, []);
        }
        leaveMap.get(leave.employee_id).push(leave);
      });

      // Process results and errors
      const results = [];
      const errors = [];
      const successful = [];

      console.log(
        `⚡ [BULK] Starting batch processing of ${attendanceData.length} records`
      );

      // Process records in smaller batches to prevent memory issues
      const batchSize = 50;
      for (
        let batchStart = 0;
        batchStart < attendanceData.length;
        batchStart += batchSize
      ) {
        const batchEnd = Math.min(
          batchStart + batchSize,
          attendanceData.length
        );
        const batch = attendanceData.slice(batchStart, batchEnd);

        console.log(
          `📦 [BULK] Processing batch ${
            Math.floor(batchStart / batchSize) + 1
          }/${Math.ceil(attendanceData.length / batchSize)} (${
            batch.length
          } records)`
        );

        // Process batch records
        for (let i = 0; i < batch.length; i++) {
          const record = batch[i];
          const globalIndex = batchStart + i;
          const { employee_id, date, time_in, time_out } = record;

          try {
            // Validate required fields
            if (!employee_id || !date || !time_in || !time_out) {
              throw new Error(
                `Row ${
                  globalIndex + 2
                }: Missing required fields (employee_id, date, time_in, time_out)`
              );
            }

            // Get employee data
            const employee = employeeMap.get(employee_id);
            if (!employee) {
              throw new Error(
                `Row ${
                  globalIndex + 2
                }: Employee ${employee_id} not found or inactive`
              );
            }

            // Check if employee has schedule
            if (!employee.schedule_id) {
              throw new Error(
                `Row ${
                  globalIndex + 2
                }: Employee ${employee_id} has no assigned schedule`
              );
            }

            // Check for existing attendance record
            const attendanceKey = `${employee_id}-${date}`;
            if (existingAttendanceMap.has(attendanceKey)) {
              throw new Error(
                `Row ${
                  globalIndex + 2
                }: Attendance already exists for ${employee_id} on ${date}`
              );
            }

            // Check for approved leave
            const employeeLeaves = leaveMap.get(employee_id) || [];
            const hasApprovedLeave = employeeLeaves.some(
              (leave) => date >= leave.start_date && date <= leave.end_date
            );

            if (hasApprovedLeave) {
              const leave = employeeLeaves.find(
                (leave) => date >= leave.start_date && date <= leave.end_date
              );
              throw new Error(
                `Row ${globalIndex + 2}: Employee has approved leave: ${
                  leave.leave_type_name
                } (${leave.start_date} to ${leave.end_date})`
              );
            }

            // Construct full datetime strings - Convert Manila time to UTC
            const clockInTime = convertManilaTimeToUTC(date, time_in);
            const clockOutTime = convertManilaTimeToUTC(date, time_out);

            if (!clockInTime || !clockOutTime) {
              throw new Error(
                `Row ${
                  globalIndex + 2
                }: Invalid date/time format for Manila timezone conversion`
              );
            }

            // Calculate day of week for the given date
            const workDate = new Date(date);
            const dayOfWeek = workDate
              .toLocaleDateString("en-US", {
                weekday: "long",
                timeZone: "Asia/Manila",
              })
              .toLowerCase();

            // Check if it's a scheduled day off
            const workingDays = employee.days_of_week || [];
            const isScheduledDayOff = !workingDays.includes(dayOfWeek);

            // Get holiday information
            const holidayInfo = await getHolidayInfo(clockInTime);

            // Calculate enhanced clock-in data
            const enhancedClockInCalcs = await enhancedClockInCalculation(
              employee_id,
              clockInTime,
              {
                start_time: employee.start_time,
                end_time: employee.end_time,
              },
              holidayInfo
            );

            // Create attendance record (clock-in simulation)
            const clockInResult = await pool.query(
              `INSERT INTO attendance (
                employee_id, date, time_in, is_present, is_late, is_absent,
                is_dayoff, is_regular_holiday, is_special_holiday, late_minutes, is_entitled_holiday
              )
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
              [
                employee_id,
                date,
                clockInTime,
                true,
                enhancedClockInCalcs.is_late,
                false,
                isScheduledDayOff,
                enhancedClockInCalcs.is_regular_holiday,
                enhancedClockInCalcs.is_special_holiday,
                enhancedClockInCalcs.late_minutes,
                enhancedClockInCalcs.is_entitled_holiday,
              ]
            );

            const attendanceRecord = clockInResult.rows[0];

            // Calculate enhanced clock-out data
            const scheduleInfo = {
              break_duration: employee.break_duration,
              break_start: employee.break_start,
              break_end: employee.break_end,
              start_time: employee.start_time,
              end_time: employee.end_time,
              days_of_week: employee.days_of_week,
            };

            const enhancedClockOutCalcs = await enhancedClockOutCalculation(
              attendanceRecord,
              clockOutTime,
              scheduleInfo
            );

            // Update attendance record with clock-out data
            const finalResult = await pool.query(
              `UPDATE attendance
               SET time_out = $1, total_hours = $2, updated_at = $3,
                   is_undertime = $4, is_halfday = $5, undertime_minutes = $6,
                   night_differential_hours = $7, rest_day_hours_worked = $8, overtime_hours = $9,
                   regular_holiday_hours_worked = $10, special_holiday_hours_worked = $11,
                   payroll_breakdown = $12
               WHERE attendance_id = $13
               RETURNING *`,
              [
                clockOutTime,
                enhancedClockOutCalcs.total_hours,
                clockOutTime,
                enhancedClockOutCalcs.is_undertime,
                enhancedClockOutCalcs.is_halfday,
                enhancedClockOutCalcs.undertime_minutes,
                enhancedClockOutCalcs.night_differential_hours,
                enhancedClockOutCalcs.rest_day_hours_worked,
                enhancedClockOutCalcs.overtime_hours,
                enhancedClockOutCalcs.regular_holiday_hours_worked || 0,
                enhancedClockOutCalcs.special_holiday_hours_worked || 0,
                JSON.stringify(enhancedClockOutCalcs.payroll_breakdown),
                attendanceRecord.attendance_id,
              ]
            );

            successful.push({
              row: globalIndex + 2,
              employee_id,
              employee_name: `${employee.first_name} ${employee.last_name}`,
              date,
              attendance_id: finalResult.rows[0].attendance_id,
              total_hours: enhancedClockOutCalcs.total_hours,
              overtime_hours: enhancedClockOutCalcs.overtime_hours,
              is_dayoff: isScheduledDayOff,
              is_regular_holiday: enhancedClockInCalcs.is_regular_holiday,
              is_special_holiday: enhancedClockInCalcs.is_special_holiday,
              night_differential_hours:
                enhancedClockOutCalcs.night_differential_hours,
              payroll_summary: {
                regular_hours:
                  enhancedClockOutCalcs.payroll_breakdown.regular_hours,
                night_diff_hours:
                  enhancedClockOutCalcs.night_differential_hours,
                rest_day_hours: enhancedClockOutCalcs.rest_day_hours_worked,
                overtime_hours: enhancedClockOutCalcs.overtime_hours,
                regular_holiday_hours:
                  enhancedClockOutCalcs.regular_holiday_hours_worked || 0,
                special_holiday_hours:
                  enhancedClockOutCalcs.special_holiday_hours_worked || 0,
                edge_cases:
                  enhancedClockOutCalcs.payroll_breakdown.edge_case_flags,
              },
            });

            if ((globalIndex + 1) % 10 === 0) {
              console.log(
                `✅ [BULK] Processed ${globalIndex + 1}/${
                  attendanceData.length
                } records`
              );
            }
          } catch (error) {
            console.error(
              `❌ [BULK] Row ${
                globalIndex + 2
              }: Error processing ${employee_id} for ${date}:`,
              error.message
            );
            errors.push({
              row: globalIndex + 2,
              employee_id: employee_id || "Unknown",
              date: date || "Unknown",
              error: error.message,
            });
          }
        }
      }

      // Return comprehensive results
      const response = {
        success: errors.length === 0,
        message: `Bulk attendance processing completed: ${successful.length} successful, ${errors.length} errors`,
        data: {
          file_name: req.file.originalname,
          total_rows: attendanceData.length,
          successful_count: successful.length,
          error_count: errors.length,
          successful_records: successful.slice(0, 50), // Limit response size
          errors: errors,
        },
      };

      console.log(
        `🎯 [BULK] Completed: ${successful.length}/${attendanceData.length} records processed successfully`
      );

      res.status(errors.length === 0 ? 200 : 207).json(response); // 207 = Multi-Status
    } catch (parseError) {
      // No file cleanup needed for memory storage
      throw parseError;
    }
  } catch (error) {
    console.error("❌ [BULK] Fatal error:", error);

    // No file cleanup needed for memory storage
    res.status(500).json({
      success: false,
      message: "Bulk attendance processing failed",
      error: error.message,
    });
  }
};

// Helper function to parse Excel attendance files
const parseExcelAttendanceFile = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet(1);
  const attendanceData = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row

    const record = {
      employee_id: row.getCell(1).value?.toString().trim(),
      date: formatDateValue(row.getCell(2).value),
      time_in: formatTimeValue(row.getCell(3).value),
      time_out: formatTimeValue(row.getCell(4).value),
    };

    // Only add if we have required data
    if (
      record.employee_id &&
      record.date &&
      record.time_in &&
      record.time_out
    ) {
      attendanceData.push(record);
    }
  });

  console.log("[DEBUG] Attendance Data:", attendanceData);
  return attendanceData;
};

// Helper function to parse CSV attendance files
const parseCSVAttendanceFile = async (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const csv = require("csv-parser");

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        const record = {
          employee_id: data.employee_id?.trim(),
          date: formatDateValue(data.date),
          time_in: formatTimeValue(data.time_in),
          time_out: formatTimeValue(data.time_out),
        };

        if (
          record.employee_id &&
          record.date &&
          record.time_in &&
          record.time_out
        ) {
          results.push(record);
        }
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
};

// Helper function to parse Excel attendance files from buffer (for Vercel)
const parseExcelAttendanceFileFromBuffer = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet(1);
  const attendanceData = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row

    const record = {
      employee_id: row.getCell(1).value?.toString().trim(),
      date: formatDateValue(row.getCell(2).value),
      time_in: formatTimeValue(row.getCell(3).value),
      time_out: formatTimeValue(row.getCell(4).value),
    };

    // Only add if we have required data
    if (
      record.employee_id &&
      record.date &&
      record.time_in &&
      record.time_out
    ) {
      attendanceData.push(record);
    }
  });

  return attendanceData;
};

// Helper function to parse CSV attendance files from buffer (for Vercel)
const parseCSVAttendanceFileFromBuffer = async (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const csv = require("csv-parser");
    const stream = require("stream");

    // Convert buffer to readable stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    bufferStream
      .pipe(csv())
      .on("data", (data) => {
        const record = {
          employee_id: data.employee_id?.trim(),
          date: formatDateValue(data.date),
          time_in: formatTimeValue(data.time_in),
          time_out: formatTimeValue(data.time_out),
        };

        if (
          record.employee_id &&
          record.date &&
          record.time_in &&
          record.time_out
        ) {
          results.push(record);
        }
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
};

// Helper function to format date values from Excel/CSV
const formatDateValue = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  if (typeof value === "string") {
    const dateStr = value.trim();
    // Try different date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    ];

    if (formats[0].test(dateStr)) {
      return dateStr;
    } else if (formats[1].test(dateStr)) {
      const [month, day, year] = dateStr.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    } else if (formats[2].test(dateStr)) {
      const [month, day, year] = dateStr.split("-");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  return null;
};

// Helper function to format time values from Excel/CSV
const formatTimeValue = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toTimeString().split(" ")[0]; // HH:MM:SS
  }

  if (typeof value === "string") {
    const timeStr = value.trim();
    // Handle different time formats
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    } else if (/^\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr + ":00";
    } else if (/^\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)$/i.test(timeStr)) {
      // Convert 12-hour to 24-hour format
      const [time, period] = timeStr.split(/\s+/);
      let [hours, minutes, seconds = "00"] = time.split(":");
      hours = parseInt(hours);

      if (period.toUpperCase() === "PM" && hours !== 12) {
        hours += 12;
      } else if (period.toUpperCase() === "AM" && hours === 12) {
        hours = 0;
      }

      return `${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
    }
  }

  return null;
};

// Helper function to convert Manila time to UTC ISO string
const convertManilaTimeToUTC = (date, time) => {
  if (!date || !time) return null;

  // Create a date object in Manila timezone
  const manilaDateTime = new Date(`${date}T${time}`);

  // Manila is UTC+8, so we subtract 8 hours to get UTC
  const utcDateTime = new Date(manilaDateTime.getTime() - 8 * 60 * 60 * 1000);

  return utcDateTime.toISOString();
};

// export const startBreak = async (req, res) => {
//   res.status(410).json({
//     success: false,
//     message: "Break system is now automatic based on employee schedule",
//     note: "Break duration is calculated from assigned schedule break_duration field during clock-out",
//     deprecated: true,
//   });
// };

// export const endBreak = async (req, res) => {
//   res.status(410).json({
//     success: false,
//     message: "Break system is now automatic based on employee schedule",
//     note: "Break duration is calculated from assigned schedule break_duration field during clock-out",
//     deprecated: true,
//   });
// };

export const getTodayAttendance = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const result = await pool.query(
      `
      SELECT a.*, e.first_name, e.last_name, e.hourly_rate,
        CASE 
          WHEN a.time_in IS NOT NULL AND a.time_out IS NOT NULL AND a.break_start IS NOT NULL AND a.break_end IS NULL THEN 'on_break'
          WHEN a.time_in IS NOT NULL AND a.time_out IS NOT NULL THEN 'completed'
          ELSE 'not_started'
        END AS current_status,
        CASE 
          WHEN a.time_in IS NOT NULL AND a.time_out IS NULL THEN
            ROUND(EXTRACT(EPOCH FROM (CURRENT_TIME - a.time_in)) / 3600 -
              COALESCE(EXTRACT(EPOCH FROM (a.break_end - a.break_start)) / 3600, 0), 2)
          ELSE a.total_hours
        END AS current_hours_worked
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      WHERE a.employee_id = $1 AND a.date = $2
    `,
      [employee_id, today]
    );

    res.status(200).json({ success: true, data: result.rows[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployeeAttendanceSummary = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { start_date = "1900-01-01", end_date = "2100-12-31" } = req.query;

    const result = await pool.query(
      `
      SELECT 
        e.first_name, e.last_name, e.hourly_rate,
        COUNT(*) as total_days,
        SUM(a.total_hours) as total_hours,
        SUM(a.overtime_hours) as total_overtime_hours,
        SUM(a.total_hours * e.hourly_rate) as total_regular_pay,
        SUM(a.overtime_hours * e.hourly_rate * 1.5) as total_overtime_pay,
        SUM(a.total_hours * e.hourly_rate + a.overtime_hours * e.hourly_rate * 1.5) as total_gross_pay
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      WHERE a.employee_id = $1 AND a.date BETWEEN $2 AND $3 AND a.total_hours IS NOT NULL
      GROUP BY e.employee_id, e.first_name, e.last_name, e.hourly_rate
    `,
      [employee_id, start_date, end_date]
    );

    res.status(200).json({ success: true, data: result.rows[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createManualAttendance = async (req, res) => {
  try {
    const {
      employee_id,
      date,
      time_in,
      time_out,
      notes,
      status = "PRESENT",
      is_dayoff = false,
      is_regular_holiday = false,
      is_special_holiday = false,
    } = req.body;

    // Validate required fields
    if (!employee_id || !date) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and date are required",
      });
    }

    // Check if attendance already exists for this employee and date
    const existing = await pool.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2",
      [employee_id, date]
    );

    const schedule = await pool.query(
      `SELECT e.schedule_id, s.break_duration, s.break_start, s.break_end, s.start_time, s.end_time
       FROM schedules s
       JOIN employees e ON e.schedule_id = s.schedule_id
       WHERE e.employee_id = $1`,
      [employee_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Attendance already exists for this date",
      });
    }

    if (schedule.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Employee does not have an assigned schedule",
      });
    }

    const scheduleData = schedule.rows[0];

    // Auto-detect holiday status if not manually specified
    let finalIsRegularHoliday = is_regular_holiday;
    let finalIsSpecialHoliday = is_special_holiday;

    if (!is_regular_holiday && !is_special_holiday) {
      const holidayStatus = await checkHolidayStatus(date);
      finalIsRegularHoliday = holidayStatus.isRegularHoliday;
      finalIsSpecialHoliday = holidayStatus.isSpecialHoliday;
    }

    // Calculate hours worked and overtime if both time_in and time_out are provided
    let hoursWorked = null;
    let overtime = null;

    // Convert schedule times to numbers for easier calculation
    const shiftStart = scheduleData.start_time
      .split(":")
      .reduce((acc, time, index) => {
        return acc + parseInt(time) / Math.pow(60, index);
      }, 0);
    const shiftEnd = scheduleData.end_time
      .split(":")
      .reduce((acc, time, index) => {
        return acc + parseInt(time) / Math.pow(60, index);
      }, 0);

    // Calculate break duration from break_start/break_end or fallback to break_duration
    let breakDuration = 0;
    if (scheduleData.break_start && scheduleData.break_end) {
      const [breakStartH, breakStartM] = scheduleData.break_start
        .split(":")
        .map(Number);
      const [breakEndH, breakEndM] = scheduleData.break_end
        .split(":")
        .map(Number);
      breakDuration =
        (breakEndH * 60 + breakEndM - (breakStartH * 60 + breakStartM)) / 60;
    } else {
      breakDuration = (scheduleData.break_duration || 0) / 60;
    }

    const shiftHours = shiftEnd - shiftStart - breakDuration;

    if (time_in && time_out) {
      const timeInDate = new Date(`${date}T${time_in}`);
      const timeOutDate = new Date(`${date}T${time_out}`);

      // Handle next day time_out (for night shifts)
      if (timeOutDate < timeInDate) {
        timeOutDate.setDate(timeOutDate.getDate() + 1);
      }

      const diffMs = timeOutDate - timeInDate;
      const diffHours = diffMs / (1000 * 60 * 60);

      hoursWorked = Math.round(diffHours * 100) / 100 - breakDuration; // Round to 2 decimal places

      // Calculate shift hours

      // Calculate overtime (hours over shift hours)
      if (hoursWorked > shiftHours) {
        overtime = Math.round((hoursWorked - shiftHours) * 100) / 100;
      }
    }

    console.log(
      "Calculated hoursWorked:",
      hoursWorked,
      "Overtime:",
      overtime,
      "Shift Hours:",
      shiftHours
    );

    console.log(
      "Shift Start:",
      shiftStart,
      "Shift End:",
      shiftEnd,
      "Break:",
      breakDuration
    );

    // Set boolean flags based on status
    const is_present = status === "PRESENT";
    const is_late = status === "LATE";
    const is_absent = status === "ABSENT";
    const on_leave = status === "ON_LEAVE";
    const is_halfday = status === "HALF_DAY";
    const is_undertime = false; // Default to false, can be calculated later

    // Insert the manual attendance record
    const insert = await pool.query(
      `
      INSERT INTO attendance (
        employee_id, date, time_in, time_out, total_hours, overtime_hours, notes, 
        created_at, updated_at, is_present, is_late, is_absent, on_leave, 
        is_undertime, is_halfday, is_dayoff, is_regular_holiday, is_special_holiday
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `,
      [
        employee_id,
        date,
        time_in ? `${date}T${time_in}` : null,
        time_out ? `${date}T${time_out}` : null,
        hoursWorked,
        overtime || 0,
        notes,
        is_present,
        is_late,
        is_absent,
        on_leave,
        is_undertime,
        is_halfday,
        is_dayoff,
        finalIsRegularHoliday,
        finalIsSpecialHoliday,
      ]
    );

    // Fetch the complete record with employee details
    const result = await pool.query(
      `
      SELECT 
        a.*, 
        e.first_name, 
        e.last_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      WHERE a.attendance_id = $1
    `,
      [insert.rows[0].attendance_id]
    );

    res.status(201).json({
      success: true,
      message: "Manual attendance record created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating manual attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create manual attendance record",
      error: error.message,
    });
  }
};

export const getEmployeeStatus = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { date: today } = getPhilippineTime();

    const result = await pool.query(
      `
      SELECT a.*, e.first_name, e.last_name,
        CASE 
          WHEN a.time_in IS NOT NULL AND a.time_out IS NOT NULL THEN 'completed'
          WHEN a.time_in IS NOT NULL AND a.time_out IS NULL THEN 'clocked_in'
          ELSE 'not_started'
        END AS current_status,
        s.break_duration,
        s.break_start,
        s.break_end
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      LEFT JOIN schedules s ON e.schedule_id = s.schedule_id
      WHERE a.employee_id = $1 AND a.date = $2
    `,
      [employee_id, today]
    );

    res.status(200).json({ success: true, data: result.rows[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const canTakeBreak = async (req, res) => {
  res.status(200).json({
    success: true,
    can_take_break: false,
    message: "Break system is now automatic based on employee schedule",
    note: "Break duration is calculated from assigned schedule break_duration field during clock-out",
    deprecated: true,
  });
};

export const manualUpdate = async (req, res) => {
  try {
    const { attendance_id } = req.params;
    const { time_in, time_out } = req.body;

    // Validate required fields
    if (!attendance_id) {
      return res.status(400).json({
        success: false,
        message: "Attendance ID is required",
      });
    }

    if (!time_in || !time_out) {
      return res.status(400).json({
        success: false,
        message: "Both time_in and time_out are required",
      });
    }

    // Validate time difference is less than 20 hours to prevent exploits
    const timeInDate = new Date(time_in);
    const timeOutDate = new Date(time_out);
    const timeDifferenceHours = (timeOutDate - timeInDate) / (1000 * 60 * 60);

    if (timeDifferenceHours >= 20) {
      return res.status(400).json({
        success: false,
        message: "Time difference cannot be 20 hours or more",
      });
    }

    if (timeDifferenceHours <= 0) {
      return res.status(400).json({
        success: false,
        message: "Time out must be after time in",
      });
    }

    // Get the existing attendance record
    const existingRecord = await pool.query(
      `SELECT a.*, e.first_name, e.last_name, s.start_time, s.end_time, s.days_of_week, s.break_duration, s.break_start, s.break_end
       FROM attendance a
       JOIN employees e ON a.employee_id = e.employee_id
       LEFT JOIN schedules s ON e.schedule_id = s.schedule_id
       WHERE a.attendance_id = $1`,
      [attendance_id]
    );

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    const record = existingRecord.rows[0];
    const employeeId = record.employee_id;
    const attendanceDate = record.date;

    // Check if the record is part of a consumed timesheet
    const timesheetCheck = await pool.query(
      "SELECT is_consumed FROM timesheets WHERE timesheet_id = (SELECT timesheet_id FROM attendance WHERE attendance_id = $1)",
      [attendance_id]
    );

    if (timesheetCheck.rows.length > 0 && timesheetCheck.rows[0].is_consumed) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot edit attendance record that is part of a consumed timesheet",
      });
    }

    // Delete the existing record
    await pool.query("DELETE FROM attendance WHERE attendance_id = $1", [
      attendance_id,
    ]);

    // Create new attendance record using clockIn/clockOut logic
    // First, simulate clockIn with the provided time_in
    const timeInISOString = new Date(time_in).toISOString();

    // Get holiday information for the date
    const holidayInfo = await getHolidayInfo(timeInISOString);

    // Check if the date is a working day according to schedule
    const workingDays = record.days_of_week || [];
    const dayOfWeek = new Date(attendanceDate)
      .toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "Asia/Manila",
      })
      .toLowerCase();
    const isScheduledDayOff = !workingDays.includes(dayOfWeek);

    // Calculate enhanced clock-in data
    const enhancedClockInCalcs = await enhancedClockInCalculation(
      employeeId,
      timeInISOString,
      {
        start_time: record.start_time,
        end_time: record.end_time,
      },
      holidayInfo
    );

    // Insert new attendance record with clock-in data
    const clockInResult = await pool.query(
      `INSERT INTO attendance (
        employee_id, date, time_in, is_present, is_late, is_absent,
        is_dayoff, is_regular_holiday, is_special_holiday, late_minutes, is_entitled_holiday
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        employeeId,
        attendanceDate,
        timeInISOString,
        true,
        enhancedClockInCalcs.is_late,
        false,
        isScheduledDayOff,
        enhancedClockInCalcs.is_regular_holiday,
        enhancedClockInCalcs.is_special_holiday,
        enhancedClockInCalcs.late_minutes,
        enhancedClockInCalcs.is_entitled_holiday,
      ]
    );

    const newRecord = clockInResult.rows[0];

    // Now simulate clockOut with the provided time_out
    const timeOutISOString = new Date(time_out).toISOString();

    const scheduleInfo = {
      break_duration: record.break_duration || 60,
      break_start: record.break_start || "12:00:00",
      break_end: record.break_end || "13:00:00",
      start_time: record.start_time,
      end_time: record.end_time,
      days_of_week: record.days_of_week,
    };

    // Calculate enhanced clock-out data
    const enhancedClockOutCalcs = await enhancedClockOutCalculation(
      newRecord,
      timeOutISOString,
      scheduleInfo
    );

    // Update the record with clock-out data
    const clockOutResult = await pool.query(
      `UPDATE attendance
       SET time_out = $1, total_hours = $2, updated_at = $3,
           is_undertime = $4, is_halfday = $5, undertime_minutes = $6,
           night_differential_hours = $7, rest_day_hours_worked = $8, overtime_hours = $9,
           regular_holiday_hours_worked = $10, special_holiday_hours_worked = $11,
           payroll_breakdown = $12
       WHERE attendance_id = $13
       RETURNING *`,
      [
        timeOutISOString,
        enhancedClockOutCalcs.total_hours,
        new Date().toISOString(),
        enhancedClockOutCalcs.is_undertime,
        enhancedClockOutCalcs.is_halfday,
        enhancedClockOutCalcs.undertime_minutes,
        enhancedClockOutCalcs.night_differential_hours,
        enhancedClockOutCalcs.rest_day_hours_worked,
        enhancedClockOutCalcs.overtime_hours,
        enhancedClockOutCalcs.regular_holiday_hours_worked || 0,
        enhancedClockOutCalcs.special_holiday_hours_worked || 0,
        JSON.stringify(enhancedClockOutCalcs.payroll_breakdown),
        newRecord.attendance_id,
      ]
    );

    // Get the final record with employee information
    const finalResult = await pool.query(
      `
      SELECT
        a.*, e.first_name, e.last_name,
        COALESCE(a.total_hours, 0) as calculated_total_hours,
        COALESCE(a.overtime_hours, 0) as overtime_hours,
        s.break_duration,
        s.break_start,
        s.break_end
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      LEFT JOIN schedules s ON e.schedule_id = s.schedule_id
      WHERE a.attendance_id = $1
    `,
      [newRecord.attendance_id]
    );

    res.status(200).json({
      success: true,
      message:
        "Attendance record updated successfully with recalculated values",
      data: finalResult.rows[0],
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update attendance record",
      error: error.message,
    });
  }
};

export const processTimesheet = async (req, res) => {
  try {
    const { startDate, endDate, attendanceIds, approverId } = req.body;
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);
    console.log("Attendance IDs:", attendanceIds);
    console.log("Approver ID:", approverId);

    if (!startDate || !endDate || !approverId) {
      return res.status(400).json({
        success: false,
        message: "startDate, endDate, and approverId are required",
      });
    }

    if (!Array.isArray(attendanceIds) || attendanceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Select at least one attendance record to process",
      });
    }

    const existingEmployeeCheck = await pool.query(
      `SELECT employee_id FROM employees WHERE employee_id = $1`,
      [approverId]
    );

    if (existingEmployeeCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Approver employee not found",
      });
    }

    // Check date range validity
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "startDate cannot be after endDate",
      });
    }

    // console.log(
    //   "Processing timesheet for attendance IDs:",
    //   attendanceIds,
    //   "from",
    //   startDate,
    //   "to",
    //   endDate
    // );

    // Debug input dates
    // debugDateFormats(startDate, "Start Date Input");
    // debugDateFormats(endDate, "End Date Input");

    // Create proper date range query using utilities
    const dateRangeQuery = createDateRangeQuery(startDate, endDate, "date");

    console.log("📅 Normalized date range:", {
      start: dateRangeQuery.startDate,
      end: dateRangeQuery.endDate,
      condition: dateRangeQuery.condition,
    });

    // Debug: Check a sample attendance record date
    const sampleCheck = await pool.query(
      `SELECT attendance_id, date, 
       date::text as date_string,
       date AT TIME ZONE 'Asia/Manila' as date_ph
       FROM attendance WHERE attendance_id = ANY($1::int[]) LIMIT 1`,
      [attendanceIds]
    );

    if (sampleCheck.rows.length > 0) {
      console.log("📋 Sample attendance record:", sampleCheck.rows[0]);
    }

    // Check if attendance records exist within the specified date range
    const attendanceCheck = await pool.query(
      `SELECT attendance_id, date, date::text as date_string
       FROM attendance 
       WHERE attendance_id = ANY($1::int[])
       AND date BETWEEN $2 AND $3`,
      [attendanceIds, dateRangeQuery.startDate, dateRangeQuery.endDate]
    );

    // console.log(
    //   `Found ${attendanceCheck.rows.length} matching records:`,
    //   attendanceCheck.rows
    // );

    // If no matching records found, return error
    if (attendanceCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `The selected attendance records were not found in the specified date range`,
      });
    }

    // Create timesheet with normalized dates
    const createTimesheetQuery = `
      INSERT INTO timesheets
      (start_date, end_date)
      VALUES ($1, $2)
      RETURNING timesheet_id
    `;

    const timesheetId = await pool.query(createTimesheetQuery, [
      dateRangeQuery.startDate,
      dateRangeQuery.endDate,
    ]);

    // Link attendance records to the created timesheet
    const linkAttendanceQuery = `
      UPDATE attendance
      SET timesheet_id = $1, processed_by = $2, date_last_processed = NOW()
      WHERE attendance_id = ANY($3::int[])
      RETURNING *
    `;

    const result = await pool.query(linkAttendanceQuery, [
      timesheetId.rows[0].timesheet_id,
      approverId,
      attendanceIds,
    ]);

    res.status(200).json({
      success: true,
      message: `${result.rows.length} attendance record${
        result.rows.length === 1 ? "" : "s"
      } processed successfully`,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnconsumedTimesheet = async (req, res) => {
  try {
    const timesheets = await pool.query(
      `
      SELECT * FROM timesheets
      WHERE is_consumed = false
      ORDER BY end_date DESC
    `
    );

    // For each timesheet, get its attendance record count and distinct employee count
    const timesheetsWithCounts = await Promise.all(
      timesheets.rows.map(async (timesheet) => {
        // Get attendance record count for this specific timesheet
        const recordCountResult = await pool.query(
          `
          SELECT COUNT(*) as record_count
          FROM attendance
          WHERE timesheet_id = $1
        `,
          [timesheet.timesheet_id]
        );

        // Get distinct employee count for this specific timesheet
        const employeeCountResult = await pool.query(
          `
          SELECT COUNT(DISTINCT employee_id) as employee_count
          FROM attendance
          WHERE timesheet_id = $1
        `,
          [timesheet.timesheet_id]
        );

        return {
          ...timesheet,
          recordCount: parseInt(recordCountResult.rows[0].record_count),
          employeeCount: parseInt(employeeCountResult.rows[0].employee_count),
        };
      })
    );

    // console.log("Unconsumed timesheet debug:", timesheetsWithCounts);

    res.status(200).json({
      success: true,
      data: timesheetsWithCounts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const consumeTimesheet = async (req, res) => {
  try {
    const { timesheet_id } = req.params;

    if (!timesheet_id) {
      return res.status(400).json({
        success: false,
        message: "Timesheet ID is required",
      });
    }

    // Check if timesheet exists and is unconsumed
    const timesheetCheck = await pool.query(
      `SELECT * FROM timesheets WHERE timesheet_id = $1`,
      [timesheet_id]
    );

    if (timesheetCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Timesheet not found",
      });
    }

    if (timesheetCheck.rows[0].is_consumed) {
      return res.status(400).json({
        success: false,
        message: "Timesheet is already consumed",
      });
    }

    // Mark timesheet as consumed
    const result = await pool.query(
      `
      UPDATE timesheets
      SET is_consumed = true, processed_at = NOW()
      WHERE timesheet_id = $1
      RETURNING *
    `,
      [timesheet_id]
    );

    res.status(200).json({
      success: true,
      message: "Timesheet marked as consumed",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceByTimesheet = async (req, res) => {
  try {
    const { timesheet_id } = req.params;

    if (!timesheet_id) {
      return res.status(400).json({
        success: false,
        message: "Timesheet ID is required",
      });
    }

    // Get timesheet details first
    const timesheetCheck = await pool.query(
      `SELECT * FROM timesheets WHERE timesheet_id = $1`,
      [timesheet_id]
    );

    if (timesheetCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Timesheet not found",
      });
    }

    // Get all attendance records for this timesheet
    const attendanceRecords = await pool.query(
      `
      SELECT 
        a.*, e.first_name, e.last_name, e.employee_id,
        COALESCE(a.total_hours, 0) as calculated_total_hours,
        COALESCE(a.overtime_hours, 0) as overtime_hours,
        s.break_duration,
        s.break_start,
        s.break_end
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      LEFT JOIN schedules s ON e.schedule_id = s.schedule_id
      WHERE a.timesheet_id = $1
      ORDER BY a.date DESC, a.time_in DESC
    `,
      [timesheet_id]
    );

    res.status(200).json({
      success: true,
      data: {
        timesheet: timesheetCheck.rows[0],
        attendance: attendanceRecords.rows,
        count: attendanceRecords.rows.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAttendanceRecord = async (req, res) => {
  try {
    const { attendance_id } = req.params;

    if (!attendance_id) {
      return res.status(400).json({
        success: false,
        message: "Attendance ID is required",
      });
    }

    // Check if attendance record exists
    const existingRecord = await pool.query(
      "SELECT * FROM attendance WHERE attendance_id = $1",
      [attendance_id]
    );

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Check if the record is part of a consumed timesheet
    const timesheetCheck = await pool.query(
      `SELECT t.is_consumed
       FROM timesheets t
       JOIN attendance a ON a.timesheet_id = t.timesheet_id
       WHERE a.attendance_id = $1`,
      [attendance_id]
    );

    if (timesheetCheck.rows.length > 0 && timesheetCheck.rows[0].is_consumed) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete attendance record that is part of a consumed timesheet",
      });
    }

    // Delete the attendance record
    await pool.query("DELETE FROM attendance WHERE attendance_id = $1", [
      attendance_id,
    ]);

    res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting attendance record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete attendance record",
      error: error.message,
    });
  }
};

export const bulkDeleteAttendanceRecords = async (req, res) => {
  try {
    const { attendance_ids } = req.body;

    if (
      !attendance_ids ||
      !Array.isArray(attendance_ids) ||
      attendance_ids.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Attendance IDs array is required",
      });
    }

    // Check if all attendance records exist
    const existingRecords = await pool.query(
      "SELECT attendance_id FROM attendance WHERE attendance_id = ANY($1)",
      [attendance_ids]
    );

    if (existingRecords.rows.length !== attendance_ids.length) {
      return res.status(404).json({
        success: false,
        message: "Some attendance records not found",
      });
    }

    // Check if any records are part of consumed timesheets
    const timesheetCheck = await pool.query(
      `SELECT a.attendance_id, t.is_consumed
       FROM timesheets t
       JOIN attendance a ON a.timesheet_id = t.timesheet_id
       WHERE a.attendance_id = ANY($1)`,
      [attendance_ids]
    );

    const consumedRecords = timesheetCheck.rows.filter(
      (row) => row.is_consumed
    );
    if (consumedRecords.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ${consumedRecords.length} attendance record(s) that are part of consumed timesheets`,
      });
    }

    // Delete the attendance records
    await pool.query("DELETE FROM attendance WHERE attendance_id = ANY($1)", [
      attendance_ids,
    ]);

    res.status(200).json({
      success: true,
      message: `${attendance_ids.length} attendance record(s) deleted successfully`,
    });
  } catch (error) {
    console.error("Error bulk deleting attendance records:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete attendance records",
      error: error.message,
    });
  }
};
