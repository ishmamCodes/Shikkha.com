import express from 'express';
const router = express.Router();
import {
  logout,
  signup,
  login,
  getUserById,
  updateUserProfile,
  forgotPassword,
  searchUsers
} from '../controllers/authcontroller.js';
import Student from '../models/Student.js';
import Educator from '../models/Educator.js';
import authMiddleware from '../middleware/authMiddleware.js';

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.get('/id/:userId', authMiddleware, getUserById);
router.put('/:userId', authMiddleware, updateUserProfile);
router.post('/forgot-password', forgotPassword);

// Enhanced user search endpoint for messenger - use existing searchUsers from controller
router.get('/search', authMiddleware, searchUsers);

// Get minimal user details (optimized for messaging)
router.get('/for-messenger/:userId', authMiddleware, async (req, res) => {
  try {
    let user = await Student.findById(req.params.userId)
      .select('fullName email avatarUrl role')
      .lean();

    if (!user) {
      user = await Educator.findById(req.params.userId)
        .select('fullName email avatarUrl role')
        .lean();
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('[Get User Error]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
});

export default router;