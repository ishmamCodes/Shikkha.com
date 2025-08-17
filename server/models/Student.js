import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    // Auth credentials
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false, required: [true, "Password is required"] },
    dateOfBirth: { type: Date, required: [true, "Date of birth is required"] },
    role: { type: String, enum: ["student"], default: "student" },

    // Basic info
    fullName: { type: String, required: [true, "Full name is required"] },
    phone: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "" },
    // Admin moderation
    status: { type: String, enum: ["active", "suspended", "pending"], default: "active", index: true },
    // Student specific
    institution: { type: String, default: "" },
    gradeLevel: { type: String, default: "" },
    studentId: { type: String, default: "" },
    guardianName: { type: String, default: "" },
    guardianPhone: { type: String, default: "" },
    // Address
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

// Ensure unique index on email
studentSchema.index({ email: 1 }, { unique: true, name: 'email_1' });

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
export default Student;
