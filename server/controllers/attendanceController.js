import { pool } from "../config/db.js";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// Helper function to check if a date is a holiday
const checkHolidayStatus = async (date) => {
  try {
    // Check if holidays table exists and query it
    const holidayResult = await pool.query(
      `SELECT holiday_type FROM holidays 
       WHERE date = $1 AND is_active = true`,
      [date]
    );

    if (holidayResult.rows.length > 0) {
      const holidayType = holidayResult.rows[0].holiday_type;
      return {
        isRegularHoliday: holidayType === "regular",
        isSpecialHoliday: holidayType === "special",
      };
    }

    return {
      isRegularHoliday: false,
      isSpecialHoliday: false,
    };
  } catch (error) {
    // If holidays table doesn't exist, return false for all
    console.log("Holiday check skipped - holidays table may not exist");
    return {
      isRegularHoliday: false,
      isSpecialHoliday: false,
    };
  }
};

// Payroll-friendly hour rounding function
const roundToPayrollIncrement = (hours) => {
  const wholeHours = Math.floor(hours);
  const minutes = (hours - wholeHours) * 60;

  if (minutes <= 15) {
    // 0-15 minutes: round down
    return wholeHours;
  } else if (minutes <= 45) {
    // 16-45 minutes: round to 30 minutes (0.5 hours)
    return wholeHours + 0.5;
  } else {
    // 46-59 minutes: round up to next hour
    return wholeHours + 1;
  }
};

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
        s.break_duration,
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
        s.break_duration
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
        s.break_duration
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

    // Get current Philippine time
    const now = dayjs().tz("Asia/Manila");
    const today = now.format("YYYY-MM-DD");
    const currentTime = now.format("YYYY-MM-DD HH:mm:ss");
    const currentDayOfWeek = now.format("dddd").toLowerCase(); // monday, tuesday, etc.

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
        message: "Cannot clock in - You have approved leave for today",
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

    // Determine if employee is late
    const scheduleStartTime = foundEmployee.start_time;
    const currentTimeOnly = now.format("HH:mm:ss");
    const isLate = currentTimeOnly > scheduleStartTime;

    // Check holiday status
    const holidayStatus = await checkHolidayStatus(today);

    // Insert attendance record with boolean flags including payroll flags
    const result = await pool.query(
      `INSERT INTO attendance (
        employee_id, date, time_in, is_present, is_late, is_absent, 
        is_dayoff, is_regular_holiday, is_special_holiday
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        actualEmployeeId,
        today,
        currentTime,
        true,
        isLate,
        false,
        isScheduledDayOff, // Flag if working on day off
        holidayStatus.isRegularHoliday,
        holidayStatus.isSpecialHoliday,
      ]
    );

    res.status(201).json({
      success: true,
      message: `Clocked in successfully - ${foundEmployee.first_name} ${
        foundEmployee.last_name
      }${isLate ? " (Late)" : ""}${isScheduledDayOff ? " (Day Off Work)" : ""}${
        holidayStatus.isRegularHoliday ? " (Regular Holiday)" : ""
      }${holidayStatus.isSpecialHoliday ? " (Special Holiday)" : ""}`,
      data: {
        ...result.rows[0],
        employee_name: `${foundEmployee.first_name} ${foundEmployee.last_name}`,
        schedule_name: foundEmployee.schedule_name,
        scheduled_start_time: scheduleStartTime,
        is_late: isLate,
        is_dayoff: isScheduledDayOff,
        is_regular_holiday: holidayStatus.isRegularHoliday,
        is_special_holiday: holidayStatus.isSpecialHoliday,
        method: rfid ? "RFID" : "Manual",
        payroll_note:
          isScheduledDayOff ||
          holidayStatus.isRegularHoliday ||
          holidayStatus.isSpecialHoliday
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

    // Get current Philippine time
    const now = dayjs().tz("Asia/Manila");
    const today = now.format("YYYY-MM-DD");
    const currentTime = now.format("YYYY-MM-DD HH:mm:ss");

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

    // Get attendance record for today
    const attendanceRecord = await pool.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2",
      [actualEmployeeId, today]
    );

    if (attendanceRecord.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No clock-in record found for today",
      });
    }

    const record = attendanceRecord.rows[0];

    if (record.time_out) {
      return res.status(400).json({
        success: false,
        message: "Employee already clocked out today",
      });
    }

    // Calculate total hours worked
    const timeIn = dayjs(record.time_in);
    const timeOut = dayjs(currentTime);

    // Get employee schedule to calculate break duration
    const scheduleQuery = await pool.query(
      `SELECT s.break_duration, s.start_time, s.end_time
       FROM employees e 
       JOIN schedules s ON e.schedule_id = s.schedule_id 
       WHERE e.employee_id = $1`,
      [actualEmployeeId]
    );

    // Calculate raw hours worked
    const rawHours = timeOut.diff(timeIn, "hour", true);

    // Calculate break duration in hours (from schedule)
    let breakDurationHours = 0;
    if (scheduleQuery.rows.length > 0 && scheduleQuery.rows[0].break_duration) {
      // Convert break_duration from minutes to hours
      breakDurationHours = scheduleQuery.rows[0].break_duration / 60;
    }

    // Only deduct break time if the employee worked long enough to take a break
    // Typically breaks are taken if working more than 4-6 hours
    // For shorter periods, don't deduct break time
    let totalHours = rawHours;
    if (rawHours >= 4) {
      totalHours = rawHours - breakDurationHours;
    }

    // Ensure total hours is never negative
    if (totalHours < 0) {
      totalHours = 0;
    }

    // Apply payroll-friendly rounding
    // 0-15 minutes: round down, 16-45 minutes: round to 0.5, 46-59 minutes: round up
    const payrollRoundedHours = roundToPayrollIncrement(totalHours);
    const roundedTotalHours = Math.round(payrollRoundedHours * 100) / 100;

    // Calculate scheduled work hours for undertime/halfday flags
    let isUndertime = false;
    let isHalfday = false;

    if (scheduleQuery.rows.length > 0) {
      const scheduledStartTime = scheduleQuery.rows[0].start_time;
      const scheduledEndTime = scheduleQuery.rows[0].end_time;

      // Calculate scheduled hours (raw schedule time minus break)
      const scheduledRawHours = dayjs(`1970-01-01 ${scheduledEndTime}`).diff(
        dayjs(`1970-01-01 ${scheduledStartTime}`),
        "hour",
        true
      );
      const scheduledWorkHours = scheduledRawHours - breakDurationHours;

      // Calculate flags independently
      isHalfday = roundedTotalHours < scheduledWorkHours / 2;
      isUndertime = roundedTotalHours < scheduledWorkHours - 1;
    }

    // Note: overtime_hours will only be populated when overtime requests are approved
    // Do not auto-calculate overtime here

    // Update attendance record with new flags
    const result = await pool.query(
      `UPDATE attendance 
       SET time_out = $1, total_hours = $2, notes = $3, updated_at = $4, is_undertime = $5, is_halfday = $6
       WHERE employee_id = $7 AND date = $8 
       RETURNING *`,
      [
        currentTime,
        roundedTotalHours,
        notes || null,
        currentTime,
        isUndertime,
        isHalfday,
        actualEmployeeId,
        today,
      ]
    );

    res.status(200).json({
      success: true,
      message: `Clocked out successfully - ${employeeName}${
        isUndertime ? " (Undertime)" : ""
      }${isHalfday ? " (Half-day)" : ""}`,
      data: {
        ...result.rows[0],
        employee_name: employeeName,
        hours_worked: roundedTotalHours,
        break_duration_hours: breakDurationHours,
        is_undertime: isUndertime,
        is_halfday: isHalfday,
        method: rfid ? "RFID" : "Manual",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startBreak = async (req, res) => {
  res.status(410).json({
    success: false,
    message: "Break system is now automatic based on employee schedule",
    note: "Break duration is calculated from assigned schedule break_duration field during clock-out",
    deprecated: true,
  });
};

export const endBreak = async (req, res) => {
  res.status(410).json({
    success: false,
    message: "Break system is now automatic based on employee schedule",
    note: "Break duration is calculated from assigned schedule break_duration field during clock-out",
    deprecated: true,
  });
};

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
      `SELECT e.schedule_id, s.break_duration, s.start_time, s.end_time
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
    // Convert break duration from minutes to hours
    const breakDuration = (scheduleData.break_duration || 0) / 60;
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
        s.break_duration
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
    const {
      date,
      time_in,
      time_out,
      notes,
      total_hours,
      overtime_hours,
      // Boolean flags
      is_present,
      is_absent,
      is_late,
      on_leave,
      is_undertime,
      is_halfday,
      is_dayoff,
      is_regular_holiday,
      is_special_holiday,
      // Leave information
      leave_type_id,
      leave_request_id,
    } = req.body;

    // Validate required fields
    if (!attendance_id) {
      return res.status(400).json({
        success: false,
        message: "Attendance ID is required",
      });
    }

    // Build dynamic update query
    let updateFields = [];
    let values = [];
    let paramIndex = 1;

    // Basic fields
    if (date !== undefined) {
      updateFields.push(`date = $${paramIndex++}`);
      values.push(date);
    }
    if (time_in !== undefined) {
      updateFields.push(`time_in = $${paramIndex++}`);
      values.push(time_in);
    }
    if (time_out !== undefined) {
      updateFields.push(`time_out = $${paramIndex++}`);
      values.push(time_out);
    }
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }
    if (total_hours !== undefined) {
      updateFields.push(`total_hours = $${paramIndex++}`);
      values.push(total_hours);
    }
    if (overtime_hours !== undefined) {
      updateFields.push(`overtime_hours = $${paramIndex++}`);
      values.push(overtime_hours);
    }

    // Boolean attendance flags
    if (is_present !== undefined) {
      updateFields.push(`is_present = $${paramIndex++}`);
      values.push(is_present);
    }
    if (is_absent !== undefined) {
      updateFields.push(`is_absent = $${paramIndex++}`);
      values.push(is_absent);
    }
    if (is_late !== undefined) {
      updateFields.push(`is_late = $${paramIndex++}`);
      values.push(is_late);
    }
    if (on_leave !== undefined) {
      updateFields.push(`on_leave = $${paramIndex++}`);
      values.push(on_leave);
    }
    if (is_undertime !== undefined) {
      updateFields.push(`is_undertime = $${paramIndex++}`);
      values.push(is_undertime);
    }
    if (is_halfday !== undefined) {
      updateFields.push(`is_halfday = $${paramIndex++}`);
      values.push(is_halfday);
    }

    // Special day flags
    if (is_dayoff !== undefined) {
      updateFields.push(`is_dayoff = $${paramIndex++}`);
      values.push(is_dayoff);
    }
    if (is_regular_holiday !== undefined) {
      updateFields.push(`is_regular_holiday = $${paramIndex++}`);
      values.push(is_regular_holiday);
    }
    if (is_special_holiday !== undefined) {
      updateFields.push(`is_special_holiday = $${paramIndex++}`);
      values.push(is_special_holiday);
    }

    // Leave information
    if (leave_type_id !== undefined) {
      updateFields.push(`leave_type_id = $${paramIndex++}`);
      values.push(leave_type_id);
    }
    if (leave_request_id !== undefined) {
      updateFields.push(`leave_request_id = $${paramIndex++}`);
      values.push(leave_request_id);
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length === 1) {
      // Only updated_at
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    // Add attendance_id as the last parameter
    values.push(attendance_id);

    const result = await pool.query(
      `
      UPDATE attendance
      SET ${updateFields.join(", ")}
      WHERE attendance_id = $${paramIndex}
      RETURNING *
    `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Get the updated record with employee information
    const detailedResult = await pool.query(
      `
      SELECT 
        a.*, e.first_name, e.last_name,
        COALESCE(a.total_hours, 0) as calculated_total_hours,
        COALESCE(a.overtime_hours, 0) as overtime_hours,
        s.break_duration
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      LEFT JOIN schedules s ON e.schedule_id = s.schedule_id
      WHERE a.attendance_id = $1
    `,
      [attendance_id]
    );

    res.status(200).json({
      success: true,
      message: "Attendance record updated successfully",
      data: detailedResult.rows[0],
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

    console.log(
      "Processing timesheet for attendance IDs:",
      attendanceIds,
      "from",
      startDate,
      "to",
      endDate
    );

    // Convert timezone-aware dates to Philippine local dates for comparison
    // Frontend sends UTC timestamps like "2025-09-14T16:00:00.000Z" which is actually Sept 15 in Philippines
    const startDatePH = dayjs(startDate).tz("Asia/Manila").format("YYYY-MM-DD");
    const endDatePH = dayjs(endDate).tz("Asia/Manila").format("YYYY-MM-DD");

    console.log("Converted to Philippine dates:", startDatePH, "to", endDatePH);

    // Debug: Check a sample attendance record date
    const sampleCheck = await pool.query(
      `SELECT attendance_id, date, 
       date AT TIME ZONE 'Asia/Manila' as date_ph,
       date::text as date_string
       FROM attendance WHERE attendance_id = ANY($1::int[]) LIMIT 1`,
      [attendanceIds]
    );

    if (sampleCheck.rows.length > 0) {
      console.log("Sample attendance record debug:", sampleCheck.rows[0]);
    }

    // Check if attendance records exist within the specified date range
    // Use string comparison for dates to avoid timezone issues
    const attendanceCheck = await pool.query(
      `
        SELECT attendance_id, date, date::text as date_string
        FROM attendance 
        WHERE attendance_id = ANY($1::int[])
        AND date::text BETWEEN $2 AND $3
      `,
      [attendanceIds, startDatePH, endDatePH]
    );

    console.log(
      `Found ${attendanceCheck.rows.length} matching records:`,
      attendanceCheck.rows
    );

    // If no matching records found, return error
    if (attendanceCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `The selected attendance records were not found in the specified date range`,
      });
    }

    // Create timesheet query
    const createTimesheetQuery = `
      INSERT INTO timesheets
      (start_date, end_date)
      VALUES ($1, $2)
      RETURNING timesheet_id
    `;

    const timesheetId = await pool.query(createTimesheetQuery, [
      startDate,
      endDate,
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
    res.status(200).json({ success: true, data: timesheets.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
