import express from 'express';
import {
  getAllUsers,
  getUser,
  createUser,
  loginUser,
  logoutUser,
  verifyUser,
} from '../controllers/userController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { verifyAdmin } from '../middlewares/verifyRole.js';

const router = express.Router();

// Public routes
router.post('/login', loginUser);
router.post('/logout', verifyToken, logoutUser);
router.post('/verify', verifyToken, verifyUser);

// Admin only routes
router.get('/', verifyToken, verifyAdmin, getAllUsers);
router.get('/:id', verifyToken, verifyAdmin, getUser);
router.post('/', verifyToken, verifyAdmin, createUser);

export default router;
