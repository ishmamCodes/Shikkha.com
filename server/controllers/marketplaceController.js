import Book from "../models/Book.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";

// GET /api/marketplace/books - List books with filters
export const getBooks = async (req, res) => {
  try {
    const { q, category, priceMin, priceMax, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
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
    const userRole = req.user.role;
    
    // Only students can access cart
    if (userRole !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can access the cart' });
    }
    
    let cart = await Cart.findOne({ userId }).populate('items.bookId');
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
    const { bookId, quantity = 1 } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Only students can add to cart
    if (userRole !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can add items to cart' });
    }
    
    // Verify book exists and check stock
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    // Check if book is in stock
    if (!book.inStock || book.stockQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'This book is currently out of stock' });
    }
    
    // Check if requested quantity is available
    if (book.stockQuantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${book.stockQuantity} copies available in stock` 
      });
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
      // Check total quantity after update
      const newQuantity = cart.items[existingItemIndex].quantity + parseInt(quantity);
      if (newQuantity > book.stockQuantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot add more items. Only ${book.stockQuantity} copies available in stock` 
        });
      }
      // Update quantity
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        bookId,
        quantity: parseInt(quantity),
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

// PUT /api/marketplace/cart/items/:itemId - Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }
    
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
    
    cart.items[itemIndex].quantity = parseInt(quantity);
    await cart.save();
    await cart.populate('items.bookId');
    
    res.json({ success: true, cart });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ success: false, message: 'Failed to update cart item' });
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

// Admin: GET /api/marketplace/orders - List orders
export const getOrders = async (req, res) => {
  try {
    const { status, q, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (q) {
      // Basic search on orderNumber
      query.orderNumber = { $regex: q, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Return raw array for compatibility with existing admin page
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// Admin: PATCH /api/marketplace/orders/:id/status - Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order: updated });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

// Admin Product Management
export const createBook = async (req, res) => {
  try {
    const bookData = { ...req.body };
    
    // Handle image upload if present
    if (req.file) {
      bookData.coverImage = `/uploads/${req.file.filename}`;
    }

    const book = new Book(bookData);
    await book.save();
    
    res.status(201).json({ success: true, book });
  } catch (error) {
    console.error('Error creating book:', error);
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'ISBN already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to create book' });
    }
  }
};

export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Handle image upload if present
    if (req.file) {
      updateData.coverImage = `/uploads/${req.file.filename}`;
    }

    const book = await Book.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    res.json({ success: true, book });
  } catch (error) {
    console.error('Error updating book:', error);
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'ISBN already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to update book' });
    }
  }
};

export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    
    const book = await Book.findByIdAndDelete(id);
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ success: false, message: 'Failed to delete book' });
  }
};

// PATCH /api/marketplace/books/:id/status - Update book status
export const updateBookStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const book = await Book.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    res.json({ success: true, book });
  } catch (error) {
    console.error('Error updating book status:', error);
    res.status(500).json({ success: false, message: 'Failed to update book status' });
  }
};

// PATCH /api/marketplace/books/:id/stock - Update book stock status
export const updateBookStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stockStatus } = req.body;
    
    if (!['in-stock', 'out-of-stock'].includes(stockStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid stock status' });
    }
    
    const book = await Book.findByIdAndUpdate(
      id, 
      { stockStatus, inStock: stockStatus === 'in-stock' }, 
      { new: true }
    );
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    res.json({ success: true, book });
  } catch (error) {
    console.error('Error updating book stock:', error);
    res.status(500).json({ success: false, message: 'Failed to update book stock' });
  }
};
