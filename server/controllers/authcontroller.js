import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Educator from "../models/Educator.js";

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * @desc    Register a new user (student/educator)
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = async (req, res) => {
  try {
    const { username, password, birthday, role } = req.body;
    const educatorProfile = req.body.educatorProfile; // optional extended educator fields

    // Validation
    if (!username || !password || !birthday || !role) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      password: hashedPassword,
      birthday,
      role
    });

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    // If educator role, create empty profile (or with provided details)
    if (role === 'educator') {
      await Educator.findOneAndUpdate(
        { user: user._id },
        {
          $set: {
            name: educatorProfile?.name || '',
            email: educatorProfile?.email || '',
            phone: educatorProfile?.phone || '',
            avatarUrl: educatorProfile?.avatarUrl || '',
            bio: educatorProfile?.bio || '',
            experienceYears: educatorProfile?.experienceYears || 0,
            experienceDescription: educatorProfile?.experienceDescription || '',
            educationBackground: Array.isArray(educatorProfile?.educationBackground) ? educatorProfile.educationBackground : [],
            achievements: Array.isArray(educatorProfile?.achievements) ? educatorProfile.achievements : [],
            certifications: Array.isArray(educatorProfile?.certifications) ? educatorProfile.certifications : [],
            socialLinks: educatorProfile?.socialLinks || { linkedin: '', twitter: '', website: '' },
          },
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('[Signup Error]', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please provide username, password, and role"
      });
    }

    let user;
    // Check for user based on role
    if (role === 'educator') {
      user = await Educator.findOne({ email: username }).select('+password');
    } else if (role === 'student') {
      user = await User.findOne({ username: username, role: 'student' }).select('+password');
    } else {
        return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Create token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Reset user password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { username, birthday, newPassword } = req.body;

    // Validate input
    if (!username || !birthday || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Find user
    const user = await User.findOne({ username, birthday });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or birthday doesn't match"
      });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error('[Password Reset Error]', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/auth/id/:userId
 * @access  Private
 */
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      });
    }

    // Find user
    const user = await User.findById(userId).select('-password -__v');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('[Get User Error]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/:id
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      });
    }

    // Prevent password updates through this route
    if (updateData.password) {
      return res.status(400).json({
        success: false,
        message: "Use password reset endpoint to change password"
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    console.error('[Update Profile Error]', error);
    res.status(500).json({
      success: false,
      message: 'Profile update failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Logout user (clear token/session)
 * @route   GET /api/auth/logout
 * @access  Private
 */
export const logout = (req, res) => {
  try {
    // In a token-based system, logout is handled client-side by removing the token
    // If using sessions:
    req.session.destroy(err => {
      if (err) throw err;
      res.clearCookie('connect.sid');
      res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    });

    // For JWT (client should remove token from storage)
    res.status(200).json({
      success: true,
      message: "Logout successful (please remove token from client storage)"
    });

  } catch (error) {
    console.error('[Logout Error]', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Search users for messenger functionality
 * @route   GET /api/users/search
 * @access  Private
 */
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'Search query must be at least 2 characters long',
        data: [] // Always return an array
      });
    }

    const users = await User.find({
      $and: [
        { 
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } }
          ]
        },
        { _id: { $ne: req.user._id } }
      ]
    })
    .select('-password -__v -createdAt -updatedAt')
    .limit(10)
    .lean();

    res.status(200).json({
      success: true,
      message: users.length ? 'Users found' : 'No users found',
      data: users || [] // Ensure data is always an array
    });

  } catch (error) {
    console.error('[User Search Error]', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to search users',
      data: [] // Return empty array on error
    });
  }
};