import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Educator from "../models/Educator.js";

// GET /api/catalog/courses - List public courses with filters
export const getCourses = async (req, res) => {
  try {
    const { q, category, difficulty, price, page = 1, limit = 10 } = req.query;
    
    // Build query for public, active courses only
    let query = { privacy: 'public', isActive: true };
    
    // Add search query
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Add category filter
    if (category) {
      query.category = category;
    }
    
    // Add difficulty filter
    if (difficulty) {
      query.difficultyLevel = difficulty;
    }
    
    // Add price filter
    if (price === 'free') {
      query.price = { $eq: 0 };
    } else if (price === 'paid') {
      query.price = { $gt: 0 };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const courses = await Course.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Course.countDocuments(query);
    
    res.json({
      success: true,
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
};

// GET /api/catalog/courses/:id - Get single course details
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findOne({ 
      _id: id, 
      privacy: 'public', 
      isActive: true 
    });
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Get enrollment count
    const enrollmentCount = await Enrollment.countDocuments({ 
      courseId: id, 
      status: 'active' 
    });
    
    res.json({
      success: true,
      course: {
        ...course.toObject(),
        enrollmentCount
      }
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course' });
  }
};

// POST /api/catalog/enrollments - Enroll in a course
export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.id;
    
    // Verify course exists and is public
    const course = await Course.findOne({ 
      _id: courseId, 
      privacy: 'public', 
      isActive: true 
    });
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ 
      studentId, 
      courseId 
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already enrolled in this course' 
      });
    }
    
    // Create enrollment
    const enrollment = new Enrollment({
      studentId,
      courseId,
      status: 'active'
    });
    
    await enrollment.save();
    
    // Add student to course's students array
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { students: studentId }
    });
    
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollment
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ success: false, message: 'Failed to enroll in course' });
  }
};
