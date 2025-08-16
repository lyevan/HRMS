import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import { verifyAdmin, verifyStaff } from '../middlewares/verifyRole.js';

const router = express.Router();

// Placeholder routes - implement these controllers later
router.get('/', verifyToken, verifyStaff, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Employee routes - Coming soon!',
    data: []
  });
});

export default router;
