import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    isbn: { type: String, unique: true },
    coverImage: { type: String, default: "" },
    publisher: { type: String, default: "" },
    publishedDate: { type: Date },
    pages: { type: Number, min: 1 },
    language: { type: String, default: "English" },
    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0, min: 0 },
    stockStatus: { type: String, enum: ['in-stock', 'out-of-stock'], default: 'in-stock' }
  },
  { timestamps: true }
);

// Index for search functionality
bookSchema.index({ title: "text", author: "text", description: "text" });
bookSchema.index({ category: 1, price: 1 });

const Book = mongoose.models.Book || mongoose.model("Book", bookSchema);
export default Book;
