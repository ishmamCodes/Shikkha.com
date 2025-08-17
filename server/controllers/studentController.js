import mongoose from "mongoose";
import axios from 'axios';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Grade from '../models/Grade.js';
import Appointment from '../models/Appointment.js';
import Material from "../models/Material.js";
import Educator from '../models/Educator.js';
import Message from '../models/Message.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getDashboardStats = async (req, res) => {
  try {
    const studentId = req.user.id;

    const enrolledCoursesCount = await Course.countDocuments({ students: studentId });

    const upcomingAppointmentsCount = await Appointment.countDocuments({
      studentId,
      datetime: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] },
    });

    const unreadMessagesCount = await Message.countDocuments({
      receiverId: studentId,
      isRead: false,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: {
        enrolledCourses: enrolledCoursesCount,
        upcomingAppointments: upcomingAppointmentsCount,
        unreadMessages: unreadMessagesCount,
      },
    });
  } catch (err) {
    console.error('[getDashboardStats]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

// Admin: list students (basic fields, optional search q)
export const listStudents = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { q } = req.query;
    const filter = {};
    if (q) {
      const rx = new RegExp(q, 'i');
      filter.$or = [{ fullName: rx }, { email: rx }];
    }
    const students = await Student.find(filter).sort({ createdAt: -1 }).select('_id fullName email status createdAt');
    return res.status(200).json(students);
  } catch (err) {
    console.error('[listStudents]', err);
    return res.status(500).json({ success: false, message: 'Failed to load students' });
  }
};

// Admin: suspend student
export const suspendStudent = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const updated = await Student.findByIdAndUpdate(id, { status: 'suspended' }, { new: true }).select('_id fullName email status');
    if (!updated) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('[suspendStudent]', err);
    return res.status(500).json({ success: false, message: 'Failed to suspend student' });
  }
};

// Admin: activate student
export const activateStudent = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const updated = await Student.findByIdAndUpdate(id, { status: 'active' }, { new: true }).select('_id fullName email status');
    if (!updated) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('[activateStudent]', err);
    return res.status(500).json({ success: false, message: 'Failed to activate student' });
  }
};

// Admin: delete student
export const deleteStudent = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const existing = await Student.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Student not found' });
    await Enrollment.deleteMany({ studentId: id }).catch(() => {});
    await Student.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Student deleted' });
  } catch (err) {
    console.error('[deleteStudent]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete student' });
  }
};

export const downloadStudentCourseMaterial = async (req, res) => {
  try {
    const { courseId, materialId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(materialId)) {
      return res.status(400).json({ success: false, message: "Invalid IDs" });
    }

    const course = await Course.findById(courseId).select('students');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const isEnrolled = (course.students || []).some(id => String(id) === req.user.id);
    if (!isEnrolled && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Enrolled students only.' });
    }

    const material = await Material.findOne({ _id: materialId, courseId }).select('title fileName url fileUrl');
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    const sourceUrl = material.url || material.fileUrl;
    const fileName = (material.fileName || material.title || 'file').replace(/[^\w\-\.\(\)\s]/g, '_');
    if (!sourceUrl) {
      return res.status(400).json({ success: false, message: 'No file URL for this material' });
    }

    const inferMime = (name) => {
      const lower = name.toLowerCase();
      if (lower.endsWith('.pdf')) return 'application/pdf';
      if (/(\.jpg|\.jpeg)$/.test(lower)) return 'image/jpeg';
      if (lower.endsWith('.png')) return 'image/png';
      if (lower.endsWith('.gif')) return 'image/gif';
      if (lower.endsWith('.webp')) return 'image/webp';
      if (lower.endsWith('.mp4')) return 'video/mp4';
      if (lower.endsWith('.mov')) return 'video/quicktime';
      if (lower.endsWith('.mp3')) return 'audio/mpeg';
      return 'application/octet-stream';
    };

    // Remote URL: stream through server so Content-Disposition is respected
    if (/^https?:\/\//i.test(sourceUrl)) {
      const response = await axios.get(sourceUrl, { responseType: 'stream', validateStatus: () => true });
      if (response.status >= 400) {
        return res.status(502).json({ success: false, message: 'Failed to fetch remote file' });
      }
      const contentType = response.headers['content-type'] || inferMime(fileName);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return response.data.pipe(res);
    }

    // Fallback: if it's a local/static path served by Express (e.g., /uploads/...), redirect
    // Note: Redirect may not preserve filename, but serves the file
    return res.redirect(sourceUrl);
  } catch (err) {
    console.error('[downloadStudentCourseMaterial]', err);
    return res.status(500).json({ success: false, message: 'Failed to download material' });
  }
};

export const getStudentCourseById = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }

    const course = await Course.findById(courseId)
      .populate({ path: 'instructor', select: 'fullName _id' });

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const isEnrolled = (course.students || []).some(id => String(id) === String(studentId));
    if (!isEnrolled && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied. Enrolled students only." });
    }

    return res.status(200).json({ success: true, course });
  } catch (err) {
    console.error('[getStudentCourseById]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch course' });
  }
};

export const searchEducators = async (req, res) => {
  try {
    const { query, category } = req.query;

    const educatorQuery = {};
    if (query) {
      educatorQuery.fullName = { $regex: query, $options: 'i' };
    }

    const educators = await Educator.find(educatorQuery)
      .populate({
        path: 'courses',
        select: 'title category difficultyLevel thumbnailUrl description',
        match: category ? { category } : {}
      });

    const filtered = category ? educators.filter(e => (e.courses || []).length > 0) : educators;

    res.status(200).json({ success: true, data: filtered });
  } catch (err) {
    console.error("[searchEducators]", err);
    res.status(500).json({ success: false, message: "Failed to search educators" });
  }
};

export const getEducatorProfile = async (req, res) => {
  try {
    const { educatorId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(educatorId)) {
      return res.status(400).json({ success: false, message: "Invalid educator ID" });
    }

    const educator = await Educator.findById(educatorId)
      .populate({ 
        path: 'courses', 
        select: 'title category difficultyLevel thumbnailUrl description privacy',
        match: { privacy: 'public' }
      });

    if (!educator) {
      return res.status(404).json({ success: false, message: "Educator profile not found" });
    }

    res.status(200).json({ success: true, data: educator });
  } catch (err) {
    console.error("[getEducatorProfile]", err);
    res.status(500).json({ success: false, message: "Failed to fetch educator profile" });
  }
};

export const bookAppointment = async (req, res) => {
  try {
    const { 
      educatorId, 
      datetime, 
      subject, 
      description, 
      meetingType, 
      duration 
    } = req.body;

    if (!educatorId || !datetime || !subject) {
      return res.status(400).json({ 
        success: false, 
        message: "Educator ID, datetime, and subject are required" 
      });
    }

    // Validate educator exists
    const educator = await Educator.findById(educatorId);
    if (!educator) {
      return res.status(404).json({ success: false, message: "Educator not found" });
    }

    // Check if datetime is in the future
    const appointmentDate = new Date(datetime);
    if (appointmentDate <= new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: "Appointment must be scheduled for a future date" 
      });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      educatorId,
      datetime: {
        $gte: new Date(appointmentDate.getTime() - 60 * 60 * 1000), // 1 hour before
        $lte: new Date(appointmentDate.getTime() + 60 * 60 * 1000)  // 1 hour after
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({ 
        success: false, 
        message: "This time slot is not available" 
      });
    }

    const appointment = await Appointment.create({
      studentId: req.user.id,
      educatorId,
      datetime: appointmentDate,
      subject,
      description: description || "",
      meetingType: meetingType || "video",
      duration: duration || 60
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate({ path: "educatorId", select: "fullName _id" })
      .populate({ path: "studentId", select: "fullName _id" });

    res.status(201).json({ success: true, data: populatedAppointment });
  } catch (err) {
    console.error("[bookAppointment]", err);
    res.status(500).json({ success: false, message: "Failed to book appointment" });
  }
};

export const getStudentAppointments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status } = req.query;

    let query = { studentId };
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .sort({ datetime: 1 })
      .populate({ path: "educatorId", select: "fullName _id" })
      .populate({ path: "studentId", select: "fullName _id" });

    res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    console.error("[getStudentAppointments]", err);
    res.status(500).json({ success: false, message: "Failed to fetch appointments" });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (String(appointment.studentId) !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (appointment.status === 'canceled' || appointment.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot cancel this appointment" 
      });
    }

    appointment.status = 'canceled';
    appointment.canceledBy = 'student';
    appointment.cancelReason = reason || '';
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointmentId)
      .populate({ path: "educatorId", select: "fullName _id" })
      .populate({ path: "studentId", select: "fullName _id" });

    res.status(200).json({ success: true, data: populatedAppointment });
  } catch (err) {
    console.error("[cancelAppointment]", err);
    res.status(500).json({ success: false, message: "Failed to cancel appointment" });
  }
};

export const getStudentMessages = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { educatorId } = req.query;

    let query = { 
      $or: [
        { senderId: studentId },
        { receiverId: studentId }
      ],
      isDeleted: false
    };

    if (educatorId) {
      query = {
        $or: [
          { senderId: studentId, receiverId: educatorId },
          { senderId: educatorId, receiverId: studentId }
        ],
        isDeleted: false
      };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({ path: "senderId", select: "fullName _id role" })
      .populate({ path: "receiverId", select: "fullName _id role" });

    return res.status(200).json({ success: true, data: messages });
  } catch (err) {
    console.error("[getStudentMessages]", err);
    return res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};

export const sendStudentMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const {
      receiverId,
      content,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      appointmentId,
      courseId,
    } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: "receiverId and content are required" });
    }

    // Determine receiver model: prefer Educator, fallback to Student
    let receiverModel = 'Educator';
    const edu = await Educator.findById(receiverId).select('_id');
    if (!edu) {
      const stu = await Student.findById(receiverId).select('_id');
      if (!stu) {
        return res.status(404).json({ success: false, message: 'Receiver not found' });
      }
      receiverModel = 'Student';
    }

    const message = await Message.create({
      senderModel: 'Student',
      receiverModel,
      senderId,
      receiverId,
      content,
      messageType: messageType || 'text',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      appointmentId: appointmentId || undefined,
      courseId: courseId || undefined,
    });

    const populated = await Message.findById(message._id)
      .populate({ path: 'senderId', select: 'fullName _id role' })
      .populate({ path: 'receiverId', select: 'fullName _id role' });

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('[sendStudentMessage]', err);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

export const markStudentMessageAsRead = async (req, res) => {
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
    console.error("[markStudentMessageAsRead]", err);
    res.status(500).json({ success: false, message: "Failed to mark message as read" });
  }
};

export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (course.privacy === "private") {
      return res.status(403).json({ success: false, message: "Cannot enroll in private course" });
    }

    // Check if already enrolled
    if (course.students.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: "Already enrolled in this course" });
    }

    course.students.push(req.user.id);
    await course.save();
    
    console.log('Student enrolled:', {
      courseId,
      studentId: req.user.id,
      courseTitle: course.title,
      totalStudents: course.students.length
    });

    res.status(200).json({ success: true, message: "Successfully enrolled in course" });
  } catch (err) {
    console.error("[enrollInCourse]", err);
    res.status(500).json({ success: false, message: "Failed to enroll in course" });
  }
};

export const getStudentCourses = async (req, res) => {
  try {
    const studentId = req.user.id;

    const courses = await Course.find({ students: studentId })
      .populate({ path: "instructor", select: "fullName _id" })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: courses });
  } catch (err) {
    console.error("[getStudentCourses]", err);
    res.status(500).json({ success: false, message: "Failed to fetch courses" });
  }
};

export const unenrollFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (!course.students.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: "Not enrolled in this course" });
    }

    course.students = course.students.filter(id => String(id) !== req.user.id);
    await course.save();

    res.status(200).json({ success: true, message: "Successfully unenrolled from course" });
  } catch (err) {
    console.error("[unenrollFromCourse]", err);
    res.status(500).json({ success: false, message: "Failed to unenroll from course" });
  }
};

// Course materials (student)
export const getStudentCourseMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }

    const course = await Course.findById(courseId).select('students instructor privacy');
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Ensure student is enrolled
    const isEnrolled = (course.students || []).some(id => String(id) === req.user.id);
    console.log('Material access check:', {
      courseId,
      userId: req.user.id,
      courseStudents: course.students,
      isEnrolled,
      userRole: req.user.role
    });
    
    if (!isEnrolled && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied. Enrolled students only." });
    }

    const materials = await Material.find({ courseId })
      .sort({ order: 1, createdAt: -1 })
      .select('-__v')
      .populate({ path: 'uploadedBy', select: 'fullName _id' });

    // Normalize fields for client compatibility
    const normalized = materials.map((m) => ({
      ...m.toObject(),
      fileUrl: m.url || m.fileUrl || '',
      fileName: m.fileName || m.title || '',
    }));

    return res.status(200).json({ success: true, data: normalized });
  } catch (err) {
    console.error('[getStudentCourseMaterials]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch materials' });
  }
};

// Student profile
export const getStudentProfile = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;
    const profile = await Student.findById(studentId).select('-password');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    console.error("[getStudentProfile]", err);
    return res.status(500).json({ success: false, message: "Failed to fetch student profile" });
  }
};

export const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const allowed = [
      "fullName",
      "email",
      "phone",
      "avatarUrl",
      "bio",
      "institution",
      "gradeLevel",
      "studentId",
      "guardianName",
      "guardianPhone",
      "address",
    ];
    const update = {};
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key];
    }

    const profile = await Student.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    );
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    console.error("[updateStudentProfile]", err);
    return res.status(500).json({ success: false, message: "Failed to update student profile" });
  }
};

// Dashboard helpers
export const getStudentSchedule = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get enrolled courses with schedule information
    const enrolledCourses = await Course.find({ students: studentId })
      .populate({ path: "instructor", select: "username _id" })
      .select('title schedule scheduleDays scheduleTime scheduleSlot instructor startDate startingDate');

    // Helpers
    const dayNameToIndex = (name) => {
      if (!name) return null;
      const map = {
        sunday: 0, sun: 0,
        monday: 1, mon: 1,
        tuesday: 2, tue: 2, tues: 2,
        wednesday: 3, wed: 3,
        thursday: 4, thu: 4, thurs: 4,
        friday: 5, fri: 5,
        saturday: 6, sat: 6,
      };
      return map[String(name).trim().toLowerCase()] ?? null;
    };

    const parseTime = (timeStr) => {
      // Accept formats like '14:00', '2:30 PM', '02:30 pm'
      if (!timeStr) return { hours: 9, minutes: 0 }; // default 9:00
      const s = String(timeStr).trim();
      const ampm = /am|pm/i.test(s) ? s.match(/am|pm/i)[0].toLowerCase() : null;
      const [hPart, mPart] = s.replace(/am|pm/ig, '').trim().split(':');
      let h = parseInt(hPart, 10);
      const m = parseInt(mPart || '0', 10) || 0;
      if (ampm === 'pm' && h < 12) h += 12;
      if (ampm === 'am' && h === 12) h = 0;
      if (Number.isNaN(h) || h < 0 || h > 23) h = 9;
      return { hours: h, minutes: m };
    };

    const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
    const addDays = (d, days) => { const x = new Date(d); x.setDate(x.getDate() + days); return x; };

    // Transform course data into schedule format with dates starting from course start
    const schedule = [];
    const today = startOfDay(new Date());

    enrolledCourses.forEach(course => {
      const days = (course.schedule?.days || course.scheduleDays || []).map(dayNameToIndex).filter(d => d !== null);
      const time = course.schedule?.time || course.scheduleTime || course.scheduleSlot || '';
      const { hours, minutes } = parseTime(time);
      const courseStart = startOfDay(course.startingDate || course.startDate || today);
      const startFrom = courseStart > today ? courseStart : today; // show from course start forward

      if (days.length === 0) return;

      // Generate up to next 8 upcoming sessions (approx 4 weeks if 2 days/week)
      let generated = 0;
      let cursor = new Date(startFrom);
      // look ahead up to 8 weeks for safety
      for (let w = 0; w < 8 && generated < 8; w++) {
        for (let dow of days) {
          const date = new Date(cursor);
          const diff = (dow - date.getDay() + 7) % 7;
          const sessionDate = addDays(date, diff);
          if (sessionDate < startFrom) continue;
          // set time
          sessionDate.setHours(hours, minutes, 0, 0);
          schedule.push({
            courseTitle: course.title,
            instructor: course.instructor?.fullName || 'Unknown',
            dayOfWeek: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dow],
            time: time || `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`,
            duration: '1 hour', // Default duration
            location: 'Online', // Default location
            courseId: course._id,
            date: sessionDate.toISOString(),
          });
          generated++;
          if (generated >= 8) break;
        }
        cursor = addDays(cursor, 7);
      }
    });

    // Sort by date ascending
    schedule.sort((a,b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({ success: true, schedule });
  } catch (err) {
    console.error("[getStudentSchedule]", err);
    return res.status(500).json({ success: false, message: "Failed to fetch schedule" });
  }
};

export const getStudentGrades = async (req, res) => {
  try {
    const studentId = req.user.id;
    const grades = await Grade.find({ studentId }).sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, grades });
  } catch (err) {
    console.error("[getStudentGrades]", err);
    return res.status(500).json({ success: false, message: "Failed to fetch grades" });
  }
};

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

export const uploadAvatar = [
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const studentId = req.user.id;
      const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;

      // Update student profile with new avatar URL
      const student = await Student.findByIdAndUpdate(
        studentId,
        { $set: { avatarUrl } },
        { new: true }
      );
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      return res.status(200).json({ 
        success: true, 
        avatarUrl: student.avatarUrl,
        message: 'Avatar uploaded successfully' 
      });
    } catch (err) {
      console.error("[uploadAvatar]", err);
      return res.status(500).json({ success: false, message: "Failed to upload avatar" });
    }
  }
];

export const removeAvatar = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get current student profile to find existing avatar
    const student = await Student.findById(studentId);
    
    if (student && student.avatarUrl) {
      // Remove the file from filesystem
      const filePath = path.join(__dirname, '..', student.avatarUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update student profile to remove avatar URL
    const updated = await Student.findByIdAndUpdate(
      studentId,
      { $unset: { avatarUrl: 1 } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Avatar removed successfully' 
    });
  } catch (err) {
    console.error("[removeAvatar]", err);
    return res.status(500).json({ success: false, message: "Failed to remove avatar" });
  }
};
