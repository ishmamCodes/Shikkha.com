import express from "express";
import {
  getEducatorEvaluations,
  getCourseEvaluations,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation
} from "../controllers/evaluationsController.js";

const router = express.Router();

// Evaluation Routes
router.get("/educator/:educatorId", getEducatorEvaluations);
router.get("/course/:courseId", getCourseEvaluations);
router.post("/", createEvaluation);
router.put("/:evaluationId", updateEvaluation);
router.delete("/:evaluationId", deleteEvaluation);

export default router;
