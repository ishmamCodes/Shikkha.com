import Exam from "../models/Exam.js";
import Course from "../models/Course.js";
import Educator from "../models/Educator.js";

// Create a new exam
export const createExam = async (req, res) => {
  try {
    const { courseId, educatorId, title, description, questions, timeLimit, dueDate, attempts } = req.body;

    // Validate course exists and belongs to educator
    const course = await Course.findOne({ _id: courseId, instructor: educatorId });
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found or access denied" });
    }

    // Validate educator exists
    const educator = await Educator.findById(educatorId);
    if (!educator) {
      return res.status(404).json({ success: false, message: "Educator not found" });
    }

    // Validate questions format
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: "At least one question is required" });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.questionText || !question.options || !Array.isArray(question.options) || question.options.length < 2) {
        return res.status(400).json({ 
          success: false, 
          message: `Question ${i + 1} must have text and at least 2 options` 
        });
      }
      if (!question.correctAnswer || !question.options.includes(question.correctAnswer)) {
        return res.status(400).json({ 
          success: false, 
          message: `Question ${i + 1} must have a valid correct answer from the options` 
        });
      }
    }

    const exam = new Exam({
      courseId,
      educatorId,
      title,
      description: description || "",
      questions,
      timeLimit: timeLimit || 60,
      dueDate: dueDate ? new Date(dueDate) : null,
      attempts: attempts || 1
    });

    await exam.save();

    // Populate course and educator info
    await exam.populate([
      { path: 'courseId', select: 'title category' },
      { path: 'educatorId', select: 'fullName email' }
    ]);

    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: exam
    });
  } catch (error) {
    console.error("Create exam error:", error);
    res.status(500).json({ success: false, message: "Failed to create exam" });
  }
};

// Get exams for a specific course
export const getCourseExams = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { educatorId } = req.query;

    let query = { courseId };
    if (educatorId) {
      query.educatorId = educatorId;
    }

    const exams = await Exam.find(query)
      .populate('courseId', 'title category')
      .populate('educatorId', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    console.error("Get course exams error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch course exams" });
  }
};

// Get educator's all exams
export const getEducatorExams = async (req, res) => {
  try {
    const { educatorId } = req.params;

    const exams = await Exam.find({ educatorId })
      .populate('courseId', 'title category')
      .populate('educatorId', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    console.error("Get educator exams error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch educator exams" });
  }
};

// Get single exam with questions
export const getExamById = async (req, res) => {
  try {
    const { examId } = req.params;
    const { includeAnswers } = req.query;

    const exam = await Exam.findById(examId)
      .populate('courseId', 'title category')
      .populate('educatorId', 'fullName email');

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    // Remove correct answers for student view unless specifically requested
    if (includeAnswers !== 'true') {
      exam.questions = exam.questions.map(question => ({
        _id: question._id,
        questionText: question.questionText,
        options: question.options,
        points: question.points
      }));
    }

    res.json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error("Get exam by ID error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch exam" });
  }
};

// Update exam
export const updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { title, description, questions, timeLimit, dueDate, attempts, isActive } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    // Validate questions if provided
    if (questions && Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (!question.questionText || !question.options || !Array.isArray(question.options) || question.options.length < 2) {
          return res.status(400).json({ 
            success: false, 
            message: `Question ${i + 1} must have text and at least 2 options` 
          });
        }
        if (!question.correctAnswer || !question.options.includes(question.correctAnswer)) {
          return res.status(400).json({ 
            success: false, 
            message: `Question ${i + 1} must have a valid correct answer from the options` 
          });
        }
      }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (questions) updateData.questions = questions;
    if (timeLimit) updateData.timeLimit = timeLimit;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (attempts) updateData.attempts = attempts;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      updateData,
      { new: true }
    ).populate([
      { path: 'courseId', select: 'title category' },
      { path: 'educatorId', select: 'fullName email' }
    ]);

    res.json({
      success: true,
      message: "Exam updated successfully",
      data: updatedExam
    });
  } catch (error) {
    console.error("Update exam error:", error);
    res.status(500).json({ success: false, message: "Failed to update exam" });
  }
};

// Delete exam
export const deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    await Exam.findByIdAndDelete(examId);

    res.json({
      success: true,
      message: "Exam deleted successfully"
    });
  } catch (error) {
    console.error("Delete exam error:", error);
    res.status(500).json({ success: false, message: "Failed to delete exam" });
  }
};

// Submit exam (placeholder for Shadman's implementation)
export const submitExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { studentId, answers } = req.body;

    // This is a placeholder endpoint for future implementation
    // Shadman will implement the full grading logic here
    
    res.status(501).json({
      success: false,
      message: "Exam submission feature will be implemented in the next phase"
    });
  } catch (error) {
    console.error("Submit exam error:", error);
    res.status(500).json({ success: false, message: "Failed to submit exam" });
  }
};
