import express from "express";
import {
  getAllPayrollConfigurations,
  getActiveConfigurations,
  upsertPayrollConfiguration,
  updatePayrollConfiguration,
  bulkUpdateConfigurations,
  deactivateConfiguration,
  initializeDefaultConfigurations,
} from "../controllers/payrollConfigurationController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyAdmin } from "../middleware/verifyRole.js";

const router = express.Router();

// Get all configurations (admin only)
router.get("/all", verifyToken, verifyAdmin, getAllPayrollConfigurations);

// Get active configurations for a specific date
router.get("/active", verifyToken, getActiveConfigurations);

// Create or update a single configuration (admin only)
router.post("/", verifyToken, verifyAdmin, upsertPayrollConfiguration);

// Update a single configuration (admin only)
router.put("/update", verifyToken, verifyAdmin, updatePayrollConfiguration);

// Bulk update configurations (admin only)
router.post("/bulk", verifyToken, verifyAdmin, bulkUpdateConfigurations);

// Deactivate configuration (admin only)
router.patch(
  "/:config_id/deactivate",
  verifyToken,
  verifyAdmin,
  deactivateConfiguration
);

// Initialize default configurations (admin only)
router.post(
  "/initialize",
  verifyToken,
  verifyAdmin,
  initializeDefaultConfigurations
);

export default router;
