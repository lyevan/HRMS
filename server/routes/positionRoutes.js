import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyStaff } from "../middleware/verifyRole.js";
import {
  getAllPositions,
  getAllPositionsByDepartment,
  getPositionById,
  addPosition,
  updatePosition,
  deletePosition,
} from "../controllers/positionController.js";

const router = Router();

router.get("/", verifyToken, verifyStaff, getAllPositions);
router.get(
  "/department/:deptId",
  verifyToken,
  verifyStaff,
  getAllPositionsByDepartment
);
router.get("/:id", verifyToken, verifyStaff, getPositionById);
router.post("/", verifyToken, verifyStaff, addPosition);
router.put("/:id", verifyToken, verifyStaff, updatePosition);
router.delete("/:id", verifyToken, verifyStaff, deletePosition);

export default router;
