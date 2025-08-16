import mongoose from "mongoose";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Appointment from "../models/Appointment.js";
import Message from "../models/Message.js";
import Educator from "../models/Educator.js";

export const searchEducators = async (req, res) => {
  try {
    const { query, category, difficultyLevel } = req.query;
    
    let searchQuery = { role: "educator" };
    
    if (query) {
      searchQuery.$or = [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ];
    }

    const users = await User.find(searchQuery).select('username _id');
    const userIds = users.map(u => u._id);

    let educatorQuery = { user: { $in: userIds } };
    
    if (category) {
      educatorQuery['courses.category'] = category;
    }

    const educators = await Educator.find(educatorQuery)
      .populate({ 
        path: 'user', 
        select: 'username _id',
        match: searchQuery
      })
      .populate({ 
        path: 'courses', 
        select: 'title category difficultyLevel thumbnailUrl description',
        match: category ? { category } : {}
      });

    const filteredEducators = educators.filter(e => e.user && e.courses.length > 0);

    res.status(200).json({ success: true, data: filteredEducators });
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

    const user = await User.findById(educatorId);
    if (!user || user.role !== "educator") {
      return res.status(404).json({ success: false, message: "Educator not found" });
    }

    const educator = await Educator.findOne({ user: educatorId })
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
    const educator = await User.findById(educatorId);
    if (!educator || educator.role !== "educator") {
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
      .populate({ path: "educatorId", select: "username _id" })
      .populate({ path: "studentId", select: "username _id" });

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
      .populate({ path: "educatorId", select: "username _id" })
      .populate({ path: "studentId", select: "username _id" });

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
      .populate({ path: "educatorId", select: "username _id" })
      .populate({ path: "studentId", select: "username _id" });

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
      .populate({ path: "senderId", select: "username _id role" })
      .populate({ path: "receiverId", select: "username _id role" });

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    console.error("[getStudentMessages]", err);
    res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};

export const sendStudentMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType, fileUrl, fileName, fileSize, appointmentId, courseId } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: "Receiver ID and content are required" });
    }

    // Verify receiver is an educator
    const receiver = await User.findById(receiverId);
    if (!receiver || receiver.role !== "educator") {
      return res.status(400).json({ success: false, message: "Invalid receiver" });
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
    console.error("[sendStudentMessage]", err);
    res.status(500).json({ success: false, message: "Failed to send message" });
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
      .populate({ path: "instructor", select: "username _id" })
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
