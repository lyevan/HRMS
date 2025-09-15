import { pool } from "../config/db.js";

class PayrollConfigService {
  static async getConfig(key) {
    try {
      const result = await pool.query(
        "SELECT config_value, data_type FROM payroll_config WHERE config_key = $1 AND is_active = true",
        [key]
      );

      if (result.rows.length === 0) {
        throw new Error(`Configuration key '${key}' not found`);
      }

      const { config_value, data_type } = result.rows[0];

      switch (data_type) {
        case "integer":
          return parseInt(config_value);
        case "decimal":
          return parseFloat(config_value);
        case "boolean":
          return config_value.toLowerCase() === "true";
        default:
          return config_value;
      }
    } catch (error) {
      console.error(`Error getting config ${key}:`, error);
      throw error;
    }
  }

  static async updateConfig(key, value) {
    try {
      const result = await pool.query(
        "UPDATE payroll_config SET config_value = $1, updated_at = NOW() WHERE config_key = $2 RETURNING *",
        [value.toString(), key]
      );

      if (result.rows.length === 0) {
        throw new Error(`Configuration key '${key}' not found`);
      }

      return result.rows[0];
    } catch (error) {
      console.error(`Error updating config ${key}:`, error);
      throw error;
    }
  }

  static async getMultipleConfigs(keys) {
    try {
      const result = await pool.query(
        "SELECT config_key, config_value, data_type FROM payroll_config WHERE config_key = ANY($1) AND is_active = true",
        [keys]
      );

      const configs = {};
      result.rows.forEach((row) => {
        const { config_key, config_value, data_type } = row;
        switch (data_type) {
          case "integer":
            configs[config_key] = parseInt(config_value);
            break;
          case "decimal":
            configs[config_key] = parseFloat(config_value);
            break;
          case "boolean":
            configs[config_key] = config_value.toLowerCase() === "true";
            break;
          default:
            configs[config_key] = config_value;
        }
      });

      return configs;
    } catch (error) {
      console.error("Error getting multiple configs:", error);
      throw error;
    }
  }

  static async getAllConfigs() {
    try {
      const result = await pool.query(
        "SELECT * FROM payroll_config WHERE is_active = true ORDER BY config_key"
      );

      return result.rows.map((row) => ({
        ...row,
        parsed_value: this.parseConfigValue(row.config_value, row.data_type),
      }));
    } catch (error) {
      console.error("Error getting all configs:", error);
      throw error;
    }
  }

  static parseConfigValue(value, dataType) {
    switch (dataType) {
      case "integer":
        return parseInt(value);
      case "decimal":
        return parseFloat(value);
      case "boolean":
        return value.toLowerCase() === "true";
      default:
        return value;
    }
  }

  static async initializeDefaultConfigs() {
    try {
      // Check if configs already exist
      const existingConfigs = await pool.query(
        "SELECT COUNT(*) FROM payroll_config"
      );

      if (parseInt(existingConfigs.rows[0].count) > 0) {
        console.log("Payroll configurations already exist");
        return;
      }

      const defaultConfigs = [
        [
          "monthly_working_days",
          "22",
          "integer",
          "Standard working days per month for monthly rate calculations",
        ],
        [
          "standard_daily_hours",
          "8",
          "integer",
          "Standard working hours per day for rate conversions",
        ],
        ["overtime_multiplier", "1.5", "decimal", "Overtime pay multiplier"],
        [
          "holiday_regular_multiplier",
          "2.0",
          "decimal",
          "Regular holiday pay multiplier",
        ],
        [
          "holiday_special_multiplier",
          "1.3",
          "decimal",
          "Special holiday pay multiplier",
        ],
        ["dayoff_multiplier", "1.3", "decimal", "Day-off work multiplier"],
        [
          "late_penalty_rate",
          "0.1",
          "decimal",
          "Late penalty as percentage of daily rate",
        ],
        [
          "sss_employee_rate",
          "0.045",
          "decimal",
          "SSS employee contribution rate",
        ],
        [
          "philhealth_employee_rate",
          "0.0275",
          "decimal",
          "PhilHealth employee contribution rate",
        ],
        [
          "hdmf_monthly_contribution",
          "100",
          "decimal",
          "HDMF monthly contribution amount",
        ],
      ];

      for (const [key, value, dataType, description] of defaultConfigs) {
        await pool.query(
          `INSERT INTO payroll_config (config_key, config_value, data_type, description) 
                     VALUES ($1, $2, $3, $4) ON CONFLICT (config_key) DO NOTHING`,
          [key, value, dataType, description]
        );
      }

      console.log("Default payroll configurations initialized");
    } catch (error) {
      console.error("Error initializing default configs:", error);
      throw error;
    }
  }
}

export default PayrollConfigService;
