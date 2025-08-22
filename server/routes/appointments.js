import express from "express";
import {
  createAppointmentSlot,
  getEducatorSlots,
  updateSlotStatus,
  bookAppointment,
  updateAppointmentStatus,
  getEducatorAppointments,
  deleteAppointmentSlot,
  deleteAppointment
} from "../controllers/appointmentsController.js";
import authMiddleware, { authorizeRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Appointment Slots Routes
// Only admins and educators can create slots
router.post("/slots", authMiddleware, authorizeRole(['admin', 'educator']), createAppointmentSlot);
// Authenticated users can view slots
router.get("/slots/:educatorId", authMiddleware, getEducatorSlots);
// Only admins and the educator who owns the slot can update it (logic in controller)
router.patch("/slots/:id", authMiddleware, authorizeRole(['admin', 'educator']), updateSlotStatus);
// Only admins and the educator who owns the slot can delete it
router.delete("/slots/:id", authMiddleware, authorizeRole(['admin', 'educator']), deleteAppointmentSlot);

// Appointments Routes
// Only students can book appointments
router.post("/", authMiddleware, authorizeRole(['student']), bookAppointment);
// Only educators can update appointment status
router.patch("/:id", authMiddleware, authorizeRole(['educator']), updateAppointmentStatus);
// Authenticated users can view appointments
router.get("/educator/:educatorId", authMiddleware, getEducatorAppointments);
// Only the student who booked or an admin can delete
router.delete("/:id", authMiddleware, deleteAppointment);

export default router;
