import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    enrolledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["pending", "active", "completed", "dropped"], default: "pending" },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    paymentStatus: { type: String, enum: ["free", "pending", "paid"], default: "free" }
  },
  { timestamps: true }
);

// Ensure a student can only enroll once per course
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const Enrollment = mongoose.models.Enrollment || mongoose.model("Enrollment", enrollmentSchema);
export default Enrollment;
