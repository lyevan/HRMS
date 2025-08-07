import { pool } from "../config/db.js";
import { getPhilippineTime } from "../utils/getPH_Time.js";

// Get all attendance records with calculated hours
export const getAllAttendance = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.*, e.first_name, e.last_name, e.hourly_rate,
        CASE 
          WHEN a.time_in IS NOT NULL AND a.time_out IS NOT NULL THEN
            EXTRACT(EPOCH FROM (a.time_out - a.time_in)) / 3600 -
            COALESCE(EXTRACT(EPOCH FROM (a.break_end - a.break_start)) / 3600, 0)
          ELSE a.total_hours
        END AS calculated_total_hours,
        a.overtime_hours,
        CASE WHEN a.total_hours IS NOT NULL THEN a.total_hours * e.hourly_rate ELSE NULL END AS daily_pay,
        CASE WHEN a.overtime_hours IS NOT NULL THEN a.overtime_hours * e.hourly_rate * 1.5 ELSE NULL END AS overtime_pay
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      ORDER BY a.date DESC, a.time_in DESC
    `);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clockIn = async (req, res) => {
  try {
    const { employee_id, rfid } = req.body;
    const { date: today, time: currentTime } = getPhilippineTime();

    // Find employee by either employee_id or RFID
    let employee;
    if (employee_id) {
      employee = await pool.query(
        "SELECT * FROM employees WHERE id = $1 AND status = 'active'",
        [employee_id]
      );
    } else if (rfid) {
      employee = await pool.query(
        "SELECT * FROM employees WHERE rfid = $1 AND status = 'active'",
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
    const actualEmployeeId = foundEmployee.id;

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

    const result = await pool.query(
      "INSERT INTO attendance (employee_id, date, time_in, status) VALUES ($1, $2, $3, 'present') RETURNING *",
      [actualEmployeeId, today, currentTime]
    );

    res.status(201).json({
      success: true,
      message: `Clocked in successfully - ${foundEmployee.first_name} ${foundEmployee.last_name}`,
      data: {
        ...result.rows[0],
        employee_name: `${foundEmployee.first_name} ${foundEmployee.last_name}`,
        method: rfid ? "RFID" : "Manual",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clockOut = async (req, res) => {
  try {
    const { employee_id, rfid, notes } = req.body;
    const { date: today, time: currentTime } = getPhilippineTime();

    // Find employee by either employee_id or RFID
    let actualEmployeeId = employee_id;
    if (!employee_id && rfid) {
      const employee = await pool.query(
        "SELECT id FROM employees WHERE rfid = $1 AND status = 'active'",
        [rfid]
      );
      if (employee.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Active employee not found",
        });
      }
      actualEmployeeId = employee.rows[0].id;
    }

    if (!actualEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "Either employee_id or rfid is required",
      });
    }

    const attendanceRecord = await pool.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2",
      [actualEmployeeId, today]
    );
    if (attendanceRecord.rows.length === 0)
      return res.status(400).json({
        success: false,
        message: "No clock-in record found for today",
      });
    if (attendanceRecord.rows[0].time_out)
      return res.status(400).json({
        success: false,
        message: "Employee already clocked out today",
      });

    // ...existing calculation code...
    const record = attendanceRecord.rows[0];
    const toMinutes = (t) =>
      t
        .split(":")
        .reduce((acc, v, i) => acc + Number(v) * [60, 1, 1 / 60][i], 0);

    const timeInM = toMinutes(record.time_in);
    const timeOutM = toMinutes(currentTime);
    const breakM =
      record.break_start && record.break_end
        ? toMinutes(record.break_end) - toMinutes(record.break_start)
        : 0;
    const totalHrs =
      Math.round(((timeOutM - timeInM - breakM) / 60) * 100) / 100;
    const overtimeHrs = Math.max(totalHrs - 8, 0);

    const result = await pool.query(
      `UPDATE attendance SET time_out = $1::time, status = 'completed', total_hours = $2, overtime_hours = $3, notes = $4 
       WHERE employee_id = $5 AND date = $6 RETURNING *`,
      [
        currentTime,
        totalHrs,
        overtimeHrs,
        notes || null,
        actualEmployeeId,
        today,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Clocked out successfully",
      data: {
        ...result.rows[0],
        method: rfid ? "RFID" : "Manual",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startBreak = async (req, res) => {
  try {
    const { employee_id, rfid } = req.body;
    const { date: today, time: currentTime } = getPhilippineTime();

    // Find employee by either employee_id or RFID
    let actualEmployeeId = employee_id;
    if (!employee_id && rfid) {
      const employee = await pool.query(
        "SELECT id FROM employees WHERE rfid = $1 AND status = 'active'",
        [rfid]
      );
      if (employee.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Active employee not found",
        });
      }
      actualEmployeeId = employee.rows[0].id;
    }

    if (!actualEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "Either employee_id or rfid is required",
      });
    }

    const breakHistory = await pool.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 AND break_start IS NOT NULL",
      [actualEmployeeId, today]
    );
    if (breakHistory.rows.length > 0)
      return res
        .status(400)
        .json({ success: false, message: "Break already taken today." });

    const activeRecord = await pool.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 AND time_in IS NOT NULL AND time_out IS NULL",
      [actualEmployeeId, today]
    );
    if (activeRecord.rows.length === 0)
      return res.status(400).json({
        success: false,
        message: "No active attendance record or already clocked out",
      });

    const result = await pool.query(
      "UPDATE attendance SET break_start = $1::time, status = 'on_break' WHERE employee_id = $2 AND date = $3 RETURNING *",
      [currentTime, actualEmployeeId, today]
    );

    res.status(200).json({
      success: true,
      message: "Break started",
      data: {
        ...result.rows[0],
        method: rfid ? "RFID" : "Manual",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const endBreak = async (req, res) => {
  try {
    const { employee_id, rfid } = req.body;
    const { date: today, time: currentTime } = getPhilippineTime();

    // Find employee by either employee_id or RFID
    let actualEmployeeId = employee_id;
    if (!employee_id && rfid) {
      const employee = await pool.query(
        "SELECT id FROM employees WHERE rfid = $1 AND status = 'active'",
        [rfid]
      );
      if (employee.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Active employee not found",
        });
      }
      actualEmployeeId = employee.rows[0].id;
    }

    if (!actualEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "Either employee_id or rfid is required",
      });
    }

    const activeBreak = await pool.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 AND break_start IS NOT NULL AND break_end IS NULL",
      [actualEmployeeId, today]
    );
    if (activeBreak.rows.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "No active break found to end" });

    const result = await pool.query(
      "UPDATE attendance SET break_end = $1::time, status = 'present' WHERE employee_id = $2 AND date = $3 RETURNING *",
      [currentTime, actualEmployeeId, today]
    );

    res.status(200).json({
      success: true,
      message: "Break ended",
      data: {
        ...result.rows[0],
        method: rfid ? "RFID" : "Manual",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
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
      break_start,
      break_end,
      notes,
      status = "present",
    } = req.body;

    const existing = await pool.query(
      "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2",
      [employee_id, date]
    );
    if (existing.rows.length > 0)
      return res.status(400).json({
        success: false,
        message: "Attendance already exists for this date",
      });

    let totalHours = null,
      overtimeHours = null;
    if (time_in && time_out) {
      const result = await pool.query(
        `
        SELECT ROUND(EXTRACT(EPOCH FROM ($1::time - $2::time)) / 3600 -
        COALESCE(EXTRACT(EPOCH FROM ($3::time - $4::time)) / 3600, 0), 2) AS calculated_hours
      `,
        [time_out, time_in, break_end, break_start]
      );

      totalHours = result.rows[0].calculated_hours;
      overtimeHours = Math.max(totalHours - 8, 0);
    }

    const insert = await pool.query(
      `
      INSERT INTO attendance (employee_id, date, time_in, time_out, break_start, break_end, total_hours, overtime_hours, status, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `,
      [
        employee_id,
        date,
        time_in,
        time_out,
        break_start,
        break_end,
        totalHours,
        overtimeHours,
        status,
        notes,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Manual attendance record created",
      data: insert.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployeeStatus = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { date: today } = getPhilippineTime();

    const result = await pool.query(
      `
      SELECT a.*, e.first_name, e.last_name, e.hourly_rate,
        CASE 
          WHEN a.time_in IS NOT NULL AND a.time_out IS NOT NULL AND a.break_start IS NOT NULL AND a.break_end IS NOT NULL THEN 'completed'
          WHEN a.time_in IS NOT NULL AND a.time_out IS NOT NULL AND a.break_start IS NOT NULL AND a.break_end IS NULL THEN 'on_break'
          WHEN a.time_in IS NOT NULL AND a.time_out IS NULL THEN 'clocked_in'
          ELSE 'not_started'
        END AS current_status,
        CASE WHEN a.break_start IS NOT NULL THEN true ELSE false END AS break_taken,
        CASE 
          WHEN a.break_start IS NOT NULL AND a.break_end IS NOT NULL THEN EXTRACT(EPOCH FROM (a.break_end - a.break_start)) / 60
          WHEN a.break_start IS NOT NULL AND a.break_end IS NULL THEN EXTRACT(EPOCH FROM (CURRENT_TIME - a.break_start)) / 60
          ELSE 0
        END AS break_duration_minutes
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

export const canTakeBreak = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { date: today } = getPhilippineTime();

    const result = await pool.query(
      `
      SELECT 
        CASE 
          WHEN break_start IS NOT NULL THEN false
          WHEN time_in IS NULL THEN false
          WHEN time_out IS NOT NULL THEN false
          ELSE true
        END AS can_take_break,
        CASE 
          WHEN break_start IS NOT NULL THEN 'Break already taken today'
          WHEN time_in IS NULL THEN 'Employee not clocked in'
          WHEN time_out IS NOT NULL THEN 'Employee already clocked out'
          ELSE 'Break available'
        END AS message
      FROM attendance WHERE employee_id = $1 AND date = $2
    `,
      [employee_id, today]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        can_take_break: false,
        message: "No attendance record found for today",
      });
    }

    res.status(200).json({
      success: true,
      can_take_break: result.rows[0].can_take_break,
      message: result.rows[0].message,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const manualUpdate = async (req, res) => {
  const employee_id = req.params.employee_id;
  const { date, time_in, time_out, break_start, break_end, notes, status } =
    req.body;

  try {
    const result = await pool.query(
      `
      UPDATE attendance
      SET date = $1, time_in = $2, time_out = $3, break_start = $4, break_end = $5, notes = $6, status = $7
      WHERE employee_id = $8
      RETURNING *
    `,
      [
        date,
        time_in,
        time_out,
        break_start,
        break_end,
        notes,
        status,
        employee_id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance record updated",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
