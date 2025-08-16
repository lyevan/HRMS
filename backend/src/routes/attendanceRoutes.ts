import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

// Placeholder routes
router.get('/', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Attendance routes - Coming soon!',
    data: []
  });
});

export default router;
