import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderModel: { type: String, required: true, enum: ["Student", "Educator", "Admin"] },
    receiverModel: { type: String, required: true, enum: ["Student", "Educator", "Admin"] },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'senderModel' },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'receiverModel' },
    // content stores ciphertext (base64) when using encryption
    content: { type: String, required: true },
    iv: { type: String, default: '' }, // base64 IV for AES-GCM
    authTag: { type: String, default: '' }, // base64 auth tag for AES-GCM
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
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date, default: null },
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
