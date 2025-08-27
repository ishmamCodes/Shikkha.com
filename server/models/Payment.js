import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    type: { type: String, enum: ["course", "book", "cart"], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId }, // courseId or bookId (not required for cart)
    amount: { type: Number, required: true, min: 0 },
    educatorShare: { type: Number, default: 0 }, // 60% for courses, 0 for books
    adminShare: { type: Number, default: 0 }, // 40% for courses, 100% for books
    status: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
    stripePaymentIntentId: { type: String },
    stripeSessionId: { type: String },
    paymentMethod: { type: String, default: "stripe" },
    metadata: {
      courseName: { type: String },
      bookTitle: { type: String },
      educatorId: { type: mongoose.Schema.Types.ObjectId, ref: "Educator" },
      educatorName: { type: String }
    }
  },
  { timestamps: true }
);

// Index for efficient queries
paymentSchema.index({ studentId: 1, type: 1 });
paymentSchema.index({ "metadata.educatorId": 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
export default Payment;
