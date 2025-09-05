import express from "express";
import multer from "multer";
import { verifyInviteToken, verifyToken } from "../middleware/verifyToken.js";
import { verifyStaff, verifyAdmin } from "../middleware/verifyRole.js";
import {
  createPendingEmployee,
  returnEmploymentData,
  completeRegistration,
  reviewPendingEmployee,
  approvePendingEmployee,
  rejectPendingEmployee,
  getAllPendingEmployees,
} from "../controllers/invitationController.js";

const router = express.Router();

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

//Create pending employee record and return invitation link with token
router.post("/pending", verifyToken, verifyStaff, createPendingEmployee);
router.get("/employment-data/:token", verifyInviteToken, returnEmploymentData);
router.get(
  "/complete-registration/:token",
  verifyInviteToken,
  returnEmploymentData
);
router.post(
  "/complete-registration/:token",
  verifyInviteToken,
  upload.single("avatar"),
  completeRegistration
);
router.get("/pending", verifyToken, verifyStaff, getAllPendingEmployees);
router.post("/review/:id", verifyToken, verifyStaff, reviewPendingEmployee);

router.post("/approve", verifyToken, verifyAdmin, approvePendingEmployee);
router.post("/reject/:id", verifyToken, verifyStaff, rejectPendingEmployee);

export default router;
