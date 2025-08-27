import express from 'express';
import { generalQuery } from '../controllers/aiController.js';
// If you want to require login, uncomment next line:
// import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public (no auth):
router.post('/query', generalQuery);

// If you want only logged-in users to use it, replace line above with:
// router.post('/query', authMiddleware, generalQuery);

export default router;
