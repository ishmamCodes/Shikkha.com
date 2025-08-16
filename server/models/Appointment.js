import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    educatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    datetime: { type: Date, required: true },
    duration: { type: Number, default: 60 }, // duration in minutes
    status: { 
      type: String, 
      enum: ["pending", "confirmed", "canceled", "completed", "no-show"], 
      default: "pending" 
    },
    subject: { type: String, required: true }, // what the appointment is about
    description: { type: String, default: "" }, // additional details
    meetingType: { 
      type: String, 
      enum: ["video", "audio", "chat", "in-person"], 
      default: "video" 
    },
    meetingLink: { type: String, default: "" }, // for video/audio meetings
    location: { type: String, default: "" }, // for in-person meetings
    price: { type: Number, default: 0 }, // consultation fee
    notes: { type: String, default: "" }, // educator notes
    studentNotes: { type: String, default: "" }, // student notes
    canceledBy: { type: String, enum: ["student", "educator", "system"], default: null },
    cancelReason: { type: String, default: "" },
    reminderSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
export default Appointment;


