import express from "express";
import {
  getAllAttendance,
  clockIn,
  clockOut,
  // startBreak,
  // endBreak,
  getTodayAllAttendance,
  getTodayAttendance,
  getEmployeeStatus,
  canTakeBreak,
  manualUpdate,
  createManualAttendance,
  getEmployeeAttendance,
} from "../controllers/attendanceController.js";

import verifyToken from "../middleware/verifyToken.js";
import { verifyAdmin, verifyStaff } from "../middleware/verifyRole.js";

const router = express.Router();

// Staff can view attendance, Admin can do everything
router.get("/", verifyToken, verifyStaff, getAllAttendance);
router.get(
  "/employee/:employee_id",
  verifyToken,
  verifyStaff,
  getEmployeeAttendance
);
router.get("/today-all", verifyToken, verifyStaff, getTodayAllAttendance);
router.get("/today/:employee_id", verifyToken, verifyStaff, getTodayAttendance);
router.get("/status/:employee_id", verifyToken, verifyStaff, getEmployeeStatus);
router.get("/can-break/:employee_id", verifyToken, verifyStaff, canTakeBreak);

// Only admin can manually update attendance
router.post(
  "/manual-update/:employee_id",
  verifyToken,
  verifyAdmin,
  manualUpdate
);

// Only admin can create manual attendance records
router.post("/manual-create", verifyToken, verifyAdmin, createManualAttendance);

// Employee attendance routes
router.post("/clock-in", verifyToken, clockIn);
router.post("/clock-out", verifyToken, clockOut);
// router.post("/break-start", verifyToken, startBreak);
// router.post("/break-end", verifyToken, endBreak);

export default router;
