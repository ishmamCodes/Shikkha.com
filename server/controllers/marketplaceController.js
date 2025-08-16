import Book from "../models/Book.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";

// GET /api/marketplace/books - List books with filters
export const getBooks = async (req, res) => {
  try {
    const { q, category, priceMin, priceMax, page = 1, limit = 10 } = req.query;
    
    let query = { inStock: true };
    
    // Add search query
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Add category filter
    if (category) {
      query.category = category;
    }
    
    // Add price range filter
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseFloat(priceMin);
      if (priceMax) query.price.$lte = parseFloat(priceMax);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const books = await Book.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Book.countDocuments(query);
    
    res.json({
      success: true,
      books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch books' });
  }
};

// GET /api/marketplace/books/:id - Get single book
export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const book = await Book.findById(id);
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    res.json({ success: true, book });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch book' });
  }
};

// GET /api/marketplace/cart - Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let cart = await Cart.findOne({ userId }).populate('items.bookId');
    
    // Create cart if it doesn't exist
    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }
    
    res.json({ success: true, cart });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
};

// POST /api/marketplace/cart/items - Add/update item in cart
export const addToCart = async (req, res) => {
  try {
    const { bookId, qty = 1 } = req.body;
    const userId = req.user.id;
    
    // Verify book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    // Get or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.bookId.toString() === bookId
    );
    
    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += parseInt(qty);
    } else {
      // Add new item
      cart.items.push({
        bookId,
        quantity: parseInt(qty),
        price: book.price
      });
    }
    
    await cart.save();
    await cart.populate('items.bookId');
    
    res.json({ success: true, cart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
};

// DELETE /api/marketplace/cart/items/:itemId - Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;
    
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();
    await cart.populate('items.bookId');
    
    res.json({ success: true, cart });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Failed to remove from cart' });
  }
};

// POST /api/marketplace/checkout - Create order from cart
export const checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await Cart.findOne({ userId }).populate('items.bookId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    
    // Create order items
    const orderItems = cart.items.map(item => ({
      bookId: item.bookId._id,
      title: item.bookId.title,
      author: item.bookId.author,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity
    }));
    
    // Create order
    const order = new Order({
      userId,
      items: orderItems,
      totalAmount: cart.totalAmount,
      status: 'pending',
      paymentStatus: 'paid' // Mock payment success
    });
    
    await order.save();
    
    // Clear cart
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();
    
    res.json({
      success: true,
      message: 'Order placed successfully',
      orderId: order._id,
      orderNumber: order.orderNumber
    });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ success: false, message: 'Checkout failed' });
  }
};
