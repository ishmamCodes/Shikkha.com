import AppointmentSlot from "../models/AppointmentSlot.js";
import Appointment from "../models/Appointment.js";
import Educator from "../models/Educator.js";
import Student from "../models/Student.js";

// Educator creates available time slots
export const createAppointmentSlot = async (req, res) => {
  try {
    const { educatorId, slot, duration, price, description } = req.body;

    // Validate educator exists
    const educator = await Educator.findById(educatorId);
    if (!educator) {
      return res.status(404).json({ success: false, message: "Educator not found" });
    }

    // Check if slot already exists
    const existingSlot = await AppointmentSlot.findOne({ educatorId, slot });
    if (existingSlot) {
      return res.status(400).json({ success: false, message: "Time slot already exists" });
    }

    const appointmentSlot = new AppointmentSlot({
      educatorId,
      slot: new Date(slot),
      duration: duration || 60,
      price: price || 0,
      description: description || ""
    });

    await appointmentSlot.save();

    res.status(201).json({
      success: true,
      message: "Appointment slot created successfully",
      data: appointmentSlot
    });
  } catch (error) {
    console.error("Create appointment slot error:", error);
    res.status(500).json({ success: false, message: "Failed to create appointment slot" });
  }
};

// Delete an appointment
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    await Appointment.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Delete appointment error:", error);
    res.status(500).json({ success: false, message: "Failed to delete appointment" });
  }
};

// Get educator's appointment slots
export const getEducatorSlots = async (req, res) => {
  try {
    const { educatorId } = req.params;
    const { status } = req.query;

    let query = { educatorId };
    if (status) {
      query.status = status;
    }

    const slots = await AppointmentSlot.find(query)
      .populate('educatorId', 'fullName email')
      .sort({ slot: 1 });

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    console.error("Get educator slots error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch appointment slots" });
  }
};

// Admin updates slot status (enable/disable/publish)
export const updateSlotStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isPublished } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (typeof isPublished === 'boolean') updateData.isPublished = isPublished;

    const slot = await AppointmentSlot.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('educatorId', 'fullName email');

    if (!slot) {
      return res.status(404).json({ success: false, message: "Appointment slot not found" });
    }

    res.json({
      success: true,
      message: "Slot updated successfully",
      data: slot
    });
  } catch (error) {
    console.error("Update slot status error:", error);
    res.status(500).json({ success: false, message: "Failed to update slot status" });
  }
};

// Student books an appointment
export const bookAppointment = async (req, res) => {
  try {
    const { studentId, educatorId, slotId, subject, description, meetingType } = req.body;

    // Validate slot exists and is available
    const slot = await AppointmentSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: "Appointment slot not found" });
    }

    if (slot.status !== 'available' || !slot.isPublished) {
      return res.status(400).json({ success: false, message: "Appointment slot is not available" });
    }

    // Validate student and educator exist
    const [student, educator] = await Promise.all([
      Student.findById(studentId),
      Educator.findById(educatorId)
    ]);

    if (!student || !educator) {
      return res.status(404).json({ success: false, message: "Student or educator not found" });
    }

    // Create appointment
    const appointment = new Appointment({
      studentId,
      educatorId,
      datetime: slot.slot,
      duration: slot.duration,
      subject: subject || "General Consultation",
      description: description || "",
      meetingType: meetingType || "video",
      price: slot.price
    });

    await appointment.save();

    // Update slot status to booked
    slot.status = 'booked';
    await slot.save();

    // Populate appointment data
    await appointment.populate([
      { path: 'studentId', select: 'fullName email' },
      { path: 'educatorId', select: 'fullName email' }
    ]);

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment
    });
  } catch (error) {
    console.error("Book appointment error:", error);
    res.status(500).json({ success: false, message: "Failed to book appointment" });
  }
};

// Educator confirms/rejects appointment
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { 
        status,
        notes: notes || "",
        updatedAt: new Date()
      },
      { new: true }
    ).populate([
      { path: 'studentId', select: 'fullName email' },
      { path: 'educatorId', select: 'fullName email' }
    ]);

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // If appointment is canceled, make the slot available again
    if (status === 'canceled') {
      await AppointmentSlot.findOneAndUpdate(
        { educatorId: appointment.educatorId, slot: appointment.datetime },
        { status: 'available' }
      );
    }

    res.json({
      success: true,
      message: `Appointment ${status} successfully`,
      data: appointment
    });
  } catch (error) {
    console.error("Update appointment status error:", error);
    res.status(500).json({ success: false, message: "Failed to update appointment status" });
  }
};

// Get educator's appointments
export const getEducatorAppointments = async (req, res) => {
  try {
    const { educatorId } = req.params;
    const { status } = req.query;

    let query = { educatorId };
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('studentId', 'fullName email phone')
      .populate('educatorId', 'fullName email')
      .sort({ datetime: -1 });

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error("Get educator appointments error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch appointments" });
  }
};

// Delete appointment slot
export const deleteAppointmentSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const slot = await AppointmentSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ success: false, message: "Appointment slot not found" });
    }

    // Security check: Only admin or the slot's owner can delete
    if (user.role !== 'admin' && slot.educatorId.toString() !== user.id) {
        return res.status(403).json({ success: false, message: "Forbidden: You cannot delete this slot" });
    }

    // If slot is booked, handle differently based on role
    if (slot.status === 'booked') {
      if (user.role === 'admin') {
        // Admin can delete a booked slot, which also deletes the appointment
        await Appointment.deleteOne({ educatorId: slot.educatorId, datetime: slot.slot });
      } else {
        // Non-admins cannot delete a booked slot
        return res.status(400).json({ success: false, message: "Cannot delete a booked appointment slot. Please cancel the appointment first." });
      }
    }

    await AppointmentSlot.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Appointment slot deleted successfully"
    });
  } catch (error) {
    console.error("Delete appointment slot error:", error);
    res.status(500).json({ success: false, message: "Failed to delete appointment slot" });
  }
};
