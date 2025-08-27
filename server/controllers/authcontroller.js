import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Educator from "../models/Educator.js";
import Student from "../models/Student.js";

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
// Hardcoded admin credentials (per request)
const ADMIN_EMAIL = 'admin@shikkha.com';
const ADMIN_PASSWORD = 'admin123';

/**
 * @desc    Register a new user (student/educator)
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = async (req, res) => {
  try {
    const { email, password, fullName, dateOfBirth, role, ...profileData } = req.body;

    // Validation
    if (!email || !password || !fullName || !dateOfBirth || !role) {
      return res.status(400).json({ 
        success: false,
        message: "Email, password, full name, date of birth, and role are required"
      });
    }

    // Check global email uniqueness
    const [existingStudent, existingEducator] = await Promise.all([
      Student.findOne({ email }).lean(),
      Educator.findOne({ email }).lean(),
    ]);
    if (existingStudent || existingEducator) {
      return res.status(409).json({ 
        success: false,
        message: "An account with this email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create role-specific account
    let principal = null;
    const commonData = {
      email: email.toLowerCase(),
      password: hashedPassword,
      dateOfBirth: new Date(dateOfBirth),
      fullName,
      role,
      ...profileData
    };

    if (role === 'student') {
      principal = await Student.create(commonData);
    } else if (role === 'educator') {
      principal = await Educator.create(commonData);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const token = jwt.sign({ id: principal._id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: principal._id,
        email: principal.email,
        fullName: principal.fullName,
        role,
        avatarUrl: principal.avatarUrl || ''
      }
    });

  } catch (error) {
    console.error('[Signup Error]', error);
    // Handle duplicate key error from Mongo (race condition or stale index)
    if (error && (error.code === 11000 || /E11000/i.test(String(error?.message)))) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }
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
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }

    // Locate principal
    let principal = null;
    const lowerEmail = email.toLowerCase();
    const query = { email: lowerEmail };

    // Admin: detect by email regardless of role value
    if (lowerEmail === ADMIN_EMAIL.toLowerCase()) {
      if (password === ADMIN_PASSWORD) {
        principal = {
          _id: 'admin_id',
          email: ADMIN_EMAIL,
          fullName: 'System Administrator',
          role: 'admin'
        };
      }
    } else if (role === 'student') {
      principal = await Student.findOne(query).select('+password');
    } else if (role === 'educator') {
      principal = await Educator.findOne(query).select('+password');
    } else {
      // Fallback: try student first, then educator
      principal = await Student.findOne(query).select('+password');
      if (!principal) principal = await Educator.findOne(query).select('+password');
    }

    if (!principal) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Verify password
    let isMatch = false;
    if (principal.role === 'admin') {
      // For admin, password is already verified above
      isMatch = true;
    } else {
      isMatch = await bcrypt.compare(password, principal.password);
    }
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Create token
    const effectiveRole = principal.role;
    const payload = { id: principal._id, role: effectiveRole };
    if (effectiveRole === 'admin' && principal.email) {
      payload.email = principal.email;
    }
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: principal._id,
        email: principal.email,
        fullName: principal.fullName,
        role: effectiveRole,
        avatarUrl: principal.avatarUrl || ''
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
 * @desc    Log user out
 * @route   GET /api/auth/logout
 * @access  Public
 */
export const logout = (req, res) => {
  // For JWT-based auth, logout is primarily a client-side operation (deleting the token).
  // This endpoint is here to support a formal logout process.
  // If using httpOnly cookies, you would clear the cookie here.
  res.status(200).json({ success: true, message: 'User logged out successfully' });
};

/**
 * @desc    Reset user password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email, dateOfBirth, newPassword } = req.body;

    if (!email || !dateOfBirth || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, date of birth, and new password are required" });
    }

    const query = { email: email.toLowerCase() };
    let principal = await Student.findOne(query) || await Educator.findOne(query);

    if (!principal) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify date of birth. The date from client is a string 'YYYY-MM-DD'.
    const clientDateOfBirth = new Date(dateOfBirth);
    const dbDateOfBirth = new Date(principal.dateOfBirth);

    if (clientDateOfBirth.toISOString().split('T')[0] !== dbDateOfBirth.toISOString().split('T')[0]) {
        return res.status(403).json({ success: false, message: "Date of birth does not match" });
    }

    principal.password = await bcrypt.hash(newPassword, 12);
    await principal.save();

    res.status(200).json({ success: true, message: "Password has been reset successfully" });

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

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    let principal = await Student.findById(userId).select('-password -__v') || await Educator.findById(userId).select('-password -__v');

    if (!principal) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: principal });

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
    const { role } = req.user; // Assuming role is available from auth middleware

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    if (updateData.password) {
      delete updateData.password;
    }
    if (updateData.email) {
      // Prevent email changes for now, or add verification logic
      delete updateData.email;
    }

    let principal = null;
    const Model = role === 'student' ? Student : Educator;

    principal = await Model.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!principal) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: principal });

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
        data: []
      });
    }

    const searchRegex = { $regex: query, $options: 'i' };
    const searchFilter = {
      $or: [
        { email: searchRegex },
        { fullName: searchRegex }
      ],
      _id: { $ne: req.user.id }
    };

    const [students, educators] = await Promise.all([
        Student.find(searchFilter).select('email fullName avatarUrl role').limit(5).lean(),
        Educator.find(searchFilter).select('email fullName avatarUrl role').limit(5).lean()
    ]);

    const users = [...students, ...educators];

    res.status(200).json({
      success: true,
      message: users.length ? 'Users found' : 'No users found',
      data: users
    });

  } catch (error) {
    console.error('[User Search Error]', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to search users',
      data: []
    });
  }
};