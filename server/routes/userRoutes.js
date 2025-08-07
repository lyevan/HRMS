import express from "express";
import {
  getAllUsers,
  getUser,
  verifyUser,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  logoutUser,
} from "../controllers/userController.js";
import verifyToken from "../middleware/verifyToken.js";
import { verifyAdmin } from "../middleware/verifyRole.js";

const router = express.Router();

// Only admin can manage user accounts
router.get("/", verifyToken, verifyAdmin, getAllUsers);
router.get("/:id", verifyToken, verifyAdmin, getUser);
router.post("/", verifyToken, verifyAdmin, createUser);
router.put("/:id", verifyToken, verifyAdmin, updateUser);
router.delete("/:id", verifyToken, verifyAdmin, deleteUser);

// Public routes
router.post("/login", loginUser);
router.post("/logout", verifyToken, logoutUser);
router.post("/verify", verifyToken, verifyUser);

export default router;
