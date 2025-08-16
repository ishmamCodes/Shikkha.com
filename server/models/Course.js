import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    privacy: { type: String, enum: ["public", "private"], default: "public" },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    materials: [{ type: mongoose.Schema.Types.ObjectId, ref: "Material" }]
  },
  { timestamps: true }
);

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);
export default Course;


