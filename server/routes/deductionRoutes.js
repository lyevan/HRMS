import express from "express";
import {
  getDeductionTypes,
  createDeductionType,
  getEmployeeDeductions,
  getAllDeductions,
  createDeduction,
  updateDeduction,
  processDeductionPayment,
  getDeductionPayments,
  getActiveDeductionsForPayroll,
  deleteDeduction,
} from "../controllers/deductionController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyAdmin } from "../middleware/verifyRole.js";

const router = express.Router();

// Deduction Types Routes
router.get("/types", verifyToken, getDeductionTypes);
router.post("/types", verifyToken, verifyAdmin, createDeductionType);

// Deduction Management Routes
router.get("/employee/:employeeId", verifyToken, getEmployeeDeductions);
router.get("/all", verifyToken, verifyAdmin, getAllDeductions);
router.get("/payroll", verifyToken, verifyAdmin, getActiveDeductionsForPayroll);

router.post("/", verifyToken, verifyAdmin, createDeduction);
router.put("/:deductionId", verifyToken, verifyAdmin, updateDeduction);
router.delete("/:deductionId", verifyToken, verifyAdmin, deleteDeduction);

// Payment Processing Routes
router.post(
  "/:deductionId/payment",
  verifyToken,
  verifyAdmin,
  processDeductionPayment
);
router.get("/:deductionId/payments", verifyToken, getDeductionPayments);

export default router;
