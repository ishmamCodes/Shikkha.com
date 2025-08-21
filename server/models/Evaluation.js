import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema(
  {
    courseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Course", 
      required: true 
    },
    educatorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Educator", 
      required: true 
    },
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Student", 
      required: true 
    },
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5 
    },
    comment: { 
      type: String, 
      required: true,
      maxlength: 1000
    },
    isAnonymous: { 
      type: Boolean, 
      default: true 
    },
    isVisible: { 
      type: Boolean, 
      default: true 
    },
    // Admin moderation
    isApproved: { 
      type: Boolean, 
      default: true 
    },
    moderatedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    moderationNote: { 
      type: String, 
      default: "" 
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate evaluations per student per course
evaluationSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

// Index for efficient educator queries
evaluationSchema.index({ educatorId: 1, createdAt: -1 });

const Evaluation = mongoose.models.Evaluation || mongoose.model("Evaluation", evaluationSchema);
export default Evaluation;
