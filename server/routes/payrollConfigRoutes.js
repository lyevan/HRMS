import express from "express";
import {
  getAllConfigs,
  getConfigsByType,
  updateConfig,
  getConfig,
  syncConfiguration,
  getEmployeeOverrides,
  createEmployeeOverride,
  updateEmployeeOverride,
  deleteEmployeeOverride,
} from "../controllers/payrollConfigController.js";

const router = express.Router();

// Payroll configuration routes (2025 database schema)
router.get("/config", getAllConfigs);
router.get("/config/:configType", getConfigsByType);
router.get("/config/:configType/:configKey", getConfig);
router.put("/config/:configType/:configKey", updateConfig);
router.post("/config/sync", syncConfiguration);

// Employee schedule override routes
router.get("/employee-overrides/:employee_id", getEmployeeOverrides);
router.post("/employee-overrides", createEmployeeOverride);
router.put("/employee-overrides/:override_id", updateEmployeeOverride);
router.delete("/employee-overrides/:override_id", deleteEmployeeOverride);

export default router;
//
