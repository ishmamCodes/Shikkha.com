import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Educator from "../models/Educator.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Appointment from "../models/Appointment.js";
import Material from "../models/Material.js";
import Message from "../models/Message.js";
import EmailChangeRequest from "../models/EmailChangeRequest.js";

export const getEducatorProfile = async (req, res) => {
  try {
    const { id } = req.params; // user id of educator
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid educator id" });
    }

    const user = await User.findById(id);
    if (!user || user.role !== "educator") {
      return res.status(404).json({ success: false, message: "Educator not found" });
    }

    const profile = await Educator.findOne({ user: id }).populate({ 
      path: "courses", 
      select: "title privacy category difficultyLevel thumbnailUrl description price duration tags scheduleDays scheduleSlot startingDate"
    });
    return res.status(200).json({ success: true, data: profile || { user: id, name: "", email: "", phone: "", bio: "", avatarUrl: "", experienceYears: 0, experienceDescription: "", educationBackground: [], achievements: [], certifications: [], socialLinks: { linkedin: "", twitter: "", website: "" }, courses: [] } });
  } catch (err) {
    console.error("[getEducatorProfile]", err);
    res.status(500).json({ success: false, message: "Failed to fetch educator profile" });
  }
};

export const updateEducatorProfile = async (req, res) => {
  try {
    const { id } = req.params; // user id
    const {
      name,
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

    const user = await User.findById(id);
    if (!user || user.role !== "educator") {
      return res.status(404).json({ success: false, message: "Educator not found" });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
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

    const profile = await Educator.findOneAndUpdate(
      { user: id },
      { $set: updates },
      { new: true, upsert: true }
    );

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
    const { id } = req.params; // user id
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    if (req.user.id !== id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // verify current password when not admin
    if (req.user.role !== 'admin') {
      const ok = await bcrypt.compare(currentPassword || '', user.password);
      if (!ok) return res.status(401).json({ success: false, message: 'Current password incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
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
      await User.findByIdAndUpdate(doc.user, { username: doc.newEmail });
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

    const course = await Course.create({
      title,
      description: description || "",
      category,
      difficultyLevel,
      thumbnailUrl: thumbnailUrl || "",
      instructor: req.user.id,
      privacy: privacy === "private" ? "private" : "public",
      price: price || 0,
      duration: duration || "",
      tags: tags || [],
      scheduleDays: Array.isArray(scheduleDays) ? scheduleDays : [],
      scheduleSlot: scheduleSlot || "",
      startingDate
    });

    await Educator.findOneAndUpdate(
      { user: req.user.id },
      { $addToSet: { courses: course._id } },
      { upsert: true }
    );

    res.status(201).json({ success: true, data: course });
  } catch (err) {
    console.error("[createCourse]", err);
    res.status(500).json({ success: false, message: "Failed to create course" });
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
      tags,
      scheduleDays,
      scheduleSlot 
    }) => ({ 
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
      scheduleSlot 
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
    await Educator.findOneAndUpdate({ user: course.instructor }, { $pull: { courses: id } });
    res.status(200).json({ success: true, message: "Course deleted" });
  } catch (err) {
    console.error("[deleteCourse]", err);
    res.status(500).json({ success: false, message: "Failed to delete course" });
  }
};

export const getCourseStudents = async (req, res) => {
  try {
    const { id } = req.params; // course id
    const course = await Course.findById(id).populate({ path: "students", select: "username role _id" });
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


