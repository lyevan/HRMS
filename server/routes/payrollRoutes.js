import express from "express";
import {
  getAllPayrollHeaders,
  getPayrollHeaderById,
  getPayslipsByHeaderId,
  getEmployeePayslips,
  calculatePayroll,
  generatePayroll,
  deletePayroll,
  getPayrollSummary,
  debugAttendanceCalculation,
} from "../controllers/payrollController.js";

const router = express.Router();

// Payroll Headers (Periods) Routes
router.get("/headers", getAllPayrollHeaders);
router.get("/headers/:payroll_header_id", getPayrollHeaderById);

// Payslips Routes
router.get("/payslips/:payroll_header_id", getPayslipsByHeaderId); // Get all payslips for a payroll period

// Employee Payslips Routes
router.get("/employee/:employee_id", getEmployeePayslips);

// Payroll Calculation Routes
router.post("/calculate", calculatePayroll);
router.post("/generate", generatePayroll);

// Payroll Management Routes
router.delete("/headers/:payroll_header_id", deletePayroll);

// Summary/Dashboard Routes
router.get("/summary", getPayrollSummary);

// Debug Routes
router.get("/debug/attendance", debugAttendanceCalculation);

export default router;
