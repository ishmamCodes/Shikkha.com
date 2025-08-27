import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import {
  getStudentSchedule,
  getStudentGrades,
  getStudentAppointments,
  cancelAppointment
} from "../../controllers/studentController.js";

const router = express.Router();

// All student routes require authentication
router.use(authMiddleware);

// Student dashboard routes
router.get('/schedule', getStudentSchedule);
router.get('/grades', getStudentGrades);
router.get('/appointments', getStudentAppointments);
router.put('/appointments/:appointmentId/cancel', cancelAppointment);

export default router;
