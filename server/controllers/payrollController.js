import { pool } from "../config/db.js";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import { AdvancedPayrollCalculator } from "../services/AdvancedPayrollCalculator.js";
import {
  normalizeToPhilippineDate,
  createDateRangeQuery,
  debugDateFormats,
} from "../utils/dateUtils.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// Get all payroll headers (payroll periods)
export const getAllPayrollHeaders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ph.*,
        COALESCE(COUNT(p.payslip_id), 0) as total_employees,
        COALESCE(SUM(p.gross_pay), 0) as total_gross_pay,
        COALESCE(SUM(p.net_pay), 0) as total_net_pay,
        COALESCE(SUM(p.deductions), 0) as total_deductions
      FROM payroll_header ph
      LEFT JOIN payslip p ON ph.payroll_header_id = p.payroll_header_id
      GROUP BY ph.payroll_header_id
      ORDER BY ph.run_date DESC, ph.start_date DESC
    `);

    // Ensure numeric values are properly formatted
    const formattedData = result.rows.map((row) => ({
      ...row,
      total_employees: parseInt(row.total_employees) || 0,
      total_gross_pay: parseFloat(row.total_gross_pay) || 0,
      total_net_pay: parseFloat(row.total_net_pay) || 0,
      total_deductions: parseFloat(row.total_deductions) || 0,
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get specific payroll header with payslips
export const getPayrollHeaderById = async (req, res) => {
  try {
    const { payroll_header_id } = req.params;

    // Get payroll header
    const headerResult = await pool.query(
      `
      SELECT * FROM payroll_header WHERE payroll_header_id = $1
    `,
      [payroll_header_id]
    );

    if (headerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payroll header not found",
      });
    }

    // Get payroll header dates first for attendance query
    const headerDates = await pool.query(
      `SELECT start_date, end_date FROM payroll_header WHERE payroll_header_id = $1`,
      [payroll_header_id]
    );

    if (headerDates.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payroll header not found",
      });
    }

    const { start_date, end_date } = headerDates.rows[0];

    // Get all employee IDs for this payroll
    const employeeIds = await pool.query(
      `SELECT DISTINCT employee_id FROM payslip WHERE payroll_header_id = $1`,
      [payroll_header_id]
    );

    const employee_ids = employeeIds.rows.map((row) => row.employee_id);

    // Get attendance data using the optimized query from calculateBatchPayroll
    const attendanceData = await pool.query(
      `
      SELECT 
        a.employee_id,
        COUNT(CASE WHEN a.is_present = true THEN 1 END) as days_worked,
        COUNT(CASE WHEN a.on_leave = true AND lt.is_paid = true THEN 1 END) as paid_leave_days,
        COUNT(CASE WHEN a.on_leave = true AND (lt.is_paid = false OR lt.is_paid IS NULL) THEN 1 END) as unpaid_leave_days,
        SUM(COALESCE(a.total_hours, 0) - COALESCE(a.overtime_hours, 0)) as total_regular_hours,
        SUM(COALESCE(a.overtime_hours, 0)) as total_overtime_hours,
        COUNT(CASE WHEN a.is_late = true THEN 1 END) as late_days,
        COUNT(CASE WHEN a.is_regular_holiday = true THEN 1 END) as regular_holiday_days,
        COUNT(CASE WHEN a.is_special_holiday = true THEN 1 END) as special_holiday_days
      FROM attendance a
      LEFT JOIN leave_types lt ON a.leave_type_id = lt.leave_type_id
      WHERE a.employee_id = ANY($1) 
        AND a.date BETWEEN $2 AND $3
      GROUP BY a.employee_id
    `,
      [employee_ids, start_date, end_date]
    );

    // Create attendance lookup map
    const attendanceMap = new Map();
    attendanceData.rows.forEach((att) => {
      attendanceMap.set(att.employee_id, att);
    });

    // Get all payslips with employee details (without complex attendance subquery)
    const payslipsResult = await pool.query(
      `
      SELECT 
        p.*,
        e.first_name,
        e.last_name,
        e.employee_id as emp_id,
        pos.title as position_title,
        dept.name as department_name,
        c.rate,
        c.rate_type,
        et.name as employment_type
      FROM payslip p
      JOIN employees e ON p.employee_id = e.employee_id
      JOIN contracts c ON e.contract_id = c.contract_id
      JOIN positions pos ON c.position_id = pos.position_id
      JOIN departments dept ON pos.department_id = dept.department_id
      JOIN employment_types et ON c.employment_type_id = et.employment_type_id
      WHERE p.payroll_header_id = $1
      ORDER BY e.last_name, e.first_name
    `,
      [payroll_header_id]
    );

    // Merge attendance data with payslip data
    const enhancedPayslips = payslipsResult.rows.map((payslip) => {
      const attendance = attendanceMap.get(payslip.employee_id) || {
        days_worked: 0,
        paid_leave_days: 0,
        unpaid_leave_days: 0,
        total_regular_hours: 0,
        total_overtime_hours: 0,
        late_days: 0,
        regular_holiday_days: 0,
        special_holiday_days: 0,
      };

      return {
        ...payslip,
        // Attendance data
        days_worked: parseInt(attendance.days_worked) || 0,
        paid_leave_days: parseInt(attendance.paid_leave_days) || 0,
        total_hours: parseFloat(attendance.total_regular_hours) || 0,
        overtime_hours: parseFloat(attendance.total_overtime_hours) || 0,
        late_days: parseInt(attendance.late_days) || 0,

        // Basic salary calculation
        basic_salary:
          payslip.rate_type === "hourly"
            ? (parseFloat(attendance.total_regular_hours) || 0) * payslip.rate
            : payslip.rate_type === "daily"
            ? (parseInt(attendance.days_worked) || 0) * payslip.rate
            : payslip.rate_type === "monthly"
            ? payslip.rate
            : 0,

        // Allowances (placeholder)
        allowances: 0,

        // Deduction fields set to 0 for now
        sss_contribution: 0,
        philhealth_contribution: 0,
        pagibig_contribution: 0,
        income_tax: 0,
        other_deductions: 0,
        total_deductions: payslip.deductions,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        header: headerDates.rows[0],
        payslips: enhancedPayslips,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get payslips for a specific payroll header
export const getPayslipsByHeaderId = async (req, res) => {
  try {
    const { payroll_header_id } = req.params;

    // Get payroll header dates first for attendance query
    const headerDates = await pool.query(
      `SELECT start_date, end_date FROM payroll_header WHERE payroll_header_id = $1`,
      [payroll_header_id]
    );

    if (headerDates.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payroll header not found",
      });
    }

    const { start_date, end_date } = headerDates.rows[0];

    // Get all employee IDs for this payroll
    const employeeIds = await pool.query(
      `SELECT DISTINCT employee_id FROM payslip WHERE payroll_header_id = $1`,
      [payroll_header_id]
    );

    const employee_ids = employeeIds.rows.map((row) => row.employee_id);

    // Get attendance data using the optimized query from calculateBatchPayroll
    const attendanceData = await pool.query(
      `
      SELECT 
        a.employee_id,
        COUNT(CASE WHEN a.is_present = true THEN 1 END) as days_worked,
        COUNT(CASE WHEN a.on_leave = true AND lt.is_paid = true THEN 1 END) as paid_leave_days,
        COUNT(CASE WHEN a.on_leave = true AND (lt.is_paid = false OR lt.is_paid IS NULL) THEN 1 END) as unpaid_leave_days,
        SUM(COALESCE(a.total_hours, 0) - COALESCE(a.overtime_hours, 0)) as total_regular_hours,
        SUM(COALESCE(a.overtime_hours, 0)) as total_overtime_hours,
        COUNT(CASE WHEN a.is_late = true THEN 1 END) as late_days,
        COUNT(CASE WHEN a.is_regular_holiday = true THEN 1 END) as regular_holiday_days,
        COUNT(CASE WHEN a.is_special_holiday = true THEN 1 END) as special_holiday_days
      FROM attendance a
      LEFT JOIN leave_types lt ON a.leave_type_id = lt.leave_type_id
      WHERE a.employee_id = ANY($1) 
        AND a.date BETWEEN $2 AND $3
      GROUP BY a.employee_id
    `,
      [employee_ids, start_date, end_date]
    );

    // Create attendance lookup map
    const attendanceMap = new Map();
    attendanceData.rows.forEach((att) => {
      attendanceMap.set(att.employee_id, att);
    });

    // Get all payslips with employee details (without complex attendance subquery)
    const payslipsResult = await pool.query(
      `
      SELECT 
        p.*,
        ph.start_date,
        ph.end_date,
        e.first_name,
        e.last_name,
        e.employee_id as emp_id,
        pos.title as position_title,
        dept.name as department_name,
        c.rate,
        c.rate_type,
        et.name as employment_type
      FROM payslip p
      JOIN payroll_header ph ON p.payroll_header_id = ph.payroll_header_id
      JOIN employees e ON p.employee_id = e.employee_id
      JOIN contracts c ON e.contract_id = c.contract_id
      JOIN positions pos ON c.position_id = pos.position_id
      JOIN departments dept ON pos.department_id = dept.department_id
      JOIN employment_types et ON c.employment_type_id = et.employment_type_id
      WHERE p.payroll_header_id = $1
      ORDER BY e.last_name, e.first_name
    `,
      [payroll_header_id]
    );

    // Merge attendance data with payslip data
    const enhancedPayslips = payslipsResult.rows.map((payslip) => {
      const attendance = attendanceMap.get(payslip.employee_id) || {
        days_worked: 0,
        paid_leave_days: 0,
        unpaid_leave_days: 0,
        total_regular_hours: 0,
        total_overtime_hours: 0,
        late_days: 0,
        regular_holiday_days: 0,
        special_holiday_days: 0,
      };
      const calculator = new AdvancedPayrollCalculator(pool);
      return {
        ...payslip,
        // Attendance data
        days_worked: parseInt(attendance.days_worked) || 0,
        paid_leave_days: parseInt(attendance.paid_leave_days) || 0,
        total_hours: parseFloat(attendance.total_regular_hours) || 0,
        overtime_hours: parseFloat(attendance.total_overtime_hours) || 0,
        late_days: parseInt(attendance.late_days) || 0,

        // Basic salary calculation
        basic_salary:
          payslip.rate_type === "hourly"
            ? (parseFloat(attendance.total_regular_hours) || 0) * payslip.rate
            : payslip.rate_type === "daily"
            ? (parseInt(attendance.days_worked) || 0) * payslip.rate
            : payslip.rate_type === "monthly"
            ? payslip.rate
            : 0,

        // Allowances (placeholder)
        allowances: 0,

        hourly_rate:
          payslip.rate_type === "hourly"
            ? payslip.rate
            : payslip.rate_type === "daily"
            ? payslip.rate / calculator.config.standardWorkingHours
            : payslip.rate_type === "weekly"
            ? payslip.rate /
              calculator.config.standardWorkingDaysInWeek /
              calculator.config.standardWorkingHours
            : payslip.rate_type === "monthly"
            ? payslip.rate /
              calculator.config.standardWorkingDays /
              calculator.config.standardWorkingHours
            : 0,
        // Deduction fields set to 0 for now
        sss_contribution: 0,
        philhealth_contribution: 0,
        pagibig_contribution: 0,
        income_tax: 0,
        other_deductions: 0,
        total_deductions: payslip.deductions,
      };
    });

    res.status(200).json({
      success: true,
      data: enhancedPayslips,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get employee's payslip history
export const getEmployeePayslips = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { year } = req.query;

    let dateFilter = "";
    let params = [employee_id];

    if (year) {
      dateFilter = "AND EXTRACT(YEAR FROM ph.start_date) = $2";
      params.push(year);
    }

    const result = await pool.query(
      `
      SELECT 
        p.*,
        ph.run_date,
        ph.start_date,
        ph.end_date,
        e.first_name,
        e.last_name
      FROM payslip p
      JOIN payroll_header ph ON p.payroll_header_id = ph.payroll_header_id
      JOIN employees e ON p.employee_id = e.employee_id
      WHERE p.employee_id = $1 ${dateFilter}
      ORDER BY ph.start_date DESC
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

// Calculate payroll for employees (without saving)
export const calculatePayroll = async (req, res) => {
  try {
    const { start_date, end_date, employee_ids } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const calculations = [];

    for (const employee_id of employee_ids || []) {
      try {
        const payrollData = await calculateEmployeePayroll(
          employee_id,
          start_date,
          end_date
        );
        calculations.push(payrollData);
      } catch (empError) {
        console.error(
          `Error calculating payroll for ${employee_id}:`,
          empError
        );
        calculations.push({
          employee_id,
          error: empError.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        period: { start_date, end_date },
        calculations,
        summary: {
          total_employees: calculations.length,
          total_gross_pay: calculations.reduce(
            (sum, calc) => sum + (calc.gross_pay || 0),
            0
          ),
          total_net_pay: calculations.reduce(
            (sum, calc) => sum + (calc.net_pay || 0),
            0
          ),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Generate and save payroll (legacy version - kept for backward compatibility)
export const generatePayrollLegacy = async (req, res) => {
  try {
    const { start_date, end_date, employee_ids, run_by } = req.body;

    // Enhanced input validation with specific error messages
    const validationErrors = [];

    if (!start_date) {
      validationErrors.push("Start date is required");
    } else if (new Date(start_date) < new Date("2020-01-01")) {
      validationErrors.push("Start date cannot be before 2020");
    }

    if (!end_date) {
      validationErrors.push("End date is required");
    } else if (new Date(end_date) > new Date()) {
      validationErrors.push("End date cannot be in the future");
    }

    if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
      validationErrors.push("End date must be after start date");
    }

    if (
      !employee_ids ||
      !Array.isArray(employee_ids) ||
      employee_ids.length === 0
    ) {
      validationErrors.push("At least one employee must be selected");
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
        error_type: "validation_error",
      });
    }

    // console.log(
    //   `🏃 Generating payroll for ${employee_ids.length} employees from ${start_date} to ${end_date}...`
    // );

    // Check if payroll already exists for the specific employees in this period
    const existingPayslips = await pool.query(
      `
      SELECT DISTINCT p.employee_id, ph.payroll_header_id, e.first_name, e.last_name
      FROM payroll_header ph
      JOIN payslip p ON ph.payroll_header_id = p.payroll_header_id
      JOIN employees e ON p.employee_id = e.employee_id
      WHERE ph.start_date = $1 AND ph.end_date = $2 
        AND p.employee_id = ANY($3)
    `,
      [start_date, end_date, employee_ids]
    );

    if (existingPayslips.rows.length > 0) {
      const existingEmployees = existingPayslips.rows.map(
        (row) => `${row.first_name} ${row.last_name} (${row.employee_id})`
      );
      return res.status(409).json({
        success: false,
        message: `Payroll already exists for ${existingPayslips.rows.length} employee(s) in this period`,
        error_type: "duplicate_payroll",
        details: {
          period: `${start_date} to ${end_date}`,
          existing_employees: existingEmployees,
          existing_payroll_id: existingPayslips.rows[0].payroll_header_id,
          affected_count: existingPayslips.rows.length,
        },
      });
    }

    try {
      // Find existing payroll header for this period or create a new one
      let payrollHeaderId;
      const existingHeader = await pool.query(
        `
        SELECT payroll_header_id FROM payroll_header 
        WHERE start_date = $1 AND end_date = $2
        ORDER BY created_at DESC
        LIMIT 1
      `,
        [start_date, end_date]
      );

      if (existingHeader.rows.length > 0) {
        payrollHeaderId = existingHeader.rows[0].payroll_header_id;
        // console.log(`📋 Using existing payroll header: ${payrollHeaderId}`);
      } else {
        // Create new payroll header
        const payrollHeader = await pool.query(
          `
          INSERT INTO payroll_header (run_date, start_date, end_date, run_by)
          VALUES (CURRENT_DATE, $1, $2, $3) 
          RETURNING payroll_header_id
        `,
          [start_date, end_date, run_by || null]
        );
        payrollHeaderId = payrollHeader.rows[0].payroll_header_id;
        // console.log(`📋 Created new payroll header: ${payrollHeaderId}`);
      }

      // Validate employee existence before processing
      const employeeCheck = await pool.query(
        `SELECT employee_id, first_name, last_name, status 
         FROM employees 
         WHERE employee_id = ANY($1)`,
        [employee_ids]
      );

      const validEmployees = employeeCheck.rows.filter(
        (emp) => emp.status === "active"
      );
      const invalidEmployees = employee_ids.filter(
        (id) => !employeeCheck.rows.find((emp) => emp.employee_id === id)
      );
      const inactiveEmployees = employeeCheck.rows.filter(
        (emp) => emp.status !== "active"
      );

      if (invalidEmployees.length > 0) {
        throw new Error(`Invalid employee IDs: ${invalidEmployees.join(", ")}`);
      }

      if (inactiveEmployees.length > 0 && validEmployees.length === 0) {
        throw new Error(
          `All selected employees are inactive: ${inactiveEmployees
            .map((e) => `${e.first_name} ${e.last_name}`)
            .join(", ")}`
        );
      }

      // console.log(`👥 Processing ${validEmployees.length} active employees...`);
      // if (inactiveEmployees.length > 0) {
      //   console.log(
      //     `⚠️ Skipping ${inactiveEmployees.length} inactive employees`
      //   );
      // }

      // Batch fetch all employee data and attendance data
      const batchResults = await calculateBatchPayroll(
        validEmployees.map((emp) => emp.employee_id),
        start_date,
        end_date
      );

      const successfulPayslips = [];
      const failedPayslips = [];
      const warnings = [];

      // Add warning for inactive employees
      if (inactiveEmployees.length > 0) {
        warnings.push({
          type: "inactive_employees",
          message: `${inactiveEmployees.length} inactive employees were skipped`,
          employees: inactiveEmployees.map(
            (emp) => `${emp.first_name} ${emp.last_name} (${emp.employee_id})`
          ),
        });
      }

      // Process results and insert payslips
      for (const result of batchResults) {
        if (!result.error) {
          try {
            // Insert payslip data matching the actual schema
            await pool.query(
              `
              INSERT INTO payslip (
                employee_id, payroll_header_id, gross_pay, overtime_pay, 
                night_diff_pay, leave_pay, bonuses, deductions, 
                sss_contribution, philhealth_contribution, pagibig_contribution, 
                income_tax, other_deductions, net_pay
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `,
              [
                result.employee_id,
                payrollHeaderId,
                result.gross_pay || 0,
                result.overtime_pay || 0,
                result.night_diff_pay || 0,
                result.leave_pay || 0,
                result.bonuses || 0,
                result.deductions || 0,
                result.sss_contribution || 0,
                result.philhealth_contribution || 0,
                result.pagibig_contribution || 0,
                result.income_tax || 0,
                result.other_deductions || 0,
                result.net_pay || 0,
              ]
            );

            successfulPayslips.push({
              employee_id: result.employee_id,
              employee_name: result.employee_name,
              gross_pay: result.gross_pay || 0,
              net_pay: result.net_pay || 0,
              days_worked: result.days_worked || 0,
            });
          } catch (insertError) {
            console.error(
              `💥 Insert error for ${result.employee_id}:`,
              insertError
            );
            failedPayslips.push({
              employee_id: result.employee_id,
              employee_name: result.employee_name || result.employee_id,
              error: `Database insertion failed: ${insertError.message}`,
              error_type: "database_error",
            });
          }
        } else {
          failedPayslips.push({
            employee_id: result.employee_id,
            employee_name: result.employee_name || result.employee_id,
            error: result.error,
            error_type: "calculation_error",
          });
        }
      }

      // console.log(
      //   `✅ Payroll completed: ${successfulPayslips.length} success, ${failedPayslips.length} failed`
      // );

      const responseStatus = failedPayslips.length === 0 ? 201 : 207; // 207 = Multi-Status for partial success

      res.status(responseStatus).json({
        success: successfulPayslips.length > 0,
        message:
          failedPayslips.length === 0
            ? `Payroll generated successfully for ${successfulPayslips.length} employees`
            : `Payroll partially completed: ${successfulPayslips.length} successful, ${failedPayslips.length} failed`,
        data: {
          payroll_header_id: payrollHeaderId,
          period: { start_date, end_date },
          successful_payslips: successfulPayslips,
          failed_payslips: failedPayslips,
          warnings: warnings,
          summary: {
            total_requested: employee_ids.length,
            total_processed: successfulPayslips.length,
            total_failed: failedPayslips.length,
            total_skipped: inactiveEmployees.length,
            total_gross_pay: successfulPayslips.reduce(
              (sum, p) => sum + (p.gross_pay || 0),
              0
            ),
            total_net_pay: successfulPayslips.reduce(
              (sum, p) => sum + (p.net_pay || 0),
              0
            ),
          },
        },
        error_type: failedPayslips.length > 0 ? "partial_failure" : null,
      });
    } catch (error) {
      // Enhanced error handling with classification
      console.error("💥 Payroll generation error:", error);

      let errorMessage =
        "An unexpected error occurred during payroll generation";
      let errorType = "internal_error";
      let statusCode = 500;

      if (error.message.includes("Invalid employee IDs")) {
        errorMessage = error.message;
        errorType = "invalid_employees";
        statusCode = 400;
      } else if (error.message.includes("inactive")) {
        errorMessage = error.message;
        errorType = "inactive_employees";
        statusCode = 400;
      } else if (error.code === "23505") {
        // PostgreSQL unique violation
        errorMessage =
          "Duplicate payroll detected. This payroll may have already been generated.";
        errorType = "duplicate_error";
        statusCode = 409;
      } else if (error.code === "23503") {
        // PostgreSQL foreign key violation
        errorMessage =
          "Data integrity error. Please check employee and contract data.";
        errorType = "data_integrity_error";
        statusCode = 400;
      } else if (
        error.message.includes("connection") ||
        error.code === "ECONNREFUSED"
      ) {
        errorMessage = "Database connection error. Please try again later.";
        errorType = "database_connection_error";
        statusCode = 503;
      }

      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error_type: errorType,
        details:
          process.env.NODE_ENV === "development"
            ? {
                original_error: error.message,
                stack: error.stack,
              }
            : undefined,
      });
    }
  } catch (error) {
    console.error("💥 Outer payroll generation error:", error);
    res.status(500).json({
      success: false,
      message: "Critical system error during payroll generation",
      error_type: "system_error",
    });
  }
};

// Optimized batch payroll calculation
const calculateBatchPayroll = async (employee_ids, start_date, end_date) => {
  try {
    // Debug date inputs
    // debugDateFormats(start_date, "Payroll Start Date");
    // debugDateFormats(end_date, "Payroll End Date");

    // Create normalized date range for consistent querying
    const dateRangeQuery = createDateRangeQuery(start_date, end_date, "a.date");

    console.log("📅 [PAYROLL] Normalized date range:", {
      start: dateRangeQuery.startDate,
      end: dateRangeQuery.endDate,
      condition: dateRangeQuery.condition,
    });

    // Batch fetch all employee data
    const employeeData = await pool.query(
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
      WHERE e.employee_id = ANY($1) AND e.status = 'active'
    `,
      [employee_ids]
    );

    console.log(
      `✅ [PAYROLL] Found ${employeeData.rows.length} active employees`
    );

    // Batch fetch all attendance data with proper date handling
    const attendanceData = await pool.query(
      `
      SELECT 
        a.employee_id,
        COUNT(CASE WHEN a.is_present = true THEN 1 END) as days_worked,
        COUNT(CASE WHEN a.on_leave = true AND lt.is_paid = true THEN 1 END) as paid_leave_days,
        COUNT(CASE WHEN a.on_leave = true AND (lt.is_paid = false OR lt.is_paid IS NULL) THEN 1 END) as unpaid_leave_days,
        SUM(COALESCE(a.total_hours, 0) - COALESCE(a.overtime_hours, 0)) as total_regular_hours,
        SUM(COALESCE(a.overtime_hours, 0)) as total_overtime_hours,
        COUNT(CASE WHEN a.is_late = true THEN 1 END) as late_days,
        COUNT(CASE WHEN a.is_regular_holiday = true THEN 1 END) as regular_holiday_days,
        COUNT(CASE WHEN a.is_special_holiday = true THEN 1 END) as special_holiday_days,
        -- Debug fields
        COUNT(*) as total_attendance_records,
        MIN(a.date) as first_date,
        MAX(a.date) as last_date
      FROM attendance a
      LEFT JOIN leave_types lt ON a.leave_type_id = lt.leave_type_id
      WHERE a.employee_id = ANY($1) 
        AND a.date BETWEEN $2 AND $3
      GROUP BY a.employee_id
    `,
      [employee_ids, dateRangeQuery.startDate, dateRangeQuery.endDate]
    );

    console.log(
      `✅ [PAYROLL] Found attendance data for ${attendanceData.rows.length} employees`
    );
    attendanceData.rows.forEach((att) => {
      console.log(
        `   - ${att.employee_id}: ${att.total_attendance_records} records, ${att.days_worked} days worked (${att.first_date} to ${att.last_date})`
      );
    });

    // Create lookup maps for faster processing
    // console.log(`🗺️ [CONTROLLER DEBUG] Creating lookup maps...`);
    const employeeMap = new Map();
    const attendanceMap = new Map();

    employeeData.rows.forEach((emp) => {
      employeeMap.set(emp.employee_id, emp);
    });

    attendanceData.rows.forEach((att) => {
      attendanceMap.set(att.employee_id, att);
    });

    // console.log(
    //   `📊 [CONTROLLER DEBUG] Processing individual payroll calculations...`
    // );

    // Process each employee with the batched data
    const results = [];
    for (const employee_id of employee_ids) {
      // console.log(
      //   `\n👤 [CONTROLLER DEBUG] Processing employee: ${employee_id}`
      // );

      const emp = employeeMap.get(employee_id);
      const attendance = attendanceMap.get(employee_id) || {
        days_worked: 0,
        paid_leave_days: 0,
        unpaid_leave_days: 0,
        total_regular_hours: 0,
        total_overtime_hours: 0,
        late_days: 0,
        regular_holiday_days: 0,
        special_holiday_days: 0,
      };

      // console.log(
      //   `📋 [CONTROLLER DEBUG] Employee data found: ${emp ? "YES" : "NO"}`
      // );
      // if (emp) {
      //   console.log(`   Name: ${emp.first_name} ${emp.last_name}`);
      //   console.log(`   Rate: ₱${emp.rate} (${emp.rate_type})`);
      //   console.log(`   Employment: ${emp.employment_type}`);
      // }

      // console.log(`📊 [CONTROLLER DEBUG] Attendance data:`, attendance);

      if (!emp) {
        // console.log(
        //   `❌ [CONTROLLER DEBUG] Employee ${employee_id} not found or inactive`
        // );
        results.push({ employee_id, error: "Employee not found or inactive" });
        continue;
      }

      // Check contract validity
      if (
        emp.contract_start > end_date ||
        (emp.contract_end && emp.contract_end < start_date)
      ) {
        // console.log(
        //   `❌ [CONTROLLER DEBUG] Contract invalid for ${employee_id}: start=${emp.contract_start}, end=${emp.contract_end}`
        // );
        results.push({
          employee_id,
          error: "No active contract for this period",
        });
        continue;
      }

      // console.log(`✅ [CONTROLLER DEBUG] Contract valid for ${employee_id}`);

      // Calculate payroll using comprehensive calculator
      try {
        // console.log(
        //   `🔧 [CONTROLLER DEBUG] Calling calculateEmployeePayrollSync for ${employee_id}...`
        // );
        const result = await calculateEmployeePayrollSync(
          emp,
          attendance,
          start_date,
          end_date
        );
        // console.log(
        //   `✅ [CONTROLLER DEBUG] Successfully calculated payroll for ${employee_id}`
        // );
        // console.log(
        //   `💰 [CONTROLLER DEBUG] Result summary - Gross: ₱${result.gross_pay}, Net: ₱${result.net_pay}`
        // );
        results.push(result);
      } catch (error) {
        // console.error(
        //   `❌ [CONTROLLER DEBUG] Error calculating payroll for employee ${employee_id}:`,
        //   error.message
        // );
        results.push({ employee_id, error: error.message });
      }
    }

    // console.log(
    //   `\n🏁 [CONTROLLER DEBUG] ===== Batch calculation completed =====`
    // );
    // console.log(
    //   `📊 [CONTROLLER DEBUG] Total processed: ${results.length} employees`
    // );

    const successCount = results.filter((r) => !r.error).length;
    const errorCount = results.filter((r) => r.error).length;

    // console.log(
    //   `✅ [CONTROLLER DEBUG] Successful calculations: ${successCount}`
    // );
    // console.log(`❌ [CONTROLLER DEBUG] Failed calculations: ${errorCount}`);

    if (errorCount > 0) {
      // console.log(
      //   `📋 [CONTROLLER DEBUG] Errors:`,
      //   results
      //     .filter((r) => r.error)
      //     .map((r) => ({ employee_id: r.employee_id, error: r.error }))
      // );
    }

    // console.log(
    //   `⚡ [CONTROLLER DEBUG] Batch calculation completed for ${results.length} employees`
    // );
    return results;
  } catch (error) {
    // console.error(
    //   "💥 [CONTROLLER DEBUG] Batch calculation error:",
    //   error.message
    // );
    // console.error("🔍 [CONTROLLER DEBUG] Error stack:", error.stack);
    throw error;
  }
};

// Synchronous payroll calculation (integrated with AdvancedPayrollCalculator)
const calculateEmployeePayrollSync = async (
  emp,
  attendance,
  startDate = null,
  endDate = null
) => {
  try {
    const calculator = new AdvancedPayrollCalculator(pool);
    await calculator.loadConfiguration();

    // Enhanced attendance data with comprehensive breakdown
    const attendanceForCalculator = {
      days_worked: parseInt(attendance.days_worked) || 0,
      paid_leave_days: parseInt(attendance.paid_leave_days) || 0,
      unpaid_leave_days: parseInt(attendance.unpaid_leave_days) || 0,

      // Basic totals
      total_hours_worked: parseFloat(attendance.total_hours_worked) || 0,
      total_regular_hours: parseFloat(attendance.total_regular_hours) || 0,
      total_overtime_hours: parseFloat(attendance.total_overtime_hours) || 0,
      total_night_diff_hours:
        parseFloat(attendance.total_night_diff_hours) || 0,
      total_rest_day_hours: parseFloat(attendance.total_rest_day_hours) || 0,
      total_regular_holiday_hours:
        parseFloat(attendance.total_regular_holiday_hours) || 0,
      total_special_holiday_hours:
        parseFloat(attendance.total_special_holiday_hours) || 0,

      // Enhanced overtime breakdown
      regular_overtime_hours:
        parseFloat(attendance.regular_overtime_hours) || 0,
      night_diff_overtime_hours:
        parseFloat(attendance.night_diff_overtime_hours) || 0,
      rest_day_overtime_hours:
        parseFloat(attendance.rest_day_overtime_hours) || 0,
      regular_holiday_overtime_hours:
        parseFloat(attendance.regular_holiday_overtime_hours) || 0,
      special_holiday_overtime_hours:
        parseFloat(attendance.special_holiday_overtime_hours) || 0,

      // ULTIMATE EDGE CASES: Holiday + Rest Day combinations
      regular_holiday_rest_day_hours:
        parseFloat(attendance.regular_holiday_rest_day_hours) || 0,
      special_holiday_rest_day_hours:
        parseFloat(attendance.special_holiday_rest_day_hours) || 0,
      regular_holiday_rest_day_overtime_hours:
        parseFloat(attendance.regular_holiday_rest_day_overtime_hours) || 0,
      special_holiday_rest_day_overtime_hours:
        parseFloat(attendance.special_holiday_rest_day_overtime_hours) || 0,

      // Deductions
      late_days: parseInt(attendance.late_days) || 0,
      total_late_minutes: parseInt(attendance.total_late_minutes) || 0,
      total_undertime_minutes:
        parseInt(attendance.total_undertime_minutes) || 0,

      // Edge case flags for complex calculations
      has_regular_holiday_rest_day:
        attendance.has_regular_holiday_rest_day || false,
      has_special_holiday_rest_day:
        attendance.has_special_holiday_rest_day || false,
      has_ultimate_case_regular: attendance.has_ultimate_case_regular || false,
      has_ultimate_case_special: attendance.has_ultimate_case_special || false,
      max_premium_stack_count:
        parseInt(attendance.max_premium_stack_count) || 0,

      // Comprehensive breakdown for detailed calculations
      payroll_breakdowns: attendance.payroll_breakdowns || [],
    };

    const dateRangeQuery = createDateRangeQuery(startDate, endDate, "a.date");
    const calculationStartDate = dateRangeQuery.startDate;
    const calculationEndDate = dateRangeQuery.endDate;

    // Enhanced schedule information for precise break calculations
    const scheduleInfo = {
      schedule_id: emp.schedule_id,
      schedule_name: emp.schedule_name,
      start_time: emp.schedule_start_time,
      end_time: emp.schedule_end_time,
      break_duration: parseFloat(emp.break_duration) || 0,
      break_start: emp.break_start,
      break_end: emp.break_end,
      days_of_week: emp.days_of_week || [],
    };

    const payrollData = await calculator.calculateEmployeePayroll(
      emp.employee_id,
      calculationStartDate,
      calculationEndDate,
      attendanceForCalculator, // Pass attendance data to avoid re-querying
      scheduleInfo // Pass enhanced schedule information for break calculations
    );

    if (payrollData.error) {
      console.error(
        `❌ [CALC DEBUG] Calculator returned error: ${payrollData.error}`
      );
      throw new Error(payrollData.error);
    }

    // Enhanced result mapping with comprehensive breakdown
    const result = {
      employee_id: emp.employee_id,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      position: emp.position_title || payrollData.position,
      employment_type: emp.employment_type,
      rate: emp.rate,
      rate_type: emp.rate_type,
      days_worked: payrollData.attendance.days_worked,
      paid_leave_days: attendanceForCalculator.paid_leave_days,
      total_hours: payrollData.attendance.total_regular_hours,
      overtime_hours: payrollData.attendance.total_overtime_hours,

      earnings_breakdown: payrollData.earnings.breakdown || null,
      late_days: 0, // Legacy field
      gross_pay: Math.round(payrollData.earnings.gross_pay * 100) / 100,
      overtime_pay: Math.round(payrollData.earnings.overtime_pay * 100) / 100,
      leave_pay: Math.round((payrollData.earnings.leave_pay || 0) * 100) / 100,
      deductions:
        Math.round(payrollData.deductions.total_deductions * 100) / 100,
      net_pay: Math.round(payrollData.net_pay * 100) / 100,

      // Basic comprehensive data
      basic_pay: Math.round(payrollData.earnings.base_pay * 100) / 100,
      sss_contribution: Math.round(payrollData.deductions.sss * 100) / 100,
      philhealth_contribution:
        Math.round(payrollData.deductions.philhealth * 100) / 100,
      pagibig_contribution:
        Math.round(payrollData.deductions.pagibig * 100) / 100,
      income_tax: Math.round(payrollData.deductions.tax * 100) / 100,
      loans_deduction:
        Math.round((payrollData.deductions.loans || 0) * 100) / 100,
      other_deductions:
        Math.round((payrollData.deductions.other_deductions || 0) * 100) / 100,
      thirteenth_month_pay:
        Math.round((payrollData.thirteenth_month_pay || 0) * 100) / 100,

      // ENHANCED: Comprehensive premium breakdown
      night_diff_pay:
        Math.round((payrollData.earnings.night_differential_pay || 0) * 100) /
        100,
      rest_day_pay:
        Math.round((payrollData.earnings.rest_day_pay || 0) * 100) / 100,
      regular_holiday_pay:
        Math.round((payrollData.earnings.regular_holiday_pay || 0) * 100) / 100,
      special_holiday_pay:
        Math.round((payrollData.earnings.special_holiday_pay || 0) * 100) / 100,

      // ULTIMATE EDGE CASES: Holiday + Rest Day combinations
      regular_holiday_rest_day_pay:
        Math.round(
          (payrollData.earnings.regular_holiday_rest_day_pay || 0) * 100
        ) / 100,
      special_holiday_rest_day_pay:
        Math.round(
          (payrollData.earnings.special_holiday_rest_day_pay || 0) * 100
        ) / 100,

      // Enhanced overtime breakdown
      regular_overtime_hours: attendanceForCalculator.regular_overtime_hours,
      night_diff_overtime_hours:
        attendanceForCalculator.night_diff_overtime_hours,
      rest_day_overtime_hours: attendanceForCalculator.rest_day_overtime_hours,
      regular_holiday_overtime_hours:
        attendanceForCalculator.regular_holiday_overtime_hours,
      special_holiday_overtime_hours:
        attendanceForCalculator.special_holiday_overtime_hours,
      regular_holiday_rest_day_overtime_hours:
        attendanceForCalculator.regular_holiday_rest_day_overtime_hours,
      special_holiday_rest_day_overtime_hours:
        attendanceForCalculator.special_holiday_rest_day_overtime_hours,

      // Edge case metadata for complex payroll validation
      edge_case_flags: {
        has_regular_holiday_rest_day:
          attendanceForCalculator.has_regular_holiday_rest_day,
        has_special_holiday_rest_day:
          attendanceForCalculator.has_special_holiday_rest_day,
        has_ultimate_case_regular:
          attendanceForCalculator.has_ultimate_case_regular,
        has_ultimate_case_special:
          attendanceForCalculator.has_ultimate_case_special,
        max_premium_stack_count:
          attendanceForCalculator.max_premium_stack_count,
      },

      // Raw attendance breakdown for debugging and audit trails
      comprehensive_breakdown: attendanceForCalculator.payroll_breakdowns,
    };
    // console.log(
    //   `✅ [CALC DEBUG] Payroll calculated for ${emp.employee_id}:`,
    //   result.earnings_breakdown
    // );
    return result;
  } catch (error) {
    console.error(
      `❌ [CALC DEBUG] Error in calculateEmployeePayrollSync for ${emp.employee_id}:`,
      error.message
    );
    return { employee_id: emp.employee_id, error: error.message };
  }
};

// Helper function to calculate individual employee payroll (integrated with AdvancedPayrollCalculator)
const calculateEmployeePayroll = async (employee_id, start_date, end_date) => {
  try {
    // Use AdvancedPayrollCalculator for comprehensive calculations
    const calculator = new AdvancedPayrollCalculator(pool);
    const payrollData = await calculator.calculateEmployeePayroll(
      employee_id,
      start_date,
      end_date
    );

    // Map to legacy format for API compatibility
    return {
      employee_id: employee_id,
      employee_name: payrollData.employee_name,
      position: payrollData.position,
      employment_type: payrollData.employment_type,
      rate: payrollData.rate,
      rate_type: payrollData.rate_type,
      days_worked: payrollData.attendance.days_worked,
      paid_leave_days: payrollData.attendance.paid_leave_days || 0,
      total_hours: payrollData.attendance.total_hours,
      overtime_hours: payrollData.attendance.overtime_hours,
      late_days: 0, // Legacy field
      gross_pay: Math.round(payrollData.earnings.gross_pay * 100) / 100,
      overtime_pay: Math.round(payrollData.earnings.overtime_pay * 100) / 100,
      leave_pay: Math.round((payrollData.earnings.leave_pay || 0) * 100) / 100,
      deductions:
        Math.round(payrollData.deductions.total_deductions * 100) / 100,
      net_pay: Math.round(payrollData.net_pay * 100) / 100,
      // Additional comprehensive data
      basic_pay: Math.round(payrollData.earnings.base_pay * 100) / 100,
      sss_contribution: Math.round(payrollData.deductions.sss * 100) / 100,
      philhealth_contribution:
        Math.round(payrollData.deductions.philhealth * 100) / 100,
      pagibig_contribution:
        Math.round(payrollData.deductions.pagibig * 100) / 100,
      income_tax: Math.round(payrollData.deductions.tax * 100) / 100,
      loans_deduction:
        Math.round((payrollData.deductions.loans || 0) * 100) / 100,
      other_deductions:
        Math.round((payrollData.deductions.other_deductions || 0) * 100) / 100,
      thirteenth_month_pay:
        Math.round((payrollData.thirteenth_month_pay || 0) * 100) / 100,
    };
  } catch (error) {
    console.error(
      `Error calculating payroll for employee ${employee_id}:`,
      error
    );
    return { employee_id, error: error.message };
  }
};

// Helper function to get working days in period
const getWorkingDaysInPeriod = async (start_date, end_date) => {
  // Simple calculation - you can enhance this to exclude holidays
  const start = dayjs(start_date);
  const end = dayjs(end_date);
  const totalDays = end.diff(start, "day") + 1;

  // Rough calculation: exclude weekends (you can make this more sophisticated)
  let workingDays = 0;
  for (let i = 0; i < totalDays; i++) {
    const day = start.add(i, "day");
    if (day.day() !== 0 && day.day() !== 6) {
      // Not Sunday or Saturday
      workingDays++;
    }
  }

  return workingDays || 1; // Avoid division by zero
};

// Delete payroll (soft delete - mark as cancelled)
export const deletePayroll = async (req, res) => {
  try {
    const { payroll_header_id } = req.params;
    const { deleted_by, reason } = req.body;

    // Check if payroll exists
    const payroll = await pool.query(
      `
      SELECT * FROM payroll_header WHERE payroll_header_id = $1
    `,
      [payroll_header_id]
    );

    if (payroll.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    // Mark as cancelled instead of deleting
    await pool.query(
      `
      UPDATE payroll_header 
      SET status = 'cancelled',
          deleted_by = $1,
          deletion_reason = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE payroll_header_id = $3
    `,
      [deleted_by, reason, payroll_header_id]
    );

    res.status(200).json({
      success: true,
      message: "Payroll marked as cancelled",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get payroll summary/dashboard data
export const getPayrollSummary = async (req, res) => {
  try {
    const { year } = req.query;

    let dateFilter = "";
    let params = [];

    if (year) {
      dateFilter = "WHERE EXTRACT(YEAR FROM ph.start_date) = $1";
      params.push(year);
    }

    const summary = await pool.query(
      `
      SELECT 
        COUNT(DISTINCT ph.payroll_header_id) as total_payroll_runs,
        COUNT(p.payslip_id) as total_payslips,
        COUNT(DISTINCT p.employee_id) as unique_employees_paid,
        COALESCE(SUM(p.gross_pay), 0) as total_gross_pay,
        COALESCE(SUM(p.overtime_pay), 0) as total_overtime_pay,
        COALESCE(SUM(p.leave_pay), 0) as total_leave_pay,
        COALESCE(SUM(p.deductions), 0) as total_deductions,
        COALESCE(SUM(p.net_pay), 0) as total_net_pay,
        COALESCE(AVG(p.net_pay), 0) as average_net_pay
      FROM payroll_header ph
      INNER JOIN payslip p ON ph.payroll_header_id = p.payroll_header_id
      ${dateFilter}
    `,
      params
    );

    // Get monthly breakdown if year is specified
    let monthlyBreakdown = [];
    if (year) {
      const monthly = await pool.query(
        `
        SELECT 
          EXTRACT(MONTH FROM ph.start_date) as month,
          COUNT(p.payslip_id) as payslips_count,
          COUNT(DISTINCT p.employee_id) as unique_employees,
          COALESCE(SUM(p.gross_pay), 0) as gross_pay,
          COALESCE(SUM(p.net_pay), 0) as net_pay
        FROM payroll_header ph
        INNER JOIN payslip p ON ph.payroll_header_id = p.payroll_header_id
        WHERE EXTRACT(YEAR FROM ph.start_date) = $1
        GROUP BY EXTRACT(MONTH FROM ph.start_date)
        ORDER BY month
      `,
        [year]
      );

      monthlyBreakdown = monthly.rows;
    }

    // Get additional dashboard statistics
    let dashboardStats = {};

    // Get unique employee counts and totals for current month
    const currentMonthStats = await pool.query(
      `
      SELECT 
        COUNT(DISTINCT p.employee_id) as unique_employees_current_month,
        COUNT(p.payslip_id) as total_payslips_current_month,
        COALESCE(SUM(p.gross_pay), 0) as total_gross_pay_current_month,
        COALESCE(SUM(p.net_pay), 0) as total_net_pay_current_month,
        COALESCE(SUM(p.deductions), 0) as total_deductions_current_month
      FROM payroll_header ph
      INNER JOIN payslip p ON ph.payroll_header_id = p.payroll_header_id
      WHERE EXTRACT(MONTH FROM ph.start_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM ph.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `
    );

    if (currentMonthStats.rows.length > 0) {
      dashboardStats = currentMonthStats.rows[0];
    }

    res.status(200).json({
      success: true,
      data: {
        summary: summary.rows[0],
        monthly_breakdown: monthlyBreakdown,
        dashboard_stats: dashboardStats,
        year: year || "All time",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getContractDetails = async (employee_id) => {
  const contractQuery = `
    SELECT 
        e.employee_id,
        e.first_name,
        e.last_name,
        c.rate,
        c.rate_type,
        c.start_date as contract_start,
        c.end_date as contract_end,
        p.title as position_title,
        et.name as employment_type,
        
        -- Enhanced: Include schedule details with break_start/break_end
        s.schedule_id,
        s.schedule_name,
        s.start_time as schedule_start_time,
        s.end_time as schedule_end_time,
        s.break_duration,
        s.break_start,
        s.break_end,
        s.days_of_week
      FROM employees e
      JOIN contracts c ON e.contract_id = c.contract_id
      JOIN positions p ON c.position_id = p.position_id
      JOIN employment_types et ON c.employment_type_id = et.employment_type_id
      LEFT JOIN schedules s ON e.schedule_id = s.schedule_id
      WHERE e.employee_id = ANY($1) AND e.status = 'active'
  `;

  const result = await pool.query(contractQuery, [[employee_id]]);
  return result;
};

const getAttendanceDetails = async (employee_id, start_date, end_date) => {
  // Create proper date range query using utilities
  const dateRangeQuery = createDateRangeQuery(start_date, end_date, "a.date");

  const attendanceQuery = `
      SELECT 
        a.employee_id,
        COUNT(*) as total_attendance_records,
        COUNT(CASE WHEN a.is_present = true THEN 1 END) as days_worked,
        COUNT(CASE WHEN a.is_absent = true THEN 1 END) as days_absent,
        COUNT(CASE WHEN a.on_leave = true AND lt.is_paid = true THEN 1 END) as paid_leave_days,
        COUNT(CASE WHEN a.on_leave = true AND (lt.is_paid = false OR lt.is_paid IS NULL) THEN 1 END) as unpaid_leave_days,
        COUNT(CASE WHEN a.is_dayoff = true THEN 1 END) as day_off_days,
        COUNT(CASE WHEN a.is_regular_holiday = true THEN 1 END) as regular_holiday_days,
        COUNT(CASE WHEN a.is_special_holiday = true THEN 1 END) as special_holiday_days,
        
        -- Enhanced payroll breakdown aggregation using the new JSON schema
        SUM(COALESCE(a.total_hours, 0)) as total_hours_worked,
        SUM(COALESCE(a.overtime_hours, 0)) as total_overtime_hours,
        SUM(COALESCE(a.night_differential_hours, 0)) as total_night_diff_hours,
        SUM(COALESCE(a.rest_day_hours_worked, 0)) as total_rest_day_hours,
        SUM(COALESCE(a.regular_holiday_hours_worked, 0)) as total_regular_holiday_hours,
        SUM(COALESCE(a.special_holiday_hours_worked, 0)) as total_special_holiday_hours,
        
        -- Enhanced breakdown from payroll_breakdown JSON
        COALESCE(
          SUM(CAST(a.payroll_breakdown->>'regular_hours' AS NUMERIC)), 0
        ) as total_regular_hours,
        
        -- Overtime breakdown
        COALESCE(
          SUM(CAST(a.payroll_breakdown->'overtime'->>'regular_overtime' AS NUMERIC)), 0
        ) as regular_overtime_hours,
        COALESCE(
          SUM(CAST(a.payroll_breakdown->'overtime'->>'night_diff_overtime' AS NUMERIC)), 0
        ) as night_diff_overtime_hours,
        COALESCE(
          SUM(CAST(a.payroll_breakdown->'overtime'->>'rest_day_overtime' AS NUMERIC)), 0
        ) as rest_day_overtime_hours,
        COALESCE(
          SUM(CAST(a.payroll_breakdown->'overtime'->>'regular_holiday_overtime' AS NUMERIC)), 0
        ) as regular_holiday_overtime_hours,
        COALESCE(
          SUM(CAST(a.payroll_breakdown->'overtime'->>'special_holiday_overtime' AS NUMERIC)), 0
        ) as special_holiday_overtime_hours,
        
        -- ULTIMATE EDGE CASES: Holiday + Rest Day overtime
        COALESCE(
          SUM(CAST(a.payroll_breakdown->'overtime'->>'regular_holiday_rest_day_overtime' AS NUMERIC)), 0
        ) as regular_holiday_rest_day_overtime_hours,
        COALESCE(
          SUM(CAST(a.payroll_breakdown->'overtime'->>'special_holiday_rest_day_overtime' AS NUMERIC)), 0
        ) as special_holiday_rest_day_overtime_hours,
        
        -- Premium breakdowns
        COALESCE(
          SUM(CAST(a.payroll_breakdown->'premiums'->'holidays'->'regular_holiday_rest_day'->>'total' AS NUMERIC)), 0
        ) as regular_holiday_rest_day_hours,
        COALESCE(
          SUM(CAST(a.payroll_breakdown->'premiums'->'holidays'->'special_holiday_rest_day'->>'total' AS NUMERIC)), 0
        ) as special_holiday_rest_day_hours,
        
        -- Edge case flags aggregation
        BOOL_OR(CAST(a.payroll_breakdown->'edge_case_flags'->>'is_day_off_and_regular_holiday' AS BOOLEAN)) as has_regular_holiday_rest_day,
        BOOL_OR(CAST(a.payroll_breakdown->'edge_case_flags'->>'is_day_off_and_special_holiday' AS BOOLEAN)) as has_special_holiday_rest_day,
        BOOL_OR(CAST(a.payroll_breakdown->'edge_case_flags'->>'is_ultimate_case_regular' AS BOOLEAN)) as has_ultimate_case_regular,
        BOOL_OR(CAST(a.payroll_breakdown->'edge_case_flags'->>'is_ultimate_case_special' AS BOOLEAN)) as has_ultimate_case_special,
        MAX(CAST(a.payroll_breakdown->'edge_case_flags'->>'premium_stack_count' AS INTEGER)) as max_premium_stack_count,
        
        -- Deductions
        SUM(COALESCE(a.late_minutes, 0)) as total_late_minutes,
        SUM(COALESCE(a.undertime_minutes, 0)) as total_undertime_minutes,
        COUNT(CASE WHEN a.is_late = true THEN 1 END) as late_days,
        
        -- Comprehensive payroll breakdown as JSON aggregation
        JSON_AGG(
          CASE 
            WHEN a.payroll_breakdown IS NOT NULL THEN a.payroll_breakdown
            ELSE NULL
          END
        ) FILTER (WHERE a.payroll_breakdown IS NOT NULL) as payroll_breakdowns,
        
        -- Debug: Get some sample dates
        MIN(a.date) as first_attendance_date,
        MAX(a.date) as last_attendance_date
      FROM attendance a
      LEFT JOIN leave_types lt ON a.leave_type_id = lt.leave_type_id
      WHERE a.employee_id = ANY($1) 
        AND a.date BETWEEN $2 AND $3
      GROUP BY a.employee_id
    `;

  const result = await pool.query(attendanceQuery, [
    [employee_id],
    dateRangeQuery.startDate,
    dateRangeQuery.endDate,
  ]);
  return result;
};

// Optimized generatePayroll function using batch processing and timesheet support
const optimizedGeneratePayroll = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      employee_ids = [],
      payroll_title,
      notes = "",
      run_by,
      timesheet_id,
    } = req.body;

    if (!start_date || !end_date || !run_by) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: start_date, end_date, run_by",
      });
    }

    // Get employees from timesheet if timesheet_id is provided, otherwise use employee_ids
    let targetEmployeeIds = [];

    if (timesheet_id) {
      console.log(`🎯 Getting employees from timesheet ${timesheet_id}...`);
      const timesheetEmployees = await pool.query(
        "SELECT DISTINCT employee_id FROM attendance WHERE timesheet_id = $1",
        [timesheet_id]
      );
      targetEmployeeIds = timesheetEmployees.rows.map((emp) => emp.employee_id);
      console.log(
        `📊 Found ${targetEmployeeIds.length} employees in timesheet ${timesheet_id}:`,
        targetEmployeeIds
      );
    } else if (employee_ids && employee_ids.length > 0) {
      console.log("🎯 Using provided employee IDs:", employee_ids);
      targetEmployeeIds = employee_ids;
    } else {
      console.log(
        "🔍 No employee IDs or timesheet provided, fetching all active employees..."
      );
      const allEmployees = await pool.query(
        "SELECT employee_id FROM employees WHERE status = 'active'"
      );
      targetEmployeeIds = allEmployees.rows.map((emp) => emp.employee_id);
      console.log(`📊 Found ${targetEmployeeIds.length} active employees`);
    }

    if (!targetEmployeeIds.length) {
      return res.status(400).json({
        success: false,
        message: "No active employees found",
      });
    }

    // Batch fetch all employee details with contracts in a single query
    const employees = await getContractDetails(targetEmployeeIds);

    if (employees.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid employees found",
      });
    }

    const attendance = await getAttendanceDetails(
      targetEmployeeIds,
      start_date,
      end_date
    );

    console.log("Attendance data fetched for employees:", attendance.rows);

    // Create lookup map for attendance data
    const attendanceMap = {};
    attendance.rows.forEach((att) => {
      attendanceMap[att.employee_id] = att;
    });

    // Process all employees using async/await with Promise.all
    const payrollPromises = employees.rows.map(async (emp) => {
      const empAttendance = attendanceMap[emp.employee_id] || {
        total_attendance_records: 0,
        days_worked: 0,
        days_absent: 0,
        paid_leave_days: 0,
        unpaid_leave_days: 0,
        day_off_days: 0,
        total_regular_hours: 0,
        total_overtime_hours: 0,
        late_days: 0,
        regular_holiday_days: 0,
        special_holiday_days: 0,
      };

      try {
        return await calculateEmployeePayrollSync(
          emp,
          empAttendance,
          start_date,
          end_date
        );
      } catch (error) {
        console.error(
          `Error calculating payroll for employee ${emp.employee_id}:`,
          error
        );
        return { employee_id: emp.employee_id, error: error.message };
      }
    });

    const payrollResults = await Promise.all(payrollPromises);

    // Filter out any errors
    const validPayrolls = payrollResults.filter((result) => !result.error);
    const errorPayrolls = payrollResults.filter((result) => result.error);

    if (errorPayrolls.length > 0) {
      console.log(
        "⚠️ Payroll calculation errors:",
        errorPayrolls.map((e) => e.error)
      );
    }

    if (validPayrolls.length === 0) {
      console.log("❌ No valid payroll calculations");
      return res.status(400).json({
        success: false,
        message: "No valid payroll data could be calculated",
        errors: errorPayrolls,
      });
    }

    const dateRange = createDateRangeQuery(start_date, end_date);

    // Create payroll header using actual schema columns
    const headerResult = await pool.query(
      `
      INSERT INTO payroll_header (
        run_date, start_date, end_date, run_by
      ) VALUES (CURRENT_DATE, $1, $2, $3)
      RETURNING payroll_header_id
    `,
      [dateRange.startDate, dateRange.endDate, run_by]
    );

    const payroll_header_id = headerResult.rows[0].payroll_header_id;

    // Batch insert all payslips matching the actual schema
    const payslipValues = validPayrolls.map((payroll) => [
      payroll_header_id,
      payroll.employee_id,
      payroll.gross_pay,
      payroll.overtime_pay,
      payroll.night_diff_pay || 0,
      payroll.leave_pay,
      payroll.bonuses || 0,
      payroll.deductions,
      payroll.sss_contribution || 0,
      payroll.philhealth_contribution || 0,
      payroll.pagibig_contribution || 0,
      payroll.income_tax || 0,
      payroll.other_deductions || 0,
      payroll.net_pay,
      // Store breakdown object as jsonb
      payroll.earnings_breakdown
        ? JSON.stringify(payroll.earnings_breakdown)
        : JSON.stringify({ value: "Not provided" }),
    ]);

    const payslipQuery = `
  INSERT INTO payslip (
    payroll_header_id, employee_id, gross_pay, overtime_pay, 
    night_diff_pay, leave_pay, bonuses, deductions,
    sss_contribution, philhealth_contribution, pagibig_contribution,
    income_tax, other_deductions, net_pay, earnings_breakdown
  ) VALUES ${payslipValues
    .map(
      (_, i) =>
        `(${Array.from({ length: 15 }, (_, j) => `$${i * 15 + j + 1}`).join(
          ","
        )})`
    )
    .join(",")}
`;

    const flatValues = payslipValues.flat();
    await pool.query(payslipQuery, flatValues);

    console.log(
      `✅ Payroll generated successfully: ${validPayrolls.length} employees processed`
    );

    res.status(201).json({
      success: true,
      message: "Payroll generated successfully",
      data: {
        payroll_header_id,
        employees_processed: validPayrolls.length,
        errors: errorPayrolls.length > 0 ? errorPayrolls : undefined,
      },
    });
  } catch (error) {
    console.error("Error generating payroll:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const payrollController = {
  generatePayroll: optimizedGeneratePayroll, // Use optimized version by default
  generatePayrollLegacy: generatePayrollLegacy, // Keep legacy version for backward compatibility
  deletePayroll,
  getPayrollSummary,
  getAllPayrollHeaders,
  getPayrollHeaderById,
  getPayslipsByHeaderId,
};

// Export the optimized version as the default generatePayroll for routes
export { optimizedGeneratePayroll as generatePayroll };

// Debug endpoint to investigate attendance calculation issues
export const debugAttendanceCalculation = async (req, res) => {
  try {
    const { employee_id, start_date, end_date } = req.query;

    if (!employee_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "employee_id, start_date, and end_date are required",
      });
    }

    // console.log(
    //   `🔍 Debug attendance for ${employee_id} from ${start_date} to ${end_date}`
    // );

    // Get raw attendance records
    const rawRecords = await pool.query(
      `
      SELECT 
        date,
        is_present,
        is_absent,
        on_leave,
        is_dayoff,
        is_regular_holiday,
        is_special_holiday,
        total_hours,
        overtime_hours,
        time_in,
        time_out,
        notes
      FROM attendance 
      WHERE employee_id = $1 AND date BETWEEN $2 AND $3
      ORDER BY date
    `,
      [employee_id, start_date, end_date]
    );

    // Get aggregated data (same as payroll calculation)
    const aggregatedData = await pool.query(
      `
      SELECT 
        employee_id,
        COUNT(*) as total_attendance_records,
        COUNT(CASE WHEN is_present = true THEN 1 END) as days_worked,
        COUNT(CASE WHEN is_absent = true THEN 1 END) as days_absent,
        COUNT(CASE WHEN on_leave = true THEN 1 END) as days_on_leave,
        COUNT(CASE WHEN is_dayoff = true THEN 1 END) as day_off_days,
        COUNT(CASE WHEN is_regular_holiday = true THEN 1 END) as regular_holiday_days,
        COUNT(CASE WHEN is_special_holiday = true THEN 1 END) as special_holiday_days,
        SUM(COALESCE(total_hours, 0) - COALESCE(overtime_hours, 0)) as total_regular_hours,
        SUM(COALESCE(overtime_hours, 0)) as total_overtime_hours
      FROM attendance 
      WHERE employee_id = $1 AND date BETWEEN $2 AND $3
      GROUP BY employee_id
    `,
      [employee_id, start_date, end_date]
    );

    res.status(200).json({
      success: true,
      data: {
        employee_id,
        period: { start_date, end_date },
        total_raw_records: rawRecords.rows.length,
        raw_records: rawRecords.rows,
        aggregated_calculation: aggregatedData.rows[0] || null,
        period_analysis: {
          total_days_in_period:
            Math.ceil(
              (new Date(end_date) - new Date(start_date)) /
                (1000 * 60 * 60 * 24)
            ) + 1,
          records_vs_days:
            rawRecords.rows.length <=
            Math.ceil(
              (new Date(end_date) - new Date(start_date)) /
                (1000 * 60 * 60 * 24)
            ) +
              1
              ? "✅ Normal"
              : "⚠️ More records than days",
        },
      },
    });
  } catch (error) {
    console.error("Debug attendance error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
