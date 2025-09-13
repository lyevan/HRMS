import { pool } from "../config/db.js";
import { getPhilippineTime } from "../utils/getPH_Time.js";

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

let pendingUser = null;
const enrollDuration = 30_000;

const getEmployeeByRFID = async (tag) => {
  if (!tag) {
    return;
  }
  let employee;
  try {
    employee = await pool.query(
      "SELECT * FROM employees WHERE rfid = $1 AND status = 'active'",
      [tag]
    );
  } catch (error) {
    console.log(error.message);
  }

  return employee.rows[0];
};

// Define valid modes for attendance operations
const VALID_MODES = ["clock-in", "clock-out", "break-start", "break-end"];

const employeeHasExistingAttendance = async (employee_id, mode, today) => {
  // Input validation
  if (!employee_id || !mode || !today) {
    throw new Error(
      "Missing required parameters: employee_id, mode, and today are required"
    );
  }

  // Restrict mode parameter to valid values only
  if (!VALID_MODES.includes(mode)) {
    throw new Error(
      `Invalid mode: ${mode}. Valid modes are: ${VALID_MODES.join(", ")}`
    );
  }

  try {
    let query;
    let queryParams;

    switch (mode) {
      case "clock-in":
        // Check if employee already has clock-in record for today
        query =
          "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 AND time_in IS NOT NULL";
        queryParams = [employee_id, today];
        break;

      case "clock-out":
        // Check if employee has clock-in but no clock-out for today
        query =
          "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 AND time_in IS NOT NULL AND time_out IS NULL";
        queryParams = [employee_id, today];
        break;

      case "break-start":
      case "break-end":
        // Break system is now automatic - return deprecation info
        return {
          hasExisting: false,
          message: "Break system is now automatic based on employee schedule",
          deprecated: true,
          data: null,
        };

      default:
        throw new Error(`Unhandled mode: ${mode}`);
    }

    const result = await pool.query(query, queryParams);

    // Return different responses based on mode
    switch (mode) {
      case "clock-in":
        return {
          hasExisting: result.rows.length > 0,
          message:
            result.rows.length > 0
              ? "Employee already clocked in today"
              : "Can clock in",
          data: result.rows[0] || null,
        };

      case "clock-out":
        return {
          hasExisting: result.rows.length > 0,
          message:
            result.rows.length > 0
              ? "Can clock out"
              : "No clock-in record found or already clocked out",
          data: result.rows[0] || null,
        };

      case "break-start":
      case "break-end":
        return {
          hasExisting: false,
          message: "Break system is now automatic based on employee schedule",
          deprecated: true,
          data: null,
        };

      default:
        return {
          hasExisting: false,
          message: "Unknown mode",
          data: null,
        };
    }
  } catch (error) {
    console.error("Database error in employeeHasExistingAttendance:", error);
    throw new Error(`Database error: ${error.message}`);
  }
};

export const pendingEnrollment = async (req, res) => {
  const { employee_id } = req.body;
  try {
    if (!employee_id) {
      return res
        .status(400)
        .send({ success: false, message: "Employee ID is needed" });
    }

    if (Date.now() > pendingUser?.expiresAt) {
      pendingUser = null;
      return res.status(400).send({
        success: false,
        message: "The enrollment request has expired. Please request again.",
      });
    }

    if (pendingUser !== null) {
      return res.status(400).send({
        success: false,
        message: `There is already a pending enrollment for ${pendingUser.last_name}`,
      });
    }
    console.log(
      "User with employee ID of:",
      employee_id,
      "is enrolling RFID with 30 seconds timeout"
    );

    const employeeLastName = await pool.query(
      "SELECT last_name FROM employees WHERE employee_id = $1",
      [employee_id]
    );

    if (employeeLastName.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    console.log(employeeLastName.rows[0]);

    pendingUser = {
      employee_id,
      last_name: employeeLastName.rows[0].last_name,
      expiresAt: Date.now() + enrollDuration,
    };

    res.send({
      success: true,
      message: `Waiting for RFID Tag. Please enroll within ${enrollDuration
        .toString()
        .slice(0, -3)} seconds.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Internal Server Error",
    });
  }
};

// These below is only accessible to the RFID Scanner
export const handleEnrollment = async (req, res) => {
  const { tag } = req.body;
  console.log("Tag received for enrollment:", tag);
  console.log("Pending user:", pendingUser);

  if (!tag) {
    return res
      .status(400)
      .send({ success: false, message: "No tag were scanned." });
  }

  try {
    if (!pendingUser) {
      return res.status(400).send({
        success: false,
        message: "There is no currently active RFID enrollment",
      });
    }

    if (Date.now() > pendingUser.expiresAt) {
      pendingUser = null;
      return res.status(400).send({
        success: false,
        message: "The enrollment request has expired. Please request again.",
      });
    }

    const result = await pool.query(
      "UPDATE employees SET rfid = $1 WHERE employee_id = $2 RETURNING *",
      [tag, pendingUser.employee_id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, results: result.rows[0] });
    pendingUser = null;
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Internal Server Error",
    });
  }
};

export const deleteRFID = async (req, res) => {
  const { employee_id, rfid } = req.body;

  if (!employee_id || !rfid) {
    return res.status(400).send({
      success: false,
      message: "Employee ID and RFID are required",
    });
  }

  try {
    const result = await pool.query(
      "UPDATE employees SET rfid = NULL WHERE employee_id = $1 AND rfid = $2 RETURNING *",
      [employee_id, rfid]
    );

    if (result.rows.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Employee not found or RFID does not match",
      });
    }

    res.send({
      success: true,
      message: "RFID deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting RFID:", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const handleClocking = async (req, res) => {
  const { tag } = req.body;

  if (!tag) {
    return res
      .status(400)
      .send({ success: false, message: "No tag were scanned." });
  }

  try {
    // Find the employee by RFID
    const employee = await getEmployeeByRFID(tag);

    // Handle error if no employees were found
    if (!employee) {
      return res.status(404).send({
        success: false,
        message: "Employee not found or inactive",
      });
    }

    const employee_id = employee.employee_id.toString();

    const { date: today, time: currentTime } = getPhilippineTime();

    // Check if employee already has attendance record for today
    const clockInCheck = await employeeHasExistingAttendance(
      employee_id,
      "clock-in",
      today
    );

    if (!clockInCheck.hasExisting) {
      // No clock-in record today, proceed with clock-in
      const result = await pool.query(
        "INSERT INTO attendance (employee_id, date, time_in, is_present) VALUES ($1, $2, $3, true) RETURNING *",
        [employee_id, today, currentTime]
      );

      return res.status(201).json({
        success: true,
        message: `Clocked in successfully - ${employee.first_name} ${employee.last_name}`,
        action: "clock-in",
        data: {
          ...result.rows[0],
          employee_name: `${employee.first_name} ${employee.last_name}`,
          method: "RFID",
        },
      });
    } else {
      // Has clock-in record, check if can clock-out
      const clockOutCheck = await employeeHasExistingAttendance(
        employee_id,
        "clock-out",
        today
      );

      if (clockOutCheck.hasExisting) {
        // Can clock out - calculate hours using schedule break duration
        const record = clockOutCheck.data;

        // Get employee schedule for break calculation
        const scheduleQuery = await pool.query(
          `SELECT s.break_duration, s.start_time, s.end_time
           FROM employees e 
           JOIN schedules s ON e.schedule_id = s.schedule_id 
           WHERE e.employee_id = $1`,
          [employee_id]
        );

        let breakDurationHours = 0;
        if (
          scheduleQuery.rows.length > 0 &&
          scheduleQuery.rows[0].break_duration
        ) {
          // Convert break_duration from minutes to hours
          breakDurationHours = scheduleQuery.rows[0].break_duration / 60;
        }

        const toMinutes = (t) =>
          t
            .split(":")
            .reduce((acc, v, i) => acc + Number(v) * [60, 1, 1 / 60][i], 0);

        const timeInM = toMinutes(record.time_in);
        const timeOutM = toMinutes(currentTime);

        // Calculate raw hours worked
        const rawHours = (timeOutM - timeInM) / 60;

        // Only deduct break time if the employee worked long enough to take a break
        // Typically breaks are taken if working more than 4 hours
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
        const totalHrs = Math.round(payrollRoundedHours * 100) / 100;

        // Calculate scheduled work hours for undertime/halfday flags
        let isUndertime = false;
        let isHalfday = false;

        if (scheduleQuery.rows.length > 0) {
          const scheduledStartTime = scheduleQuery.rows[0].start_time;
          const scheduledEndTime = scheduleQuery.rows[0].end_time;

          // Calculate scheduled hours (raw schedule time minus break)
          const scheduledRawHours =
            (toMinutes(scheduledEndTime) - toMinutes(scheduledStartTime)) / 60;
          const scheduledWorkHours = scheduledRawHours - breakDurationHours;

          // Calculate flags independently
          isHalfday = totalHrs < scheduledWorkHours / 2;
          isUndertime = totalHrs < scheduledWorkHours - 1;
        }

        const result = await pool.query(
          `UPDATE attendance SET time_out = $1::time, total_hours = $2, is_undertime = $3, is_halfday = $4, updated_at = NOW()
           WHERE employee_id = $5 AND date = $6 RETURNING *`,
          [currentTime, totalHrs, isUndertime, isHalfday, employee_id, today]
        );

        return res.status(200).json({
          success: true,
          message: `Clocked out successfully - ${employee.first_name} ${
            employee.last_name
          }${isUndertime ? " (Undertime)" : ""}${
            isHalfday ? " (Half-day)" : ""
          }`,
          action: "clock-out",
          data: {
            ...result.rows[0],
            employee_name: `${employee.first_name} ${employee.last_name}`,
            hours_worked: totalHrs,
            is_undertime: isUndertime,
            is_halfday: isHalfday,
            method: "RFID",
          },
        });
      } else {
        // Already clocked out
        return res.status(400).json({
          success: false,
          message: "Employee already clocked out today",
        });
      }
    }
  } catch (error) {
    console.error("Error in handleClocking:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Internal Server Error",
    });
  }
};

export const handleBreak = async (req, res) => {
  res.status(410).json({
    success: false,
    message: "Break system is now automatic based on employee schedule",
    note: "Break duration is calculated from assigned schedule break_duration field during clock-out",
    deprecated: true,
    action: "break-deprecated",
  });
};
