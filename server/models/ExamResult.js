import mongoose from "mongoose";

const examResultSchema = new mongoose.Schema(
  {
    examId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Exam", 
      required: true 
    },
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Student", 
      required: true 
    },
    courseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Course", 
      required: true 
    },
    answers: [
      {
        questionId: { 
          type: mongoose.Schema.Types.ObjectId, 
          required: true 
        },
        selectedOption: { 
          type: String, 
          required: true 
        },
        isCorrect: { 
          type: Boolean, 
          required: true 
        },
        points: { 
          type: Number, 
          default: 0 
        }
      }
    ],
    score: { 
      type: Number, 
      required: true 
    },
    percentage: { 
      type: Number, 
      required: true 
    },
    totalPoints: { 
      type: Number, 
      required: true 
    },
    earnedPoints: { 
      type: Number, 
      required: true 
    },
    timeSpent: { 
      type: Number, // in minutes
      default: 0 
    },
    submittedAt: { 
      type: Date, 
      default: Date.now 
    },
    attemptNumber: { 
      type: Number, 
      default: 1 
    }
  },
  { timestamps: true }
);

// Compound index to track attempts per student per exam
examResultSchema.index({ examId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });

// Index for efficient student queries
examResultSchema.index({ studentId: 1, submittedAt: -1 });

// Index for efficient exam queries
examResultSchema.index({ examId: 1, submittedAt: -1 });

const ExamResult = mongoose.models.ExamResult || mongoose.model("ExamResult", examResultSchema);
export default ExamResult;
