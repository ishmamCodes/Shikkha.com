import express from "express";
import authMiddleware, { authorizeRole } from "../middleware/authMiddleware.js";
import {
  searchEducators,
  getEducatorProfile,
  bookAppointment,
  getStudentAppointments,
  cancelAppointment,
  getStudentMessages,
  sendStudentMessage,
  markStudentMessageAsRead,
  enrollInCourse,
  getStudentCourses,
  unenrollFromCourse,
} from "../controllers/studentController.js";

const router = express.Router();

// Educator search and profiles
router.get("/educators/search", authMiddleware, authorizeRole(["student", "admin"]), searchEducators);
router.get("/educators/:educatorId", authMiddleware, authorizeRole(["student", "admin"]), getEducatorProfile);

// Appointments
router.post("/appointments", authMiddleware, authorizeRole(["student", "admin"]), bookAppointment);
router.get("/appointments", authMiddleware, authorizeRole(["student", "admin"]), getStudentAppointments);
router.put("/appointments/:appointmentId/cancel", authMiddleware, authorizeRole(["student", "admin"]), cancelAppointment);

// Messaging
router.get("/messages", authMiddleware, authorizeRole(["student", "admin"]), getStudentMessages);
router.post("/messages", authMiddleware, authorizeRole(["student", "admin"]), sendStudentMessage);
router.put("/messages/:messageId/read", authMiddleware, authorizeRole(["student", "admin"]), markStudentMessageAsRead);

// Course enrollment
router.post("/courses/:courseId/enroll", authMiddleware, authorizeRole(["student", "admin"]), enrollInCourse);
router.get("/courses", authMiddleware, authorizeRole(["student", "admin"]), getStudentCourses);
router.delete("/courses/:courseId/enroll", authMiddleware, authorizeRole(["student", "admin"]), unenrollFromCourse);

export default router;
