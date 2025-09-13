import { pool } from "../config/db.js";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// Get all payroll headers (payroll periods)
export const getAllPayrollHeaders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ph.*,
        COUNT(p.payslip_id) as employee_count,
        SUM(p.gross_pay) as total_gross_pay,
        SUM(p.net_pay) as total_net_pay
      FROM payroll_header ph
      LEFT JOIN payslip p ON ph.payroll_header_id = p.payroll_header_id
      GROUP BY ph.payroll_header_id
      ORDER BY ph.run_date DESC, ph.start_date DESC
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

    // Get all payslips for this payroll period
    const payslipsResult = await pool.query(
      `
      SELECT 
        p.*,
        e.first_name,
        e.last_name,
        e.employee_id as emp_id,
        pos.position_title,
        dept.department_name,
        c.rate,
        c.rate_type,
        et.type_name as employment_type
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

    res.status(200).json({
      success: true,
      data: {
        header: headerResult.rows[0],
        payslips: payslipsResult.rows,
      },
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

// Generate and save payroll
export const generatePayroll = async (req, res) => {
  try {
    const { start_date, end_date, employee_ids, run_by } = req.body;

    if (
      !start_date ||
      !end_date ||
      !employee_ids ||
      employee_ids.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Start date, end date, and employee IDs are required",
      });
    }

    // Check if payroll already exists for this period
    const existingPayroll = await pool.query(
      `
      SELECT payroll_header_id FROM payroll_header 
      WHERE start_date = $1 AND end_date = $2
    `,
      [start_date, end_date]
    );

    if (existingPayroll.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Payroll already exists for this period",
        existing_payroll_id: existingPayroll.rows[0].payroll_header_id,
      });
    }

    try {
      // Create payroll header
      const payrollHeader = await pool.query(
        `
        INSERT INTO payroll_header (run_date, start_date, end_date, run_by)
        VALUES (CURRENT_DATE, $1, $2, $3) 
        RETURNING payroll_header_id
      `,
        [start_date, end_date, run_by || null]
      );

      const payrollHeaderId = payrollHeader.rows[0].payroll_header_id;
      const successfulPayslips = [];
      const failedPayslips = [];

      // Process each employee
      for (const employee_id of employee_ids) {
        try {
          const payrollData = await calculateEmployeePayroll(
            employee_id,
            start_date,
            end_date
          );

          if (!payrollData.error) {
            // Insert payslip
            await pool.query(
              `
              INSERT INTO payslip (
                employee_id, payroll_header_id, gross_pay, overtime_pay, 
                night_diff_pay, leave_pay, bonuses, deductions, net_pay
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `,
              [
                employee_id,
                payrollHeaderId,
                payrollData.gross_pay,
                payrollData.overtime_pay || 0,
                payrollData.night_diff_pay || 0,
                payrollData.leave_pay || 0,
                payrollData.bonuses || 0,
                payrollData.deductions || 0,
                payrollData.net_pay,
              ]
            );

            successfulPayslips.push({
              employee_id,
              employee_name: payrollData.employee_name,
              net_pay: payrollData.net_pay,
            });
          } else {
            failedPayslips.push({
              employee_id,
              error: payrollData.error,
            });
          }
        } catch (empError) {
          console.error(
            `Error processing payroll for ${employee_id}:`,
            empError
          );
          failedPayslips.push({
            employee_id,
            error: empError.message,
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Payroll generated successfully for period ${start_date} to ${end_date}`,
        data: {
          payroll_header_id: payrollHeaderId,
          period: { start_date, end_date },
          successful_payslips: successfulPayslips,
          failed_payslips: failedPayslips,
          summary: {
            total_processed: successfulPayslips.length,
            total_failed: failedPayslips.length,
            total_gross_pay: successfulPayslips.reduce(
              (sum, p) => sum + p.net_pay,
              0
            ),
          },
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

// Helper function to calculate individual employee payroll
const calculateEmployeePayroll = async (employee_id, start_date, end_date) => {
  try {
    // Get employee details with contract
    const employee = await pool.query(
      `
      SELECT 
        e.employee_id,
        e.first_name,
        e.last_name,
        c.rate,
        c.rate_type,
        c.start_date as contract_start,
        c.end_date as contract_end,
        p.position_title,
        et.type_name as employment_type
      FROM employees e
      JOIN contracts c ON e.contract_id = c.contract_id
      JOIN positions p ON c.position_id = p.position_id
      JOIN employment_types et ON c.employment_type_id = et.employment_type_id
      WHERE e.employee_id = $1 AND e.status = 'active'
    `,
      [employee_id]
    );

    if (employee.rows.length === 0) {
      return { employee_id, error: "Employee not found or inactive" };
    }

    const emp = employee.rows[0];

    // Check contract validity
    if (
      emp.contract_start > end_date ||
      (emp.contract_end && emp.contract_end < start_date)
    ) {
      return { employee_id, error: "No active contract for this period" };
    }

    // Get attendance data for the period
    const attendanceData = await pool.query(
      `
      SELECT 
        COUNT(CASE WHEN a.is_present = true THEN 1 END) as days_worked,
        COUNT(CASE WHEN a.on_leave = true AND lt.is_paid = true THEN 1 END) as paid_leave_days,
        COUNT(CASE WHEN a.on_leave = true AND (lt.is_paid = false OR lt.is_paid IS NULL) THEN 1 END) as unpaid_leave_days,
        SUM(COALESCE(a.total_hours, 0)) as total_regular_hours,
        SUM(COALESCE(a.overtime_hours, 0)) as total_overtime_hours,
        COUNT(CASE WHEN a.is_late = true THEN 1 END) as late_days,
        COUNT(CASE WHEN a.is_holiday = true THEN 1 END) as holiday_days
      FROM attendance a
      LEFT JOIN leave_types lt ON a.leave_type_id = lt.leave_type_id
      WHERE a.employee_id = $1 
        AND a.date BETWEEN $2 AND $3
    `,
      [employee_id, start_date, end_date]
    );

    const attendance = attendanceData.rows[0];

    // Calculate pay based on rate type
    let grossPay = 0;
    let overtimePay = 0;
    let leavePay = 0;

    switch (emp.rate_type) {
      case "hourly":
        grossPay =
          (parseFloat(attendance.total_regular_hours) || 0) *
          parseFloat(emp.rate);
        overtimePay =
          (parseFloat(attendance.total_overtime_hours) || 0) *
          parseFloat(emp.rate) *
          1.5;
        leavePay =
          (parseInt(attendance.paid_leave_days) || 0) *
          parseFloat(emp.rate) *
          8; // 8 hours per day
        break;

      case "daily":
        grossPay =
          (parseInt(attendance.days_worked) || 0) * parseFloat(emp.rate);
        overtimePay =
          (parseFloat(attendance.total_overtime_hours) || 0) *
          (parseFloat(emp.rate) / 8) *
          1.5;
        leavePay =
          (parseInt(attendance.paid_leave_days) || 0) * parseFloat(emp.rate);
        break;

      case "monthly":
        // Pro-rate monthly salary
        const workingDaysInPeriod = await getWorkingDaysInPeriod(
          start_date,
          end_date
        );
        const dailyRate = parseFloat(emp.rate) / workingDaysInPeriod;
        grossPay =
          ((parseInt(attendance.days_worked) || 0) +
            (parseInt(attendance.paid_leave_days) || 0)) *
          dailyRate;
        // Monthly employees typically don't get overtime, but include if specified
        overtimePay = 0;
        leavePay = 0; // Already included in gross pay for monthly
        break;
    }

    // Calculate basic deductions (you can expand this)
    const deductions = calculateDeductions(
      grossPay + overtimePay,
      emp.employment_type
    );
    const netPay = grossPay + overtimePay + leavePay - deductions;

    return {
      employee_id,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      position: emp.position_title,
      employment_type: emp.employment_type,
      rate: emp.rate,
      rate_type: emp.rate_type,
      days_worked: parseInt(attendance.days_worked) || 0,
      paid_leave_days: parseInt(attendance.paid_leave_days) || 0,
      total_hours: parseFloat(attendance.total_regular_hours) || 0,
      overtime_hours: parseFloat(attendance.total_overtime_hours) || 0,
      late_days: parseInt(attendance.late_days) || 0,
      gross_pay: Math.round(grossPay * 100) / 100,
      overtime_pay: Math.round(overtimePay * 100) / 100,
      leave_pay: Math.round(leavePay * 100) / 100,
      deductions: Math.round(deductions * 100) / 100,
      net_pay: Math.round(netPay * 100) / 100,
    };
  } catch (error) {
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

// Helper function to calculate deductions
const calculateDeductions = (grossPay, employmentType) => {
  // Basic deduction calculation - you can expand this
  let deductions = 0;

  // Example: SSS, PhilHealth, HDMF deductions for regular employees
  if (employmentType === "Regular") {
    // SSS - simplified calculation
    if (grossPay >= 1000) {
      deductions += Math.min(grossPay * 0.045, 1350); // 4.5% capped at 1,350
    }

    // PhilHealth - simplified calculation
    if (grossPay >= 10000) {
      deductions += Math.min(grossPay * 0.025, 1800); // 2.5% capped at 1,800
    }

    // HDMF (Pag-IBIG) - simplified calculation
    if (grossPay >= 1000) {
      deductions += Math.min(grossPay * 0.02, 100); // 2% capped at 100
    }
  }

  return deductions;
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
        SUM(p.gross_pay) as total_gross_pay,
        SUM(p.overtime_pay) as total_overtime_pay,
        SUM(p.leave_pay) as total_leave_pay,
        SUM(p.deductions) as total_deductions,
        SUM(p.net_pay) as total_net_pay,
        AVG(p.net_pay) as average_net_pay
      FROM payroll_header ph
      LEFT JOIN payslip p ON ph.payroll_header_id = p.payroll_header_id
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
          SUM(p.gross_pay) as gross_pay,
          SUM(p.net_pay) as net_pay
        FROM payroll_header ph
        JOIN payslip p ON ph.payroll_header_id = p.payroll_header_id
        WHERE EXTRACT(YEAR FROM ph.start_date) = $1
        GROUP BY EXTRACT(MONTH FROM ph.start_date)
        ORDER BY month
      `,
        [year]
      );

      monthlyBreakdown = monthly.rows;
    }

    res.status(200).json({
      success: true,
      data: {
        summary: summary.rows[0],
        monthly_breakdown: monthlyBreakdown,
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
