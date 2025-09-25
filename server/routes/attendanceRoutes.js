import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
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
  deleteAttendanceRecord,
  bulkDeleteAttendanceRecords,
  createManualAttendance,
  getEmployeeAttendance,
  processTimesheet,
  getUnconsumedTimesheet,
  consumeTimesheet,
  getAttendanceByTimesheet,
  bulkExcelAttendance,
} from "../controllers/attendanceController.js";

import verifyToken from "../middleware/verifyToken.js";
import { verifyAdmin, verifyStaff } from "../middleware/verifyRole.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for bulk attendance file uploads
// Use memory storage for Vercel compatibility (no local filesystem access)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv", // .csv
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

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
router.put(
  "/manual-update/:attendance_id",
  verifyToken,
  verifyAdmin,
  manualUpdate
);

// Only admin can bulk delete attendance records
router.delete(
  "/bulk-delete",
  verifyToken,
  verifyAdmin,
  bulkDeleteAttendanceRecords
);

// Only admin can delete attendance records
router.delete(
  "/:attendance_id",
  verifyToken,
  verifyAdmin,
  deleteAttendanceRecord
);

// Only admin can create manual attendance records
router.post("/manual-create", verifyToken, verifyAdmin, createManualAttendance);

// Bulk Excel attendance upload (Admin only)
router.post(
  "/bulk-excel",
  verifyToken,
  verifyAdmin,
  upload.single("attendanceFile"),
  bulkExcelAttendance
);

router.patch("/process-timesheet", verifyToken, verifyAdmin, processTimesheet);
router.patch(
  "/consume-timesheet/:timesheet_id",
  verifyToken,
  verifyAdmin,
  consumeTimesheet
);
router.get("/get-timesheets", getUnconsumedTimesheet);
router.get(
  "/timesheet/:timesheet_id",
  verifyToken,
  verifyStaff,
  getAttendanceByTimesheet
);
// Employee attendance routes
router.post("/clock-in", verifyToken, clockIn);
router.post("/clock-out", verifyToken, clockOut);

/* Sample Response for Bulk Excel Upload
{
  "success": true,
  "message": "Bulk processing completed: 98 successful, 2 errors",
  "data": {
    "total_processed": 100,
    "successful_count": 98,
    "error_count": 2,
    "successful_records": [
      {
        "employee_id": "2025-00001",
        "date": "2025-08-24",
        "attendance_id": 145,
        "total_hours": 10,
        "overtime_hours": 2,
        "payroll_summary": {
          "regular_hours": 0,
          "night_diff_hours": 8,
          "rest_day_hours": 10,
          "edge_cases": { "is_ultimate_case_regular": true }
        }
      }
    ],
    "errors": [
      {
        "row": 15,
        "employee_id": "2025-00099",
        "date": "2025-08-24", 
        "error": "Employee has approved leave: Sick Leave (2025-08-24 to 2025-08-26)"
      }
    ]
  }
}
*/

// router.post("/break-start", verifyToken, startBreak);
// router.post("/break-end", verifyToken, endBreak);
// TODO
export default router;
