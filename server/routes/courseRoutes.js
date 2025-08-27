import express from "express";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Student from "../models/Student.js";
import mongoose from "mongoose";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Get all public courses
 */
router.get("/", async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;
    let query = { privacy: "public", isActive: true };

    if (category) query.category = category;
    if (difficulty) query.difficultyLevel = difficulty;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }

    const courses = await Course.find(query)
      .populate("instructor", "fullName role")
      .populate("students", "fullName")
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

/**
 * Get a specific course by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "fullName role")
      .populate("students", "fullName");

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

/**
 * Get all students for a specific course
 */
router.get("/:id/students", authMiddleware, async (req, res) => {
  try {
    console.log("Fetching students for course:", req.params.id);
    
    // First check if course exists
    const course = await Course.findById(req.params.id).select("students");
    if (!course) {
      console.log("Course not found:", req.params.id);
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    console.log("Course students array:", course.students);

    // Handle both enrolled students and purchased students
    let allStudentIds = [];
    
    // Get students from course.students array (enrolled)
    if (Array.isArray(course.students)) {
      const validCourseIds = course.students.filter(id => mongoose.Types.ObjectId.isValid(id));
      allStudentIds.push(...validCourseIds);
    }

    // Get students who purchased this course via payments
    try {
      const enrollments = await Enrollment.find({ courseId: req.params.id }).select("studentId");
      const purchasedStudentIds = enrollments
        .map(e => e.studentId)
        .filter(id => mongoose.Types.ObjectId.isValid(id));
      allStudentIds.push(...purchasedStudentIds);
    } catch (enrollmentError) {
      console.log("No enrollments found or enrollment model issue:", enrollmentError.message);
    }

    // Remove duplicates
    const uniqueStudentIds = [...new Set(allStudentIds.map(id => id.toString()))];
    console.log("Unique student IDs:", uniqueStudentIds);

    if (uniqueStudentIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const students = await Student.find({ 
      _id: { $in: uniqueStudentIds } 
    }, "fullName email").lean();

    console.log("Found students:", students);

    return res.json({ success: true, data: students });
  } catch (error) {
    console.error("Error fetching course students:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch course students",
      error: error.message 
    });
  }
});

/**
 * Enroll in a course (students only)
 */
router.post("/:id/enroll", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user.id;

    // Check if user is a student
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students can enroll in courses" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if already enrolled
    if (course.students.includes(studentId)) {
      return res.status(400).json({ error: "Already enrolled in this course" });
    }

    // Add student to course
    course.students.push(studentId);
    await course.save();

    // Create Enrollment record (idempotent thanks to unique index)
    try {
      await Enrollment.create({ studentId, courseId, status: "active" });
    } catch (e) {
      // Ignore duplicate enrollment errors
      if (e && e.code !== 11000) {
        console.warn("Enrollment create warning:", e.message);
      }
    }

    // Populate the updated course
    const updatedCourse = await Course.findById(courseId)
      .populate("instructor", "fullName role")
      .populate("students", "fullName");

    res.json({ 
      message: "Successfully enrolled in course", 
      course: updatedCourse 
    });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    res.status(500).json({ error: "Failed to enroll in course" });
  }
});

/**
 * Unenroll from a course (students only)
 */
router.post("/:id/unenroll", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Remove student from course
    course.students = course.students.filter(id => id.toString() !== studentId);
    await course.save();

    // Remove Enrollment record if exists
    try {
      await Enrollment.deleteOne({ studentId, courseId });
    } catch (e) {
      console.warn("Enrollment delete warning:", e.message);
    }

    const updatedCourse = await Course.findById(courseId)
      .populate("instructor", "username fullName role")
      .populate("students", "username fullName");

    res.json({ 
      message: "Successfully unenrolled from course", 
      course: updatedCourse 
    });
  } catch (error) {
    console.error("Error unenrolling from course:", error);
    res.status(500).json({ error: "Failed to unenroll from course" });
  }
});

/**
 * Get courses by educator ID
 */
router.get("/educator/:educatorId", authMiddleware, async (req, res) => {
  try {
    const { educatorId } = req.params;
    
    const courses = await Course.find({ instructor: educatorId })
      .populate("instructor", "fullName role")
      .populate("students", "fullName")
      .sort({ createdAt: -1 });

    res.json({ success: true, courses });
  } catch (error) {
    console.error("Error fetching educator courses:", error);
    res.status(500).json({ success: false, message: "Failed to fetch educator courses" });
  }
});

/**
 * Create a new course (educators only)
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "educator") {
      return res.status(403).json({ error: "Only educators can create courses" });
    }

    const {
      title,
      description,
      category,
      difficultyLevel,
      thumbnailUrl,
      privacy,
      price,
      isPaid,
      maxStudents,
      duration,
      tags,
      scheduleDays,
      scheduleSlot,
      startingDate
    } = req.body;

    if (!title || !category || !difficultyLevel) {
      return res.status(400).json({ error: "Title, category, and difficulty level are required" });
    }

    const course = new Course({
      title,
      description,
      category,
      difficultyLevel,
      thumbnailUrl,
      instructor: req.user.id,
      instructorName: req.user.fullName || req.user.name || 'Unknown Instructor',
      privacy: privacy || "public",
      price: isPaid ? (price || 0) : 0,
      isPaid: isPaid || false,
      maxStudents: maxStudents || null,
      enrolledCount: 0,
      duration,
      tags: tags || [],
      scheduleDays: scheduleDays || [],
      scheduleSlot: scheduleSlot || '',
      startingDate: startingDate ? new Date(startingDate) : null
    });

    await course.save();

    const populatedCourse = await Course.findById(course._id)
      .populate("instructor", "fullName role");

    res.status(201).json(populatedCourse);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
});

export default router;
