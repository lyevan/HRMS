import { pool } from "../config/db.js";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

// Get all leave requests with employee and leave type details
export const getAllLeaveRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        lr.*,
        e.first_name,
        e.last_name,
        e.employee_id as emp_id,
        lt.name as leave_type_name,
        lt.description as leave_type_description,
        (SELECT CONCAT(first_name, ' ', last_name) FROM employees WHERE employee_id = lr.approved_by) as approver_name,
        (lr.end_date - lr.start_date + 1) as days_requested
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.employee_id
      JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
      ORDER BY lr.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get leave requests for a specific employee
export const getEmployeeLeaveRequests = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        lr.*,
        lt.name as leave_type_name,
        lt.description as leave_type_description,
        (lr.end_date - lr.start_date + 1) as days_requested
      FROM leave_requests lr
      JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
      WHERE lr.employee_id = $1
      ORDER BY lr.created_at DESC
    `,
      [employee_id]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Apply for leave
export const applyForLeave = async (req, res) => {
  try {
    const { employee_id, leave_type_id, start_date, end_date, reason } =
      req.body;

    // Validate required fields
    if (!employee_id || !leave_type_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message:
          "Employee ID, leave type, start date, and end date are required",
      });
    }

    // Validate dates
    const startDate = dayjs(start_date);
    const endDate = dayjs(end_date);

    if (!startDate.isValid() || !endDate.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (endDate.isBefore(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    // Check if employee exists and is active
    const employee = await pool.query(
      "SELECT employee_id, first_name, last_name FROM employees WHERE employee_id = $1 AND status = 'active'",
      [employee_id]
    );

    if (employee.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Active employee not found",
      });
    }

    // Check if leave type exists
    const leaveType = await pool.query(
      "SELECT leave_type_id, name FROM leave_types WHERE leave_type_id = $1",
      [leave_type_id]
    );

    if (leaveType.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

    // Check for overlapping leave requests
    const overlapping = await pool.query(
      `
      SELECT leave_request_id FROM leave_requests 
      WHERE employee_id = $1 
        AND status IN ('pending', 'approved')
        AND NOT (end_date < $2 OR start_date > $3)
    `,
      [employee_id, start_date, end_date]
    );

    if (overlapping.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have overlapping leave requests for this period",
      });
    }

    // Calculate days requested
    const daysRequested = endDate.diff(startDate, "day") + 1;

    // Check leave balance if exists
    const leaveBalance = await pool.query(
      `
      SELECT balance FROM leave_balance 
      WHERE employee_id = $1 AND leave_type_id = $2
    `,
      [employee_id, leave_type_id]
    );

    if (
      leaveBalance.rows.length > 0 &&
      leaveBalance.rows[0].balance < daysRequested
    ) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. Available: ${leaveBalance.rows[0].balance} days, Requested: ${daysRequested} days`,
      });
    }

    // Insert leave request
    const result = await pool.query(
      `
      INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [employee_id, leave_type_id, start_date, end_date, reason || null]
    );

    res.status(201).json({
      success: true,
      message: `Leave request submitted successfully for ${employee.rows[0].first_name} ${employee.rows[0].last_name}`,
      data: {
        ...result.rows[0],
        employee_name: `${employee.rows[0].first_name} ${employee.rows[0].last_name}`,
        leave_type_name: leaveType.rows[0].name,
        days_requested: daysRequested,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Approve leave request
export const approveLeaveRequest = async (req, res) => {
  try {
    const { leave_request_id } = req.params;
    const { approved_by, comments } = req.body;
    console.log("Approved by:", approved_by);

    // Get leave request details
    const leaveRequest = await pool.query(
      `
      SELECT 
        lr.*,
        e.first_name,
        e.last_name,
        lt.name as leave_type_name,
        (lr.end_date - lr.start_date + 1) as days_requested
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.employee_id
      JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
      WHERE lr.leave_request_id = $1
    `,
      [leave_request_id]
    );

    if (leaveRequest.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    const request = leaveRequest.rows[0];

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${request.status}`,
      });
    }

    try {
      // Update leave request status
      await pool.query(
        `
        UPDATE leave_requests 
        SET status = 'approved', 
            approved_by = $1, 
            approved_date = CURRENT_TIMESTAMP,
            comments = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE leave_request_id = $3
      `,
        [approved_by, comments, leave_request_id]
      );

      // Deduct from leave balance if exists
      const balanceExists = await pool.query(
        `
        SELECT balance FROM leave_balance 
        WHERE employee_id = $1 AND leave_type_id = $2
      `,
        [request.employee_id, request.leave_type_id]
      );

      if (balanceExists.rows.length > 0) {
        await pool.query(
          `
          UPDATE leave_balance 
          SET balance = balance - $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE employee_id = $2 AND leave_type_id = $3
        `,
          [request.days_requested, request.employee_id, request.leave_type_id]
        );
      }

      // Create attendance records for approved leave period
      const startDate = dayjs(request.start_date);
      const endDate = dayjs(request.end_date);

      for (
        let date = startDate;
        date.isSameOrBefore(endDate);
        date = date.add(1, "day")
      ) {
        const dateStr = date.format("YYYY-MM-DD");

        // Check if attendance record exists
        const existingAttendance = await pool.query(
          "SELECT attendance_id FROM attendance WHERE employee_id = $1 AND date = $2",
          [request.employee_id, dateStr]
        );

        if (existingAttendance.rows.length > 0) {
          // Update existing record
          await pool.query(
            `
            UPDATE attendance 
            SET is_present = false, 
                is_absent = false, 
                on_leave = true, 
                leave_type_id = $1,
                leave_request_id = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE employee_id = $3 AND date = $4
          `,
            [
              request.leave_type_id,
              leave_request_id,
              request.employee_id,
              dateStr,
            ]
          );
        } else {
          // Create new attendance record for leave
          await pool.query(
            `
            INSERT INTO attendance (
              employee_id, date, is_present, is_absent, on_leave, 
              leave_type_id, leave_request_id
            ) VALUES ($1, $2, false, false, true, $3, $4)
          `,
            [
              request.employee_id,
              dateStr,
              request.leave_type_id,
              leave_request_id,
            ]
          );
        }
      }

      res.status(200).json({
        success: true,
        message: `Leave request approved for ${request.first_name} ${request.last_name}`,
        data: {
          leave_request_id,
          employee_name: `${request.first_name} ${request.last_name}`,
          leave_type: request.leave_type_name,
          period: `${request.start_date} to ${request.end_date}`,
          days_approved: request.days_requested,
        },
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Reject leave request
export const rejectLeaveRequest = async (req, res) => {
  try {
    const { leave_request_id } = req.params;
    const { rejected_by, comments } = req.body;

    // Get leave request details
    const leaveRequest = await pool.query(
      `
      SELECT 
        lr.*,
        e.first_name,
        e.last_name,
        lt.name as leave_type_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.employee_id
      JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
      WHERE lr.leave_request_id = $1
    `,
      [leave_request_id]
    );

    if (leaveRequest.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    const request = leaveRequest.rows[0];

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${request.status}`,
      });
    }

    // Update leave request status
    const result = await pool.query(
      `
      UPDATE leave_requests 
      SET status = 'rejected', 
          rejected_by = $1, 
          rejected_date = CURRENT_TIMESTAMP,
          comments = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE leave_request_id = $3
      RETURNING *
    `,
      [rejected_by, comments, leave_request_id]
    );

    res.status(200).json({
      success: true,
      message: `Leave request rejected for ${request.first_name} ${request.last_name}`,
      data: {
        ...result.rows[0],
        employee_name: `${request.first_name} ${request.last_name}`,
        leave_type: request.leave_type_name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel leave request (by employee)
export const cancelLeaveRequest = async (req, res) => {
  try {
    const { leave_request_id } = req.params;
    const { employee_id } = req.body;

    // Get leave request details
    const leaveRequest = await pool.query(
      `
      SELECT 
        lr.*,
        e.first_name,
        e.last_name,
        lt.name as leave_type_name,
        (lr.end_date - lr.start_date + 1) as days_requested
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.employee_id
      JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
      WHERE lr.leave_request_id = $1 AND lr.employee_id = $2
    `,
      [leave_request_id, employee_id]
    );

    if (leaveRequest.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Leave request not found or you don't have permission to cancel this request",
      });
    }

    const request = leaveRequest.rows[0];

    if (request.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Leave request is already cancelled",
      });
    }

    // Check if it's too late to cancel (e.g., leave has already started)
    const today = dayjs().tz("Asia/Manila").format("YYYY-MM-DD");
    if (dayjs(request.start_date).isSameOrBefore(today)) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot cancel leave request that has already started or passed",
      });
    }

    try {
      // Update leave request status
      await pool.query(
        `
        UPDATE leave_requests 
        SET status = 'cancelled', 
            updated_at = CURRENT_TIMESTAMP
        WHERE leave_request_id = $1
      `,
        [leave_request_id]
      );

      // If it was approved, restore leave balance and remove attendance records
      if (request.status === "approved") {
        // Restore leave balance
        const balanceExists = await pool.query(
          `
          SELECT balance FROM leave_balance 
          WHERE employee_id = $1 AND leave_type_id = $2
        `,
          [request.employee_id, request.leave_type_id]
        );

        if (balanceExists.rows.length > 0) {
          await pool.query(
            `
            UPDATE leave_balance 
            SET balance = balance + $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE employee_id = $2 AND leave_type_id = $3
          `,
            [request.days_requested, request.employee_id, request.leave_type_id]
          );
        }

        // Remove or update attendance records
        await pool.query(
          `
          DELETE FROM attendance 
          WHERE employee_id = $1 
            AND leave_request_id = $2
            AND date >= $3
        `,
          [request.employee_id, leave_request_id, today]
        );
      }

      res.status(200).json({
        success: true,
        message: `Leave request cancelled successfully`,
        data: {
          leave_request_id,
          employee_name: `${request.first_name} ${request.last_name}`,
          leave_type: request.leave_type_name,
          period: `${request.start_date} to ${request.end_date}`,
        },
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get leave types
export const getLeaveTypes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM leave_types 
      ORDER BY name ASC
    `);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get employee leave balances
export const getEmployeeLeaveBalances = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        lb.*,
        lt.name as leave_type_name,
        lt.description
      FROM leave_balance lb
      JOIN leave_types lt ON lb.leave_type_id = lt.leave_type_id
      WHERE lb.employee_id = $1
      ORDER BY lt.name ASC
    `,
      [employee_id]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get leave calendar for an employee (for specific month/year)
export const getEmployeeLeaveCalendar = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { year, month } = req.query;

    let dateFilter = "";
    let params = [employee_id];

    if (year && month) {
      dateFilter =
        "AND EXTRACT(YEAR FROM lr.start_date) = $2 AND EXTRACT(MONTH FROM lr.start_date) = $3";
      params.push(year, month);
    } else if (year) {
      dateFilter = "AND EXTRACT(YEAR FROM lr.start_date) = $2";
      params.push(year);
    }

    const result = await pool.query(
      `
      SELECT 
        lr.*,
        lt.name as leave_type_name,
        (lr.end_date - lr.start_date + 1) as days_count
      FROM leave_requests lr
      JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
      WHERE lr.employee_id = $1 
        AND lr.status = 'approved'
        ${dateFilter}
      ORDER BY lr.start_date ASC
    `,
      params
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
