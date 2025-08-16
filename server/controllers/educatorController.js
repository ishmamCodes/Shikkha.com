import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import Educator from "../models/Educator.js";
// Removed User import - using role-based authentication
import Course from "../models/Course.js";
import Appointment from "../models/Appointment.js";
import Material from "../models/Material.js";
import Message from "../models/Message.js";
import EmailChangeRequest from "../models/EmailChangeRequest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getEducatorProfile = async (req, res) => {
  try {
    const { id } = req.params; // educator id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid educator id" });
    }

    const profile = await Educator.findById(id).populate({
      path: "courses",
      select:
        "title description category difficultyLevel privacy price duration tags thumbnailUrl instructorName scheduleDays scheduleSlot startingDate createdAt",
    });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Educator not found" });
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    console.error("[getEducatorProfile]", err);
    res.status(500).json({ success: false, message: "Failed to fetch educator profile" });
  }
};

export const updateEducatorProfile = async (req, res) => {
  try {
    const { id } = req.params; // educator id
    const {
      fullName,
      email,
      phone,
      avatarUrl,
      bio,
      experienceYears,
      experienceDescription,
      educationBackground,
      achievements,
      certifications,
      socialLinks,
    } = req.body;

    if (req.user.id !== id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (bio !== undefined) updates.bio = bio;
    if (experienceYears !== undefined) updates.experienceYears = experienceYears;
    if (experienceDescription !== undefined) updates.experienceDescription = experienceDescription;
    if (educationBackground !== undefined) updates.educationBackground = educationBackground;
    if (achievements !== undefined) updates.achievements = achievements;
    if (certifications !== undefined) updates.certifications = certifications;
    if (socialLinks !== undefined) updates.socialLinks = socialLinks;

    const profile = await Educator.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: "Educator not found" });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    console.error("[updateEducatorProfile]", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const educatorId = req.user.id;
    // total courses
    const courses = await Course.find({ instructor: educatorId }).select('_id');
    const courseIds = courses.map(c => c._id);
    const totalCourses = courses.length;

    // total students (unique across courses)
    const coursesWithStudents = await Course.find({ _id: { $in: courseIds } }).select('students');
    const studentSet = new Set();
    coursesWithStudents.forEach(c => (c.students || []).forEach(s => studentSet.add(String(s))));
    const totalStudents = studentSet.size;

    // appointments stats
    const appointments = await Appointment.find({ educatorId });
    const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
    const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length;

    // fake earnings and rating placeholders (since no payments model provided)
    const monthlyEarnings = 0;
    const averageRating = 0;

    // trend placeholders
    const earningsTrend = Array.from({ length: 6 }).map((_, i) => ({ month: i + 1, amount: 0 }));
    const enrollmentTrend = Array.from({ length: 6 }).map((_, i) => ({ month: i + 1, count: 0 }));

    // recent activity (latest students across courses)
    const recentActivity = [];

    res.status(200).json({
      success: true,
      data: {
        totals: {
          totalCourses,
          totalStudents,
          monthlyEarnings,
          averageRating,
          pendingAppointments,
          confirmedAppointments,
        },
        charts: {
          earningsTrend,
          enrollmentTrend,
        },
        recentActivity,
      },
    });
  } catch (err) {
    console.error('[getDashboardStats]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

export const updateEducatorPassword = async (req, res) => {
  try {
    const { id } = req.params; // educator id
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    if (req.user.id !== id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const educator = await Educator.findById(id).select('+password');
    if (!educator) {
      return res.status(404).json({ success: false, message: "Educator not found" });
    }

    // verify current password when not admin
    if (req.user.role !== 'admin') {
      const ok = await bcrypt.compare(currentPassword || '', educator.password);
      if (!ok) return res.status(401).json({ success: false, message: 'Current password incorrect' });
    }

    educator.password = await bcrypt.hash(newPassword, 12);
    await educator.save();
    res.status(200).json({ success: true, message: "Password updated" });
  } catch (err) {
    console.error("[updateEducatorPassword]", err);
    res.status(500).json({ success: false, message: "Failed to update password" });
  }
};

export const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ success: false, message: 'newEmail required' });
    const exists = await EmailChangeRequest.findOne({ user: req.user.id, status: 'pending' });
    if (exists) return res.status(400).json({ success: false, message: 'Pending request already exists' });
    const reqDoc = await EmailChangeRequest.create({ user: req.user.id, newEmail });
    res.status(201).json({ success: true, data: reqDoc });
  } catch (err) {
    console.error('[requestEmailChange]', err);
    res.status(500).json({ success: false, message: 'Failed to request email change' });
  }
};

export const listMyEmailChangeRequests = async (req, res) => {
  try {
    const list = await EmailChangeRequest.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    console.error('[listMyEmailChangeRequests]', err);
    res.status(500).json({ success: false, message: 'Failed to load requests' });
  }
};

export const decideEmailChange = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { requestId } = req.params;
    const { action } = req.body; // 'approve' | 'reject'
    const doc = await EmailChangeRequest.findById(requestId);
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' });
    if (doc.status !== 'pending') return res.status(400).json({ success: false, message: 'Already processed' });
    if (action === 'approve') {
      await Educator.findByIdAndUpdate(doc.user, { email: doc.newEmail });
      doc.status = 'approved';
    } else {
      doc.status = 'rejected';
    }
    doc.decidedBy = req.user.id;
    doc.decidedAt = new Date();
    await doc.save();
    res.status(200).json({ success: true, data: doc });
  } catch (err) {
    console.error('[decideEmailChange]', err);
    res.status(500).json({ success: false, message: 'Failed to decide request' });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      difficultyLevel, 
      thumbnailUrl, 
      privacy, 
      price, 
      duration, 
      tags,
      scheduleDays,
      scheduleSlot,
      startingDate
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    if (!category || !difficultyLevel) {
      return res.status(400).json({ success: false, message: "Category and difficulty level are required" });
    }

    // Get educator's name for display
    const educator = await Educator.findById(req.user.id);
    if (!educator) {
      return res.status(404).json({ success: false, message: "Educator not found" });
    }

    const course = await Course.create({
      title,
      description: description || "",
      category,
      difficultyLevel,
      thumbnailUrl: thumbnailUrl || "",
      instructor: req.user.id,
      instructorName: educator.fullName,
      privacy: privacy === "private" ? "private" : "public",
      price: price || 0,
      duration: duration || "",
      tags: tags || [],
      scheduleDays: scheduleDays || [],
      scheduleSlot: scheduleSlot || "",
      startingDate: startingDate ? new Date(startingDate) : null
    });

    await Educator.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { courses: course._id } }
    );

    res.status(201).json({ success: true, data: course });
  } catch (err) {
    console.error("[createCourse]", err);
    return res.status(500).json({ success: false, message: "Failed to create course" });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params; // course id
    const updates = (({ 
      title, 
      description, 
      category, 
      difficultyLevel, 
      thumbnailUrl, 
      privacy, 
      price, 
      duration, 
      tags 
    }) => ({ 
      title, 
      description, 
      category, 
      difficultyLevel, 
      thumbnailUrl, 
      privacy, 
      price, 
      duration, 
      tags 
    }))(req.body);

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (String(course.instructor) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (updates.privacy && !["public", "private"].includes(updates.privacy)) {
      return res.status(400).json({ success: false, message: "Invalid privacy value" });
    }

    const updated = await Course.findByIdAndUpdate(id, updates, { new: true });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("[updateCourse]", err);
    res.status(500).json({ success: false, message: "Failed to update course" });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params; // course id
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (String(course.instructor) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await Course.findByIdAndDelete(id);
    await Educator.findByIdAndUpdate(course.instructor, { $pull: { courses: id } });
    res.status(200).json({ success: true, message: "Course deleted" });
  } catch (err) {
    console.error("[deleteCourse]", err);
    res.status(500).json({ success: false, message: "Failed to delete course" });
  }
};

export const getCourseStudents = async (req, res) => {
  try {
    const { id } = req.params; // course id
    const course = await Course.findById(id).populate({ path: "students", select: "username fullName role _id" });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (String(course.instructor) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    res.status(200).json({ success: true, data: course.students || [] });
  } catch (err) {
    console.error("[getCourseStudents]", err);
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
};

export const removeStudentFromCourse = async (req, res) => {
  try {
    const { id, studentId } = req.params; // course id, student id
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (String(course.instructor) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await Course.findByIdAndUpdate(id, { $pull: { students: studentId } });
    res.status(200).json({ success: true, message: "Student removed" });
  } catch (err) {
    console.error("[removeStudentFromCourse]", err);
    res.status(500).json({ success: false, message: "Failed to remove student" });
  }
};

export const getEducatorAppointments = async (req, res) => {
  try {
    const educatorId = req.query.educatorId || req.user.id;
    if (!mongoose.Types.ObjectId.isValid(educatorId)) {
      return res.status(400).json({ success: false, message: "Invalid educatorId" });
    }

    if (educatorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const appts = await Appointment.find({ educatorId })
      .sort({ datetime: 1 })
      .populate({ path: "studentId", select: "username _id" });
    res.status(200).json({ success: true, data: appts });
  } catch (err) {
    console.error("[getEducatorAppointments]", err);
    res.status(500).json({ success: false, message: "Failed to fetch appointments" });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params; // appointment id
    const { status, notes } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (String(appointment.educatorId) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const updates = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const updated = await Appointment.findByIdAndUpdate(id, updates, { new: true })
      .populate({ path: "studentId", select: "username _id" });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("[updateAppointmentStatus]", err);
    res.status(500).json({ success: false, message: "Failed to update appointment" });
  }
};

export const getEducatorMessages = async (req, res) => {
  try {
    const educatorId = req.user.id;
    const { studentId } = req.query;

    let query = { 
      $or: [
        { senderId: educatorId },
        { receiverId: educatorId }
      ],
      isDeleted: false
    };

    if (studentId) {
      query = {
        $or: [
          { senderId: educatorId, receiverId: studentId },
          { senderId: studentId, receiverId: educatorId }
        ],
        isDeleted: false
      };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({ path: "senderId", select: "username _id role" })
      .populate({ path: "receiverId", select: "username _id role" });

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    console.error("[getEducatorMessages]", err);
    res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType, fileUrl, fileName, fileSize, appointmentId, courseId } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: "Receiver ID and content are required" });
    }

    const message = await Message.create({
      senderId: req.user.id,
      receiverId,
      content,
      messageType: messageType || "text",
      fileUrl: fileUrl || "",
      fileName: fileName || "",
      fileSize: fileSize || 0,
      appointmentId,
      courseId
    });

    const populatedMessage = await Message.findById(message._id)
      .populate({ path: "senderId", select: "username _id role" })
      .populate({ path: "receiverId", select: "username _id role" });

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (err) {
    console.error("[sendMessage]", err);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (String(message.receiverId) !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({ success: true, data: message });
  } catch (err) {
    console.error("[markMessageAsRead]", err);
    res.status(500).json({ success: false, message: "Failed to mark message as read" });
  }
};

export const handleUpload = async (req, res) => {
  try {
    // multer added file info at req.file
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const { courseId, title, description, contentType } = req.body;
    let materialDoc = null;
    
    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      materialDoc = await Material.create({
        title: title || req.file.originalname,
        description: description || "",
        contentType: contentType || "file",
        url: fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: req.user.id,
        courseId
      });
      await Course.findByIdAndUpdate(courseId, { $addToSet: { materials: materialDoc._id } });
    }

    res.status(201).json({ success: true, url: fileUrl, material: materialDoc });
  } catch (err) {
    console.error("[handleUpload]", err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

// Configure multer for educator avatar uploads
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'educator-avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

export const uploadEducatorAvatar = [
  avatarUpload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const educatorUserId = req.user.id;
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Update educator profile with new avatar URL (Educator schema uses _id, no 'user' field)
      const educator = await Educator.findByIdAndUpdate(
        educatorUserId,
        { avatarUrl },
        { new: true }
      );

      return res.status(200).json({ 
        success: true, 
        avatarUrl,
        message: 'Avatar uploaded successfully' 
      });
    } catch (err) {
      console.error("[uploadEducatorAvatar]", err);
      return res.status(500).json({ success: false, message: "Failed to upload avatar" });
    }
  }
];

export const removeEducatorAvatar = async (req, res) => {
  try {
    const educatorUserId = req.user.id;

    // Get current educator profile to find existing avatar
    const educator = await Educator.findById(educatorUserId);
    
    if (educator && educator.avatarUrl) {
      // Remove the file from filesystem
      const relativeAvatarPath = educator.avatarUrl.replace(/^\/+/, '');
      const filePath = path.join(__dirname, '..', relativeAvatarPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update educator profile to remove avatar URL
    await Educator.findByIdAndUpdate(
      educatorUserId,
      { $unset: { avatarUrl: 1 } },
      { new: true }
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Avatar removed successfully' 
    });
  } catch (err) {
    console.error("[removeEducatorAvatar]", err);
    return res.status(500).json({ success: false, message: "Failed to remove avatar" });
  }
};

export const getCourseMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (String(course.instructor) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const materials = await Material.find({ courseId })
      .sort({ order: 1, createdAt: -1 })
      .populate({ path: "uploadedBy", select: "username _id" });

    res.status(200).json({ success: true, data: materials });
  } catch (err) {
    console.error("[getCourseMaterials]", err);
    res.status(500).json({ success: false, message: "Failed to fetch materials" });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ success: false, message: "Material not found" });
    }

    if (String(material.uploadedBy) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await Material.findByIdAndDelete(materialId);
    
    // Remove from course materials array
    if (material.courseId) {
      await Course.findByIdAndUpdate(material.courseId, { $pull: { materials: materialId } });
    }

    res.status(200).json({ success: true, message: "Material deleted" });
  } catch (err) {
    console.error("[deleteMaterial]", err);
    res.status(500).json({ success: false, message: "Failed to delete material" });
  }
};


