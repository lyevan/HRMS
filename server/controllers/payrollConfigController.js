import { pool } from "../config/db.js";
import { AdvancedPayrollCalculator } from "../services/AdvancedPayrollCalculator.js";

// Get all payroll configurations (2025 database schema)
export const getAllConfigs = async (req, res) => {
  try {
    const configs = await AdvancedPayrollCalculator.getAllConfigs();

    // Organize by config type for easier frontend consumption
    const organizedConfigs = {};
    configs.forEach((config) => {
      if (!organizedConfigs[config.config_type]) {
        organizedConfigs[config.config_type] = {};
      }
      organizedConfigs[config.config_type][config.config_key] = {
        value: config.config_value,
        description: config.description,
        effective_date: config.effective_date,
        expiry_date: config.expiry_date,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        raw: configs,
        organized: organizedConfigs,
      },
    });
  } catch (error) {
    console.error("Error fetching payroll configs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payroll configurations",
      error: error.message,
    });
  }
};

// Get configurations by type (e.g., 'sss', 'philhealth', 'income_tax')
export const getConfigsByType = async (req, res) => {
  try {
    const { configType } = req.params;
    const configs = await AdvancedPayrollCalculator.getConfigsByType(
      configType
    );

    res.status(200).json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error(`Error fetching ${configType} configs:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch ${configType} configurations`,
      error: error.message,
    });
  }
};

// Update specific configuration (2025 database schema)
export const updateConfig = async (req, res) => {
  try {
    const { configType, configKey } = req.params;
    const { value, effectiveDate } = req.body;

    if (!configType || !configKey || value === undefined) {
      return res.status(400).json({
        success: false,
        message: "Configuration type, key, and value are required",
      });
    }

    const updatedConfig = await AdvancedPayrollCalculator.updateConfig(
      configType,
      configKey,
      value,
      effectiveDate
    );

    res.status(200).json({
      success: true,
      message: `Configuration '${configType}.${configKey}' updated successfully`,
      data: updatedConfig,
    });
  } catch (error) {
    console.error("Error updating payroll config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update configuration",
      error: error.message,
    });
  }
};

// Get specific configuration (2025 database schema)
export const getConfig = async (req, res) => {
  try {
    const { configType, configKey } = req.params;

    const value = await AdvancedPayrollCalculator.getConfig(
      configType,
      configKey
    );

    res.status(200).json({
      success: true,
      data: { configType, configKey, value },
    });
  } catch (error) {
    console.error("Error fetching payroll config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch configuration",
      error: error.message,
    });
  }
};

// Sync 2025 Philippine payroll rates with database
export const syncConfiguration = async (req, res) => {
  try {
    const result =
      await AdvancedPayrollCalculator.syncConfigurationWithDatabase();

    res.status(200).json({
      success: true,
      message: result
        ? "Configuration sync completed - 2025 rates are up to date"
        : "Configuration sync needed - please run database migration",
      synced: result,
    });
  } catch (error) {
    console.error("Error syncing configuration:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync configuration",
      error: error.message,
    });
  }
};

// Get employee schedule overrides
export const getEmployeeOverrides = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const result = await pool.query(
      `
            SELECT * FROM employee_schedule_overrides 
            WHERE employee_id = $1 
            AND (effective_until IS NULL OR effective_until >= NOW())
            ORDER BY effective_from DESC
        `,
      [employee_id]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching employee overrides:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee overrides",
      error: error.message,
    });
  }
};

// Create employee schedule override
export const createEmployeeOverride = async (req, res) => {
  try {
    const {
      employee_id,
      override_type,
      override_value,
      effective_from,
      effective_until,
      reason,
    } = req.body;

    // Validate required fields
    if (!employee_id || !override_type || !override_value || !effective_from) {
      return res.status(400).json({
        success: false,
        message:
          "employee_id, override_type, override_value, and effective_from are required",
      });
    }

    // Validate override_type
    const validTypes = [
      "hours_per_day",
      "days_per_week",
      "monthly_working_days",
    ];
    if (!validTypes.includes(override_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid override_type. Must be one of: ${validTypes.join(
          ", "
        )}`,
      });
    }

    const result = await pool.query(
      `
            INSERT INTO employee_schedule_overrides 
            (employee_id, override_type, override_value, effective_from, effective_until, reason)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `,
      [
        employee_id,
        override_type,
        override_value,
        effective_from,
        effective_until,
        reason,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Employee schedule override created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating employee override:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create employee override",
      error: error.message,
    });
  }
};

// Update employee schedule override
export const updateEmployeeOverride = async (req, res) => {
  try {
    const { override_id } = req.params;
    const { override_value, effective_until, reason } = req.body;

    let updateFields = [];
    let values = [];
    let paramIndex = 1;

    if (override_value !== undefined) {
      updateFields.push(`override_value = $${paramIndex++}`);
      values.push(override_value);
    }

    if (effective_until !== undefined) {
      updateFields.push(`effective_until = $${paramIndex++}`);
      values.push(effective_until);
    }

    if (reason !== undefined) {
      updateFields.push(`reason = $${paramIndex++}`);
      values.push(reason);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(override_id);

    const result = await pool.query(
      `
            UPDATE employee_schedule_overrides 
            SET ${updateFields.join(", ")}
            WHERE override_id = $${paramIndex}
            RETURNING *
        `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee override not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee override updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating employee override:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update employee override",
      error: error.message,
    });
  }
};

// Delete employee schedule override
export const deleteEmployeeOverride = async (req, res) => {
  try {
    const { override_id } = req.params;

    const result = await pool.query(
      "DELETE FROM employee_schedule_overrides WHERE override_id = $1 RETURNING *",
      [override_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee override not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee override deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting employee override:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete employee override",
      error: error.message,
    });
  }
};
