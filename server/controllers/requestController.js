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
          // Update existing attendance record
          let updateQuery = `
            UPDATE attendance 
            SET updated_at = NOW()
          `;
          let updateParams = [];
          let paramIndex = 1;

          if (manualLog.time_in) {
            updateQuery += `, time_in = $${paramIndex}`;
            updateParams.push(`${manualLog.target_date}T${manualLog.time_in}`);
            paramIndex++;
          }

          if (manualLog.time_out) {
            updateQuery += `, time_out = $${paramIndex}`;
            updateParams.push(`${manualLog.target_date}T${manualLog.time_out}`);
            paramIndex++;
          }

          // Calculate total hours if both times are provided
          if (manualLog.time_in && manualLog.time_out) {
            const timeInDate = new Date(
              `${manualLog.target_date}T${manualLog.time_in}`
            );
            const timeOutDate = new Date(
              `${manualLog.target_date}T${manualLog.time_out}`
            );

            // Handle next day time_out (for night shifts)
            if (timeOutDate < timeInDate) {
              timeOutDate.setDate(timeOutDate.getDate() + 1);
            }

            const diffMs = timeOutDate - timeInDate;
            const diffHours = diffMs / (1000 * 60 * 60);
            const totalHours = Math.round(diffHours * 100) / 100;

            updateQuery += `, total_hours = $${paramIndex}`;
            updateParams.push(totalHours);
            paramIndex++;

            // Calculate overtime (hours over 8)
            if (totalHours > 8) {
              const overtimeHours = Math.round((totalHours - 8) * 100) / 100;
              updateQuery += `, overtime_hours = $${paramIndex}`;
              updateParams.push(overtimeHours);
              paramIndex++;
            }
          }

          updateQuery += ` WHERE employee_id = $${paramIndex} AND date = $${
            paramIndex + 1
          }`;
          updateParams.push(request.employee_id, manualLog.target_date);

          await client.query(updateQuery, updateParams);
        } else {
          // Create new attendance record with proper calculation
          let totalHours = null;
          let overtimeHours = 0;

          // Calculate hours worked using the new logic if all required fields are provided
          if (
            manualLog.time_in &&
            manualLog.time_out &&
            manualLog.shift_start_time &&
            manualLog.shift_end_time
          ) {
            // Helper function to convert time string to minutes
            const timeToMinutes = (timeStr) => {
              const [hours, minutes] = timeStr.split(":").map(Number);
              return hours * 60 + minutes;
            };

            // Helper function to convert minutes to hours (decimal)
            const minutesToHours = (minutes) =>
              Math.round((minutes / 60) * 100) / 100;

            // Calculate shift duration
            const shiftStartMinutes = timeToMinutes(manualLog.shift_start_time);
            const shiftEndMinutes = timeToMinutes(manualLog.shift_end_time);
            let shiftDurationMinutes = shiftEndMinutes - shiftStartMinutes;

            // Handle overnight shifts
            if (shiftDurationMinutes < 0) {
              shiftDurationMinutes += 24 * 60; // Add 24 hours in minutes
            }

            // Calculate worked duration
            const timeInMinutes = timeToMinutes(manualLog.time_in);
            const timeOutMinutes = timeToMinutes(manualLog.time_out);
            let workedDurationMinutes = timeOutMinutes - timeInMinutes;

            // Handle overnight work
            if (workedDurationMinutes < 0) {
              workedDurationMinutes += 24 * 60; // Add 24 hours in minutes
            }

            // Subtract break duration if provided
            if (manualLog.break_duration) {
              // break_duration is now stored as minutes (number or string)
              const breakDurationMinutes = parseInt(manualLog.break_duration);
              if (!isNaN(breakDurationMinutes) && breakDurationMinutes > 0) {
                workedDurationMinutes -= breakDurationMinutes;
                shiftDurationMinutes -= breakDurationMinutes;
              }
            }

            // Convert to hours
            totalHours = minutesToHours(workedDurationMinutes);
            const shiftHours = minutesToHours(shiftDurationMinutes);

            // Calculate overtime: worked time - expected shift time
            overtimeHours = Math.max(0, totalHours - shiftHours);
            overtimeHours = Math.round(overtimeHours * 100) / 100;

            console.log("Calculation details:", {
              time_in: manualLog.time_in,
              time_out: manualLog.time_out,
              shift_start: manualLog.shift_start_time,
              shift_end: manualLog.shift_end_time,
              break_duration: manualLog.break_duration,
              worked_minutes: workedDurationMinutes,
              shift_minutes: shiftDurationMinutes,
              total_hours: totalHours,
              overtime_hours: overtimeHours,
            });
          }

          // Convert date to proper string format considering local timezone
          const dateStr =
            manualLog.target_date instanceof Date
              ? manualLog.target_date.toLocaleDateString("en-CA") // Returns YYYY-MM-DD in local timezone
              : manualLog.target_date;

          console.log("Creating attendance record for:", {
            employee_id: request.employee_id,
            date: dateStr,
            time_in: manualLog.time_in
              ? `${dateStr} ${manualLog.time_in}`
              : null,
            time_out: manualLog.time_out
              ? `${dateStr} ${manualLog.time_out}`
              : null,
            total_hours: totalHours,
            overtime_hours: overtimeHours,
          });

          await client.query(
            `
            INSERT INTO attendance (
              employee_id, date, time_in, time_out, total_hours, overtime_hours, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
            [
              request.employee_id,
              dateStr,
              manualLog.time_in ? `${dateStr} ${manualLog.time_in}` : null,
              manualLog.time_out ? `${dateStr} ${manualLog.time_out}` : null,
              totalHours,
              overtimeHours,
              `Manual log approved from request #${request_id}: ${manualLog.reason}`,
            ]
          );
        }
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
