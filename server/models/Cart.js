import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true, min: 0 }
});

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [cartItemSchema],
    totalAmount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

// Calculate total amount before saving
cartSchema.pre('save', function() {
  this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);
export default Cart;
