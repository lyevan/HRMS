import express from "express";
import {
  getAllEmployees,
  createEmployee,
  getEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();
import verifyToken from "../middleware/verifyToken.js";
import { verifyAdmin, verifyStaff } from "../middleware/verifyRole.js";

// Staff can view, create, and update employees, Admin can do everything
router.get("/", verifyToken, verifyStaff, getAllEmployees);
router.post("/get-employee", verifyToken, verifyStaff, getEmployee);
router.post("/", verifyToken, verifyStaff, createEmployee);
router.put("/update-employee", verifyToken, verifyStaff, updateEmployee);

// Only admin can delete employees
router.delete("/delete-employee", verifyToken, verifyAdmin, deleteEmployee);

export default router;
