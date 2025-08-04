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
router.get('/id/:userId', getUserById);
router.put('/:id', updateUserProfile);
router.post('/forgot-password', forgotPassword);

// Enhanced user search endpoint for messenger
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'Search query must be at least 2 characters long' 
      });
    }

    // Search by username, email, or name (case insensitive)
    const users = await User.find({
      $and: [
        { 
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } }
          ]
        },
        { _id: { $ne: req.user._id } } // Exclude current user
      ]
    })
    .select('-password -__v -createdAt -updatedAt') // Exclude sensitive fields
    .limit(10)
    .lean();

    if (!users.length) {
      return res.status(200).json({ 
        success: true,
        message: 'No users found',
        data: [] 
      });
    }

    res.status(200).json({
      success: true,
      data: users.map(user => ({
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar || null
      }))
    });

  } catch (err) {
    console.error('[User Search Error]', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to search users',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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