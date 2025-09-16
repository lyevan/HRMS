import { pool } from "../config/db.js";

// Get all payroll configurations
export const getAllPayrollConfigurations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM payroll_configuration 
      ORDER BY config_type, config_key, effective_date DESC
    `);

    // Group by config_type for better organization
    const configsByType = {};
    result.rows.forEach((config) => {
      if (!configsByType[config.config_type]) {
        configsByType[config.config_type] = [];
      }
      configsByType[config.config_type].push(config);
    });

    res.status(200).json({
      success: true,
      message: "Payroll configurations retrieved successfully",
      data: {
        all: result.rows,
        byType: configsByType,
      },
    });
  } catch (error) {
    console.error("Error fetching payroll configurations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payroll configurations",
      error: error.message,
    });
  }
};

// Get active configurations for a specific date
export const getActiveConfigurations = async (req, res) => {
  try {
    const { date = new Date().toISOString().split("T")[0] } = req.query;

    const result = await pool.query(
      `
      SELECT 
        config_type,
        config_key,
        config_value,
        effective_date,
        expiry_date,
        description
      FROM payroll_configuration 
      WHERE is_active = true 
        AND effective_date <= $1
        AND (expiry_date IS NULL OR expiry_date > $1)
      ORDER BY config_type, config_key, effective_date DESC
    `,
      [date]
    );

    // Group by config_type
    const configsByType = {};
    result.rows.forEach((config) => {
      if (!configsByType[config.config_type]) {
        configsByType[config.config_type] = {};
      }
      configsByType[config.config_type][config.config_key] = {
        value: config.config_value,
        effectiveDate: config.effective_date,
        expiryDate: config.expiry_date,
        description: config.description,
      };
    });

    res.status(200).json({
      success: true,
      message: "Active payroll configurations retrieved successfully",
      data: configsByType,
      effectiveDate: date,
    });
  } catch (error) {
    console.error("Error fetching active payroll configurations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active payroll configurations",
      error: error.message,
    });
  }
};

// Create or update payroll configuration
export const upsertPayrollConfiguration = async (req, res) => {
  try {
    const {
      config_type,
      config_key,
      config_value,
      effective_date,
      expiry_date,
      description,
    } = req.body;

    // Validate required fields
    if (!config_type || !config_key || !config_value || !effective_date) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: config_type, config_key, config_value, effective_date",
      });
    }

    // Check if configuration already exists for this exact combination
    const existingResult = await pool.query(
      `
      SELECT config_id FROM payroll_configuration 
      WHERE config_type = $1 AND config_key = $2 AND effective_date = $3
    `,
      [config_type, config_key, effective_date]
    );

    let result;
    if (existingResult.rows.length > 0) {
      // Update existing configuration
      result = await pool.query(
        `
        UPDATE payroll_configuration 
        SET config_value = $1, expiry_date = $2, description = $3, updated_at = NOW()
        WHERE config_type = $4 AND config_key = $5 AND effective_date = $6
        RETURNING *
      `,
        [
          config_value,
          expiry_date,
          description,
          config_type,
          config_key,
          effective_date,
        ]
      );
    } else {
      // Insert new configuration
      result = await pool.query(
        `
        INSERT INTO payroll_configuration 
        (config_type, config_key, config_value, effective_date, expiry_date, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
        [
          config_type,
          config_key,
          config_value,
          effective_date,
          expiry_date,
          description,
        ]
      );
    }

    res.status(200).json({
      success: true,
      message:
        existingResult.rows.length > 0
          ? "Configuration updated successfully"
          : "Configuration created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error upserting payroll configuration:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save payroll configuration",
      error: error.message,
    });
  }
};

// Bulk update configurations
export const bulkUpdateConfigurations = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { configurations } = req.body;

    if (!Array.isArray(configurations)) {
      return res.status(400).json({
        success: false,
        message: "Configurations must be an array",
      });
    }

    const results = [];

    for (const config of configurations) {
      const {
        config_type,
        config_key,
        config_value,
        effective_date,
        expiry_date,
        description,
      } = config;

      // Check if configuration exists
      const existingResult = await client.query(
        `
        SELECT config_id FROM payroll_configuration 
        WHERE config_type = $1 AND config_key = $2 AND effective_date = $3
      `,
        [config_type, config_key, effective_date]
      );

      let result;
      if (existingResult.rows.length > 0) {
        // Update existing
        result = await client.query(
          `
          UPDATE payroll_configuration 
          SET config_value = $1, expiry_date = $2, description = $3, updated_at = NOW()
          WHERE config_type = $4 AND config_key = $5 AND effective_date = $6
          RETURNING *
        `,
          [
            config_value,
            expiry_date,
            description,
            config_type,
            config_key,
            effective_date,
          ]
        );
      } else {
        // Insert new
        result = await client.query(
          `
          INSERT INTO payroll_configuration 
          (config_type, config_key, config_value, effective_date, expiry_date, description)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `,
          [
            config_type,
            config_key,
            config_value,
            effective_date,
            expiry_date,
            description,
          ]
        );
      }

      results.push(result.rows[0]);
    }

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: `Successfully processed ${results.length} configurations`,
      data: results,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error bulk updating payroll configurations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk update payroll configurations",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// Deactivate configuration
export const deactivateConfiguration = async (req, res) => {
  try {
    const { config_id } = req.params;

    const result = await pool.query(
      `
      UPDATE payroll_configuration 
      SET is_active = false, updated_at = NOW()
      WHERE config_id = $1
      RETURNING *
    `,
      [config_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Configuration deactivated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error deactivating payroll configuration:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate payroll configuration",
      error: error.message,
    });
  }
};

// Initialize default configurations
export const initializeDefaultConfigurations = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const defaultConfigs = [
      // Government contribution rates
      {
        config_type: "government",
        config_key: "sss_employee_rate",
        config_value: "0.045",
        effective_date: "2024-01-01",
        description: "SSS employee contribution rate (4.5%)",
      },
      {
        config_type: "government",
        config_key: "sss_employer_rate",
        config_value: "0.095",
        effective_date: "2024-01-01",
        description: "SSS employer contribution rate (9.5%)",
      },
      {
        config_type: "government",
        config_key: "philhealth_employee_rate",
        config_value: "0.0275",
        effective_date: "2024-01-01",
        description: "PhilHealth employee contribution rate (2.75%)",
      },
      {
        config_type: "government",
        config_key: "philhealth_employer_rate",
        config_value: "0.0275",
        effective_date: "2024-01-01",
        description: "PhilHealth employer contribution rate (2.75%)",
      },
      {
        config_type: "government",
        config_key: "pagibig_employee_rate",
        config_value: "0.02",
        effective_date: "2024-01-01",
        description: "Pag-IBIG employee contribution rate (2%)",
      },
      {
        config_type: "government",
        config_key: "pagibig_employer_rate",
        config_value: "0.02",
        effective_date: "2024-01-01",
        description: "Pag-IBIG employer contribution rate (2%)",
      },

      // Overtime and holiday multipliers
      {
        config_type: "overtime",
        config_key: "regular_overtime_multiplier",
        config_value: "1.25",
        effective_date: "2024-01-01",
        description: "Regular overtime multiplier (125%)",
      },
      {
        config_type: "overtime",
        config_key: "night_differential_multiplier",
        config_value: "1.10",
        effective_date: "2024-01-01",
        description: "Night differential multiplier (110%)",
      },
      {
        config_type: "overtime",
        config_key: "rest_day_multiplier",
        config_value: "1.30",
        effective_date: "2024-01-01",
        description: "Rest day work multiplier (130%)",
      },

      // Holiday multipliers
      {
        config_type: "holiday",
        config_key: "regular_holiday_multiplier",
        config_value: "2.0",
        effective_date: "2024-01-01",
        description: "Regular holiday work multiplier (200%)",
      },
      {
        config_type: "holiday",
        config_key: "special_holiday_multiplier",
        config_value: "1.30",
        effective_date: "2024-01-01",
        description: "Special holiday work multiplier (130%)",
      },
      {
        config_type: "holiday",
        config_key: "regular_holiday_not_worked_multiplier",
        config_value: "1.0",
        effective_date: "2024-01-01",
        description: "Regular holiday not worked pay (100%)",
      },

      // Penalty rates
      {
        config_type: "penalties",
        config_key: "late_penalty_rate",
        config_value: "0.00462",
        effective_date: "2024-01-01",
        description: "Late penalty rate per minute (1/216 of daily rate)",
      },
      {
        config_type: "penalties",
        config_key: "undertime_deduction_rate",
        config_value: "1.0",
        effective_date: "2024-01-01",
        description: "Undertime deduction rate (100%)",
      },
    ];

    for (const config of defaultConfigs) {
      // Check if it already exists
      const existingResult = await client.query(
        `
        SELECT config_id FROM payroll_configuration 
        WHERE config_type = $1 AND config_key = $2 AND effective_date = $3
      `,
        [config.config_type, config.config_key, config.effective_date]
      );

      if (existingResult.rows.length === 0) {
        await client.query(
          `
          INSERT INTO payroll_configuration 
          (config_type, config_key, config_value, effective_date, description)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [
            config.config_type,
            config.config_key,
            config.config_value,
            config.effective_date,
            config.description,
          ]
        );
      }
    }

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: `Successfully initialized ${defaultConfigs.length} default configurations`,
      data: { configurationsInitialized: defaultConfigs.length },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error initializing default configurations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize default configurations",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// Update or create a payroll configuration
export const updatePayrollConfiguration = async (req, res) => {
  try {
    const {
      config_type,
      config_key,
      config_value,
      effective_date,
      description,
    } = req.body;

    // Validate required fields
    if (!config_type || !config_key || config_value === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: config_type, config_key, and config_value are required",
      });
    }

    const effectiveDate =
      effective_date || new Date().toISOString().split("T")[0];

    // Check if configuration already exists with the same type, key, and effective date
    const existingConfig = await pool.query(
      `SELECT config_id FROM payroll_configuration 
       WHERE config_type = $1 AND config_key = $2 AND effective_date = $3`,
      [config_type, config_key, effectiveDate]
    );

    let result;
    if (existingConfig.rows.length > 0) {
      // Update existing configuration
      result = await pool.query(
        `UPDATE payroll_configuration 
         SET config_value = $1, description = $2, updated_at = NOW()
         WHERE config_type = $3 AND config_key = $4 AND effective_date = $5
         RETURNING *`,
        [
          config_value,
          description || null,
          config_type,
          config_key,
          effectiveDate,
        ]
      );
    } else {
      // Create new configuration
      result = await pool.query(
        `INSERT INTO payroll_configuration 
         (config_type, config_key, config_value, effective_date, description) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          config_type,
          config_key,
          config_value,
          effectiveDate,
          description || null,
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "Payroll configuration updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating payroll configuration:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payroll configuration",
      error: error.message,
    });
  }
};
