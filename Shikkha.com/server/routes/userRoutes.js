import express from 'express';
const router = express.Router();
import {
  logout,
  signup,
  login,
  getUserById,
  updateUserProfile,
  forgotPassword
} from '../controllers/authcontroller.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

// Auth routes (unchanged)
router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.get('/id/:userId', authMiddleware, getUserById);
router.put('/:id', authMiddleware, updateUserProfile);
router.post('/forgot-password', forgotPassword);

// Enhanced user search endpoint for messenger
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const users = await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: req.user.id } // Exclude current user
    }).select('username role _id');
    
    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get minimal user details (optimized for messaging)
router.get('/for-messenger/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username name avatar role')
      .lean();

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