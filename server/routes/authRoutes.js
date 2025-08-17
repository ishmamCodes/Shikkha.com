import express from 'express';
import {
  logout,
  signup,
  login,
  getUserById,
  updateUserProfile,
  forgotPassword,
  searchUsers,
} from '../controllers/authcontroller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Auth
router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgot-password', forgotPassword);

// Profile
router.get('/id/:userId', authMiddleware, getUserById);
router.put('/:id', authMiddleware, updateUserProfile);

// Search (email/fullName only, no legacy username)
router.get('/search', authMiddleware, searchUsers);

export default router;
