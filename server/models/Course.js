import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, enum: ["Mathematics", "Science", "Language", "History", "Computer Science", "Arts", "Music", "Physical Education", "Other"] },
    difficultyLevel: { type: String, required: true, enum: ["Beginner", "Intermediate", "Advanced"] },
    thumbnailUrl: { type: String, default: "" },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Educator", required: true },
    instructorName: { type: String, required: true }, // Store educator's name for display
    privacy: { type: String, enum: ["public", "private"], default: "public" },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    materials: [{ type: mongoose.Schema.Types.ObjectId, ref: "Material" }],
    price: { type: Number, default: 0 }, // Free by default
    isPaid: { type: Boolean, default: false },
    maxStudents: { type: Number, default: null }, // null means unlimited
    enrolledCount: { type: Number, default: 0 },
    duration: { type: String, default: "" }, // e.g., "8 weeks", "Self-paced"
    tags: [{ type: String }], // For search and filtering
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    // Additional fields from CreateCoursePage form
    scheduleDays: [{ type: String }],
    scheduleSlot: { type: String, default: "" },
    startingDate: { type: Date }
  },
  { timestamps: true }
);

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);
export default Course;


