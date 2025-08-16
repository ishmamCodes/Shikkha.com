import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, enum: ["Mathematics", "Science", "Language", "History", "Computer Science", "Arts", "Music", "Physical Education", "Other"] },
    difficultyLevel: { type: String, required: true, enum: ["Beginner", "Intermediate", "Advanced"] },
    thumbnailUrl: { type: String, default: "" },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    privacy: { type: String, enum: ["public", "private"], default: "public" },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    materials: [{ type: mongoose.Schema.Types.ObjectId, ref: "Material" }],
    price: { type: Number, default: 0 }, // Free by default
    duration: { type: String, default: "" }, // e.g., "8 weeks", "Self-paced"
    tags: [{ type: String }], // For search and filtering
    // New schedule fields
    scheduleDays: {
      type: [{ type: String, enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] }],
      default: []
    },
    // A human-readable timeslot label like "08:00-09:20"
    scheduleSlot: { type: String, default: "" },
    startingDate: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);
export default Course;


