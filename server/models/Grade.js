import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    courseTitle: { type: String, required: true },
    grade: { type: String, required: true }, // A+, A, B+, etc.
    points: { type: Number, min: 0, max: 4 }, // GPA points
    feedback: { type: String, default: "" },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

// Ensure one grade per student per course
gradeSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const Grade = mongoose.models.Grade || mongoose.model("Grade", gradeSchema);
export default Grade;
