import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyAdmin } from "../middleware/verifyRole.js";
import { getAllEmploymentTypes } from "../controllers/employmentTypeController.js";

const router = Router();
router.get("/", verifyToken, verifyAdmin, getAllEmploymentTypes);

export default router;
