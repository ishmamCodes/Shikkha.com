import mongoose from "mongoose";

const emailChangeRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    newEmail: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

const EmailChangeRequest = mongoose.models.EmailChangeRequest || mongoose.model("EmailChangeRequest", emailChangeRequestSchema);
export default EmailChangeRequest;


