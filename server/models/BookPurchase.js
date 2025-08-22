import mongoose from "mongoose";

const bookPurchaseSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true },
    amount: { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"], default: "pending" },
    shippingInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String },
      country: { type: String, required: true }
    },
    trackingNumber: { type: String },
    deliveryDate: { type: Date }
  },
  { timestamps: true }
);

// Index for efficient queries
bookPurchaseSchema.index({ studentId: 1 });
bookPurchaseSchema.index({ bookId: 1 });
bookPurchaseSchema.index({ status: 1 });
bookPurchaseSchema.index({ createdAt: -1 });

const BookPurchase = mongoose.models.BookPurchase || mongoose.model("BookPurchase", bookPurchaseSchema);
export default BookPurchase;
