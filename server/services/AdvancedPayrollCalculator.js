import { pool } from "../config/db.js";
import dayjs from "dayjs";

/**
 * Advanced Payroll Calculator with Dynamic Configuration Support
 * Handles complex payroll calculations with configurable rates, multipliers, and business rules
 */

export class AdvancedPayrollCalculator {
  constructor(config = {}) {
    // Default configuration - can be overridden by database config
    this.config = {
      // Working time configuration
      standardWorkingHours: 8,
      standardWorkingDays: 26,
      standardWorkingDaysInWeek: 6,
      weekendDays: [0, 6], // Sunday = 0, Saturday = 6

      // Overtime configuration
      overtimeMultiplier: 1.5,
      overtimeThreshold: 8, // hours per day
      nightDifferentialRate: 0.1, // 10% additional

      // Holiday multipliers
      regularHolidayMultiplier: 2.0,
      specialHolidayMultiplier: 1.3,
      restDayMultiplier: 1.3,

      // Leave configuration
      paidLeaveTypes: ["sick", "vacation", "emergency"],
      unpaidLeaveTypes: ["lwop", "suspension"],

      // Deduction configuration (Philippine 2025 rates - Updated September 2025)
      deductions: {
        // SSS Contribution Table (2025 rates - with inflation adjustments)
        sss: {
          brackets: [
            { min: 0, max: 3249.99, employee: 140, employer: 325 },
            { min: 3250, max: 3749.99, employee: 162.5, employer: 377.5 },
            { min: 3750, max: 4249.99, employee: 185, employer: 430 },
            { min: 4250, max: 4749.99, employee: 207.5, employer: 482.5 },
            { min: 4750, max: 5249.99, employee: 230, employer: 535 },
            { min: 5250, max: 5749.99, employee: 252.5, employer: 587.5 },
            { min: 5750, max: 6249.99, employee: 275, employer: 640 },
            { min: 6250, max: 6749.99, employee: 297.5, employer: 692.5 },
            { min: 6750, max: 7249.99, employee: 320, employer: 745 },
            { min: 7250, max: 7749.99, employee: 342.5, employer: 797.5 },
            { min: 7750, max: 8249.99, employee: 365, employer: 850 },
            { min: 8250, max: 8749.99, employee: 387.5, employer: 902.5 },
            { min: 8750, max: 9249.99, employee: 410, employer: 955 },
            { min: 9250, max: 9749.99, employee: 432.5, employer: 1007.5 },
            { min: 9750, max: 10249.99, employee: 455, employer: 1060 },
            { min: 10250, max: 10749.99, employee: 477.5, employer: 1112.5 },
            { min: 10750, max: 11249.99, employee: 500, employer: 1165 },
            { min: 11250, max: 11749.99, employee: 522.5, employer: 1217.5 },
            { min: 11750, max: 12249.99, employee: 545, employer: 1270 },
            { min: 12250, max: 12749.99, employee: 567.5, employer: 1322.5 },
            { min: 12750, max: 13249.99, employee: 590, employer: 1375 },
            { min: 13250, max: 13749.99, employee: 612.5, employer: 1427.5 },
            { min: 13750, max: 14249.99, employee: 635, employer: 1480 },
            { min: 14250, max: 14749.99, employee: 657.5, employer: 1532.5 },
            { min: 14750, max: 15249.99, employee: 680, employer: 1585 },
            { min: 15250, max: 15749.99, employee: 702.5, employer: 1637.5 },
            { min: 15750, max: 16249.99, employee: 725, employer: 1690 },
            { min: 16250, max: 16749.99, employee: 747.5, employer: 1742.5 },
            { min: 16750, max: 17249.99, employee: 770, employer: 1795 },
            { min: 17250, max: 17749.99, employee: 792.5, employer: 1847.5 },
            { min: 17750, max: 18249.99, employee: 815, employer: 1900 },
            { min: 18250, max: 18749.99, employee: 837.5, employer: 1952.5 },
            { min: 18750, max: 19249.99, employee: 860, employer: 2005 },
            { min: 19250, max: 19749.99, employee: 882.5, employer: 2057.5 },
            { min: 19750, max: 20249.99, employee: 905, employer: 2110 },
            { min: 20250, max: Infinity, employee: 930, employer: 2170 }, // Updated maximum
          ],
        },
        // PhilHealth Premium (2025 rates - Universal Health Care Act updates)
        philhealth: {
          rate: 0.055, // 5.5% total (2.75% employee, 2.75% employer) - increased for UHC
          employeeRate: 0.0275,
          employerRate: 0.0275,
          minContribution: 550, // Increased minimum
          maxContribution: 5500, // Increased maximum
          minSalary: 10000,
          maxSalary: 100000,
        },
        // Pag-IBIG/HDMF Contribution (2025 rates - with housing fund enhancements)
        pagibig: {
          brackets: [
            { min: 0, max: 1500, rate: 0.01 }, // 1% for salary ≤ 1,500
            { min: 1500.01, max: 5000, rate: 0.02 }, // 2% for salary 1,501-5,000
            { min: 5000.01, max: Infinity, rate: 0.025 }, // 2.5% for salary > 5,000 (new tier)
          ],
          cap: 150, // Increased maximum monthly contribution from ₱100 to ₱150
        },
        // Philippine Income Tax (TRAIN Law 2025 - Indexed for inflation)
        tax: {
          brackets: [
            { min: 0, max: 21667, rate: 0, fixedAmount: 0 }, // ₱0-₱260k annually (₱0-₱21,667 monthly) - adjusted for inflation
            { min: 21667.01, max: 34167, rate: 0.15, fixedAmount: 0 }, // ₱260k-₱410k annually
            { min: 34167.01, max: 68333, rate: 0.2, fixedAmount: 1875 }, // ₱410k-₱820k annually
            { min: 68333.01, max: 170833, rate: 0.25, fixedAmount: 8708.33 }, // ₱820k-₱2.05M annually
            { min: 170833.01, max: 683333, rate: 0.3, fixedAmount: 34333.33 }, // ₱2.05M-₱8.2M annually
            {
              min: 683333.01,
              max: 1366667,
              rate: 0.32,
              fixedAmount: 188083.33,
            }, // ₱8.2M-₱16.4M annually (new bracket)
            {
              min: 1366667.01,
              max: Infinity,
              rate: 0.35,
              fixedAmount: 406750,
            }, // >₱16.4M annually
          ],
        },
      },

      // Late and undertime deduction rates
      late_penalty_rate: 0.00462, // 1/216 of daily rate per minute (per DOLE)
      undertime_deduction_rate: 1.0, // 100% deduction for undertime
      holiday_regular_not_worked_multiplier: 1.0, // 100% pay for regular holidays not worked

      // TODO: Add database configuration for enabling/disabling deductions
      // Currently hardcoded - should be moved to database config table
      enable_late_deductions: false, // Set to true to enable late deductions
      enable_undertime_deductions: false, // Set to true to enable undertime deductions
      enable_auto_approve_overtime: true, // Set to true to auto-approve OT if within limits
      auto_approve_overtime_hours_limit: Infinity, // Maximum OT hours that can be auto-approved

      // Rounding configuration
      payrollRounding: "nearest", // 'up', 'down', 'nearest'
      roundingIncrement: 0.01,

      ...config,
    };
  }

  /**
   * Load configuration from database
   */
  async loadConfiguration() {
    try {
      // Load from the new payroll_configuration table
      console.log("📊  Loading payroll configuration from database...");
      const configResult = await pool.query(`
        SELECT 
          config_type,
          config_key,
          config_value,
          effective_date,
          expiry_date
        FROM payroll_configuration 
        WHERE is_active = true 
          AND effective_date <= CURRENT_DATE
          AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
        ORDER BY effective_date DESC
      `);

      const dbConfig = {};

      // Group configurations by type and process them
      const configGroups = {};
      configResult.rows.forEach((row) => {
        const { config_type, config_key, config_value, effective_date } = row;

        if (!configGroups[config_type]) {
          configGroups[config_type] = {};
        }

        // Parse config value based on the key structure
        let parsedValue;
        try {
          // Try to parse as JSON first (for complex objects)
          parsedValue = JSON.parse(config_value);
        } catch {
          // If not JSON, try to parse as number
          const numValue = parseFloat(config_value);
          if (!isNaN(numValue)) {
            parsedValue = numValue;
          } else if (
            config_value.toLowerCase() === "true" ||
            config_value.toLowerCase() === "false"
          ) {
            parsedValue = config_value.toLowerCase() === "true";
          } else {
            parsedValue = config_value;
          }
        }

        configGroups[config_type][config_key] = parsedValue;
      });

      // Process specific configuration types
      if (configGroups.rates) {
        // Handle rate configurations
        Object.assign(dbConfig, configGroups.rates);
      }

      if (configGroups.government) {
        // Handle government contribution configurations
        if (!dbConfig.government) dbConfig.government = {};
        Object.assign(dbConfig.government, configGroups.government);
      }

      if (configGroups.holiday) {
        // Handle holiday multipliers with proper key mapping
        const holidayConfig = configGroups.holiday;

        // Map database keys to expected property names
        if (holidayConfig.regular_holiday_rate !== undefined) {
          dbConfig.regularHolidayMultiplier =
            holidayConfig.regular_holiday_rate;
        }
        if (holidayConfig.special_holiday_rate !== undefined) {
          dbConfig.specialHolidayMultiplier =
            holidayConfig.special_holiday_rate;
        }

        // Also assign the raw values for reference
        Object.assign(dbConfig, configGroups.holiday);
      }

      if (configGroups.night_differential) {
        // Handle night differential configurations
        const nightDiffConfig = configGroups.night_differential;

        // Map database keys to expected property names
        if (nightDiffConfig.rate !== undefined) {
          dbConfig.nightDifferentialRate = nightDiffConfig.rate;
        }

        // Also assign the raw values for reference
        Object.assign(dbConfig, configGroups.night_differential);
      }

      if (configGroups.overtime) {
        // Handle overtime configurations with proper key mapping
        const overtimeConfig = configGroups.overtime;

        // Map database keys to expected property names
        if (overtimeConfig.regular_overtime_rate !== undefined) {
          dbConfig.overtimeMultiplier = overtimeConfig.regular_overtime_rate;
        }
        if (overtimeConfig.holiday_overtime_rate !== undefined) {
          dbConfig.holidayOvertimeMultiplier =
            overtimeConfig.holiday_overtime_rate;
        }
        if (overtimeConfig.rest_day_overtime_rate !== undefined) {
          dbConfig.restDayOvertimeMultiplier =
            overtimeConfig.rest_day_overtime_rate;
        }

        // Also assign the raw values for reference
        Object.assign(dbConfig, configGroups.overtime);
      }

      if (configGroups.penalties) {
        // Handle penalty configurations
        Object.assign(dbConfig, configGroups.penalties);
      }

      console.log("📊  Loaded payroll configuration from database:", dbConfig);

      // Merge database config with default config using deep merge
      this.config = { ...this.config, ...dbConfig };

      // console.log("📊  Final merged payroll configuration:", this.config);

      // console.log("Final payroll configuration:", this.config);
    } catch (error) {
      console.warn(
        "⚠️ Could not load payroll configuration from database, using defaults:",
        error.message
      );

      // Fallback to old table if new one doesn't exist
      try {
        const oldConfigResult = await pool.query(
          `SELECT config_key, config_value, data_type FROM payroll_config WHERE is_active = true`
        );

        const dbConfig = {};
        oldConfigResult.rows.forEach((row) => {
          const { config_key, config_value, data_type } = row;

          switch (data_type) {
            case "number":
              dbConfig[config_key] = parseFloat(config_value);
              break;
            case "boolean":
              dbConfig[config_key] = config_value === "true";
              break;
            case "json":
              dbConfig[config_key] = JSON.parse(config_value);
              break;
            default:
              dbConfig[config_key] = config_value;
          }
        });

        this.config = { ...this.config, ...dbConfig };
        console.log(
          "📊 Payroll configuration loaded from legacy payroll_config table"
        );
      } catch (fallbackError) {
        console.warn(
          "⚠️ Could not load from legacy table either, using hardcoded defaults"
        );
      }
    }
  }

  /**
   * Calculate payroll for a single employee
   */
  async calculateEmployeePayroll(
    employeeId,
    startDate,
    endDate,
    attendanceData = null,
    scheduleInfo = null
  ) {
    try {
      // Get employee details
      // console.log(`👤 [DEBUG] Fetching employee details for: ${employeeId}`);
      const employee = await this.getEmployeeDetails(employeeId);
      if (!employee) {
        console.error(
          `❌ [DEBUG] Employee ${employeeId} not found or inactive`
        );
        throw new Error(`Employee ${employeeId} not found or inactive`);
      }

      const attendance =
        attendanceData ||
        (await this.getAttendanceData(employeeId, startDate, endDate));

      // Calculate earnings
      const earnings = await this.calculateEarnings(
        employee,
        attendance,
        scheduleInfo,
        startDate,
        endDate
      );

      // Calculate deductions
      const deductions = await this.calculateDeductions(
        earnings.grossPay,
        employeeId,
        employee.employment_type
      );

      // Calculate net pay
      const netPay = earnings.grossPay - deductions.totalDeductions;

      console.log("DEBUG: ======", earnings.breakdown);

      return {
        employee_id: employeeId,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        position: employee.position_title,
        employment_type: employee.employment_type,
        rate: employee.rate,
        rate_type: employee.rate_type,
        period: { start_date: startDate, end_date: endDate },

        // Attendance summary
        attendance: {
          days_worked: attendance.days_worked || 0,
          paid_leave_days: attendance.paid_leave_days || 0,
          unpaid_leave_days: attendance.unpaid_leave_days || 0,
          total_regular_hours: attendance.total_regular_hours || 0,
          total_overtime_hours: attendance.total_overtime_hours || 0,
          regular_holiday_days_worked:
            attendance.regular_holiday_days_worked || 0,
          regular_holiday_days_not_worked:
            attendance.regular_holiday_days_not_worked || 0,
          special_holiday_days_worked:
            attendance.special_holiday_days_worked || 0,
          rest_day_hours_worked: attendance.rest_day_hours_worked || 0,
          night_differential_hours: attendance.night_differential_hours || 0,
          late_minutes: attendance.late_minutes || 0,
          undertime_minutes: attendance.undertime_minutes || 0,
          late_days: attendance.late_days || 0,
        },

        // Earnings breakdown
        earnings: {
          base_pay: earnings.basePay,
          overtime_pay: earnings.overtimePay,
          holiday_pay: earnings.holidayPay,
          night_differential: earnings.nightDifferential,
          leave_pay: earnings.leavePay,
          late_deductions: earnings.lateDeductions,
          undertime_deductions: earnings.undertimeDeductions,
          other_earnings: earnings.otherEarnings,
          gross_pay: earnings.grossPay,

          breakdown: earnings.breakdown || {},
        },

        // Deductions breakdown
        deductions: {
          sss: deductions.sss,
          philhealth: deductions.philhealth,
          pagibig: deductions.pagibig,
          tax: deductions.tax,
          other_deductions: deductions.otherDeductions,
          total_deductions: deductions.totalDeductions,
        },

        net_pay: this.roundAmount(netPay),
        calculated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error(
        `❌ [DEBUG] Payroll calculation failed for ${employeeId}:`,
        error.message
      );
      console.error(`🔍 [DEBUG] Error stack:`, error.stack);
      return {
        employee_id: employeeId,
        error: error.message,
        calculated_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate earnings for an employee with enhanced payroll breakdown support
   */
  async calculateEarnings(
    employee,
    attendance,
    scheduleInfo = null,
    startDate = null,
    endDate = null
  ) {
    // console.log(
    //   `💵 [DEBUG] Starting earnings calculation for ${employee.first_name} ${employee.last_name}`
    // );

    const rate = parseFloat(employee.rate);

    // ===== CHECK FOR PAYROLL_BREAKDOWN DATA FROM ATTENDANCE RECORDS =====
    // If we have individual attendance records with payroll_breakdown, use those for precise calculation
    try {
      const attendanceRecords =
        await this.getAttendanceRecordsWithPayrollBreakdown(
          employee.employee_id,
          startDate,
          endDate
        );

      if (attendanceRecords && attendanceRecords.length > 0) {
        console.log(
          `🚀 [CALC DEBUG] Using payroll_breakdown data from ${attendanceRecords.length} attendance records...`
        );
        return await this.calculateEarningsFromPayrollBreakdown(
          employee,
          attendanceRecords
        );
      }
    } catch (error) {
      console.warn(
        `⚠️ [CALC DEBUG] Could not fetch payroll_breakdown data, falling back to aggregated calculation:`,
        error.message
      );
    }

    // console.log(`📊 [DEBUG] Employee rate: ₱${rate} (${employee.rate_type})`);
    console.log("📊  Overtime Multiplier:", this.config.overtimeMultiplier);
    // Calculate base pay based on rate type
    switch (employee.rate_type) {
      case "hourly":
        // Handle if day off worked
        basePay = (attendance.total_regular_hours || 0) * rate;

        overtimePay =
          (attendance.total_overtime_hours || 0) *
          rate *
          this.config.overtimeMultiplier;

        leavePay = await this.calculateLeavePay(employee, attendance);
        // console.log(`🏖️ [DEBUG] Leave pay: ₱${leavePay}`);
        break;

      case "daily":
        // console.log(
        //   `📅 [DEBUG] Calculating daily pay: ${
        //     attendance.days_worked || 0
        //   } days × ₱${rate}`
        // );
        basePay = (attendance.days_worked || 0) * rate;
        // console.log(`💰 [DEBUG] Base pay (daily): ₱${basePay}`);

        const dailyOvertimeRate = rate / this.config.standardWorkingHours;
        overtimePay =
          (attendance.total_overtime_hours || 0) *
          dailyOvertimeRate *
          this.config.overtimeMultiplier;
        // console.log(
        //   `⏰ [DEBUG] Overtime pay: ${
        //     attendance.total_overtime_hours || 0
        //   } hours × ₱${dailyOvertimeRate.toFixed(2)} × ${
        //     this.config.overtimeMultiplier
        //   } = ₱${overtimePay}`
        // );

        leavePay = await this.calculateLeavePay(employee, attendance);
        // console.log(`🏖️ [DEBUG] Leave pay: ₱${leavePay}`);

        // Calculate late deductions (per DOLE: 1/216 of daily rate per minute)
        if (attendance.late_minutes > 0 && this.config.enable_late_deductions) {
          const lateRatePerMinute = rate * this.config.late_penalty_rate;
          lateDeductions = attendance.late_minutes * lateRatePerMinute;
          // console.log(
          //   `⏰ [DEBUG] Late deductions: ${
          //     attendance.late_minutes
          //   } minutes × ₱${lateRatePerMinute.toFixed(
          //     4
          //   )} = ₱${lateDeductions.toFixed(2)}`
          // );
        }

        // Calculate undertime deductions (proportional to daily rate)
        if (
          attendance.undertime_minutes > 0 &&
          this.config.enable_undertime_deductions
        ) {
          const dailyRatePerMinute =
            rate / (this.config.standardWorkingHours * 60);
          undertimeDeductions =
            attendance.undertime_minutes *
            dailyRatePerMinute *
            this.config.undertime_deduction_rate;
          // console.log(
          //   `⏰ [DEBUG] Undertime deductions: ${
          //     attendance.undertime_minutes
          //   } minutes × ₱${dailyRatePerMinute.toFixed(4)} × ${
          //     this.config.undertime_deduction_rate
          //   } = ₱${undertimeDeductions.toFixed(2)}`
          // );
        }
        break;

      case "monthly":
        const workingDaysInPeriod = this.config.standardWorkingDays;
        const dailyRate = rate / workingDaysInPeriod;
        // console.log(
        //   `📅 [DEBUG] Monthly calculation: ₱${rate} / ${workingDaysInPeriod} days = ₱${dailyRate.toFixed(
        //     2
        //   )} per day`
        // );

        const totalPaidDays =
          (attendance.days_worked || 0) + (attendance.paid_leave_days || 0);
        basePay = totalPaidDays * dailyRate;
        // console.log(
        //   `💰 [DEBUG] Base pay (monthly): ${totalPaidDays} paid days × ₱${dailyRate.toFixed(
        //     2
        //   )} = ₱${basePay.toFixed(2)}`
        // );

        // Monthly employees typically don't get overtime pay
        overtimePay = 0;
        leavePay = 0; // Already included in base pay for monthly employees
        // console.log(
        //   `⏰ [DEBUG] Overtime and leave pay: ₱0 (included in monthly salary)`
        // );

        // Calculate late deductions for monthly employees
        if (attendance.late_minutes > 0 && this.config.enable_late_deductions) {
          const monthlyRatePerMinute =
            rate /
            (workingDaysInPeriod * this.config.standardWorkingHours * 60);
          lateDeductions = attendance.late_minutes * monthlyRatePerMinute;
          // console.log(
          //   `⏰ [DEBUG] Late deductions (monthly): ${
          //     attendance.late_minutes
          //   } minutes × ₱${monthlyRatePerMinute.toFixed(
          //     6
          //   )} = ₱${lateDeductions.toFixed(2)}`
          // );
        }

        // Calculate undertime deductions for monthly employees
        if (
          attendance.undertime_minutes > 0 &&
          this.config.enable_undertime_deductions
        ) {
          const monthlyRatePerMinute =
            rate /
            (workingDaysInPeriod * this.config.standardWorkingHours * 60);
          undertimeDeductions =
            attendance.undertime_minutes *
            monthlyRatePerMinute *
            this.config.undertime_deduction_rate;
          // console.log(
          //   `⏰ [DEBUG] Undertime deductions (monthly): ${
          //     attendance.undertime_minutes
          //   } minutes × ₱${monthlyRatePerMinute.toFixed(6)} × ${
          //     this.config.undertime_deduction_rate
          //   } = ₱${undertimeDeductions.toFixed(2)}`
          // );
        }
        break;
    }

    // Calculate holiday pay (Philippine Labor Code compliance)
    // console.log(`🎉 [DEBUG] Calculating holiday pay...`);

    if (attendance.regular_holiday_days_worked > 0) {
      // Regular holiday worked: 200% of daily rate
      const holidayRate =
        this.getHourlyRate(employee) * this.config.regularHolidayMultiplier;
      const regularHolidayPay =
        attendance.regular_holiday_days_worked *
        this.config.standardWorkingHours *
        holidayRate;
      holidayPay += regularHolidayPay;
      // console.log(
      //   `🎊 [DEBUG] Regular holiday worked: ${
      //     attendance.regular_holiday_days_worked
      //   } days × ${
      //     this.config.standardWorkingHours
      //   } hours × ₱${holidayRate.toFixed(2)} = ₱${regularHolidayPay.toFixed(2)}`
      // );
    }

    if (attendance.regular_holiday_days_not_worked > 0) {
      // Regular holiday not worked but entitled: 100% of daily rate (if present day before)
      const holidayRate =
        this.getHourlyRate(employee) *
        this.config.holiday_regular_not_worked_multiplier;
      const regularHolidayNotWorkedPay =
        attendance.regular_holiday_days_not_worked *
        this.config.standardWorkingHours *
        holidayRate;
      holidayPay += regularHolidayNotWorkedPay;
      // console.log(
      //   `🎊 [DEBUG] Regular holiday not worked (entitled): ${
      //     attendance.regular_holiday_days_not_worked
      //   } days × ${
      //     this.config.standardWorkingHours
      //   } hours × ₱${holidayRate.toFixed(
      //     2
      //   )} = ₱${regularHolidayNotWorkedPay.toFixed(2)}`
      // );
    }

    if (attendance.special_holiday_days_worked > 0) {
      // Special holiday worked: 130% of daily rate
      const holidayRate =
        this.getHourlyRate(employee) * this.config.specialHolidayMultiplier;
      const specialHolidayPay =
        attendance.special_holiday_days_worked *
        this.config.standardWorkingHours *
        holidayRate;
      holidayPay += specialHolidayPay;
      // console.log(
      //   `🎊 [DEBUG] Special holiday worked: ${
      //     attendance.special_holiday_days_worked
      //   } days × ${
      //     this.config.standardWorkingHours
      //   } hours × ₱${holidayRate.toFixed(2)} = ₱${specialHolidayPay.toFixed(2)}`
      // );
    }

    // Rest day work (applies if worked on designated rest day)
    if (attendance.rest_day_hours_worked > 0) {
      const restDayRate =
        this.getHourlyRate(employee) * this.config.restDayMultiplier;
      const restDayPay = attendance.rest_day_hours_worked * restDayRate;
      holidayPay += restDayPay;
      // console.log(
      //   `🏖️ [DEBUG] Rest day work: ${
      //     attendance.rest_day_hours_worked
      //   } hours × ₱${restDayRate.toFixed(2)} = ₱${restDayPay.toFixed(2)}`
      // );
    }

    // console.log(`🎉 [DEBUG] Total holiday pay: ₱${holidayPay.toFixed(2)}`);

    // Calculate night differential (10PM-6AM work per DOLE rules)
    if (attendance.night_differential_hours > 0) {
      const hourlyRate = this.getHourlyRate(employee);
      nightDifferential =
        attendance.night_differential_hours *
        hourlyRate *
        this.config.nightDifferentialRate;
      // console.log(
      //   `🌙 [DEBUG] Night differential: ${
      //     attendance.night_differential_hours
      //   } hours × ₱${hourlyRate.toFixed(2)} × ${
      //     this.config.nightDifferentialRate
      //   } = ₱${nightDifferential.toFixed(2)}`
      // );
    }

    const grossPay =
      basePay + overtimePay + holidayPay + nightDifferential + leavePay;
    // lateDeductions -
    // undertimeDeductions;

    // console.log(
    //   `💰 [DEBUG] Gross pay calculation: Base(₱${basePay.toFixed(
    //     2
    //   )}) + Overtime(₱${overtimePay.toFixed(
    //     2
    //   )}) + Holiday(₱${holidayPay.toFixed(
    //     2
    //   )}) + Night(₱${nightDifferential.toFixed(2)}) + Leave(₱${leavePay.toFixed(
    //     2
    //   )}) - Late(₱${lateDeductions.toFixed(
    //     2
    //   )}) - Undertime(₱${undertimeDeductions.toFixed(2)}) = ₱${grossPay.toFixed(
    //     2
    //   )}`
    // );

    const result = {
      basePay: this.roundAmount(basePay),
      overtimePay: this.roundAmount(overtimePay),
      holidayPay: this.roundAmount(holidayPay),
      nightDifferential: this.roundAmount(nightDifferential),
      leavePay: this.roundAmount(leavePay),
      lateDeductions: this.roundAmount(lateDeductions),
      undertimeDeductions: this.roundAmount(undertimeDeductions),
      otherEarnings: 0,
      grossPay: this.roundAmount(grossPay),
    };

    // console.log(`✅ [DEBUG] Final earnings result:`, result);
    return result;
  }

  /**
   * Calculate earnings using enhanced payroll breakdown (ULTIMATE EDGE CASES)
   * Handles Day Off + Holiday + Night Diff + Overtime stacking with proper rate calculations
   */
  async calculateEarningsFromBreakdown(
    employee,
    attendance,
    scheduleInfo = null
  ) {
    console.log(
      `🎯 [CALC DEBUG] Processing ultimate edge cases with comprehensive breakdown...`
    );

    const rate = parseFloat(employee.rate);
    let basePay = 0;
    let overtimePay = 0;
    let holidayPay = 0;
    let nightDifferential = 0;
    let leavePay = 0;
    let lateDeductions = 0;
    let undertimeDeductions = 0;

    // Aggregate all payroll breakdowns from attendance records
    const aggregatedBreakdown = this.aggregatePayrollBreakdowns(
      attendance.payroll_breakdowns
    );

    console.log(
      `📊 [CALC DEBUG] Aggregated breakdown:`,
      JSON.stringify(aggregatedBreakdown, null, 2)
    );

    // Calculate hourly rate based on employee rate type
    const hourlyRate = this.getHourlyRate(employee);

    // ===== ENHANCED EARNINGS CALCULATION WITH ULTIMATE EDGE CASES =====

    // 1. BASE PAY (Regular hours with no premiums)
    basePay = (aggregatedBreakdown.regular_hours || 0) * hourlyRate;

    // 2. OVERTIME PAY (with comprehensive stacking)
    if (aggregatedBreakdown.overtime) {
      const overtime = aggregatedBreakdown.overtime;

      // Regular overtime (1.25x)
      overtimePay +=
        (overtime.regular_overtime || 0) *
        hourlyRate *
        this.config.overtimeMultiplier;

      // Night differential overtime (1.25x base + 10% night diff = 1.375x)
      overtimePay +=
        (overtime.night_diff_overtime || 0) *
        hourlyRate *
        this.config.overtimeMultiplier *
        (1 + this.config.nightDifferentialRate);

      // Rest day overtime (1.69x = 1.30x rest day × 1.30x overtime)
      overtimePay +=
        (overtime.rest_day_overtime || 0) *
        hourlyRate *
        this.config.restDayMultiplier *
        this.config.overtimeMultiplier;

      // Regular holiday overtime (2.60x = 2.0x holiday × 1.30x overtime)
      overtimePay +=
        (overtime.regular_holiday_overtime || 0) *
        hourlyRate *
        this.config.regularHolidayMultiplier *
        this.config.overtimeMultiplier;

      // Special holiday overtime (1.69x = 1.30x holiday × 1.30x overtime)
      overtimePay +=
        (overtime.special_holiday_overtime || 0) *
        hourlyRate *
        this.config.specialHolidayMultiplier *
        this.config.overtimeMultiplier;

      // ===== ULTIMATE EDGE CASES: Holiday + Rest Day overtime =====
      // Regular Holiday + Rest Day overtime (3.38x = 2.0x holiday × 1.30x rest day × 1.30x overtime)
      overtimePay +=
        (overtime.regular_holiday_rest_day_overtime || 0) *
        hourlyRate *
        this.config.regularHolidayMultiplier *
        this.config.restDayMultiplier *
        this.config.overtimeMultiplier;

      // Special Holiday + Rest Day overtime (2.197x = 1.30x holiday × 1.30x rest day × 1.30x overtime)
      overtimePay +=
        (overtime.special_holiday_rest_day_overtime || 0) *
        hourlyRate *
        this.config.specialHolidayMultiplier *
        this.config.restDayMultiplier *
        this.config.overtimeMultiplier;
    }

    // 3. HOLIDAY PAY (with comprehensive stacking)
    if (aggregatedBreakdown.premiums && aggregatedBreakdown.premiums.holidays) {
      const holidays = aggregatedBreakdown.premiums.holidays;

      // Regular holiday pay (2.0x for regular hours)
      if (holidays.regular_holiday) {
        holidayPay +=
          (holidays.regular_holiday.regular || 0) *
          hourlyRate *
          this.config.regularHolidayMultiplier;
      }

      // Special holiday pay (1.30x for regular hours)
      if (holidays.special_holiday) {
        holidayPay +=
          (holidays.special_holiday.regular || 0) *
          hourlyRate *
          this.config.specialHolidayMultiplier;
      }

      // ===== ULTIMATE EDGE CASES: Holiday + Rest Day regular hours =====
      // Regular Holiday + Rest Day (2.60x = 2.0x holiday × 1.30x rest day)
      if (holidays.regular_holiday_rest_day) {
        holidayPay +=
          (holidays.regular_holiday_rest_day.regular || 0) *
          hourlyRate *
          this.config.regularHolidayMultiplier *
          this.config.restDayMultiplier;
      }

      // Special Holiday + Rest Day (1.69x = 1.30x holiday × 1.30x rest day)
      if (holidays.special_holiday_rest_day) {
        holidayPay +=
          (holidays.special_holiday_rest_day.regular || 0) *
          hourlyRate *
          this.config.specialHolidayMultiplier *
          this.config.restDayMultiplier;
      }
    }

    // 4. REST DAY PAY (for pure rest day work, not holiday combinations)
    if (aggregatedBreakdown.premiums && aggregatedBreakdown.premiums.rest_day) {
      const restDay = aggregatedBreakdown.premiums.rest_day;

      // Pure rest day pay (1.30x, excluding holiday combinations)
      holidayPay +=
        (restDay.pure_rest_day || 0) *
        hourlyRate *
        this.config.restDayMultiplier;
    }

    // 5. NIGHT DIFFERENTIAL (10% additional on all applicable hours)
    if (
      aggregatedBreakdown.premiums &&
      aggregatedBreakdown.premiums.night_differential
    ) {
      const nightDiff = aggregatedBreakdown.premiums.night_differential;

      // Regular night differential (10% of base rate)
      nightDifferential +=
        (nightDiff.regular || 0) *
        hourlyRate *
        this.config.nightDifferentialRate;

      // Night differential with holiday combinations is already calculated above in overtime/holiday sections
      // This is just for tracking/reporting purposes
    }

    // 6. LEAVE PAY
    leavePay = await this.calculateLeavePay(employee, attendance);

    // 7. LATE AND UNDERTIME DEDUCTIONS
    // Calculate based on rate type
    switch (employee.rate_type) {
      case "daily":
        if (attendance.late_minutes > 0 && this.config.enable_late_deductions) {
          const lateRatePerMinute = rate * this.config.late_penalty_rate;
          lateDeductions = attendance.late_minutes * lateRatePerMinute;
        }

        if (
          attendance.undertime_minutes > 0 &&
          this.config.enable_undertime_deductions
        ) {
          const dailyRatePerMinute =
            rate / (this.config.standardWorkingHours * 60);
          undertimeDeductions =
            attendance.undertime_minutes *
            dailyRatePerMinute *
            this.config.undertime_deduction_rate;
        }
        break;

      case "monthly":
        const workingDaysInPeriod = this.config.standardWorkingDays;

        if (attendance.late_minutes > 0 && this.config.enable_late_deductions) {
          const monthlyRatePerMinute =
            rate /
            (workingDaysInPeriod * this.config.standardWorkingHours * 60);
          lateDeductions = attendance.late_minutes * monthlyRatePerMinute;
        }

        if (
          attendance.undertime_minutes > 0 &&
          this.config.enable_undertime_deductions
        ) {
          const monthlyRatePerMinute =
            rate /
            (workingDaysInPeriod * this.config.standardWorkingHours * 60);
          undertimeDeductions =
            attendance.undertime_minutes *
            monthlyRatePerMinute *
            this.config.undertime_deduction_rate;
        }
        break;

      case "hourly":
      default:
        // For hourly employees, late/undertime is typically handled differently
        // Usually no additional deductions since they're only paid for hours worked
        break;
    }

    const grossPay =
      basePay + overtimePay + holidayPay + nightDifferential + leavePay;

    console.log(`💰 [CALC DEBUG] Enhanced earnings breakdown:
      Base Pay: ₱${basePay.toFixed(2)}
      Overtime Pay: ₱${overtimePay.toFixed(2)}
      Holiday Pay: ₱${holidayPay.toFixed(2)}
      Night Differential: ₱${nightDifferential.toFixed(2)}
      Leave Pay: ₱${leavePay.toFixed(2)}
      Late Deductions: ₱${lateDeductions.toFixed(2)}
      Undertime Deductions: ₱${undertimeDeductions.toFixed(2)}
      ===========================
      GROSS PAY: ₱${grossPay.toFixed(2)}`);

    const result = {
      basePay: this.roundAmount(basePay),
      overtimePay: this.roundAmount(overtimePay),
      holidayPay: this.roundAmount(holidayPay),
      nightDifferential: this.roundAmount(nightDifferential),
      leavePay: this.roundAmount(leavePay),
      lateDeductions: this.roundAmount(lateDeductions),
      undertimeDeductions: this.roundAmount(undertimeDeductions),
      otherEarnings: 0,
      grossPay: this.roundAmount(grossPay),
      // Add enhanced breakdown for detailed reporting
      enhancedBreakdown: aggregatedBreakdown,
    };

    console.log(`✅ [CALC DEBUG] Enhanced earnings result:`, result);
    return result;
  }

  /**
   * Aggregate payroll breakdowns from multiple attendance records
   */
  aggregatePayrollBreakdowns(breakdowns) {
    const aggregated = {
      regular_hours: 0,
      overtime: {
        total: 0,
        regular_overtime: 0,
        night_diff_overtime: 0,
        rest_day_overtime: 0,
        regular_holiday_overtime: 0,
        special_holiday_overtime: 0,
        regular_holiday_rest_day_overtime: 0,
        special_holiday_rest_day_overtime: 0,
        night_diff_regular_holiday_overtime: 0,
        night_diff_special_holiday_overtime: 0,
        night_diff_rest_day_overtime: 0,
        night_diff_regular_holiday_rest_day_overtime: 0,
        night_diff_special_holiday_rest_day_overtime: 0,
      },
      worked_hours: {
        total: 0,
        regular: 0,
        rest_day: 0,
        night_diff: 0,
        regular_holiday: 0,
        special_holiday: 0,
        regular_holiday_rest_day: 0,
        special_holiday_rest_day: 0,
        night_diff_rest_day: 0,
        night_diff_regular_holiday: 0,
        night_diff_special_holiday: 0,
        night_diff_regular_holiday_rest_day: 0,
        night_diff_special_holiday_rest_day: 0,
      },
    };

    // Aggregate all breakdown records
    breakdowns.forEach((breakdown) => {
      if (!breakdown) return;

      // Regular hours
      aggregated.regular_hours += breakdown.regular_hours || 0;

      // Overtime breakdown
      if (breakdown.overtime) {
        Object.keys(aggregated.overtime).forEach((key) => {
          aggregated.overtime[key] += breakdown.overtime[key] || 0;
        });
      }

      // Worked hours breakdown
      if (breakdown.worked_hours) {
        Object.keys(aggregated.worked_hours).forEach((key) => {
          aggregated.worked_hours[key] += breakdown.worked_hours[key] || 0;
        });
      }
    });

    return aggregated;
  }

  /**
   * Calculate deductions for an employee (updated with Philippine law compliance)
   */
  async calculateDeductions(grossPay, employeeId, employmentType = "Regular") {
    // console.log(
    //   `📉 [DEBUG] Starting deductions calculation for employee: ${employeeId}`
    // );
    // console.log(
    //   `💰 [DEBUG] Gross pay: ₱${grossPay}, Employment type: ${employmentType}`
    // );

    let sss = 0;
    let philhealth = 0;
    let pagibig = 0;
    let tax = 0;
    let otherDeductions = 0;

    // Employer contributions (for compliance reporting)
    let employerSSS = 0;
    let employerPhilHealth = 0;
    let employerPagIBIG = 0;

    // Get individual deductions for this employee
    // console.log(
    //   `🔍 [DEBUG] Fetching individual deductions for employee: ${employeeId}`
    // );
    const date = new Date();
    console.log(date);
    const individualDeductions = await this.getIndividualDeductions(
      employeeId,
      new Date()
    );
    otherDeductions = individualDeductions.reduce(
      (sum, deduction) => sum + deduction.amount,
      0
    );
    // console.log(
    //   `💸 [DEBUG] Individual deductions found: ${individualDeductions.length} items, total: ₱${otherDeductions}`
    // );
    if (individualDeductions.length > 0) {
      // console.log(
      //   `📋 [DEBUG] Individual deductions details:`,
      //   individualDeductions.map((d) => ({
      //     type: d.deduction_type,
      //     amount: d.amount,
      //     description: d.description,
      //   }))
      // );
    }

    // Only apply government contributions for regular employees
    if (employmentType === "Regular") {
      // console.log(
      //   `🏛️ [DEBUG] Calculating government contributions for regular employee`
      // );

      // Calculate government contributions based on monthly gross pay
      const monthlyGrossPay = this.convertToMonthlyPay(grossPay);
      // console.log(
      //   `📊 [DEBUG] Monthly gross pay for deductions: ₱${monthlyGrossPay.toFixed(
      //     2
      //   )}`
      // );

      // SSS Contribution (based on contribution table) - Use database config
      console.log(`🏦 [DEBUG] Calculating SSS contribution...`);
      const sssContributions = await this.calculateSSSContribution(
        monthlyGrossPay
      );
      sss = sssContributions.employee;
      employerSSS = sssContributions.employer;
      // console.log(
      //   `🏦 [DEBUG] SSS: Employee ₱${sss}, Employer ₱${employerSSS}, Source: ${
      //     sssContributions.source || "N/A"
      //   }`
      // );

      // PhilHealth Contribution (5.5% total for 2025) - Use database config
      // console.log(`🏥 [DEBUG] Calculating PhilHealth contribution...`);
      const philHealthContributions =
        await this.calculatePhilHealthContribution(monthlyGrossPay);
      philhealth = philHealthContributions.employee;
      employerPhilHealth = philHealthContributions.employer;
      // console.log(
      //   `🏥 [DEBUG] PhilHealth: Employee ₱${philhealth}, Employer ₱${employerPhilHealth}, Source: ${
      //     philHealthContributions.source || "N/A"
      //   }`
      // );

      // Pag-IBIG Contribution (enhanced tiers for 2025) - Use database config
      // console.log(`🏘️ [DEBUG] Calculating Pag-IBIG contribution...`);
      const pagIBIGContributions = await this.calculatePagIBIGContribution(
        monthlyGrossPay
      );
      pagibig = pagIBIGContributions.employee;
      employerPagIBIG = pagIBIGContributions.employer;
      // console.log(
      //   `🏘️ [DEBUG] Pag-IBIG: Employee ₱${pagibig}, Employer ₱${employerPagIBIG}, Source: ${
      //     pagIBIGContributions.source || "N/A"
      //   }`
      // );

      // Income Tax (2025 brackets with inflation adjustments) - Use database config
      const taxableIncome = monthlyGrossPay - sss - philhealth - pagibig;
      // console.log(
      //   `💰 [DEBUG] Taxable income: ₱${monthlyGrossPay.toFixed(
      //     2
      //   )} - ₱${sss} - ₱${philhealth} - ₱${pagibig} = ₱${taxableIncome.toFixed(
      //     2
      //   )}`
      // );

      // console.log(`📊 [DEBUG] Calculating income tax...`);
      tax = await this.calculateIncomeTax(taxableIncome);
      // console.log(`📊 [DEBUG] Income tax: ₱${tax}`);
    } else {
      // console.log(
      //   `👤 [DEBUG] Skipping government contributions for ${employmentType} employee`
      // );
    }

    const totalDeductions = sss + philhealth + pagibig + tax + otherDeductions;
    const totalEmployerContributions =
      employerSSS + employerPhilHealth + employerPagIBIG;

    // console.log(`💸 [DEBUG] Total deductions breakdown:`);
    // console.log(`   SSS: ₱${sss}`);
    // console.log(`   PhilHealth: ₱${philhealth}`);
    // console.log(`   Pag-IBIG: ₱${pagibig}`);
    // console.log(`   Income Tax: ₱${tax}`);
    // console.log(`   Other Deductions: ₱${otherDeductions}`);
    // console.log(`   TOTAL: ₱${totalDeductions}`);
    // console.log(
    //   `💼 [DEBUG] Total employer contributions: ₱${totalEmployerContributions}`
    // );

    const result = {
      sss: this.roundAmount(sss),
      philhealth: this.roundAmount(philhealth),
      pagibig: this.roundAmount(pagibig),
      tax: this.roundAmount(tax),
      otherDeductions: this.roundAmount(otherDeductions),
      totalDeductions: this.roundAmount(totalDeductions),
      breakdown: {
        employeeContributions: {
          sss: this.roundAmount(sss),
          philhealth: this.roundAmount(philhealth),
          pagibig: this.roundAmount(pagibig),
        },
        employerContributions: {
          sss: this.roundAmount(employerSSS),
          philhealth: this.roundAmount(employerPhilHealth),
          pagibig: this.roundAmount(employerPagIBIG),
          total: this.roundAmount(totalEmployerContributions),
        },
        incomeTax: this.roundAmount(tax),
        individualDeductions: individualDeductions,
        totalOtherDeductions: this.roundAmount(otherDeductions),
      },
    };

    // console.log(`✅ [DEBUG] Final deductions result:`, result);
    return result;
  }

  /**
   * Calculate SSS contribution based on database configuration
   */
  async calculateSSSContribution(monthlyPay) {
    try {
      // Try to get rates from database first
      const sssConfigs = await AdvancedPayrollCalculator.getConfigsByType(
        "sss"
      );

      if (sssConfigs && Object.keys(sssConfigs).length > 0) {
        // Use database rates for calculation logic
        // For SSS, we still use the brackets table since it's complex
        // but we can verify against database minimums/maximums
        const minSalaryCredit = sssConfigs.minimum_salary_credit || 4000;
        const maxSalaryCredit = sssConfigs.maximum_salary_credit || 30000;

        // Constrain salary to SSS limits
        const constrainedSalary = Math.max(
          minSalaryCredit,
          Math.min(monthlyPay, maxSalaryCredit)
        );

        // Use the SSS table (this is mandated by law and doesn't change often)
        const sssTable = this.config.deductions.sss.brackets;

        for (const bracket of sssTable) {
          if (
            constrainedSalary >= bracket.min &&
            constrainedSalary <= bracket.max
          ) {
            return {
              employee: bracket.employee,
              employer: bracket.employer,
              total: bracket.employee + bracket.employer,
              salaryCredit: constrainedSalary,
              source: "database_verified",
            };
          }
        }

        // If salary exceeds maximum bracket, use the highest contribution
        const maxBracket = sssTable[sssTable.length - 1];
        return {
          employee: maxBracket.employee,
          employer: maxBracket.employer,
          total: maxBracket.employee + maxBracket.employer,
          salaryCredit: constrainedSalary,
          source: "database_verified",
        };
      }
    } catch (error) {
      console.warn(
        "Failed to fetch SSS config from database, using fallback:",
        error
      );
    }

    // Fallback to hardcoded values
    const sssTable = this.config.deductions.sss.brackets;

    for (const bracket of sssTable) {
      if (monthlyPay >= bracket.min && monthlyPay <= bracket.max) {
        return {
          employee: bracket.employee,
          employer: bracket.employer,
          total: bracket.employee + bracket.employer,
          source: "hardcoded_fallback",
        };
      }
    }

    // If salary exceeds maximum bracket, use the highest contribution
    const maxBracket = sssTable[sssTable.length - 1];
    return {
      employee: maxBracket.employee,
      employer: maxBracket.employer,
      total: maxBracket.employee + maxBracket.employer,
      source: "hardcoded_fallback",
    };
  }

  /**
   * Calculate PhilHealth contribution based on database configuration
   */
  async calculatePhilHealthContribution(monthlyPay) {
    try {
      // Try to get rates from database first
      const philhealthConfigs =
        await AdvancedPayrollCalculator.getConfigsByType("philhealth");

      if (philhealthConfigs && Object.keys(philhealthConfigs).length > 0) {
        const totalRate = philhealthConfigs.contribution_rate_total || 0.055; // 5.5% for 2025
        const employeeRate =
          philhealthConfigs.contribution_rate_employee || 0.0275;
        const employerRate =
          philhealthConfigs.contribution_rate_employer || 0.0275;
        const minPremium = philhealthConfigs.minimum_premium || 550;
        const maxPremium = philhealthConfigs.maximum_premium || 6875;

        // Calculate premium based on salary
        const calculatedPremium = monthlyPay * totalRate;
        const finalPremium = Math.max(
          minPremium,
          Math.min(calculatedPremium, maxPremium)
        );

        return {
          employee: this.roundAmount(finalPremium * (employeeRate / totalRate)),
          employer: this.roundAmount(finalPremium * (employerRate / totalRate)),
          total: this.roundAmount(finalPremium),
          rate: totalRate,
          source: "database",
        };
      }
    } catch (error) {
      console.warn(
        "Failed to fetch PhilHealth config from database, using fallback:",
        error
      );
    }

    // Fallback to hardcoded values
    const {
      employeeRate,
      employerRate,
      minContribution,
      maxContribution,
      minSalary,
      maxSalary,
    } = this.config.deductions.philhealth;

    // Use minimum salary for calculation if actual salary is below minimum
    const calculationBase = Math.max(monthlyPay, minSalary);

    // Use maximum salary for calculation if actual salary exceeds maximum
    const cappedSalary = Math.min(calculationBase, maxSalary);

    // Calculate 2.5% each for employee and employer
    const employeeContribution = cappedSalary * employeeRate;
    const employerContribution = cappedSalary * employerRate;

    // Apply minimum and maximum contribution limits
    const finalEmployeeContribution = Math.max(
      minContribution,
      Math.min(employeeContribution, maxContribution)
    );
    const finalEmployerContribution = Math.max(
      minContribution,
      Math.min(employerContribution, maxContribution)
    );

    return {
      employee: finalEmployeeContribution,
      employer: finalEmployerContribution,
      total: finalEmployeeContribution + finalEmployerContribution,
      source: "hardcoded_fallback",
    };
  }

  /**
   * Calculate Pag-IBIG contribution based on database configuration
   */
  async calculatePagIBIGContribution(monthlyPay) {
    try {
      // Try to get rates from database first
      const pagibigConfigs = await AdvancedPayrollCalculator.getConfigsByType(
        "pagibig"
      );

      if (pagibigConfigs && Object.keys(pagibigConfigs).length > 0) {
        const employeeRateTier1 =
          pagibigConfigs.contribution_rate_employee_tier1 || 0.01; // 1%
        const employeeRateTier2 =
          pagibigConfigs.contribution_rate_employee_tier2 || 0.02; // 2%
        const employerRate = pagibigConfigs.contribution_rate_employer || 0.02; // 2%
        const minContribution = pagibigConfigs.minimum_contribution || 15;
        const maxContribution = pagibigConfigs.maximum_contribution || 200;
        const salaryThreshold = pagibigConfigs.salary_threshold || 1500;

        // Determine employee rate based on salary
        const employeeRate =
          monthlyPay <= salaryThreshold ? employeeRateTier1 : employeeRateTier2;

        // Calculate contributions
        const employeeContribution = Math.max(
          minContribution,
          Math.min(monthlyPay * employeeRate, maxContribution)
        );
        const employerContribution = Math.max(
          minContribution,
          Math.min(monthlyPay * employerRate, maxContribution)
        );

        return {
          employee: this.roundAmount(employeeContribution),
          employer: this.roundAmount(employerContribution),
          total: this.roundAmount(employeeContribution + employerContribution),
          rate: employeeRate,
          tier: monthlyPay <= salaryThreshold ? 1 : 2,
          source: "database",
        };
      }
    } catch (error) {
      console.warn(
        "Failed to fetch Pag-IBIG config from database, using fallback:",
        error
      );
    }

    // Fallback to hardcoded values
    const brackets = this.config.deductions.pagibig.brackets;
    const cap = this.config.deductions.pagibig.cap;

    let rate = 0.01; // Default 1%

    // Find applicable rate for employee
    for (const bracket of brackets) {
      if (
        monthlyPay >= bracket.min &&
        (bracket.max === Infinity || monthlyPay <= bracket.max)
      ) {
        rate = bracket.rate;
        break;
      }
    }

    const employeeContribution = Math.min(monthlyPay * rate, cap);

    // Employer matches employee contribution up to 100 pesos
    const employerContribution = Math.min(employeeContribution, cap);

    return {
      employee: employeeContribution,
      employer: employerContribution,
      total: employeeContribution + employerContribution,
      source: "hardcoded_fallback",
    };
  }

  /**
   * Calculate progressive income tax based on database configuration
   */
  async calculateIncomeTax(taxableMonthlyIncome) {
    if (taxableMonthlyIncome <= 0) return 0;

    try {
      // Try to get tax rates from database first
      const taxConfigs = await AdvancedPayrollCalculator.getConfigsByType(
        "income_tax"
      );

      if (taxConfigs && Object.keys(taxConfigs).length > 0) {
        // Convert to annual income for calculation
        const annualIncome = taxableMonthlyIncome * 12;
        const exemption = taxConfigs.exemption_annual || 250000;

        if (annualIncome <= exemption) {
          return 0;
        }

        const taxableAnnual = annualIncome - exemption;
        let tax = 0;

        // Apply tax brackets (2025 with inflation adjustments)
        const brackets = [
          {
            min: 0,
            max: 150000,
            rate: taxConfigs.rate_bracket_2 || 0.15,
            base: 0,
          },
          {
            min: 150000,
            max: 400000,
            rate: taxConfigs.rate_bracket_3 || 0.2,
            base: 22500,
          },
          {
            min: 400000,
            max: 1200000,
            rate: taxConfigs.rate_bracket_4 || 0.25,
            base: 102500,
          },
          {
            min: 1200000,
            max: 5750000,
            rate: taxConfigs.rate_bracket_5 || 0.3,
            base: 302500,
          },
          {
            min: 5750000,
            max: Infinity,
            rate: taxConfigs.rate_bracket_6 || 0.32,
            base: 1667500,
          },
        ];

        for (const bracket of brackets) {
          if (taxableAnnual > bracket.min) {
            const taxableInBracket = Math.min(
              taxableAnnual - bracket.min,
              bracket.max - bracket.min
            );
            tax = bracket.base + taxableInBracket * bracket.rate;

            if (taxableAnnual <= bracket.max) {
              break;
            }
          }
        }

        return this.roundAmount(tax / 12); // Convert back to monthly
      }
    } catch (error) {
      console.warn(
        "Failed to fetch tax config from database, using fallback:",
        error
      );
    }

    // Fallback to hardcoded calculation
    const brackets = this.config.deductions.tax.brackets;
    let tax = 0;

    for (const bracket of brackets) {
      if (taxableMonthlyIncome > bracket.min) {
        // Calculate taxable amount in this bracket
        const excessAmount =
          Math.min(taxableMonthlyIncome, bracket.max) - bracket.min;

        // Apply bracket rate to excess amount
        const bracketTax = excessAmount * bracket.rate;

        // Add fixed amount for this bracket
        tax = bracketTax + (bracket.fixedAmount || 0);

        // If income falls within this bracket, we're done
        if (taxableMonthlyIncome <= bracket.max) {
          break;
        }
      }
    }

    return Math.max(0, tax); // Ensure no negative tax
  }

  /**
   * Convert any pay period to monthly equivalent for tax calculations
   */
  convertToMonthlyPay(grossPay, payFrequency = null) {
    // Get pay frequency from config if not provided
    const frequency = payFrequency || this.config.pay_frequency || "monthly";

    switch (frequency.toLowerCase()) {
      case "weekly":
        return grossPay * 4.33; // Average weeks per month
      case "bi-weekly":
      case "biweekly":
        return grossPay * 2.167; // 26 pay periods / 12 months
      case "semi-monthly":
      case "semimonthly":
        return grossPay * 2; // 24 pay periods / 12 months
      case "monthly":
      default:
        return grossPay;
    }
  }

  /**
   * Convert monthly amount back to pay period amount
   */
  convertFromMonthlyPay(monthlyAmount, payFrequency = null) {
    const frequency = payFrequency || this.config.pay_frequency || "monthly";

    switch (frequency.toLowerCase()) {
      case "weekly":
        return monthlyAmount / 4.33;
      case "bi-weekly":
      case "biweekly":
        return monthlyAmount / 2.167;
      case "semi-monthly":
      case "semimonthly":
        return monthlyAmount / 2;
      case "monthly":
      default:
        return monthlyAmount;
    }
  }

  /**
   * Get individual deductions for an employee (loans, advances, etc.) with enhanced logic
   */
  async getIndividualDeductions(employeeId, payrollDate = new Date()) {
    try {
      const result = await pool.query(
        `SELECT d.deduction_id, d.amount, d.description, dt.name as deduction_type,
                d.principal_amount, d.remaining_balance, d.installment_amount,
                d.installments_total, d.installments_paid, d.start_date, d.end_date,
                d.interest_rate, d.payment_frequency, d.is_recurring, d.auto_deduct,
                d.next_deduction_date
         FROM deductions d
         JOIN deduction_types dt ON d.deduction_type_id = dt.deduction_type_id
         WHERE d.employee_id = $1 
           AND d.is_active = true 
           AND d.auto_deduct = true
           AND ($2 >= d.start_date OR d.start_date IS NULL)
           AND ($2 <= d.end_date OR d.end_date IS NULL)
           AND d.remaining_balance > 0`,
        [employeeId, payrollDate]
      );

      const deductions = [];

      for (const row of result.rows) {
        let deductionAmount = 0;

        if (row.is_recurring && row.installment_amount > 0) {
          // Calculate installment-based deduction
          deductionAmount = Math.min(
            row.installment_amount,
            row.remaining_balance
          );

          // Update the deduction record after calculating
          await this.updateDeductionPayment(
            row.deduction_id,
            deductionAmount,
            payrollDate
          );
        } else {
          // One-time deduction
          deductionAmount = row.amount;
        }

        if (deductionAmount > 0) {
          deductions.push({
            deduction_id: row.deduction_id,
            amount: deductionAmount,
            description: row.description,
            deduction_type: row.deduction_type,
            is_recurring: row.is_recurring,
            remaining_balance: row.remaining_balance - deductionAmount,
          });
        }
      }

      return deductions;
    } catch (error) {
      console.warn(
        `Could not fetch individual deductions for employee ${employeeId}:`,
        error.message
      );
      return [];
    }
  }

  /**
   * Update deduction payment and balance
   */
  async updateDeductionPayment(deductionId, amountPaid, paymentDate) {
    try {
      // Update the deduction record
      const result = await pool.query(
        `UPDATE deductions 
         SET remaining_balance = remaining_balance - $1,
             installments_paid = installments_paid + 1,
             next_deduction_date = CASE 
               WHEN payment_frequency = 'monthly' THEN $2::date + INTERVAL '1 month'
               WHEN payment_frequency = 'semi-monthly' THEN $2::date + INTERVAL '15 days'
               WHEN payment_frequency = 'weekly' THEN $2::date + INTERVAL '1 week'
               ELSE $2::date + INTERVAL '1 month'
             END,
             is_active = CASE 
               WHEN remaining_balance - $1 <= 0 THEN false 
               ELSE true 
             END,
             updated_at = NOW()
         WHERE deduction_id = $3
         RETURNING employee_id, remaining_balance - $1 as new_balance`,
        [amountPaid, paymentDate, deductionId]
      );

      if (result.rows.length > 0) {
        const { employee_id, new_balance } = result.rows[0];

        // Record the payment in deduction_payments table
        await pool.query(
          `INSERT INTO deduction_payments 
           (deduction_id, employee_id, payment_date, amount_paid, remaining_balance_after)
           VALUES ($1, $2, $3, $4, $5)`,
          [deductionId, employee_id, paymentDate, amountPaid, new_balance]
        );
      }
    } catch (error) {
      console.error(
        `Error updating deduction payment for deduction ${deductionId}:`,
        error.message
      );
    }
  }

  /**
   * Calculate leave pay based on leave types and their specific rules
   */
  async calculateLeavePay(employee, attendance) {
    if (!attendance.paid_leave_days || attendance.paid_leave_days === 0) {
      return 0;
    }

    try {
      // Get detailed leave information for this period
      const leaveDetails = await pool.query(
        `SELECT lt.name as leave_type, lt.pay_percentage, COUNT(*) as days_used
         FROM attendance a
         JOIN leave_types lt ON a.leave_type_id = lt.leave_type_id
         WHERE a.employee_id = $1 AND a.on_leave = true AND lt.is_paid = true
         GROUP BY lt.leave_type_id, lt.name, lt.pay_percentage`,
        [employee.employee_id]
      );

      let totalLeavePay = 0;
      const rate = parseFloat(employee.rate);

      for (const leave of leaveDetails.rows) {
        const payPercentage = leave.pay_percentage || 100; // Default to 100% if not specified
        const daysUsed = parseInt(leave.days_used);

        let dailyPay = 0;
        switch (employee.rate_type) {
          case "hourly":
            dailyPay = rate * this.config.standardWorkingHours;
            break;
          case "daily":
            dailyPay = rate;
            break;
          case "monthly":
            dailyPay = rate / this.config.standardWorkingDays;
            break;
        }

        const leavePay = dailyPay * (payPercentage / 100) * daysUsed;
        totalLeavePay += leavePay;
      }

      return totalLeavePay;
    } catch (error) {
      console.warn(
        "Could not calculate detailed leave pay, using fallback:",
        error.message
      );

      // Fallback to simple calculation
      const rate = parseFloat(employee.rate);
      switch (employee.rate_type) {
        case "hourly":
          return (
            attendance.paid_leave_days * rate * this.config.standardWorkingHours
          );
        case "daily":
          return attendance.paid_leave_days * rate;
        case "monthly":
          return 0; // Already included in base pay for monthly employees
        default:
          return 0;
      }
    }
  }

  /**
   * Calculate 13th Month Pay (mandatory in Philippines)
   */
  async calculateThirteenthMonthPay(
    employeeId,
    year = new Date().getFullYear()
  ) {
    try {
      // Get employee details
      const employee = await this.getEmployeeDetails(employeeId);
      if (!employee) {
        throw new Error(`Employee ${employeeId} not found or inactive`);
      }

      // Check if 13th month pay already calculated for this year
      const existingBonus = await pool.query(
        `SELECT bonus_id FROM bonuses 
         WHERE employee_id = $1 AND year_earned = $2 AND is_thirteenth_month = true`,
        [employeeId, year]
      );

      if (existingBonus.rows.length > 0) {
        throw new Error(
          `13th month pay already calculated for employee ${employeeId} for year ${year}`
        );
      }

      // Calculate total basic salary earned for the year
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;

      // Get contract start date if hired during the year
      const contractStart = dayjs(employee.contract_start);
      const actualStart =
        contractStart.year() === year
          ? contractStart.format("YYYY-MM-DD")
          : yearStart;

      const totalEarnings = await this.getTotalBasicSalaryForPeriod(
        employeeId,
        actualStart,
        yearEnd
      );

      // Calculate months worked (for pro-rating)
      const startDate = dayjs(actualStart);
      const endDate = dayjs(yearEnd);
      const monthsWorked = Math.min(12, endDate.diff(startDate, "month", true));

      // Calculate 13th month pay (1/12 of total basic salary)
      let thirteenthMonthPay = totalEarnings.basicSalary / 12;

      // Pro-rate if employee worked less than 12 months
      const isProRated = monthsWorked < 12;
      if (isProRated) {
        thirteenthMonthPay =
          (totalEarnings.basicSalary / 12) * (monthsWorked / 12);
      }

      // Calculate tax on 13th month pay (taxable if > ₱90,000)
      const taxExemptLimit = 90000; // ₱90,000 exempt per year
      const taxableAmount = Math.max(0, thirteenthMonthPay - taxExemptLimit);
      const taxWithheld = this.calculateIncomeTax(taxableAmount);
      const netAmount = thirteenthMonthPay - taxWithheld;

      return {
        employee_id: employeeId,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        year: year,
        months_worked: monthsWorked,
        is_pro_rated: isProRated,
        total_basic_salary: totalEarnings.basicSalary,
        gross_thirteenth_month: this.roundAmount(thirteenthMonthPay),
        tax_exempt_portion: Math.min(thirteenthMonthPay, taxExemptLimit),
        taxable_portion: taxableAmount,
        tax_withheld: this.roundAmount(taxWithheld),
        net_thirteenth_month: this.roundAmount(netAmount),
        calculation_date: new Date().toISOString(),
        pay_period_start: actualStart,
        pay_period_end: yearEnd,
      };
    } catch (error) {
      return {
        employee_id: employeeId,
        error: error.message,
        calculation_date: new Date().toISOString(),
      };
    }
  }

  /**
   * Get total basic salary for a period (excluding overtime, bonuses, etc.)
   */
  async getTotalBasicSalaryForPeriod(employeeId, startDate, endDate) {
    try {
      // Get employee rate details
      const employee = await this.getEmployeeDetails(employeeId);
      if (!employee) {
        throw new Error(`Employee ${employeeId} not found`);
      }

      // Get attendance data for the period
      const attendance = await this.getAttendanceData(
        employeeId,
        startDate,
        endDate
      );

      const rate = parseFloat(employee.rate);
      let basicSalary = 0;

      // Calculate basic salary based on rate type (exclude overtime, bonuses, etc.)
      switch (employee.rate_type) {
        case "hourly":
          basicSalary = (attendance.total_regular_hours || 0) * rate;
          break;
        case "daily":
          basicSalary = (attendance.days_worked || 0) * rate;
          break;
        case "monthly":
          // For monthly employees, calculate based on months in period
          const start = dayjs(startDate);
          const end = dayjs(endDate);
          const monthsInPeriod = end.diff(start, "month", true);
          basicSalary = rate * monthsInPeriod;
          break;
      }

      return {
        basicSalary: basicSalary,
        rate: rate,
        rateType: employee.rate_type,
        periodStart: startDate,
        periodEnd: endDate,
      };
    } catch (error) {
      console.error(
        `Error getting total basic salary for employee ${employeeId}:`,
        error.message
      );
      return { basicSalary: 0 };
    }
  }

  /**
   * Process and save 13th month pay to database
   */
  async processThirteenthMonthPay(employeeId, year = new Date().getFullYear()) {
    try {
      const calculation = await this.calculateThirteenthMonthPay(
        employeeId,
        year
      );

      if (calculation.error) {
        throw new Error(calculation.error);
      }

      // Get or create 13th month pay bonus type
      let bonusTypeId = await this.getOrCreateBonusType(
        "13th Month Pay",
        "Mandatory 13th month pay per Philippine Labor Code"
      );

      // Insert the bonus record
      const result = await pool.query(
        `INSERT INTO bonuses 
         (employee_id, bonus_type_id, amount, description, date, 
          pay_period_start, pay_period_end, is_thirteenth_month, is_pro_rated,
          months_worked, year_earned, tax_withheld, net_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING bonus_id`,
        [
          employeeId,
          bonusTypeId,
          calculation.gross_thirteenth_month,
          `13th Month Pay for ${year} (${calculation.months_worked} months worked)`,
          new Date(),
          calculation.pay_period_start,
          calculation.pay_period_end,
          true, // is_thirteenth_month
          calculation.is_pro_rated,
          calculation.months_worked,
          year,
          calculation.tax_withheld,
          calculation.net_thirteenth_month,
        ]
      );

      return {
        ...calculation,
        bonus_id: result.rows[0].bonus_id,
        status: "saved",
      };
    } catch (error) {
      return {
        employee_id: employeeId,
        error: error.message,
        status: "failed",
      };
    }
  }

  /**
   * Get or create bonus type
   */
  async getOrCreateBonusType(name, description) {
    try {
      // Try to get existing bonus type
      let result = await pool.query(
        "SELECT bonus_type_id FROM bonus_types WHERE name = $1",
        [name]
      );

      if (result.rows.length > 0) {
        return result.rows[0].bonus_type_id;
      }

      // Create new bonus type
      result = await pool.query(
        "INSERT INTO bonus_types (name, description) VALUES ($1, $2) RETURNING bonus_type_id",
        [name, description]
      );

      return result.rows[0].bonus_type_id;
    } catch (error) {
      console.error("Error getting/creating bonus type:", error.message);
      throw error;
    }
  }

  /**
   * Calculate bonuses for an employee
   */
  async calculateEmployeeBonuses(employeeId, startDate, endDate) {
    try {
      const result = await pool.query(
        `SELECT b.bonus_id, b.amount, b.description, bt.name as bonus_type,
                b.is_thirteenth_month, b.tax_withheld, b.net_amount
         FROM bonuses b
         JOIN bonus_types bt ON b.bonus_type_id = bt.bonus_type_id
         WHERE b.employee_id = $1 
           AND b.date BETWEEN $2 AND $3
           AND b.is_paid = false`,
        [employeeId, startDate, endDate]
      );

      return result.rows || [];
    } catch (error) {
      console.warn(
        `Could not fetch bonuses for employee ${employeeId}:`,
        error.message
      );
      return [];
    }
  }

  /**
   * Batch calculate 13th month pay for all eligible employees
   */
  async batchCalculateThirteenthMonthPay(year = new Date().getFullYear()) {
    try {
      // Get all active employees
      const employeesResult = await pool.query(
        `SELECT e.employee_id, e.first_name, e.last_name, c.start_date
         FROM employees e
         JOIN contracts c ON e.contract_id = c.contract_id
         WHERE e.status = 'active'
           AND EXTRACT(YEAR FROM c.start_date) <= $1`,
        [year]
      );

      const results = [];
      const batchSize = 50;

      for (let i = 0; i < employeesResult.rows.length; i += batchSize) {
        const batch = employeesResult.rows.slice(i, i + batchSize);

        const batchPromises = batch.map((employee) =>
          this.processThirteenthMonthPay(employee.employee_id, year)
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      console.log(
        `✅ Calculated 13th month pay for ${results.length} employees for year ${year}`
      );
      return results;
    } catch (error) {
      console.error(
        "Error in batch 13th month pay calculation:",
        error.message
      );
      throw error;
    }
  }

  /**
   * Calculate progressive tax (legacy method for backward compatibility)
   */
  calculateTax(taxableIncome) {
    return this.calculateIncomeTax(taxableIncome);
  }

  /**
   * Get hourly rate for any rate type
   */
  getHourlyRate(employee) {
    const rate = parseFloat(employee.rate);

    switch (employee.rate_type) {
      case "hourly":
        return rate;
      case "daily":
        return rate / this.config.standardWorkingHours;
      case "monthly":
        return (
          rate /
          (this.config.standardWorkingDays * this.config.standardWorkingHours)
        );
      default:
        return rate;
    }
  }

  /**
   * Get employee details with contract information
   */
  async getEmployeeDetails(employeeId) {
    const result = await pool.query(
      `
      SELECT 
        e.employee_id,
        e.first_name,
        e.last_name,
        c.rate,
        c.rate_type,
        c.start_date as contract_start,
        c.end_date as contract_end,
        p.title as position_title,
        et.name as employment_type
      FROM employees e
      JOIN contracts c ON e.contract_id = c.contract_id
      JOIN positions p ON c.position_id = p.position_id
      JOIN employment_types et ON c.employment_type_id = et.employment_type_id
      WHERE e.employee_id = $1 AND e.status = 'active'
    `,
      [employeeId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get attendance data for payroll period
   */
  async getAttendanceData(employeeId, startDate, endDate) {
    console.log(
      `⏰ [DEBUG] Fetching attendance data for employee: ${employeeId}, period: ${startDate} to ${endDate}`
    );

    const result = await pool.query(
      `
      SELECT 
        COUNT(CASE WHEN a.is_present = true THEN 1 END) as days_worked,
        COUNT(CASE WHEN a.on_leave = true AND lt.is_paid = true THEN 1 END) as paid_leave_days,
        COUNT(CASE WHEN a.on_leave = true AND (lt.is_paid = false OR lt.is_paid IS NULL) THEN 1 END) as unpaid_leave_days,
        SUM(COALESCE(a.total_hours, 0)) as sum_total_hours,
        SUM(COALESCE(a.overtime_hours, 0)) as sum_overtime_hours,
        SUM(COALESCE(a.total_hours, 0) - COALESCE(a.overtime_hours, 0)) as total_regular_hours,
        SUM(COALESCE(a.overtime_hours, 0)) as total_overtime_hours,
        COUNT(CASE WHEN a.is_late = true THEN 1 END) as late_days,
        SUM(COALESCE(a.late_minutes, 0)) as late_minutes,
        SUM(COALESCE(a.undertime_minutes, 0)) as undertime_minutes,
        COUNT(CASE WHEN a.is_regular_holiday = true AND a.is_present = true THEN 1 END) as regular_holiday_days_worked,
        COUNT(CASE WHEN a.is_regular_holiday = true AND (a.is_present = false OR a.is_present IS NULL) AND a.is_entitled_holiday = true THEN 1 END) as regular_holiday_days_not_worked,
        COUNT(CASE WHEN a.is_special_holiday = true AND a.is_present = true THEN 1 END) as special_holiday_days_worked,
        SUM(CASE WHEN a.rest_day_hours_worked IS NOT NULL THEN a.rest_day_hours_worked ELSE 0 END) as rest_day_hours_worked,
        SUM(CASE WHEN a.night_differential_hours IS NOT NULL THEN a.night_differential_hours ELSE 0 END) as night_differential_hours
      FROM attendance a
      LEFT JOIN leave_types lt ON a.leave_type_id = lt.leave_type_id
      WHERE a.employee_id = $1 
        AND a.date BETWEEN $2 AND $3
    `,
      [employeeId, startDate, endDate]
    );

    const attendanceData = result.rows[0] || {};

    console.log(
      `📊 [DEBUG] Raw attendance query result for ${employeeId}:`,
      attendanceData
    );
    console.log(`🔍 [DEBUG] SQL calculation check for ${employeeId}:`);
    console.log(`  Sum total hours: ${attendanceData.sum_total_hours || 0}`);
    console.log(
      `  Sum overtime hours: ${attendanceData.sum_overtime_hours || 0}`
    );
    console.log(
      `  Calculated regular hours: ${attendanceData.total_regular_hours || 0}`
    );
    console.log(
      `  Manual verification: ${
        (attendanceData.sum_total_hours || 0) -
        (attendanceData.sum_overtime_hours || 0)
      }`
    );

    console.log(
      `📊 [DEBUG] Raw attendance query result for ${employeeId}:`,
      attendanceData
    );

    // Also get detailed daily attendance records for debugging
    const detailedResult = await pool.query(
      `
      SELECT 
        a.date,
        a.is_present,
        a.total_hours,
        a.overtime_hours,
        a.is_late,
        a.late_minutes,
        a.undertime_minutes,
        a.on_leave,
        lt.name as leave_type,
        lt.is_paid as leave_is_paid,
        a.is_regular_holiday,
        a.is_special_holiday,
        a.rest_day_hours_worked,
        a.night_differential_hours
      FROM attendance a
      LEFT JOIN leave_types lt ON a.leave_type_id = lt.leave_type_id
      WHERE a.employee_id = $1 
        AND a.date BETWEEN $2 AND $3
      ORDER BY a.date
    `,
      [employeeId, startDate, endDate]
    );

    // Check for potential duplicate records
    const duplicateCheck = await pool.query(
      `
      SELECT 
        a.date,
        COUNT(*) as record_count,
        array_agg(a.attendance_id) as attendance_ids,
        array_agg(a.total_hours) as total_hours_array,
        array_agg(a.overtime_hours) as overtime_hours_array
      FROM attendance a
      WHERE a.employee_id = $1 
        AND a.date BETWEEN $2 AND $3
      GROUP BY a.date
      HAVING COUNT(*) > 1
      ORDER BY a.date
    `,
      [employeeId, startDate, endDate]
    );

    if (duplicateCheck.rows.length > 0) {
      console.warn(
        `⚠️ [DEBUG] DUPLICATE ATTENDANCE RECORDS found for ${employeeId}:`
      );
      duplicateCheck.rows.forEach((dup) => {
        console.warn(
          `  📅 ${dup.date}: ${dup.record_count} records - IDs: ${dup.attendance_ids}, Hours: ${dup.total_hours_array}, OT: ${dup.overtime_hours_array}`
        );
      });
    }

    console.log(
      `📅 [DEBUG] Daily attendance records for ${employeeId} (${detailedResult.rows.length} days):`
    );
    detailedResult.rows.forEach((day) => {
      const regularHours = (day.total_hours || 0) - (day.overtime_hours || 0);
      console.log(
        `  ${day.date}: Present=${day.is_present}, Total=${
          day.total_hours || 0
        }h, OT=${day.overtime_hours || 0}h, Regular=${regularHours}h, Late=${
          day.late_minutes || 0
        }min, Leave=${day.on_leave ? day.leave_type : "No"}`
      );
    });

    // Calculate and log the sum for verification
    const totalRegularHours = detailedResult.rows.reduce((sum, day) => {
      return sum + ((day.total_hours || 0) - (day.overtime_hours || 0));
    }, 0);
    console.log(
      `🧮 [DEBUG] Manual calculation verification: Total regular hours = ${totalRegularHours}`
    );
    console.log(
      `📊 [DEBUG] Database query result: total_regular_hours = ${attendanceData.total_regular_hours}`
    );

    if (
      Math.abs(totalRegularHours - (attendanceData.total_regular_hours || 0)) >
      0.01
    ) {
      console.warn(
        `⚠️ [DEBUG] MISMATCH detected between manual calculation (${totalRegularHours}) and database result (${attendanceData.total_regular_hours})`
      );
    }

    console.log(
      `✅ [DEBUG] Attendance data retrieval completed for ${employeeId}`
    );

    return attendanceData;
  }

  /**
   * Get attendance records with payroll_breakdown data for precise earnings calculation
   */
  async getAttendanceRecordsWithPayrollBreakdown(
    employeeId,
    startDate,
    endDate
  ) {
    console.log(
      `📊 [DEBUG] Fetching attendance records with payroll_breakdown for employee: ${employeeId}, period: ${startDate} to ${endDate}`
    );

    const result = await pool.query(
      `
      SELECT
        a.attendance_id,
        a.date,
        a.payroll_breakdown,
        a.late_minutes,
        a.undertime_minutes,
        a.on_leave,
        lt.is_paid as leave_is_paid
      FROM attendance a
      LEFT JOIN leave_types lt ON a.leave_type_id = lt.leave_type_id
      WHERE a.employee_id = $1
        AND a.date BETWEEN $2 AND $3
        AND a.payroll_breakdown IS NOT NULL
      ORDER BY a.date
    `,
      [employeeId, startDate, endDate]
    );

    console.log(
      `📊 [DEBUG] Found ${result.rows.length} attendance records with payroll_breakdown data`
    );

    return result.rows;
  }

  /**
   * Calculate earnings using payroll_breakdown data from attendance records
   * Formula: hourly_rate * value * rate.total for all worked_hours and overtime fields
   */
  async calculateEarningsFromPayrollBreakdown(employee, attendanceRecords) {
    console.log(
      `💰 [CALC DEBUG] Calculating earnings from payroll_breakdown data for ${employee.first_name} ${employee.last_name}`
    );

    const hourlyRate = this.getHourlyRate(employee);

    let totalEarnings = 0;
    let totalOvertime = 0;

    // For "regular", "rest_day", "night_diff", "regular_holiday", "special_holiday"
    let totalRegularPay = { hours: 0, rate: 0, amount: 0 };
    let totalRestDayPay = { hours: 0, rate: 0, amount: 0 };
    let totalNightDiffPay = { hours: 0, rate: 0, amount: 0 };
    let totalRegularHolidayPay = { hours: 0, rate: 0, amount: 0 };
    let totalSpecialHolidayPay = { hours: 0, rate: 0, amount: 0 };

    // For overtime pay types
    let totalRegularPayOT = { hours: 0, rate: 0, amount: 0 };
    let totalRestDayPayOT = { hours: 0, rate: 0, amount: 0 };
    let totalNightDiffPayOT = { hours: 0, rate: 0, amount: 0 };
    let totalRegularHolidayPayOT = { hours: 0, rate: 0, amount: 0 };
    let totalSpecialHolidayPayOT = { hours: 0, rate: 0, amount: 0 };

    // For multiple premiums pay types - individual fields
    let totalRegularHolidayRestDayPay = { hours: 0, rate: 0, amount: 0 };
    let totalSpecialHolidayRestDayPay = { hours: 0, rate: 0, amount: 0 };
    let totalNightDiffRestDayPay = { hours: 0, rate: 0, amount: 0 };
    let totalNightDiffRegularHolidayPay = { hours: 0, rate: 0, amount: 0 };
    let totalNightDiffSpecialHolidayPay = { hours: 0, rate: 0, amount: 0 };
    let totalNightDiffRegularHolidayRestDayPay = {
      hours: 0,
      rate: 0,
      amount: 0,
    };
    let totalNightDiffSpecialHolidayRestDayPay = {
      hours: 0,
      rate: 0,
      amount: 0,
    };

    // For multiple premiums overtime pay types - individual fields
    let totalRegularHolidayRestDayPayOT = { hours: 0, rate: 0, amount: 0 };
    let totalSpecialHolidayRestDayPayOT = { hours: 0, rate: 0, amount: 0 };
    let totalNightDiffRestDayPayOT = { hours: 0, rate: 0, amount: 0 };
    let totalNightDiffRegularHolidayPayOT = { hours: 0, rate: 0, amount: 0 };
    let totalNightDiffSpecialHolidayPayOT = { hours: 0, rate: 0, amount: 0 };
    let totalNightDiffRegularHolidayRestDayPayOT = {
      hours: 0,
      rate: 0,
      amount: 0,
    };
    let totalNightDiffSpecialHolidayRestDayPayOT = {
      hours: 0,
      rate: 0,
      amount: 0,
    };

    let lateDeductions = 0;
    let undertimeDeductions = 0;
    let leavePay = 0;

    // Process each attendance record
    for (const record of attendanceRecords) {
      const breakdown = record.payroll_breakdown;

      if (!breakdown) continue;

      // Calculate earnings from worked_hours
      if (breakdown.worked_hours) {
        const workedHours = breakdown.worked_hours;

        // Sum all worked hours: hourly_rate * value * rate.total
        const workedHoursFields = [
          "regular",
          "rest_day",
          "night_diff",
          "regular_holiday",
          "special_holiday",
          "regular_holiday_rest_day",
          "special_holiday_rest_day",
          "night_diff_rest_day",
          "night_diff_regular_holiday",
          "night_diff_special_holiday",
          "night_diff_regular_holiday_rest_day",
          "night_diff_special_holiday_rest_day",
        ];

        for (const field of workedHoursFields) {
          if (workedHours[field] && workedHours[field].value > 0) {
            const earnings =
              hourlyRate *
              workedHours[field].value *
              workedHours[field].rate.total;
            totalEarnings += earnings;

            // Accumulate into specific pay type variables
            switch (field) {
              case "regular":
                totalRegularPay.hours += workedHours[field].value;
                totalRegularPay.rate = workedHours[field].rate.total;
                totalRegularPay.amount += earnings;
                break;
              case "rest_day":
                totalRestDayPay.hours += workedHours[field].value;
                totalRestDayPay.rate = workedHours[field].rate.total;
                totalRestDayPay.amount += earnings;
                break;
              case "night_diff":
                totalNightDiffPay.hours += workedHours[field].value;
                totalNightDiffPay.rate = workedHours[field].rate.total;
                totalNightDiffPay.amount += earnings;
                break;
              case "regular_holiday":
                totalRegularHolidayPay.hours += workedHours[field].value;
                totalRegularHolidayPay.rate = workedHours[field].rate.total;
                totalRegularHolidayPay.amount += earnings;
                break;
              case "special_holiday":
                totalSpecialHolidayPay.hours += workedHours[field].value;
                totalSpecialHolidayPay.rate = workedHours[field].rate.total;
                totalSpecialHolidayPay.amount += earnings;
                break;
              case "regular_holiday_rest_day":
                totalRegularHolidayRestDayPay.hours += workedHours[field].value;
                totalRegularHolidayRestDayPay.rate =
                  workedHours[field].rate.total;
                totalRegularHolidayRestDayPay.amount += earnings;
                break;
              case "special_holiday_rest_day":
                totalSpecialHolidayRestDayPay.hours += workedHours[field].value;
                totalSpecialHolidayRestDayPay.rate =
                  workedHours[field].rate.total;
                totalSpecialHolidayRestDayPay.amount += earnings;
                break;
              case "night_diff_rest_day":
                totalNightDiffRestDayPay.hours += workedHours[field].value;
                totalNightDiffRestDayPay.rate = workedHours[field].rate.total;
                totalNightDiffRestDayPay.amount += earnings;
                break;
              case "night_diff_regular_holiday":
                totalNightDiffRegularHolidayPay.hours +=
                  workedHours[field].value;
                totalNightDiffRegularHolidayPay.rate =
                  workedHours[field].rate.total;
                totalNightDiffRegularHolidayPay.amount += earnings;
                break;
              case "night_diff_special_holiday":
                totalNightDiffSpecialHolidayPay.hours +=
                  workedHours[field].value;
                totalNightDiffSpecialHolidayPay.rate =
                  workedHours[field].rate.total;
                totalNightDiffSpecialHolidayPay.amount += earnings;
                break;
              case "night_diff_regular_holiday_rest_day":
                totalNightDiffRegularHolidayRestDayPay.hours +=
                  workedHours[field].value;
                totalNightDiffRegularHolidayRestDayPay.rate =
                  workedHours[field].rate.total;
                totalNightDiffRegularHolidayRestDayPay.amount += earnings;
                break;
              case "night_diff_special_holiday_rest_day":
                totalNightDiffSpecialHolidayRestDayPay.hours +=
                  workedHours[field].value;
                totalNightDiffSpecialHolidayRestDayPay.rate =
                  workedHours[field].rate.total;
                totalNightDiffSpecialHolidayRestDayPay.amount += earnings;
                break;
            }

            console.log(
              `  ${field}: ${workedHours[field].value}h × ₱${hourlyRate} × ${
                workedHours[field].rate.total
              } = ₱${earnings.toFixed(2)}`
            );
          }
        }
      }

      let breakdownOTField;
      if (this.config.enable_auto_approve_overtime) {
        breakdownOTField = breakdown.overtime.computed;
      } else {
        breakdownOTField = breakdown.overtime.approved;
      }

      // Calculate earnings from overtime
      if (breakdown.overtime && breakdownOTField) {
        const overtime = breakdownOTField;

        // Sum all overtime hours: hourly_rate * value * rate.total
        const overtimeFields = [
          "regular_overtime",
          "rest_day_overtime",
          "night_diff_overtime",
          "regular_holiday_overtime",
          "special_holiday_overtime",
          "regular_holiday_rest_day_overtime",
          "special_holiday_rest_day_overtime",
          "night_diff_rest_day_overtime",
          "night_diff_regular_holiday_overtime",
          "night_diff_special_holiday_overtime",
          "night_diff_regular_holiday_rest_day_overtime",
          "night_diff_special_holiday_rest_day_overtime",
        ];

        for (const field of overtimeFields) {
          // Only count overtime if below auto-approve threshold
          if (
            this.config.enable_auto_approve_overtime &&
            this.config.auto_approve_overtime_hours_limit
          ) {
            if (
              overtime[field] &&
              overtime[field].value >
                this.config.auto_approve_overtime_hours_limit
            ) {
              // Cap overtime at the approved limit
              overtime[field].value =
                this.config.auto_approve_overtime_hours_limit;
            }
          }
          if (overtime[field] && overtime[field].value > 0) {
            const earnings =
              hourlyRate * overtime[field].value * overtime[field].rate.total;
            totalEarnings += earnings;
            totalOvertime += earnings;

            // Accumulate into specific overtime pay type variables
            switch (field) {
              case "regular_overtime":
                totalRegularPayOT.hours += overtime[field].value;
                totalRegularPayOT.rate = overtime[field].rate.total;
                totalRegularPayOT.amount += earnings;
                break;
              case "rest_day_overtime":
                totalRestDayPayOT.hours += overtime[field].value;
                totalRestDayPayOT.rate = overtime[field].rate.total;
                totalRestDayPayOT.amount += earnings;
                break;
              case "night_diff_overtime":
                totalNightDiffPayOT.hours += overtime[field].value;
                totalNightDiffPayOT.rate = overtime[field].rate.total;
                totalNightDiffPayOT.amount += earnings;
                break;
              case "regular_holiday_overtime":
                totalRegularHolidayPayOT.hours += overtime[field].value;
                totalRegularHolidayPayOT.rate = overtime[field].rate.total;
                totalRegularHolidayPayOT.amount += earnings;
                break;
              case "special_holiday_overtime":
                totalSpecialHolidayPayOT.hours += overtime[field].value;
                totalSpecialHolidayPayOT.rate = overtime[field].rate.total;
                totalSpecialHolidayPayOT.amount += earnings;
                break;
              case "regular_holiday_rest_day_overtime":
                totalRegularHolidayRestDayPayOT.hours += overtime[field].value;
                totalRegularHolidayRestDayPayOT.rate =
                  overtime[field].rate.total;
                totalRegularHolidayRestDayPayOT.amount += earnings;
                break;
              case "special_holiday_rest_day_overtime":
                totalSpecialHolidayRestDayPayOT.hours += overtime[field].value;
                totalSpecialHolidayRestDayPayOT.rate =
                  overtime[field].rate.total;
                totalSpecialHolidayRestDayPayOT.amount += earnings;
                break;
              case "night_diff_rest_day_overtime":
                totalNightDiffRestDayPayOT.hours += overtime[field].value;
                totalNightDiffRestDayPayOT.rate = overtime[field].rate.total;
                totalNightDiffRestDayPayOT.amount += earnings;
                break;
              case "night_diff_regular_holiday_overtime":
                totalNightDiffRegularHolidayPayOT.hours +=
                  overtime[field].value;
                totalNightDiffRegularHolidayPayOT.rate =
                  overtime[field].rate.total;
                totalNightDiffRegularHolidayPayOT.amount += earnings;
                break;
              case "night_diff_special_holiday_overtime":
                totalNightDiffSpecialHolidayPayOT.hours +=
                  overtime[field].value;
                totalNightDiffSpecialHolidayPayOT.rate =
                  overtime[field].rate.total;
                totalNightDiffSpecialHolidayPayOT.amount += earnings;
                break;
              case "night_diff_regular_holiday_rest_day_overtime":
                totalNightDiffRegularHolidayRestDayPayOT.hours +=
                  overtime[field].value;
                totalNightDiffRegularHolidayRestDayPayOT.rate =
                  overtime[field].rate.total;
                totalNightDiffRegularHolidayRestDayPayOT.amount += earnings;
                break;
              case "night_diff_special_holiday_rest_day_overtime":
                totalNightDiffSpecialHolidayRestDayPayOT.hours +=
                  overtime[field].value;
                totalNightDiffSpecialHolidayRestDayPayOT.rate =
                  overtime[field].rate.total;
                totalNightDiffSpecialHolidayRestDayPayOT.amount += earnings;
                break;
            }

            console.log(
              `  ${field}: ${overtime[field].value}h × ₱${hourlyRate} × ${
                overtime[field].rate.total
              } = ₱${earnings.toFixed(2)}`
            );
          }
        }
      }

      // Calculate late deductions
      if (record.late_minutes > 0 && this.config.enable_late_deductions) {
        const lateRatePerMinute =
          (hourlyRate / 60) * this.config.late_penalty_rate;
        lateDeductions += record.late_minutes * lateRatePerMinute;
      }

      // Calculate undertime deductions
      if (
        record.undertime_minutes > 0 &&
        this.config.enable_undertime_deductions
      ) {
        const undertimeRatePerMinute =
          (hourlyRate / 60) * this.config.undertime_deduction_rate;
        undertimeDeductions +=
          record.undertime_minutes * undertimeRatePerMinute;
      }

      // Calculate leave pay if applicable
      // TODO - leave_is_paid is not yet implemented in payroll_breakdown
      if (record.on_leave && record.leave_is_paid) {
        // For leave days, assume 8 hours at regular rate
        leavePay += hourlyRate * 8;
      }
    }

    console.log(
      `💰 [CALC DEBUG] Total earnings from payroll_breakdown: ₱${totalEarnings.toFixed(
        2
      )}`
    );
    console.log(
      `💸 [CALC DEBUG] Late deductions: ₱${lateDeductions.toFixed(2)}`
    );
    console.log(
      `💸 [CALC DEBUG] Undertime deductions: ₱${undertimeDeductions.toFixed(2)}`
    );
    console.log(`🏖️ [CALC DEBUG] Leave pay: ₱${leavePay.toFixed(2)}`);

    const grossPay =
      totalEarnings + leavePay - lateDeductions - undertimeDeductions;

    const result = {
      basePay: totalEarnings, // All earnings are now calculated precisely
      overtimePay: totalOvertime, // Overtime is already included in totalEarnings
      holidayPay: 0, // Holiday pay is already included in totalEarnings
      nightDifferential: 0, // Night diff is already included in totalEarnings
      leavePay: leavePay,
      lateDeductions: lateDeductions,
      undertimeDeductions: undertimeDeductions,
      otherEarnings: 0,
      grossPay: grossPay,
      // Comprehensive breakdown of all pay types
      breakdown: {
        regularPay: totalRegularPay,
        restDayPay: totalRestDayPay,
        nightDiffPay: totalNightDiffPay,
        regularHolidayPay: totalRegularHolidayPay,
        specialHolidayPay: totalSpecialHolidayPay,
        // Individual multiple premium fields
        regularHolidayRestDayPay: totalRegularHolidayRestDayPay,
        specialHolidayRestDayPay: totalSpecialHolidayRestDayPay,
        nightDiffRestDayPay: totalNightDiffRestDayPay,
        nightDiffRegularHolidayPay: totalNightDiffRegularHolidayPay,
        nightDiffSpecialHolidayPay: totalNightDiffSpecialHolidayPay,
        nightDiffRegularHolidayRestDayPay:
          totalNightDiffRegularHolidayRestDayPay,
        nightDiffSpecialHolidayRestDayPay:
          totalNightDiffSpecialHolidayRestDayPay,
        regularOvertimePay: totalRegularPayOT,
        restDayOvertimePay: totalRestDayPayOT,
        nightDiffOvertimePay: totalNightDiffPayOT,
        regularHolidayOvertimePay: totalRegularHolidayPayOT,
        specialHolidayOvertimePay: totalSpecialHolidayPayOT,
        // Individual multiple premium overtime fields
        regularHolidayRestDayOvertimePay: totalRegularHolidayRestDayPayOT,
        specialHolidayRestDayOvertimePay: totalSpecialHolidayRestDayPayOT,
        nightDiffRestDayOvertimePay: totalNightDiffRestDayPayOT,
        nightDiffRegularHolidayOvertimePay: totalNightDiffRegularHolidayPayOT,
        nightDiffSpecialHolidayOvertimePay: totalNightDiffSpecialHolidayPayOT,
        nightDiffRegularHolidayRestDayOvertimePay:
          totalNightDiffRegularHolidayRestDayPayOT,
        nightDiffSpecialHolidayRestDayOvertimePay:
          totalNightDiffSpecialHolidayRestDayPayOT,
      },
    };

    console.log(
      `✅ [CALC DEBUG] calculateEarningsFromPayrollBreakdown result:`,
      result
    );
    return result;
  }

  /**
   * Validate contract period
   */
  validateContractPeriod(employee, startDate, endDate) {
    const contractStart = dayjs(employee.contract_start);
    const contractEnd = employee.contract_end
      ? dayjs(employee.contract_end)
      : null;
    const periodStart = dayjs(startDate);
    const periodEnd = dayjs(endDate);

    if (contractStart.isAfter(periodEnd)) {
      throw new Error("Employee contract starts after the payroll period");
    }

    if (contractEnd && contractEnd.isBefore(periodStart)) {
      throw new Error("Employee contract ended before the payroll period");
    }
  }

  /**
   * Round amount based on configuration
   */
  roundAmount(amount) {
    const factor = 1 / this.config.roundingIncrement;

    switch (this.config.payrollRounding) {
      case "up":
        return Math.ceil(amount * factor) / factor;
      case "down":
        return Math.floor(amount * factor) / factor;
      case "nearest":
      default:
        return Math.round(amount * factor) / factor;
    }
  }

  /**
   * Calculate working days in period (excluding weekends and holidays)
   */
  async calculateWorkingDays(startDate, endDate) {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const totalDays = end.diff(start, "day") + 1;

    let workingDays = 0;
    for (let i = 0; i < totalDays; i++) {
      const day = start.add(i, "day");

      // Skip weekends
      if (this.config.weekendDays.includes(day.day())) {
        continue;
      }

      // Check if it's a holiday (you can enhance this with a holidays table)
      const isHoliday = await this.isHoliday(day.format("YYYY-MM-DD"));
      if (!isHoliday) {
        workingDays++;
      }
    }

    return workingDays || 1; // Avoid division by zero
  }

  /**
   * Check if a date is a holiday
   */
  async isHoliday(date) {
    // This is a placeholder - implement with your holidays table
    // For now, just return false
    return false;
  }

  /**
   * Batch calculate payroll for multiple employees
   */
  async calculateBatchPayroll(employeeIds, startDate, endDate) {
    console.log(
      `📊 Advanced batch calculating payroll for ${employeeIds.length} employees`
    );

    const results = [];

    // Process employees in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < employeeIds.length; i += batchSize) {
      const batch = employeeIds.slice(i, i + batchSize);

      const batchPromises = batch.map((employeeId) =>
        this.calculateEmployeePayroll(employeeId, startDate, endDate)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    console.log(
      `⚡ Advanced batch calculation completed for ${results.length} employees`
    );
    return results;
  }

  // Static configuration management methods for 2025 database schema
  static async getAllConfigs() {
    try {
      const result = await pool.query(`
        SELECT 
          config_type,
          config_key,
          config_value,
          description,
          effective_date,
          expiry_date
        FROM payroll_configuration 
        WHERE is_active = true 
          AND effective_date <= CURRENT_DATE 
          AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
        ORDER BY config_type, config_key
      `);

      return result.rows;
    } catch (error) {
      console.error("Error getting all configs:", error);
      throw error;
    }
  }

  static async getConfig(configType, configKey) {
    try {
      const result = await pool.query(
        `
        SELECT config_value 
        FROM payroll_configuration 
        WHERE config_type = $1 
          AND config_key = $2 
          AND is_active = true
          AND effective_date <= CURRENT_DATE 
          AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
        ORDER BY effective_date DESC
        LIMIT 1
      `,
        [configType, configKey]
      );

      if (result.rows.length === 0) {
        throw new Error(`Configuration '${configType}.${configKey}' not found`);
      }

      return parseFloat(result.rows[0].config_value);
    } catch (error) {
      console.error(`Error getting config ${configType}.${configKey}:`, error);
      throw error;
    }
  }

  static async updateConfig(
    configType,
    configKey,
    value,
    effectiveDate = null
  ) {
    try {
      // Set expiry date for current active config
      await pool.query(
        `
        UPDATE payroll_configuration 
        SET expiry_date = COALESCE($3, CURRENT_DATE - INTERVAL '1 day'),
            updated_at = NOW()
        WHERE config_type = $1 
          AND config_key = $2 
          AND is_active = true
          AND expiry_date IS NULL
      `,
        [configType, configKey, effectiveDate]
      );

      // Insert new config
      const result = await pool.query(
        `
        INSERT INTO payroll_configuration (
          config_type, config_key, config_value, effective_date, 
          description, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), 
                  'Updated via API', true, NOW(), NOW())
        RETURNING *
      `,
        [configType, configKey, value.toString(), effectiveDate]
      );

      return result.rows[0];
    } catch (error) {
      console.error(`Error updating config ${configType}.${configKey}:`, error);
      throw error;
    }
  }

  static async getConfigsByType(configType) {
    try {
      const result = await pool.query(
        `
        SELECT 
          config_key,
          config_value,
          description,
          effective_date
        FROM payroll_configuration 
        WHERE config_type = $1 
          AND is_active = true
          AND effective_date <= CURRENT_DATE 
          AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
        ORDER BY config_key
      `,
        [configType]
      );

      const configs = {};
      result.rows.forEach((row) => {
        configs[row.config_key] = parseFloat(row.config_value);
      });

      return configs;
    } catch (error) {
      console.error(`Error getting configs for type ${configType}:`, error);
      throw error;
    }
  }

  // Method to initialize/sync hardcoded rates with database configuration
  static async syncConfigurationWithDatabase() {
    try {
      console.log("🔄 Syncing 2025 Philippine payroll rates with database...");

      // This method can be called to ensure database configuration is up to date
      // The rates are already defined in the migration script
      const configCount = await pool.query(`
        SELECT COUNT(*) as count 
        FROM payroll_configuration 
        WHERE effective_date = '2025-01-01'
      `);

      if (parseInt(configCount.rows[0].count) > 0) {
        console.log(
          "✅ 2025 Philippine payroll configuration already exists in database"
        );
        return true;
      }

      console.log(
        "⚠️  2025 configuration not found. Please run the database migration script."
      );
      return false;
    } catch (error) {
      console.error("Error syncing configuration:", error);
      throw error;
    }
  }

  /**
   * Method to get current effective rates summary for validation
   */
  static async getCurrentRatesSummary() {
    try {
      const summary = {};

      // Get all config types
      const configTypes = [
        "sss",
        "philhealth",
        "pagibig",
        "income_tax",
        "thirteenth_month",
      ];

      for (const configType of configTypes) {
        try {
          const configs = await this.getConfigsByType(configType);
          summary[configType] = configs;
        } catch (error) {
          console.warn(`Failed to get ${configType} configs:`, error);
          summary[configType] = { error: error.message };
        }
      }

      return summary;
    } catch (error) {
      console.error("Error getting rates summary:", error);
      throw error;
    }
  }

  /**
   * Method to validate that calculation results include database source info
   */
  static async validateCalculationSource(employeeId, grossPay) {
    try {
      const calculator = new AdvancedPayrollCalculator();
      const monthlyGrossPay = calculator.convertToMonthlyPay(grossPay);

      // Test each calculation method and check source
      const sssResult = await calculator.calculateSSSContribution(
        monthlyGrossPay
      );
      const philhealthResult = await calculator.calculatePhilHealthContribution(
        monthlyGrossPay
      );
      const pagibigResult = await calculator.calculatePagIBIGContribution(
        monthlyGrossPay
      );
      const taxResult = await calculator.calculateIncomeTax(
        monthlyGrossPay -
          sssResult.employee -
          philhealthResult.employee -
          pagibigResult.employee
      );

      return {
        sss: { amount: sssResult.employee, source: sssResult.source },
        philhealth: {
          amount: philhealthResult.employee,
          source: philhealthResult.source,
        },
        pagibig: {
          amount: pagibigResult.employee,
          source: pagibigResult.source,
        },
        income_tax: { amount: taxResult, source: "calculated" },
        database_available:
          sssResult.source === "database_verified" ||
          sssResult.source === "database",
      };
    } catch (error) {
      console.error("Error validating calculation source:", error);
      throw error;
    }
  }

  // Get a comprehensive summary of all current rates from database
  static async getCurrentRatesSummary() {
    try {
      const query = `
        SELECT 
          config_type,
          config_key,
          config_value,
          effective_date,
          updated_at
        FROM payroll_configuration 
        WHERE effective_date <= CURRENT_DATE
        ORDER BY config_type, config_key
      `;

      const result = await pool.query(query);

      // Group by config_type for easier consumption
      const summary = {
        last_updated: new Date().toISOString(),
        total_configurations: result.rows.length,
        configurations_by_type: {},
      };

      result.rows.forEach((config) => {
        if (!summary.configurations_by_type[config.config_type]) {
          summary.configurations_by_type[config.config_type] = {};
        }
        summary.configurations_by_type[config.config_type][config.config_key] =
          {
            value: config.config_value,
            effective_date: config.effective_date,
            updated_at: config.updated_at,
          };
      });

      return summary;
    } catch (error) {
      console.error("Error getting rates summary:", error);
      throw error;
    }
  }

  // Check if database configuration is properly synchronized
  static async syncConfigurationWithDatabase() {
    try {
      const query = `
        SELECT COUNT(*) as config_count 
        FROM payroll_configuration 
        WHERE config_type IN ('SSS', 'PHILHEALTH', 'PAGIBIG', 'INCOME_TAX')
      `;

      const result = await pool.query(query);
      const configCount = parseInt(result.rows[0].config_count);

      // Should have at least basic configurations for each type
      const expectedMinimumConfigs = 20; // Conservative estimate for 2025 rates

      if (configCount >= expectedMinimumConfigs) {
        console.log(
          `✅ Configuration synchronized: ${configCount} configurations found`
        );
        return true;
      } else {
        console.log(
          `⚠️ Configuration may need sync: only ${configCount} configurations found (expected >${expectedMinimumConfigs})`
        );
        return false;
      }
    } catch (error) {
      console.error("Error checking configuration sync:", error);
      throw error;
    }
  }
}

export default AdvancedPayrollCalculator;
