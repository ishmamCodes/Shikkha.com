import express from "express";
import multer from "multer";
import path from "path";
import authMiddleware, { authorizeRole } from "../../middleware/authMiddleware.js";
import {
  getBooks,
  getBookById,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  checkout,
  getOrders,
  updateOrderStatus,
  createBook,
  updateBook,
  deleteBook,
  updateBookStatus,
  updateBookStock
} from "../../controllers/marketplaceController.js";

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All marketplace routes require authentication
router.use(authMiddleware);

// Marketplace routes
router.get('/books', getBooks);
router.get('/books/:id', getBookById);
router.get('/cart', getCart);
router.post('/cart/items', addToCart);
router.put('/cart/items/:itemId', updateCartItem);
router.delete('/cart/items/:itemId', removeFromCart);
router.post('/checkout', checkout);

// Admin-only order management
router.get('/orders', authorizeRole(['admin']), getOrders);
router.patch('/orders/:id/status', authorizeRole(['admin']), updateOrderStatus);

// Admin-only book management
router.post('/books', authorizeRole(['admin']), upload.single('coverImage'), createBook);
router.put('/books/:id', authorizeRole(['admin']), upload.single('coverImage'), updateBook);
router.delete('/books/:id', authorizeRole(['admin']), deleteBook);
router.patch('/books/:id/status', authorizeRole(['admin']), updateBookStatus);
router.patch('/books/:id/stock', authorizeRole(['admin']), updateBookStock);

export default router;
