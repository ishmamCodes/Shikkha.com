import express from "express";
import {
  createExam,
  getCourseExams,
  getEducatorExams,
  getExamById,
  updateExam,
  deleteExam,
  submitExam,
  getStudentGrades,
  getExamResults,
  listExams
} from "../controllers/examsController.js";

const router = express.Router();

// Exam Routes
router.get("/", listExams);
router.post("/", createExam);
router.get("/course/:courseId", getCourseExams);
router.get("/educator/:educatorId", getEducatorExams);
router.get("/:examId", getExamById);
router.put("/:examId", updateExam);
router.delete("/:examId", deleteExam);

// Exam Submission
router.post("/:examId/submit", submitExam);
router.post("/submit", submitExam);

// Grade Routes
router.get("/student/:studentId/grades", getStudentGrades);
router.get("/:examId/results", getExamResults);

export default router;
