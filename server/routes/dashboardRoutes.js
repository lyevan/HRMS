import Router from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyAdmin, verifyStaff } from "../middleware/verifyRole.js";
import {
  getAdminDashboard,
  getStaffDashboard,
  getEmployeeDashboard,
} from "../controllers/dashboardController.js";

const router = Router();

router.get("/admin", verifyToken, verifyAdmin, getAdminDashboard);
router.get("/staff", verifyToken, verifyStaff, getStaffDashboard);
router.get("/employee", verifyToken, getEmployeeDashboard);

export default router;
