import express from "express";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
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
      duration,
      tags
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
      privacy: privacy || "public",
      price: price || 0,
      duration,
      tags: tags || []
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
