import Exam from "../models/Exam.js";
import ExamResult from "../models/ExamResult.js";
import Course from "../models/Course.js";
import Educator from "../models/Educator.js";
import Student from "../models/Student.js";

// GPA calculation utility function
const calculateGPA = (percentage) => {
  if (percentage >= 97) return 4.0;
  if (percentage >= 93) return 3.7;
  if (percentage >= 90) return 3.3;
  if (percentage >= 87) return 3.0;
  if (percentage >= 83) return 2.7;
  if (percentage >= 80) return 2.3;
  if (percentage >= 77) return 2.0;
  if (percentage >= 73) return 1.7;
  if (percentage >= 70) return 1.3;
  if (percentage >= 67) return 1.0;
  if (percentage >= 65) return 0.7;
  return 0.0;
};

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

// List exams with optional query filters (supports ?courseId=... or ?studentId=...)
export const listExams = async (req, res) => {
  try {
    const { courseId, educatorId, studentId } = req.query;
    let query = {};
    
    if (studentId) {
      // Get courses the student is enrolled in
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ success: false, message: "Student not found" });
      }
      
      // Find courses where student is enrolled
      const courses = await Course.find({ students: studentId }).select('_id');
      const courseIds = courses.map(course => course._id);
      query.courseId = { $in: courseIds };
    } else {
      if (courseId) query.courseId = courseId;
      if (educatorId) query.educatorId = educatorId;
    }

    const exams = await Exam.find(query)
      .populate('courseId', 'title category')
      .populate('educatorId', 'fullName email')
      .sort({ createdAt: -1 });

    // If studentId is provided, check which exams the student has already taken
    let examsWithAttemptStatus = exams;
    if (studentId) {
      const examResults = await ExamResult.find({ studentId }).select('examId');
      const takenExamIds = examResults.map(result => result.examId.toString());
      
      examsWithAttemptStatus = exams.map(exam => ({
        ...exam.toObject(),
        hasAttempted: takenExamIds.includes(exam._id.toString())
      }));
    }

    res.json({ success: true, data: examsWithAttemptStatus });
  } catch (error) {
    console.error("List exams error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch exams" });
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

// Submit exam with auto-grading
export const submitExam = async (req, res) => {
  try {
    const paramExamId = req.params?.examId;
    const { examId: bodyExamId, studentId, answers, timeSpent } = req.body;
    const examId = paramExamId || bodyExamId;

    // Validate required fields
    if (!examId || !studentId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ 
        success: false, 
        message: "examId, studentId and answers are required" 
      });
    }

    // Fetch exam with correct answers
    const exam = await Exam.findById(examId).populate('courseId', 'title');
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Check if student has already attempted this exam
    const existingResult = await ExamResult.findOne({ examId, studentId });
    if (existingResult) {
      return res.status(400).json({ 
        success: false, 
        message: "You have already attempted this exam" 
      });
    }

    // Grade the exam
    let earnedPoints = 0;
    const gradedAnswers = [];

    for (const answer of answers) {
      const question = exam.questions.find(q => q._id.toString() === answer.questionId);
      if (!question) {
        return res.status(400).json({ 
          success: false, 
          message: `Question ${answer.questionId} not found in exam` 
        });
      }

      const isCorrect = question.correctAnswer === answer.selectedOption;
      const points = isCorrect ? (question.points || 1) : 0;
      earnedPoints += points;

      gradedAnswers.push({
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect,
        points
      });
    }

    // Save exam result
    const examResult = new ExamResult({
      examId,
      studentId,
      answers: gradedAnswers,
      score: earnedPoints,
      totalQuestions: exam.questions.length,
      percentage: (earnedPoints / exam.questions.length) * 100,
      timeSpent: timeSpent || 0,
      submittedAt: new Date()
    });

    await examResult.save();

    res.json({
      success: true,
      message: "Exam submitted successfully",
      data: {
        score: earnedPoints,
        totalQuestions: exam.questions.length,
        percentage: Math.round((earnedPoints / exam.questions.length) * 100),
        timeSpent: timeSpent || 0,
        submittedAt: examResult.submittedAt,
        examTitle: exam.title,
        courseTitle: exam.courseId?.title || 'Unknown Course'
      }
    });
  } catch (error) {
    console.error("Submit exam error:", error);
    res.status(500).json({ success: false, message: "Failed to submit exam" });
  }
};

// Get student grades
export const getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Get all exam results for this student with proper population
    const examResults = await ExamResult.find({ studentId })
      .populate({
        path: 'examId',
        select: 'title courseId',
        populate: {
          path: 'courseId',
          select: 'title category'
        }
      })
      .sort({ submittedAt: -1 });

    // Format results for frontend
    const grades = examResults.map(result => ({
      examTitle: result.examId?.title || 'Unknown Exam',
      courseTitle: result.examId?.courseId?.title || 'Unknown Course',
      courseId: result.examId?.courseId?._id,
      score: result.score,
      totalQuestions: result.totalQuestions,
      percentage: result.percentage,
      submittedAt: result.submittedAt,
      attemptNumber: 1 // For now, since we only allow one attempt
    }));

    // Calculate GPA based on course averages
    const courseGrades = {};
    grades.forEach(grade => {
      if (grade.courseId) {
        const courseIdStr = grade.courseId.toString();
        if (!courseGrades[courseIdStr]) {
          courseGrades[courseIdStr] = {
            courseTitle: grade.courseTitle,
            percentages: []
          };
        }
        courseGrades[courseIdStr].percentages.push(grade.percentage);
      }
    });

    // Calculate average percentage per course and convert to GPA
    const courseAverages = Object.values(courseGrades).map(course => {
      const avgPercentage = course.percentages.reduce((sum, p) => sum + p, 0) / course.percentages.length;
      return {
        courseTitle: course.courseTitle,
        avgPercentage: Math.round(avgPercentage),
        gpa: calculateGPA(avgPercentage)
      };
    });

    const overallGPA = courseAverages.length > 0 
      ? (courseAverages.reduce((sum, course) => sum + course.gpa, 0) / courseAverages.length).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: grades,
      gpa: {
        overall: parseFloat(overallGPA),
        courseBreakdown: courseAverages,
        totalCourses: courseAverages.length
      }
    });
  } catch (error) {
    console.error("Get student grades error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch grades" });
  }
};

// Get exam results for educators
export const getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;

    const results = await ExamResult.find({ examId })
      .populate('studentId', 'fullName email')
      .populate('examId', 'title')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error("Get exam results error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch exam results" });
  }
};
