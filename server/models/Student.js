import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    // Auth credentials
    email: {
      type: String,
      default: "",
      index: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false, default: "" },
    dateOfBirth: { type: Date },
    role: { type: String, enum: ["student"], default: "student" },

    // Basic info
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "" },
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

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
export default Student;
