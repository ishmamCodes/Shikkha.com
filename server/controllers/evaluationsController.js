import Evaluation from "../models/Evaluation.js";
import Course from "../models/Course.js";
import Educator from "../models/Educator.js";
import Student from "../models/Student.js";

// Get evaluations for a specific educator
export const getEducatorEvaluations = async (req, res) => {
  try {
    const { educatorId } = req.params;

    // Validate educator exists
    const educator = await Educator.findById(educatorId);
    if (!educator) {
      return res.status(404).json({ success: false, message: "Educator not found" });
    }

    // Get all evaluations for this educator
    const evaluations = await Evaluation.find({ 
      educatorId, 
      isVisible: true, 
      isApproved: true 
    })
      .populate('courseId', 'title category')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = await calculateEducatorStats(educatorId);

    res.json({
      success: true,
      data: {
        evaluations: evaluations.map(evaluation => ({
          _id: evaluation._id,
          rating: evaluation.rating,
          comment: evaluation.comment,
          course: evaluation.courseId,
          submissionDate: evaluation.createdAt,
          // Keep student anonymous
          studentName: "Anonymous Student"
        })),
        stats
      }
    });
  } catch (error) {
    console.error("Get educator evaluations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch evaluations" });
  }
};

// Summary endpoint for instructor average rating and counts
export const getInstructorEvaluationsSummary = async (req, res) => {
  try {
    const { id } = req.params; // instructor id
    // Ensure educator exists
    const educator = await Educator.findById(id).select('_id');
    if (!educator) {
      return res.status(404).json({ success: false, message: 'Educator not found' });
    }

    const stats = await calculateEducatorStats(id);
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('getInstructorEvaluationsSummary error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch evaluations summary' });
  }
};

// Get evaluations for a specific course
export const getCourseEvaluations = async (req, res) => {
  try {
    const { courseId } = req.params;

    const evaluations = await Evaluation.find({ 
      courseId, 
      isVisible: true, 
      isApproved: true 
    })
      .populate('courseId', 'title category')
      .sort({ createdAt: -1 });

    // Calculate course average
    const totalRating = evaluations.reduce((sum, evaluation) => sum + evaluation.rating, 0);
    const averageRating = evaluations.length > 0 ? (totalRating / evaluations.length).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        evaluations: evaluations.map(evaluation => ({
          _id: evaluation._id,
          rating: evaluation.rating,
          comment: evaluation.comment,
          course: evaluation.courseId,
          submissionDate: evaluation.createdAt,
          studentName: "Anonymous Student"
        })),
        averageRating: parseFloat(averageRating),
        totalEvaluations: evaluations.length
      }
    });
  } catch (error) {
    console.error("Get course evaluations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch course evaluations" });
  }
};

// Create new evaluation (for future student implementation)
export const createEvaluation = async (req, res) => {
  try {
    const { courseId, studentId, rating, comment } = req.body;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Check if student is enrolled in the course
    if (!course.students.includes(studentId)) {
      return res.status(403).json({ success: false, message: "Student not enrolled in this course" });
    }

    // Check if evaluation already exists
    const existingEvaluation = await Evaluation.findOne({ courseId, studentId });
    if (existingEvaluation) {
      return res.status(400).json({ success: false, message: "Evaluation already submitted for this course" });
    }

    const evaluation = new Evaluation({
      courseId,
      educatorId: course.instructor,
      studentId,
      rating: parseInt(rating),
      comment: (comment || '').trim()
    });

    await evaluation.save();

    res.status(201).json({
      success: true,
      message: "Evaluation submitted successfully",
      data: evaluation
    });
  } catch (error) {
    console.error("Create evaluation error:", error);
    res.status(500).json({ success: false, message: "Failed to submit evaluation" });
  }
};

// Update evaluation (for future student implementation)
export const updateEvaluation = async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const { rating, comment } = req.body;

    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ success: false, message: "Evaluation not found" });
    }

    evaluation.rating = parseInt(rating);
    evaluation.comment = comment.trim();
    await evaluation.save();

    res.json({
      success: true,
      message: "Evaluation updated successfully",
      data: evaluation
    });
  } catch (error) {
    console.error("Update evaluation error:", error);
    res.status(500).json({ success: false, message: "Failed to update evaluation" });
  }
};

// Delete evaluation (admin only)
export const deleteEvaluation = async (req, res) => {
  try {
    const { evaluationId } = req.params;

    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ success: false, message: "Evaluation not found" });
    }

    await Evaluation.findByIdAndDelete(evaluationId);

    res.json({
      success: true,
      message: "Evaluation deleted successfully"
    });
  } catch (error) {
    console.error("Delete evaluation error:", error);
    res.status(500).json({ success: false, message: "Failed to delete evaluation" });
  }
};

// Helper function to calculate educator statistics
const calculateEducatorStats = async (educatorId) => {
  try {
    const evaluations = await Evaluation.find({ 
      educatorId, 
      isVisible: true, 
      isApproved: true 
    }).populate('courseId', 'title');

    if (evaluations.length === 0) {
      return {
        overallAverage: 0,
        totalEvaluations: 0,
        courseAverages: []
      };
    }

    // Calculate overall average
    const totalRating = evaluations.reduce((sum, evaluation) => sum + evaluation.rating, 0);
    const overallAverage = (totalRating / evaluations.length).toFixed(1);

    // Calculate per-course averages
    const courseGroups = evaluations.reduce((groups, evaluation) => {
      const courseId = evaluation.courseId._id.toString();
      if (!groups[courseId]) {
        groups[courseId] = {
          courseId: evaluation.courseId._id,
          courseName: evaluation.courseId.title,
          ratings: []
        };
      }
      groups[courseId].ratings.push(evaluation.rating);
      return groups;
    }, {});

    const courseAverages = Object.values(courseGroups).map(group => ({
      courseId: group.courseId,
      courseName: group.courseName,
      average: (group.ratings.reduce((sum, rating) => sum + rating, 0) / group.ratings.length).toFixed(1),
      count: group.ratings.length
    }));

    return {
      overallAverage: parseFloat(overallAverage),
      totalEvaluations: evaluations.length,
      courseAverages
    };
  } catch (error) {
    console.error("Calculate educator stats error:", error);
    return {
      overallAverage: 0,
      totalEvaluations: 0,
      courseAverages: []
    };
  }
};
