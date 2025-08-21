import express from "express";
import {
  createExam,
  getCourseExams,
  getEducatorExams,
  getExamById,
  updateExam,
  deleteExam,
  submitExam
} from "../controllers/examsController.js";

const router = express.Router();

// Exam Routes
router.post("/", createExam);
router.get("/course/:courseId", getCourseExams);
router.get("/educator/:educatorId", getEducatorExams);
router.get("/:examId", getExamById);
router.put("/:examId", updateExam);
router.delete("/:examId", deleteExam);

// Exam Submission (placeholder for Shadman's implementation)
router.post("/:examId/submit", submitExam);

export default router;
