import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
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
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      default: "" 
    },
    questions: [
      {
        questionText: { 
          type: String, 
          required: true 
        },
        options: [{ 
          type: String, 
          required: true 
        }],
        correctAnswer: { 
          type: String, 
          required: true 
        },
        points: { 
          type: Number, 
          default: 1 
        }
      }
    ],
    totalPoints: { 
      type: Number, 
      default: 0 
    },
    timeLimit: { 
      type: Number, 
      default: 60 // in minutes
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    dueDate: { 
      type: Date 
    },
    attempts: { 
      type: Number, 
      default: 1 
    }
  },
  { timestamps: true }
);

// Calculate total points before saving
examSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((total, question) => total + (question.points || 1), 0);
  next();
});

const Exam = mongoose.models.Exam || mongoose.model("Exam", examSchema);
export default Exam;
