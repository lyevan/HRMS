import express from "express";
import {
  getEmployeeLoans,
  createLoan,
  updateLoan,
  getLoanPaymentHistory,
  calculateThirteenthMonth,
  processThirteenthMonth,
  batchCalculateThirteenthMonth,
  getDeductionTypes,
  getLoanSummaries,
} from "../controllers/loanController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyAdmin } from "../middleware/verifyRole.js";

const router = express.Router();

// Get loan summaries for all employees
router.get("/summaries", verifyToken, getLoanSummaries);

// Get all loans for an employee
router.get("/employee/:employee_id", verifyToken, getEmployeeLoans);

// Create a new loan/advance
router.post("/", verifyToken, verifyAdmin, createLoan);

// Update loan
router.put("/:deduction_id", verifyToken, verifyAdmin, updateLoan);

// Get loan payment history
router.get("/:deduction_id/payments", verifyToken, getLoanPaymentHistory);

// Calculate 13th month pay for specific employee
router.get(
  "/thirteenth-month/:employee_id/calculate",
  verifyToken,
  verifyAdmin,
  calculateThirteenthMonth
);

// Process (save) 13th month pay for specific employee
router.post(
  "/thirteenth-month/:employee_id/process",
  verifyToken,
  verifyAdmin,
  processThirteenthMonth
);

// Batch calculate 13th month pay for all employees
router.post(
  "/thirteenth-month/batch",
  verifyToken,
  verifyAdmin,
  batchCalculateThirteenthMonth
);

// Get all deduction types
router.get("/types", verifyToken, getDeductionTypes);

export default router;
