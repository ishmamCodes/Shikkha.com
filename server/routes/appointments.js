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

const router = express.Router();

// Appointment Slots Routes
router.post("/slots", createAppointmentSlot);
router.get("/slots/:educatorId", getEducatorSlots);
router.patch("/slots/:id", updateSlotStatus);
router.delete("/slots/:id", deleteAppointmentSlot);

// Appointments Routes
router.post("/", bookAppointment);
router.patch("/:id", updateAppointmentStatus);
router.get("/educator/:educatorId", getEducatorAppointments);
router.delete("/:id", deleteAppointment);

export default router;
