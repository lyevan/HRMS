import express from "express";
import {
  getAllHolidays,
  getCurrentYearHolidays,
  getUpcomingHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  initializePhilippineHolidays,
} from "../controllers/holidaysController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyAdmin } from "../middleware/verifyRole.js";

const router = express.Router();

// Get all holidays
router.get("/", verifyToken, getAllHolidays);

// Get current year holidays
router.get("/current-year", verifyToken, getCurrentYearHolidays);

// Get upcoming holidays (next 30 days)
router.get("/upcoming", verifyToken, getUpcomingHolidays);

// Create a new holiday (admin only)
router.post("/", verifyToken, verifyAdmin, createHoliday);

// Update a holiday (admin only)
router.put("/:holiday_id", verifyToken, verifyAdmin, updateHoliday);

// Delete a holiday (admin only)
router.delete("/:holiday_id", verifyToken, verifyAdmin, deleteHoliday);

// Initialize default Philippine holidays (admin only)
router.post(
  "/initialize-philippine",
  verifyToken,
  verifyAdmin,
  initializePhilippineHolidays
);

export default router;
