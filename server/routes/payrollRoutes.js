import express from "express";
import {
  getAllPayrollHeaders,
  getPayrollHeaderById,
  getEmployeePayslips,
  calculatePayroll,
  generatePayroll,
  deletePayroll,
  getPayrollSummary,
} from "../controllers/payrollController.js";

const router = express.Router();

// Payroll Headers (Periods) Routes
router.get("/headers", getAllPayrollHeaders);
router.get("/headers/:payroll_header_id", getPayrollHeaderById);

// Employee Payslips Routes
router.get("/employee/:employee_id", getEmployeePayslips);

// Payroll Calculation Routes
router.post("/calculate", calculatePayroll);
router.post("/generate", generatePayroll);

// Payroll Management Routes
router.delete("/headers/:payroll_header_id", deletePayroll);

// Summary/Dashboard Routes
router.get("/summary", getPayrollSummary);

export default router;
