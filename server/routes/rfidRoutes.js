import express from "express";
import {
  pendingEnrollment,
  handleEnrollment,
  handleClocking,
  handleBreak,
  deleteRFID,
} from "../controllers/rfidController.js";

import verifyESP32 from "../middleware/verifyESP32.js";
import verifyToken from "../middleware/verifyToken.js";
import { verifyStaff } from "../middleware/verifyRole.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello this is the RFID Scanner Route");
});

// RFID enrollment routes (browser-based, no ESP32 auth needed)
// Staff and Admin can create pending enrollments
router.post("/", verifyToken, verifyStaff, pendingEnrollment);
router.delete("/", verifyToken, verifyStaff, deleteRFID);

// RFID attendance routes for ESP32 (require ESP32 authentication)
router.post("/enroll", verifyESP32, handleEnrollment);
router.post("/clock", verifyESP32, handleClocking);
router.post("/break", verifyESP32, handleBreak);

export default router;
