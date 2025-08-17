import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import {
  getCourses,
  getCourseById,
  enrollInCourse
} from "../../controllers/catalogController.js";

const router = express.Router();

// All catalog routes require authentication
router.use(authMiddleware);

// Catalog routes
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseById);
router.post('/enrollments', enrollInCourse);

export default router;
