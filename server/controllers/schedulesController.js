import { pool } from "../config/db.js";

export const getAllSchedules = async (req, res) => {
  const { id } = req.params;
  if (id) {
    // Fetch a single schedule by ID
    try {
      const result = await pool.query(
        `
        SELECT 
          s.*
        FROM schedules s
        JOIN employees e ON s.schedule_id = e.schedule_id
        WHERE e.employee_id = $1
      `,
        [id]
      );
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Schedule not found" });
      }
      return res.status(200).json({ success: true, results: result.rows[0] });
    } catch (error) {
      console.error("Error fetching schedule:", error);
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
  }

  // Fetch all schedules
  try {
    const result = await pool.query(`
      SELECT 
        *
      FROM schedules
    `);
    res.status(200).json({ success: true, results: result.rows });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const addSchedule = async (req, res) => {
  const { schedule_name, start_time, end_time, break_duration, days_of_week } =
    req.body;
  try {
    const requiredFields = { start_time, end_time, break_duration };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null) {
        return res.status(400).json({
          success: false,
          error: `${field} is required`,
        });
      }
    }
    const result = await pool.query(
      "INSERT INTO schedules (schedule_name, start_time, end_time, break_duration, days_of_week) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [
        schedule_name,
        start_time,
        end_time,
        break_duration,
        JSON.stringify(days_of_week || []),
      ]
    );
    res.status(201).json({
      success: true,
      result: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding schedule:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const updateSchedule = async (req, res) => {
  const { id } = req.params;

  try {
    // Debug logging
    console.log("Update schedule request:", {
      id,
      body: req.body,
      hasScheduleUpdates: !!req.body.scheduleUpdates,
    });

    // Handle both formats: direct schedule data or wrapped in scheduleUpdates
    const scheduleData = req.body.scheduleUpdates || req.body;

    // Validate that we have data to update
    if (!scheduleData || Object.keys(scheduleData).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    // Handle days_of_week specially since it needs JSON.stringify
    const processedUpdates = { ...scheduleData };
    if (processedUpdates.days_of_week) {
      processedUpdates.days_of_week = JSON.stringify(
        processedUpdates.days_of_week
      );
    }

    // Remove any undefined or null values to avoid SQL errors
    Object.keys(processedUpdates).forEach((key) => {
      if (
        processedUpdates[key] === undefined ||
        processedUpdates[key] === null
      ) {
        delete processedUpdates[key];
      }
    });

    const scheduleKeys = Object.keys(processedUpdates);
    const scheduleValues = [...Object.values(processedUpdates), id];

    console.log("Processed update data:", {
      keys: scheduleKeys,
      values: scheduleValues,
    });

    const setClause = scheduleKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const result = await pool.query(
      `UPDATE schedules SET ${setClause} WHERE schedule_id = $${
        scheduleKeys.length + 1
      } RETURNING *`,
      [...scheduleValues]
    );
    res.status(200).json({
      success: true,
      result: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const deleteSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM schedules WHERE schedule_id = $1", [id]);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const bulkAssignSchedule = async (req, res) => {
  const { schedule_id, employee_ids } = req.body;

  try {
    if (
      !schedule_id ||
      !Array.isArray(employee_ids) ||
      employee_ids.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "schedule_id and employee_ids are required",
      });
    }

    const query = `
      UPDATE employees
      SET schedule_id = $1, updated_at = NOW()
      WHERE employee_id = ANY($2::varchar[])
      RETURNING employee_id, schedule_id
    `;

    const { rows } = await pool.query(query, [schedule_id, employee_ids]);

    res.status(200).json({
      success: true,
      message: "Schedules assigned successfully",
      assigned_count: rows.length,
      employees: rows,
    });
  } catch (error) {
    console.error("Error bulk assigning schedules:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
