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
  getStudentCourseById,
  getStudentPurchases,
  unenrollFromCourse,
  getStudentCourseMaterials,
  downloadStudentCourseMaterial,
  getStudentProfile,
  updateStudentProfile,
  getStudentSchedule,
  getStudentGrades,
  getCompletedCourses,
  uploadAvatar,
  removeAvatar,
  getDashboardStats,
  listStudents,
  suspendStudent,
  activateStudent,
  deleteStudent
} from '../controllers/studentController.js';
import { getStudentGrades as getExamStudentGrades } from '../controllers/examsController.js';

const router = express.Router();

// Educator search and profiles
router.get("/educators/search", authMiddleware, authorizeRole(["student", "admin"]), searchEducators);
router.get("/educators/:educatorId", authMiddleware, authorizeRole(["student", "admin"]), getEducatorProfile);

// Dashboard
router.get("/dashboard-stats", authMiddleware, authorizeRole(["student", "admin"]), getDashboardStats);

// Admin student management
router.get('/', authMiddleware, authorizeRole(['admin']), listStudents);
router.patch('/:id/suspend', authMiddleware, authorizeRole(['admin']), suspendStudent);
router.patch('/:id/activate', authMiddleware, authorizeRole(['admin']), activateStudent);
router.delete('/:id', authMiddleware, authorizeRole(['admin']), deleteStudent);

// Student profile
router.get("/profile", authMiddleware, authorizeRole(["student", "admin"]), getStudentProfile);
router.put("/profile", authMiddleware, authorizeRole(["student", "admin"]), updateStudentProfile);

// Appointments (students only)
router.post("/appointments", authMiddleware, authorizeRole(["student"]), bookAppointment);
router.get("/appointments", authMiddleware, authorizeRole(["student"]), getStudentAppointments);
router.put("/appointments/:appointmentId/cancel", authMiddleware, authorizeRole(["student"]), cancelAppointment);

// Schedule and Grades
router.get("/schedule", authMiddleware, authorizeRole(["student", "admin"]), getStudentSchedule);
router.get("/grades", authMiddleware, authorizeRole(["student", "admin"]), getStudentGrades);
// New: explicit studentId grades for exam results
router.get(
  "/:studentId/grades",
  authMiddleware,
  authorizeRole(["student", "admin"]),
  (req, res, next) => {
    // Only allow self-access unless admin
    if (req.user.role !== 'admin' && req.user.id !== req.params.studentId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    return getExamStudentGrades(req, res, next);
  }
);

// Completed courses for evaluations
router.get(
  "/:studentId/completed-courses",
  authMiddleware,
  authorizeRole(["student", "admin"]),
  (req, res, next) => {
    // Only allow self-access unless admin
    if (req.user.role !== 'admin' && req.user.id !== req.params.studentId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    return getCompletedCourses(req, res, next);
  }
);

// Messaging
router.get("/messages", authMiddleware, authorizeRole(["student", "admin"]), getStudentMessages);
router.post("/messages", authMiddleware, authorizeRole(["student", "admin"]), sendStudentMessage);
router.put("/messages/:messageId/read", authMiddleware, authorizeRole(["student", "admin"]), markStudentMessageAsRead);

// Course enrollment
router.post("/courses/:courseId/enroll", authMiddleware, authorizeRole(["student", "admin"]), enrollInCourse);
router.get("/courses/:courseId", authMiddleware, authorizeRole(["student", "admin"]), getStudentCourseById);
router.get("/courses", authMiddleware, authorizeRole(["student", "admin"]), getStudentCourses);
router.delete("/courses/:courseId/enroll", authMiddleware, authorizeRole(["student", "admin"]), unenrollFromCourse);
// Alias for backward compatibility
router.get("/enrolled-courses", authMiddleware, authorizeRole(["student", "admin"]), getStudentCourses);
// Student purchases
router.get("/purchases", authMiddleware, authorizeRole(["student", "admin"]), getStudentPurchases);
// Course materials (student)
router.get("/courses/:courseId/materials", authMiddleware, authorizeRole(["student", "admin"]), getStudentCourseMaterials);
router.get("/courses/:courseId/materials/:materialId/download", authMiddleware, authorizeRole(["student", "admin"]), downloadStudentCourseMaterial);

// Avatar upload/remove
router.post("/profile/avatar", authMiddleware, authorizeRole(["student", "admin"]), uploadAvatar);
router.delete("/profile/avatar", authMiddleware, authorizeRole(["student", "admin"]), removeAvatar);

export default router;
