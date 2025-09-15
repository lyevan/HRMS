import { pool } from "../config/db.js";
import { AdvancedPayrollCalculator } from "../services/AdvancedPayrollCalculator.js";

// Get all loans and advances for an employee
export const getEmployeeLoans = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const result = await pool.query(
      `SELECT d.*, dt.name as deduction_type_name,
              (d.installments_total - d.installments_paid) as installments_remaining,
              CASE 
                WHEN d.remaining_balance <= 0 THEN 'PAID'
                WHEN d.is_active = false THEN 'INACTIVE'
                WHEN d.start_date > CURRENT_DATE THEN 'PENDING'
                WHEN d.end_date < CURRENT_DATE THEN 'EXPIRED'
                ELSE 'ACTIVE'
              END as status
       FROM deductions d
       JOIN deduction_types dt ON d.deduction_type_id = dt.deduction_type_id
       WHERE d.employee_id = $1 
         AND d.is_recurring = true
       ORDER BY d.created_at DESC`,
      [employee_id]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching employee loans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee loans",
      error: error.message,
    });
  }
};

// Create a new loan/advance
export const createLoan = async (req, res) => {
  try {
    const {
      employee_id,
      deduction_type_id,
      principal_amount,
      installment_amount,
      installments_total,
      interest_rate = 0,
      payment_frequency = "monthly",
      start_date,
      end_date,
      description,
    } = req.body;

    // Validate required fields
    if (
      !employee_id ||
      !deduction_type_id ||
      !principal_amount ||
      !installment_amount ||
      !start_date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "employee_id, deduction_type_id, principal_amount, installment_amount, and start_date are required",
      });
    }

    // Calculate end_date if not provided
    let calculatedEndDate = end_date;
    if (!end_date && installments_total) {
      const startDate = new Date(start_date);
      const months = installments_total;
      calculatedEndDate = new Date(
        startDate.setMonth(startDate.getMonth() + months)
      )
        .toISOString()
        .split("T")[0];
    }

    const result = await pool.query(
      `INSERT INTO deductions 
       (employee_id, deduction_type_id, amount, principal_amount, remaining_balance, 
        installment_amount, installments_total, payment_frequency, is_recurring, 
        start_date, end_date, interest_rate, description, auto_deduct)
       VALUES ($1, $2, $3, $4, $4, $5, $6, $7, true, $8, $9, $10, $11, true)
       RETURNING *`,
      [
        employee_id,
        deduction_type_id,
        installment_amount, // amount field (for compatibility)
        principal_amount,
        installment_amount,
        installments_total,
        payment_frequency,
        start_date,
        calculatedEndDate,
        interest_rate,
        description,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Loan created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating loan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create loan",
      error: error.message,
    });
  }
};

// Update loan
export const updateLoan = async (req, res) => {
  try {
    const { deduction_id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = [
      "installment_amount",
      "payment_frequency",
      "end_date",
      "description",
      "is_active",
      "auto_deduct",
    ];

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    updateFields.push("updated_at = NOW()");
    values.push(deduction_id);

    const query = `
      UPDATE deductions 
      SET ${updateFields.join(", ")}
      WHERE deduction_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating loan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update loan",
      error: error.message,
    });
  }
};

// Get loan payment history
export const getLoanPaymentHistory = async (req, res) => {
  try {
    const { deduction_id } = req.params;

    const result = await pool.query(
      `SELECT dp.*, d.description as loan_description, dt.name as loan_type
       FROM deduction_payments dp
       JOIN deductions d ON dp.deduction_id = d.deduction_id
       JOIN deduction_types dt ON d.deduction_type_id = dt.deduction_type_id
       WHERE dp.deduction_id = $1
       ORDER BY dp.payment_date DESC`,
      [deduction_id]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching loan payment history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
      error: error.message,
    });
  }
};

// Calculate 13th month pay for employee
export const calculateThirteenthMonth = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    const calculator = new AdvancedPayrollCalculator();
    const result = await calculator.calculateThirteenthMonthPay(
      employee_id,
      parseInt(year)
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error calculating 13th month pay:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate 13th month pay",
      error: error.message,
    });
  }
};

// Process 13th month pay (save to database)
export const processThirteenthMonth = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { year = new Date().getFullYear() } = req.body;

    const calculator = new AdvancedPayrollCalculator();
    const result = await calculator.processThirteenthMonthPay(
      employee_id,
      parseInt(year)
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error processing 13th month pay:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process 13th month pay",
      error: error.message,
    });
  }
};

// Batch calculate 13th month pay for all employees
export const batchCalculateThirteenthMonth = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.body;

    const calculator = new AdvancedPayrollCalculator();
    const results = await calculator.batchCalculateThirteenthMonthPay(
      parseInt(year)
    );

    res.status(200).json({
      success: true,
      message: `Calculated 13th month pay for ${results.length} employees`,
      data: results,
    });
  } catch (error) {
    console.error("Error in batch 13th month calculation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate 13th month pay for all employees",
      error: error.message,
    });
  }
};

// Get all deduction types
export const getDeductionTypes = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM deduction_types ORDER BY name"
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching deduction types:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deduction types",
      error: error.message,
    });
  }
};

// Get loan summaries for all employees
export const getLoanSummaries = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        e.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        d.name as department,
        COUNT(CASE WHEN deductions.is_active = true AND deductions.remaining_balance > 0 THEN 1 END) as active_loans,
        COUNT(deductions.deduction_id) as total_loans,
        COALESCE(SUM(CASE WHEN deductions.is_active = true THEN deductions.remaining_balance ELSE 0 END), 0) as total_outstanding,
        COALESCE(SUM(CASE WHEN deductions.is_active = true AND deductions.auto_deduct = true THEN deductions.installment_amount ELSE 0 END), 0) as monthly_deduction,
        MAX(dp.payment_date) as last_payment_date
       FROM employees e
       LEFT JOIN contracts c ON e.contract_id = c.contract_id
       LEFT JOIN positions p ON c.position_id = p.position_id
       LEFT JOIN departments d ON p.department_id = d.department_id
       LEFT JOIN deductions ON e.employee_id = deductions.employee_id AND deductions.is_recurring = true
       LEFT JOIN deduction_payments dp ON deductions.deduction_id = dp.deduction_id
       WHERE e.status = 'active'
       GROUP BY e.employee_id, e.first_name, e.last_name, d.name
       ORDER BY total_outstanding DESC, e.first_name, e.last_name`
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching loan summaries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch loan summaries",
      error: error.message,
    });
  }
};
