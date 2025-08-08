import express from "express";
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

//Create pending employee record and return invitation link with token
router.post("/pending", verifyToken, verifyStaff, createPendingEmployee);
router.get(
  "/complete-registration/:token",
  verifyInviteToken,
  returnEmploymentData
);
router.post(
  "/complete-registration/:token",
  verifyInviteToken,
  completeRegistration
);
router.get("/pending", verifyToken, verifyStaff, getAllPendingEmployees);
router.post("/review/:id", verifyToken, verifyStaff, reviewPendingEmployee);

router.post("/approve", verifyToken, verifyAdmin, approvePendingEmployee);
router.post("/reject", verifyToken, verifyStaff, rejectPendingEmployee);

export default router;
