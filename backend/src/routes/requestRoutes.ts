import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
const router = express.Router();
router.get('/', verifyToken, (req, res) => {
  res.status(200).json({ success: true, message: 'Request routes - Coming soon!', data: [] });
});
export default router;
