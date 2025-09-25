import { pool } from "../config/db.js";
import dayjs from "dayjs";

// Helper function to validate request data
const validateRequestData = (requestType, data) => {
  const errors = [];

  // Common validations
  if (!data.employee_id) errors.push("Employee ID is required");
  if (!data.title) errors.push("Title is required");
  if (!data.description) errors.push("Description is required");

  // Type-specific validations
  switch (requestType) {
    case "manual_log":
      if (!data.target_date) errors.push("Target date is required");
      if (!data.reason) errors.push("Reason is required");
      break;

    case "overtime":
      if (!data.attendance_id) errors.push("Attendance ID is required");
      if (!data.expected_hours) errors.push("Expected hours is required");
      if (!data.reason) errors.push("Reason is required");
      break;

    case "out_of_business":
      if (!data.destination) errors.push("Destination is required");
      if (!data.purpose) errors.push("Purpose is required");
      if (!data.start_date) errors.push("Start date is required");
      if (!data.end_date) errors.push("End date is required");
      break;

    case "change_shift":
      if (!data.current_shift_start)
        errors.push("Current shift start is required");
      if (!data.current_shift_end) errors.push("Current shift end is required");
      if (!data.requested_shift_start)
        errors.push("Requested shift start is required");
      if (!data.requested_shift_end)
        errors.push("Requested shift end is required");
      if (!data.reason) errors.push("Reason is required");
      break;

    case "change_dayoff":
      if (!data.current_dayoff) errors.push("Current day off is required");
      if (!data.requested_dayoff) errors.push("Requested day off is required");
      if (!data.reason) errors.push("Reason is required");
      break;

    case "undertime":
      if (!data.undertime_date) errors.push("Undertime date is required");
      if (!data.early_out_time) errors.push("Early out time is required");
      if (!data.reason) errors.push("Reason is required");
      break;

    default:
      errors.push("Invalid request type");
  }

  return errors;
};

// Get all requests with filtering
export const getAllRequests = async (req, res) => {
  try {
    const {
      employee_id,
      request_type,
      status,
      start_date,
      end_date,
      page = 1,
      limit = 50,
    } = req.query;

    let query = `
      SELECT 
        r.*,
        e.first_name,
        e.last_name,
        approver.first_name as approved_by_first_name,
        approver.last_name as approved_by_last_name,
        rejector.first_name as rejected_by_first_name,
        rejector.last_name as rejected_by_last_name
      FROM requests r
      JOIN employees e ON r.employee_id = e.employee_id
      LEFT JOIN employees approver ON r.approved_by = approver.employee_id
      LEFT JOIN employees rejector ON r.rejected_by = rejector.employee_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (employee_id) {
      query += ` AND r.employee_id = $${++paramCount}`;
      params.push(employee_id);
    }

    if (request_type) {
      query += ` AND r.request_type = $${++paramCount}`;
      params.push(request_type);
    }

    if (status) {
      query += ` AND r.status = $${++paramCount}`;
      params.push(status);
    }

    if (start_date) {
      query += ` AND r.requested_date >= $${++paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND r.requested_date <= $${++paramCount}`;
      params.push(end_date);
    }

    query += ` ORDER BY r.created_at DESC`;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, (page - 1) * limit);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM requests r 
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 0;

    if (employee_id) {
      countQuery += ` AND r.employee_id = $${++countParamIndex}`;
      countParams.push(employee_id);
    }
    if (request_type) {
      countQuery += ` AND r.request_type = $${++countParamIndex}`;
      countParams.push(request_type);
    }
    if (status) {
      countQuery += ` AND r.status = $${++countParamIndex}`;
      countParams.push(status);
    }
    if (start_date) {
      countQuery += ` AND r.requested_date >= $${++countParamIndex}`;
      countParams.push(start_date);
    }
    if (end_date) {
      countQuery += ` AND r.requested_date <= $${++countParamIndex}`;
      countParams.push(end_date);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get request details with specific type data
export const getRequestDetails = async (req, res) => {
  try {
    const { request_id } = req.params;

    // Get main request data
    const requestResult = await pool.query(
      `
      SELECT 
        r.*,
        e.first_name,
        e.last_name,
        e.email,
        approver.first_name as approved_by_first_name,
        approver.last_name as approved_by_last_name,
        rejector.first_name as rejected_by_first_name,
        rejector.last_name as rejected_by_last_name
      FROM requests r
      JOIN employees e ON r.employee_id = e.employee_id
      LEFT JOIN employees approver ON r.approved_by = approver.employee_id
      LEFT JOIN employees rejector ON r.rejected_by = rejector.employee_id
      WHERE r.request_id = $1
    `,
      [request_id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    const request = requestResult.rows[0];
    let specificData = null;

    // Get type-specific data
    switch (request.request_type) {
      case "manual_log":
        const manualLogResult = await pool.query(
          "SELECT * FROM manual_log_requests WHERE request_id = $1",
          [request_id]
        );
        specificData = manualLogResult.rows[0] || null;
        break;

      case "overtime":
        const overtimeResult = await pool.query(
          "SELECT * FROM overtime_requests WHERE request_id = $1",
          [request_id]
        );
        specificData = overtimeResult.rows[0] || null;
        break;

      case "out_of_business":
        const outOfBusinessResult = await pool.query(
          "SELECT * FROM out_of_business_requests WHERE request_id = $1",
          [request_id]
        );
        specificData = outOfBusinessResult.rows[0] || null;
        break;

      case "change_shift":
        const changeShiftResult = await pool.query(
          "SELECT * FROM change_shift_requests WHERE request_id = $1",
          [request_id]
        );
        specificData = changeShiftResult.rows[0] || null;
        break;

      case "change_dayoff":
        const changeDayoffResult = await pool.query(
          "SELECT * FROM change_dayoff_requests WHERE request_id = $1",
          [request_id]
        );
        specificData = changeDayoffResult.rows[0] || null;
        break;

      case "undertime":
        const undertimeResult = await pool.query(
          "SELECT * FROM undertime_requests WHERE request_id = $1",
          [request_id]
        );
        specificData = undertimeResult.rows[0] || null;
        break;
    }

    res.status(200).json({
      success: true,
      data: {
        ...request,
        specific_data: specificData,
      },
    });
  } catch (error) {
    console.error("Error fetching request details:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new request
export const createRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { request_type, ...requestData } = req.body;

    console.log("Request Data", requestData);

    // Validate request data
    const validationErrors = validateRequestData(request_type, requestData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Insert main request
    const requestResult = await client.query(
      `
      INSERT INTO requests (
        employee_id, request_type, title, description, 
        start_date, end_date, requested_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [
        requestData.employee_id,
        request_type,
        requestData.title,
        requestData.description,
        requestData.start_date || null,
        requestData.end_date || null,
        requestData.requested_date || new Date(),
      ]
    );

    const newRequest = requestResult.rows[0];
    const requestId = newRequest.request_id;

    // Insert type-specific data
    switch (request_type) {
      case "manual_log":
        // Ensure target_date is treated as UTC date (not local time)
        const targetDate = new Date(requestData.target_date + "T00:00:00Z");
        const formattedTargetDate = targetDate.toISOString().split("T")[0];

        await client.query(
          `
          INSERT INTO manual_log_requests (
            request_id, target_date, time_in, time_out, break_duration,
            shift_start_time, shift_end_time, reason, supporting_documents
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
          [
            requestId,
            requestData.target_date,
            requestData.time_in || null,
            requestData.time_out || null,
            requestData.break_duration || null,
            requestData.shift_start_time || null,
            requestData.shift_end_time || null,
            requestData.reason,
            requestData.supporting_documents || [],
          ]
        );
        break;

      case "overtime":
        await client.query(
          `
          INSERT INTO overtime_requests (
            request_id, attendance_id, requested_overtime_hours, reason, project_or_task
          ) VALUES ($1, $2, $3, $4, $5)
        `,
          [
            requestId,
            requestData.attendance_id,
            requestData.expected_hours || 0,
            requestData.reason,
            requestData.project_or_task || null,
          ]
        );
        break;

      case "out_of_business":
        await client.query(
          `
          INSERT INTO out_of_business_requests (
            request_id, destination, purpose, client_or_company,
            contact_person, contact_number, transportation_mode, estimated_cost
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
          [
            requestId,
            requestData.destination,
            requestData.purpose,
            requestData.client_or_company || null,
            requestData.contact_person || null,
            requestData.contact_number || null,
            requestData.transportation_mode || null,
            requestData.estimated_cost || null,
          ]
        );
        break;

      case "change_shift":
        await client.query(
          `
          INSERT INTO change_shift_requests (
            request_id, current_shift_start, current_shift_end,
            requested_shift_start, requested_shift_end, reason,
            is_permanent, effective_until
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
          [
            requestId,
            requestData.current_shift_start,
            requestData.current_shift_end,
            requestData.requested_shift_start,
            requestData.requested_shift_end,
            requestData.reason,
            requestData.is_permanent || false,
            requestData.effective_until || null,
          ]
        );
        break;

      case "change_dayoff":
        await client.query(
          `
          INSERT INTO change_dayoff_requests (
            request_id, current_dayoff, requested_dayoff, reason,
            is_permanent, effective_until
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [
            requestId,
            requestData.current_dayoff,
            requestData.requested_dayoff,
            requestData.reason,
            requestData.is_permanent || false,
            requestData.effective_until || null,
          ]
        );
        break;

      case "undertime":
        await client.query(
          `
          INSERT INTO undertime_requests (
            request_id, undertime_date, early_out_time,
            expected_hours_missed, reason, is_emergency, makeup_plan
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
          [
            requestId,
            requestData.undertime_date,
            requestData.early_out_time,
            requestData.expected_hours_missed || 0,
            requestData.reason,
            requestData.is_emergency || false,
            requestData.makeup_plan || null,
          ]
        );
        break;
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Request created successfully",
      data: newRequest,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating request:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

// Approve a request
export const approveRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { request_id } = req.params;
    const { approved_by, comments } = req.body;

    // First, get the request details to know what type it is
    const requestResult = await client.query(
      "SELECT * FROM requests WHERE request_id = $1 AND status = 'pending'",
      [request_id]
    );

    if (requestResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Request not found or already processed",
      });
    }

    const request = requestResult.rows[0];

    // Update the request status
    const result = await client.query(
      `
      UPDATE requests 
      SET 
        status = 'approved',
        approved_by = $1,
        approved_date = NOW(),
        updated_at = NOW()
      WHERE request_id = $2
      RETURNING *
    `,
      [approved_by, request_id]
    );

    // Handle special processing based on request type
    if (request.request_type === "manual_log") {
      // Import required functions
      const {
        getHolidayInfo,
        enhancedClockInCalculation,
        enhancedClockOutCalculation,
      } = await import("../utils/attendanceCalculations.js");

      // Get the manual log request details
      const manualLogResult = await client.query(
        "SELECT * FROM manual_log_requests WHERE request_id = $1",
        [request_id]
      );

      if (manualLogResult.rows.length > 0) {
        const manualLog = manualLogResult.rows[0];

        // Check if attendance already exists for this employee and date
        const existingAttendance = await client.query(
          "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2",
          [request.employee_id, manualLog.target_date]
        );

        if (existingAttendance.rows.length > 0) {
          throw new Error(
            `Attendance record already exists for employee ${request.employee_id} on date ${manualLog.target_date}`
          );
        }

        // Get employee schedule information
        const scheduleQuery = await client.query(
          `SELECT s.*, e.first_name, e.last_name
           FROM schedules s
           JOIN employees e ON e.schedule_id = s.schedule_id
           WHERE e.employee_id = $1`,
          [request.employee_id]
        );

        const scheduleInfo =
          scheduleQuery.rows.length > 0
            ? scheduleQuery.rows[0]
            : {
                break_duration: 60,
                break_start: "12:00:00",
                break_end: "13:00:00",
                start_time: "08:00:00",
                end_time: "17:00:00",
              };

        // Convert manual log times to UTC timestamps
        // time_in and time_out are now stored as full timestamptz in the database
        // const workDateObj = new Date(manualLog.target_date);
        // const workDate = workDateObj.toISOString().split("T")[0]; // Format as YYYY-MM-DD
        const workDate = manualLog.target_date;

        // time_in and time_out are now full timestamps, convert to ISO strings for calculations
        const timeInUTC = manualLog.time_in
          ? new Date(manualLog.time_in).toISOString()
          : null;
        const timeOutUTC = manualLog.time_out
          ? new Date(manualLog.time_out).toISOString()
          : null;

        // Validate required fields
        if (!workDate || !timeInUTC || !timeOutUTC) {
          throw new Error(
            `Missing required fields for manual log: date=${workDate}, time_in=${timeInUTC}, time_out=${timeOutUTC}`
          );
        }

        // Handle overnight shifts (if timeOut is next day)
        if (new Date(timeOutUTC) < new Date(timeInUTC)) {
          const timeOutDate = new Date(timeOutUTC);
          timeOutDate.setDate(timeOutDate.getDate() + 1);
          timeOutUTC = timeOutDate.toISOString();
        }

        // Get holiday information
        const holidayInfo = await getHolidayInfo(timeInUTC);

        // Create attendance record using enhanced calculations
        // First, simulate clock-in
        const clockInCalcs = await enhancedClockInCalculation(
          request.employee_id,
          timeInUTC,
          {
            start_time: scheduleInfo.start_time,
            end_time: scheduleInfo.end_time,
            break_start: scheduleInfo.break_start,
            break_end: scheduleInfo.break_end,
          },
          holidayInfo
        );

        // Create initial attendance record
        const attendanceRecord = {
          attendance_id: null, // Will be set after insert
          employee_id: request.employee_id,
          date: workDate,
          time_in: timeInUTC,
          time_out: null, // Will be set by clock-out
          is_present: true,
          is_late: clockInCalcs.is_late,
          is_absent: false,
          is_dayoff: false, // Will be determined by schedule
          is_regular_holiday: clockInCalcs.is_regular_holiday,
          is_special_holiday: clockInCalcs.is_special_holiday,
          late_minutes: clockInCalcs.late_minutes,
          is_entitled_holiday: clockInCalcs.is_entitled_holiday,
        };

        // Now simulate clock-out to get complete calculations
        const clockOutCalcs = await enhancedClockOutCalculation(
          attendanceRecord,
          timeOutUTC,
          {
            start_time: scheduleInfo.start_time,
            end_time: scheduleInfo.end_time,
            break_start: scheduleInfo.break_start,
            break_end: scheduleInfo.break_end,
          }
        );

        console.log("Clock-in calculations:", clockInCalcs);
        console.log("Clock-out calculations:", clockOutCalcs);
        const attendanceResult = await client.query(
          `INSERT INTO attendance (
            employee_id, date, time_in, time_out, total_hours, overtime_hours,
            is_present, is_late, is_absent, is_undertime, is_halfday,
            undertime_minutes, is_dayoff, is_regular_holiday, is_special_holiday,
            late_minutes, night_differential_hours, rest_day_hours_worked,
            regular_holiday_hours_worked, special_holiday_hours_worked,
            payroll_breakdown, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, NOW(), NOW()
          ) RETURNING *`,
          [
            request.employee_id,
            workDate,
            timeInUTC,
            timeOutUTC,
            clockOutCalcs.total_hours,
            clockOutCalcs.overtime_hours,
            true, // is_present
            clockOutCalcs.is_undertime ? false : clockInCalcs.is_late, // is_late
            false, // is_absent
            clockOutCalcs.is_undertime,
            clockOutCalcs.is_halfday,
            clockOutCalcs.undertime_minutes,
            false, // is_dayoff (TODO: determine from schedule)
            clockInCalcs.is_regular_holiday,
            clockInCalcs.is_special_holiday,
            clockInCalcs.late_minutes,
            clockOutCalcs.night_differential_hours,
            clockOutCalcs.rest_day_hours_worked,
            clockOutCalcs.regular_holiday_hours_worked,
            clockOutCalcs.special_holiday_hours_worked,
            JSON.stringify(clockOutCalcs.payroll_breakdown),
          ]
        );

        console.log("Manual log attendance created:", attendanceResult.rows[0]);
      }
    }

    // Handle overtime request approval
    if (request.request_type === "overtime") {
      // Get the overtime request details
      const overtimeResult = await client.query(
        "SELECT * FROM overtime_requests WHERE request_id = $1",
        [request_id]
      );

      if (overtimeResult.rows.length > 0) {
        const overtimeRequest = overtimeResult.rows[0];

        // Get the current attendance record to check existing overtime
        const attendanceResult = await client.query(
          "SELECT * FROM attendance WHERE attendance_id = $1",
          [overtimeRequest.attendance_id]
        );

        if (attendanceResult.rows.length > 0) {
          const attendance = attendanceResult.rows[0];
          const currentOvertimeHours =
            parseFloat(attendance.overtime_hours) || 0;
          const requestedOvertimeHours = parseFloat(
            overtimeRequest.requested_overtime_hours
          );

          // Add the requested overtime hours to existing overtime
          const newOvertimeHours =
            currentOvertimeHours + requestedOvertimeHours;

          // Update the attendance record with the new overtime hours
          await client.query(
            `
            UPDATE attendance 
            SET 
              overtime_hours = $1,
              updated_at = NOW()
            WHERE attendance_id = $2
          `,
            [newOvertimeHours, overtimeRequest.attendance_id]
          );

          console.log(
            `Overtime approved: Added ${requestedOvertimeHours}h to attendance ${overtimeRequest.attendance_id}. Previous: ${currentOvertimeHours}h, New: ${newOvertimeHours}h`
          );
        } else {
          console.error(
            `Attendance record not found for attendance_id: ${overtimeRequest.attendance_id}`
          );
          await client.query("ROLLBACK");
          return res.status(400).json({
            success: false,
            message: "Associated attendance record not found",
          });
        }
      } else {
        console.error(
          `Overtime request details not found for request_id: ${request_id}`
        );
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Overtime request details not found",
        });
      }
    }

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Request approved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error approving request:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

// Reject a request
export const rejectRequest = async (req, res) => {
  try {
    const { request_id } = req.params;
    const { rejected_by, rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const result = await pool.query(
      `
      UPDATE requests 
      SET 
        status = 'rejected',
        rejected_by = $1,
        rejected_date = NOW(),
        rejection_reason = $2,
        updated_at = NOW()
      WHERE request_id = $3 AND status = 'pending'
      RETURNING *
    `,
      [rejected_by, rejection_reason, request_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Request not found or already processed",
      });
    }

    res.status(200).json({
      success: true,
      message: "Request rejected successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel a request (by employee)
export const cancelRequest = async (req, res) => {
  try {
    const { request_id } = req.params;
    const { employee_id } = req.body;

    const result = await pool.query(
      `
      UPDATE requests 
      SET 
        status = 'cancelled',
        updated_at = NOW()
      WHERE request_id = $1 AND employee_id = $2 AND status = 'pending'
      RETURNING *
    `,
      [request_id, employee_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Request not found, doesn't belong to you, or already processed",
      });
    }

    res.status(200).json({
      success: true,
      message: "Request cancelled successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error cancelling request:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get request statistics
export const getRequestStats = async (req, res) => {
  try {
    const { employee_id, start_date, end_date } = req.query;

    let query = `
      SELECT 
        request_type,
        status,
        COUNT(*) as count
      FROM requests 
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (employee_id) {
      query += ` AND employee_id = $${++paramCount}`;
      params.push(employee_id);
    }

    if (start_date) {
      query += ` AND requested_date >= $${++paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND requested_date <= $${++paramCount}`;
      params.push(end_date);
    }

    query += ` GROUP BY request_type, status ORDER BY request_type, status`;

    const result = await pool.query(query, params);

    // Format the results for easier consumption
    const stats = {
      by_type: {},
      by_status: {
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
      },
      total: 0,
    };

    result.rows.forEach((row) => {
      // By type
      if (!stats.by_type[row.request_type]) {
        stats.by_type[row.request_type] = {
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          total: 0,
        };
      }
      stats.by_type[row.request_type][row.status] = parseInt(row.count);
      stats.by_type[row.request_type].total += parseInt(row.count);

      // By status
      stats.by_status[row.status] += parseInt(row.count);
      stats.total += parseInt(row.count);
    });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching request stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
