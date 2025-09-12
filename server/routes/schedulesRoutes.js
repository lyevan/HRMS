import express from "express";
import { getAllSchedules, addSchedule, updateSchedule, deleteSchedule, bulkAssignSchedule } from "../controllers/schedulesController.js";
import {verifyToken} from "../middleware/verifyToken.js";
import { verifyAdmin, verifyStaff } from "../middleware/verifyRole.js";

const router = express.Router();

router.get("/", verifyToken, verifyStaff, getAllSchedules);
router.post("/", verifyToken, verifyAdmin, addSchedule);
router.put("/:id", verifyToken, verifyAdmin, updateSchedule);
router.delete("/:id", verifyToken, verifyAdmin, deleteSchedule);


router.post("/bulk-assign", verifyToken, verifyAdmin, bulkAssignSchedule);

export default router;