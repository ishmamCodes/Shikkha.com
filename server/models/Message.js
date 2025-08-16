import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    messageType: { 
      type: String, 
      enum: ["text", "image", "file", "audio"], 
      default: "text" 
    },
    fileUrl: { type: String, default: "" }, // for attachments
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" }, // if related to an appointment
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" }, // if related to a course
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }, // for reply messages
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Index for efficient querying
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);
export default Message;
