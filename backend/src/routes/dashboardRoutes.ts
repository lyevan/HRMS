import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import { verifyAdmin } from '../middlewares/verifyRole.js';

const router = express.Router();

// Admin dashboard
router.get('/admin', verifyToken, verifyAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin dashboard data - Coming soon!',
    data: {
      employees: { total: 0, active: 0 },
      attendance: { present_today: 0 },
      pending: { total_pending: 0 }
    }
  });
});

// Employee dashboard  
router.get('/employee', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Employee dashboard data - Coming soon!',
    data: {
      employee: {},
      attendance_summary: {},
      recent_attendance: []
    }
  });
});

export default router;
