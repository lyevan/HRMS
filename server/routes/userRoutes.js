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
  sendOTP,
  verifyOTPAndLogin,
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

/**
 * @openapi
 * /login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *     responses:
 *       200:
 *         description: Successful login, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/login", loginUser);
router.post("/logout", verifyToken, logoutUser);
router.post("/verify", verifyToken, verifyUser);

// OTP Authentication routes
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTPAndLogin);

export default router;
