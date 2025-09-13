import express from "express";
import {
  getAllLeaveRequests,
  getEmployeeLeaveRequests,
  applyForLeave,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  getLeaveTypes,
  getEmployeeLeaveBalances,
  getEmployeeLeaveCalendar,
} from "../controllers/leaveController.js";

const router = express.Router();

// Leave Requests Routes
router.get("/requests", getAllLeaveRequests);
router.get("/requests/employee/:employee_id", getEmployeeLeaveRequests);
router.post("/requests/apply", applyForLeave);
router.patch("/requests/:leave_request_id/approve", approveLeaveRequest);
router.patch("/requests/:leave_request_id/reject", rejectLeaveRequest);
router.patch("/requests/:leave_request_id/cancel", cancelLeaveRequest);

// Leave Types Routes
router.get("/types", getLeaveTypes);

// Leave Balance Routes
router.get("/balance/:employee_id", getEmployeeLeaveBalances);

// Leave Calendar Routes
router.get("/calendar/:employee_id", getEmployeeLeaveCalendar);

export default router;
