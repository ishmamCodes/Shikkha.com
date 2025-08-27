import mongoose from "mongoose";

const appointmentSlotSchema = new mongoose.Schema(
  {
    educatorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Educator", 
      required: true 
    },
    slot: { 
      type: Date, 
      required: true 
    },
    duration: { 
      type: Number, 
      default: 60 // duration in minutes
    },
    status: { 
      type: String, 
      enum: ["available", "disabled", "booked"], 
      default: "available" 
    },
    isPublished: { 
      type: Boolean, 
      default: false // Admin needs to approve/publish
    },
    price: { 
      type: Number, 
      default: 0 
    },
    description: { 
      type: String, 
      default: "" 
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate slots for same educator
appointmentSlotSchema.index({ educatorId: 1, slot: 1 }, { unique: true });

const AppointmentSlot = mongoose.models.AppointmentSlot || mongoose.model("AppointmentSlot", appointmentSlotSchema);
export default AppointmentSlot;
