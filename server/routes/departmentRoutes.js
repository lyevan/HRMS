import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyAdmin } from "../middleware/verifyRole.js";
import {
  getAllDepartments,
  getDepartment,
  addDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentControllers.js";

const router = Router();

// Get all departments
router.get("/", verifyToken, verifyAdmin, getAllDepartments);

// Get specific department by ID
router.get("/:id", verifyToken, verifyAdmin, getDepartment);

// Create new department
router.post("/", verifyToken, verifyAdmin, addDepartment);

// Update department
router.put("/:id", verifyToken, verifyAdmin, updateDepartment);

// Delete department
router.delete("/:id", verifyToken, verifyAdmin, deleteDepartment);

export default router;
