import express from "express";
import { verifyInviteToken, verifyToken } from "../middleware/verifyToken.js";
import { verifyStaff } from "../middleware/verifyRole.js";
import {
  createPendingEmployee,
  returnEmploymentData,
  completeRegistration,
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
router.patch("/approve-pending", approvePendingEmployee);
router.patch("/reject-pending", rejectPendingEmployee);

export default router;
