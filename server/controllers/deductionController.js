import { pool } from "../config/db.js";
import dayjs from "dayjs";

// Get all deduction types
export const getDeductionTypes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        deduction_type_id,
        name,
        description,
        created_at,
        updated_at
      FROM deduction_types 
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      deductionTypes: result.rows,
    });
  } catch (error) {
    console.error("Error fetching deduction types:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deduction types",
    });
  }
};

// Create a new deduction type
export const createDeductionType = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Deduction type name is required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO deduction_types (name, description)
      VALUES ($1, $2)
      RETURNING *
    `,
      [name, description]
    );

    res.status(201).json({
      success: true,
      deductionType: result.rows[0],
      message: "Deduction type created successfully",
    });
  } catch (error) {
    console.error("Error creating deduction type:", error);

    if (error.code === "23505") {
      // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: "Deduction type with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create deduction type",
    });
  }
};

// Get all deductions for an employee
export const getEmployeeDeductions = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status = "active" } = req.query;

    let statusCondition = "";
    if (status === "active") {
      statusCondition = "AND d.is_active = true";
    } else if (status === "inactive") {
      statusCondition = "AND d.is_active = false";
    }

    const result = await pool.query(
      `
      SELECT 
        d.deduction_id,
        d.employee_id,
        d.amount,
        d.description,
        d.date,
        d.is_active,
        d.principal_amount,
        d.remaining_balance,
        d.installment_amount,
        d.installments_total,
        d.installments_paid,
        d.start_date,
        d.end_date,
        d.interest_rate,
        d.payment_frequency,
        d.is_recurring,
        d.auto_deduct,
        d.next_deduction_date,
        dt.name as deduction_type_name,
        dt.description as deduction_type_description,
        e.first_name,
        e.last_name
      FROM deductions d
      JOIN deduction_types dt ON d.deduction_type_id = dt.deduction_type_id
      JOIN employees e ON d.employee_id = e.employee_id
      WHERE d.employee_id = $1 ${statusCondition}
      ORDER BY d.created_at DESC
    `,
      [employeeId]
    );

    res.json({
      success: true,
      deductions: result.rows,
    });
  } catch (error) {
    console.error("Error fetching employee deductions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee deductions",
    });
  }
};

// Get all deductions (for admin view)
export const getAllDeductions = async (req, res) => {
  try {
    const { status = "all", page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let statusCondition = "";
    if (status === "active") {
      statusCondition = "WHERE d.is_active = true";
    } else if (status === "inactive") {
      statusCondition = "WHERE d.is_active = false";
    }

    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM deductions d
      JOIN deduction_types dt ON d.deduction_type_id = dt.deduction_type_id
      JOIN employees e ON d.employee_id = e.employee_id
      ${statusCondition}
    `);

    // Get paginated data
    const result = await pool.query(
      `
      SELECT 
        d.deduction_id,
        d.employee_id,
        d.amount,
        d.description,
        d.date,
        d.is_active,
        d.principal_amount,
        d.remaining_balance,
        d.installment_amount,
        d.installments_total,
        d.installments_paid,
        d.start_date,
        d.end_date,
        d.interest_rate,
        d.payment_frequency,
        d.is_recurring,
        d.auto_deduct,
        d.next_deduction_date,
        dt.name as deduction_type_name,
        dt.description as deduction_type_description,
        e.first_name,
        e.last_name,
        e.email
      FROM deductions d
      JOIN deduction_types dt ON d.deduction_type_id = dt.deduction_type_id
      JOIN employees e ON d.employee_id = e.employee_id
      ${statusCondition}
      ORDER BY d.created_at DESC
      LIMIT $1 OFFSET $2
    `,
      [limit, offset]
    );

    res.json({
      success: true,
      deductions: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all deductions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deductions",
    });
  }
};

// Create a new deduction/loan
export const createDeduction = async (req, res) => {
  try {
    const {
      employee_id,
      deduction_type_id,
      amount,
      description,
      principal_amount,
      installment_amount,
      installments_total,
      start_date,
      end_date,
      interest_rate = 0,
      payment_frequency = "monthly",
      is_recurring = false,
      auto_deduct = true,
    } = req.body;

    // Validation
    if (!employee_id || !deduction_type_id || !amount) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, deduction type, and amount are required",
      });
    }

    // Calculate remaining balance and next deduction date
    const remaining_balance = principal_amount || amount;
    const next_deduction_date = start_date || dayjs().format("YYYY-MM-DD");

    const result = await pool.query(
      `
      INSERT INTO deductions (
        employee_id,
        deduction_type_id,
        amount,
        description,
        principal_amount,
        remaining_balance,
        installment_amount,
        installments_total,
        start_date,
        end_date,
        interest_rate,
        payment_frequency,
        is_recurring,
        auto_deduct,
        next_deduction_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `,
      [
        employee_id,
        deduction_type_id,
        amount,
        description,
        principal_amount,
        remaining_balance,
        installment_amount,
        installments_total || 1,
        start_date,
        end_date,
        interest_rate,
        payment_frequency,
        is_recurring,
        auto_deduct,
        next_deduction_date,
      ]
    );

    res.status(201).json({
      success: true,
      deduction: result.rows[0],
      message: "Deduction created successfully",
    });
  } catch (error) {
    console.error("Error creating deduction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create deduction",
    });
  }
};

// Update a deduction
export const updateDeduction = async (req, res) => {
  try {
    const { deductionId } = req.params;
    const {
      amount,
      description,
      installment_amount,
      installments_total,
      end_date,
      interest_rate,
      payment_frequency,
      is_recurring,
      auto_deduct,
      is_active,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE deductions SET
        amount = COALESCE($1, amount),
        description = COALESCE($2, description),
        installment_amount = COALESCE($3, installment_amount),
        installments_total = COALESCE($4, installments_total),
        end_date = COALESCE($5, end_date),
        interest_rate = COALESCE($6, interest_rate),
        payment_frequency = COALESCE($7, payment_frequency),
        is_recurring = COALESCE($8, is_recurring),
        auto_deduct = COALESCE($9, auto_deduct),
        is_active = COALESCE($10, is_active),
        updated_at = NOW()
      WHERE deduction_id = $11
      RETURNING *
    `,
      [
        amount,
        description,
        installment_amount,
        installments_total,
        end_date,
        interest_rate,
        payment_frequency,
        is_recurring,
        auto_deduct,
        is_active,
        deductionId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Deduction not found",
      });
    }

    res.json({
      success: true,
      deduction: result.rows[0],
      message: "Deduction updated successfully",
    });
  } catch (error) {
    console.error("Error updating deduction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update deduction",
    });
  }
};

// Process deduction payment
export const processDeductionPayment = async (req, res) => {
  try {
    const { deductionId } = req.params;
    const { amount_paid, payroll_period_start, payroll_period_end, notes } =
      req.body;

    if (!amount_paid || amount_paid <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid payment amount is required",
      });
    }

    // Get current deduction details
    const deductionResult = await pool.query(
      `
      SELECT * FROM deductions WHERE deduction_id = $1 AND is_active = true
    `,
      [deductionId]
    );

    if (deductionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Active deduction not found",
      });
    }

    const deduction = deductionResult.rows[0];

    // Calculate new remaining balance
    const newRemainingBalance =
      parseFloat(deduction.remaining_balance) - parseFloat(amount_paid);
    const newInstallmentsPaid = deduction.installments_paid + 1;

    // Start transaction
    await pool.query("BEGIN");

    try {
      // Insert payment record
      await pool.query(
        `
        INSERT INTO deduction_payments (
          deduction_id,
          employee_id,
          payment_date,
          amount_paid,
          remaining_balance_after,
          payroll_period_start,
          payroll_period_end,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
        [
          deductionId,
          deduction.employee_id,
          dayjs().format("YYYY-MM-DD"),
          amount_paid,
          Math.max(0, newRemainingBalance),
          payroll_period_start,
          payroll_period_end,
          notes,
        ]
      );

      // Update deduction
      const updateValues = [
        Math.max(0, newRemainingBalance),
        newInstallmentsPaid,
        deductionId,
      ];

      let updateQuery = `
        UPDATE deductions SET
          remaining_balance = $1,
          installments_paid = $2,
          updated_at = NOW()
      `;

      // If fully paid or reached installment limit, mark as inactive
      if (
        newRemainingBalance <= 0 ||
        newInstallmentsPaid >= deduction.installments_total
      ) {
        updateQuery += `, is_active = false`;
      } else if (deduction.payment_frequency && deduction.auto_deduct) {
        // Calculate next deduction date
        const nextDate = calculateNextDeductionDate(
          deduction.next_deduction_date,
          deduction.payment_frequency
        );
        updateQuery += `, next_deduction_date = '${nextDate}'`;
      }

      updateQuery += ` WHERE deduction_id = $3 RETURNING *`;

      const updatedDeduction = await pool.query(updateQuery, updateValues);

      await pool.query("COMMIT");

      res.json({
        success: true,
        deduction: updatedDeduction.rows[0],
        message: "Payment processed successfully",
      });
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error processing deduction payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process payment",
    });
  }
};

// Get deduction payment history
export const getDeductionPayments = async (req, res) => {
  try {
    const { deductionId } = req.params;

    const result = await pool.query(
      `
      SELECT 
        dp.*,
        d.description as deduction_description,
        dt.name as deduction_type_name,
        e.first_name,
        e.last_name
      FROM deduction_payments dp
      JOIN deductions d ON dp.deduction_id = d.deduction_id
      JOIN deduction_types dt ON d.deduction_type_id = dt.deduction_type_id
      JOIN employees e ON dp.employee_id = e.employee_id
      WHERE dp.deduction_id = $1
      ORDER BY dp.payment_date DESC
    `,
      [deductionId]
    );

    res.json({
      success: true,
      payments: result.rows,
    });
  } catch (error) {
    console.error("Error fetching deduction payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
    });
  }
};

// Get active deductions for payroll processing
export const getActiveDeductionsForPayroll = async (req, res) => {
  try {
    const { payrollPeriodStart, payrollPeriodEnd } = req.query;

    if (!payrollPeriodStart || !payrollPeriodEnd) {
      return res.status(400).json({
        success: false,
        message: "Payroll period start and end dates are required",
      });
    }

    const result = await pool.query(
      `
      SELECT 
        d.*,
        dt.name as deduction_type_name,
        e.first_name,
        e.last_name,
        e.email
      FROM deductions d
      JOIN deduction_types dt ON d.deduction_type_id = dt.deduction_type_id
      JOIN employees e ON d.employee_id = e.employee_id
      WHERE d.is_active = true 
        AND d.auto_deduct = true
        AND d.remaining_balance > 0
        AND (d.next_deduction_date <= $2 OR d.next_deduction_date IS NULL)
        AND (d.start_date <= $2 OR d.start_date IS NULL)
        AND (d.end_date >= $1 OR d.end_date IS NULL)
      ORDER BY d.employee_id, d.created_at
    `,
      [payrollPeriodStart, payrollPeriodEnd]
    );

    res.json({
      success: true,
      deductions: result.rows,
    });
  } catch (error) {
    console.error("Error fetching active deductions for payroll:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active deductions",
    });
  }
};

// Helper function to calculate next deduction date
const calculateNextDeductionDate = (currentDate, frequency) => {
  const current = dayjs(currentDate);

  switch (frequency) {
    case "weekly":
      return current.add(1, "week").format("YYYY-MM-DD");
    case "bi-weekly":
      return current.add(2, "weeks").format("YYYY-MM-DD");
    case "semi-monthly":
      // If 1st-15th, next is 16th. If 16th-end, next is 1st of next month
      const day = current.date();
      if (day <= 15) {
        return current.date(16).format("YYYY-MM-DD");
      } else {
        return current.add(1, "month").date(1).format("YYYY-MM-DD");
      }
    case "monthly":
    default:
      return current.add(1, "month").format("YYYY-MM-DD");
  }
};

// Delete deduction
export const deleteDeduction = async (req, res) => {
  try {
    const { deductionId } = req.params;

    // Check if deduction has payments
    const paymentsResult = await pool.query(
      `
      SELECT COUNT(*) as payment_count FROM deduction_payments WHERE deduction_id = $1
    `,
      [deductionId]
    );

    if (parseInt(paymentsResult.rows[0].payment_count) > 0) {
      // If has payments, just mark as inactive
      const result = await pool.query(
        `
        UPDATE deductions SET is_active = false, updated_at = NOW()
        WHERE deduction_id = $1
        RETURNING *
      `,
        [deductionId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Deduction not found",
        });
      }

      res.json({
        success: true,
        message: "Deduction marked as inactive (has payment history)",
      });
    } else {
      // If no payments, safe to delete
      const result = await pool.query(
        `
        DELETE FROM deductions WHERE deduction_id = $1 RETURNING *
      `,
        [deductionId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Deduction not found",
        });
      }

      res.json({
        success: true,
        message: "Deduction deleted successfully",
      });
    }
  } catch (error) {
    console.error("Error deleting deduction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete deduction",
    });
  }
};
