import express from "express";
import {
  getAllRequests,
  getRequestDetails,
  createRequest,
  approveRequest,
  rejectRequest,
  cancelRequest,
  getRequestStats,
} from "../controllers/requestController.js";

import verifyToken from "../middleware/verifyToken.js";
import { verifyAdmin, verifyStaff } from "../middleware/verifyRole.js";

const router = express.Router();

// Get all requests with filtering (staff and above)
router.get("/", verifyToken, verifyStaff, getAllRequests);

// Get request statistics (staff and above)
router.get("/stats", verifyToken, verifyStaff, getRequestStats);

// Get specific request details (staff and above)
router.get("/:request_id", verifyToken, verifyStaff, getRequestDetails);

// Create a new request (all authenticated users)
router.post("/", verifyToken, createRequest);

// Approve a request (admin only)
router.put("/:request_id/approve", verifyToken, verifyAdmin, approveRequest);

// Reject a request (admin only)
router.put("/:request_id/reject", verifyToken, verifyAdmin, rejectRequest);

// Cancel a request (employee can cancel their own)
router.put("/:request_id/cancel", verifyToken, cancelRequest);

export default router;
