import express from 'express';
import { 
  getSalesSummary, 
  getEducatorEarnings, 
  getStudentPurchases 
} from '../controllers/adminController.js';
import authMiddleware, { authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin sales management routes (require admin authentication)
router.get('/sales', authMiddleware, authorizeRole(['admin']), getSalesSummary);
router.get('/educator/:educatorId/earnings', authMiddleware, authorizeRole(['admin']), getEducatorEarnings);
router.get('/student/:studentId/purchases', authMiddleware, authorizeRole(['admin']), getStudentPurchases);

export default router;
