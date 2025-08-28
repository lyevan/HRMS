import express from "express";
import {
  getAllEmployees,
  createEmployee,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  uploadOwnAvatar,
  uploadAvatar,
  deleteAvatar,
} from "../controllers/employeeController.js";
import multer from "multer";

const router = express.Router();
import verifyToken from "../middleware/verifyToken.js";
import { verifyAdmin, verifyStaff } from "../middleware/verifyRole.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

router.post(
  "/upload-own-avatar",
  verifyToken,
  upload.single("avatar"),
  uploadOwnAvatar
);

// Staff can view, create, and update employees, Admin can do everything
router.post(
  "/upload-avatar",
  verifyToken,
  verifyStaff,
  upload.single("avatar"),
  uploadAvatar
);
router.delete(
  "/delete-avatar/:employeeId",
  verifyToken,
  verifyStaff,
  deleteAvatar
);
router.get("/", verifyToken, verifyStaff, getAllEmployees);
router.post("/get-employee", verifyToken, verifyStaff, getEmployee);
router.post("/", verifyToken, verifyStaff, createEmployee);
router.put("/:id", verifyToken, verifyStaff, updateEmployee);

// Only admin can delete employees
router.delete("/delete-employee", verifyToken, verifyAdmin, deleteEmployee);

export default router;
