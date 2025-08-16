import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import {
  getBooks,
  getBookById,
  getCart,
  addToCart,
  removeFromCart,
  checkout
} from "../../controllers/marketplaceController.js";

const router = express.Router();

// All marketplace routes require authentication
router.use(authMiddleware);

// Marketplace routes
router.get('/books', getBooks);
router.get('/books/:id', getBookById);
router.get('/cart', getCart);
router.post('/cart/items', addToCart);
router.delete('/cart/items/:itemId', removeFromCart);
router.post('/checkout', checkout);

export default router;
