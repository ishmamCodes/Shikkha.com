import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import authMiddleware, { authorizeRole } from "../middleware/authMiddleware.js";
import {
  getEducatorProfile,
  updateEducatorProfile,
  updateEducatorPassword,
  requestEmailChange,
  listMyEmailChangeRequests,
  decideEmailChange,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseStudents,
  removeStudentFromCourse,
  getEducatorAppointments,
  updateAppointmentStatus,
  getEducatorMessages,
  sendMessage,
  markMessageAsRead,
  handleUpload,
  uploadEducatorAvatar,
  removeEducatorAvatar,
  getCourseMaterials,
  deleteMaterial,
  getDashboardStats
} from "../controllers/educatorController.js";

const router = express.Router();

// Configure multer for local uploads to /uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || "";
    cb(null, `${uniqueSuffix}${ext}`);
  },
});
const upload = multer({ storage });

// Educator profile
router.get("/educators/:id", authMiddleware, authorizeRole(["educator", "admin"]), getEducatorProfile);
router.put("/educators/:id", authMiddleware, authorizeRole(["educator", "admin"]), updateEducatorProfile);
router.put("/educators/:id/password", authMiddleware, authorizeRole(["educator", "admin"]), updateEducatorPassword);

// Courses
router.post("/courses", authMiddleware, authorizeRole(["educator", "admin"]), createCourse);
router.put("/courses/:id", authMiddleware, authorizeRole(["educator", "admin"]), updateCourse);
router.delete("/courses/:id", authMiddleware, authorizeRole(["educator", "admin"]), deleteCourse);
router.get("/courses/:id/students", authMiddleware, authorizeRole(["educator", "admin"]), getCourseStudents);
router.delete("/courses/:id/students/:studentId", authMiddleware, authorizeRole(["educator", "admin"]), removeStudentFromCourse);

// Course Materials
router.get("/courses/:courseId/materials", authMiddleware, authorizeRole(["educator", "admin"]), getCourseMaterials);
router.delete("/materials/:materialId", authMiddleware, authorizeRole(["educator", "admin"]), deleteMaterial);

// Appointments
router.get("/appointments", authMiddleware, authorizeRole(["educator", "admin"]), getEducatorAppointments);
router.put("/appointments/:id/status", authMiddleware, authorizeRole(["educator", "admin"]), updateAppointmentStatus);

// Messaging
router.get("/messages", authMiddleware, authorizeRole(["educator", "admin"]), getEducatorMessages);
router.post("/messages", authMiddleware, authorizeRole(["educator", "admin"]), sendMessage);
router.put("/messages/:messageId/read", authMiddleware, authorizeRole(["educator", "admin"]), markMessageAsRead);

// Uploads
router.post("/uploads", authMiddleware, authorizeRole(["educator", "admin"]), upload.single("file"), handleUpload);

// Avatar upload/remove
// Note: uploadEducatorAvatar already applies its own multer single('avatar') middleware.
router.post("/profile/avatar", authMiddleware, authorizeRole(["educator", "admin"]), uploadEducatorAvatar);
router.delete("/profile/avatar", authMiddleware, authorizeRole(["educator", "admin"]), removeEducatorAvatar);

// Dashboard stats
router.get('/dashboard/stats', authMiddleware, authorizeRole(["educator", "admin"]), getDashboardStats);

// Alias routes matching requested shapes
router.get('/educator/:id', authMiddleware, authorizeRole(["educator", "admin"]), getEducatorProfile);
router.put('/educator/:id/update', authMiddleware, authorizeRole(["educator", "admin"]), updateEducatorProfile);

// Email change flow
router.post('/educators/:id/email-change', authMiddleware, authorizeRole(["educator", "admin"]), requestEmailChange);
router.get('/educators/me/email-change', authMiddleware, authorizeRole(["educator", "admin"]), listMyEmailChangeRequests);
router.post('/educators/email-change/:requestId/decide', authMiddleware, authorizeRole(["admin"]), decideEmailChange);

export default router;


