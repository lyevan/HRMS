import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  generateAttendanceTemplate,
  generateCSVTemplate,
  uploadAttendanceFile,
  processAttendanceFile,
  submitAttendanceRecords,
} from "../controllers/bulkUploadController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/temp/");

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

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

// Template download routes
router.get("/template/excel", verifyToken, generateAttendanceTemplate);
router.get("/template/csv", verifyToken, generateCSVTemplate);

// NEW WORKFLOW: File upload routes
router.post(
  "/process",
  verifyToken,
  upload.single("attendanceFile"),
  processAttendanceFile
);

router.post("/submit", verifyToken, submitAttendanceRecords);

// OLD WORKFLOW: File upload route (kept for backward compatibility)
router.post(
  "/upload",
  verifyToken,
  upload.single("attendanceFile"),
  uploadAttendanceFile
);

export default router;
