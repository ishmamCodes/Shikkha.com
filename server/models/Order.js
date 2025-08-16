import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 }
});

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, required: true, unique: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "processing", "shipped", "delivered", "cancelled"], default: "pending" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: "Bangladesh" }
    }
  },
  { timestamps: true }
);

// Generate order number before saving
orderSchema.pre('save', function() {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
});

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
