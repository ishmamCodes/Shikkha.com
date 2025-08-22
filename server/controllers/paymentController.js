import dotenv from 'dotenv';
import Stripe from 'stripe';
dotenv.config();
import Payment from '../models/Payment.js';
import BookPurchase from '../models/BookPurchase.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Book from '../models/Book.js';
import Student from '../models/Student.js';
import Educator from '../models/Educator.js';

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY is not set. Please add it to server/.env');
}
const stripe = new Stripe(stripeKey);

// Unified checkout session endpoint
export const createCheckoutSession = async (req, res) => {
  try {
    console.log('📦 Create checkout session request:', req.body);
    console.log('🔐 User from middleware:', req.user);
    
    const { type, itemId, studentId: bodyStudentId } = req.body;
    const studentId = req.user?.id || bodyStudentId; // Get from auth middleware or body

    console.log('🎯 Extracted values:', { type, itemId, studentId });
    console.log('🌍 Environment variables:', { 
      CLIENT_URL: process.env.CLIENT_URL,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set'
    });

    // Validate required fields (itemId is only required for course/book)
    if (!type || !studentId || (type !== 'cart' && !itemId)) {
      console.log('❌ Missing required fields:', { type: !!type, itemId: !!itemId, studentId: !!studentId });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!['course', 'book', 'cart'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type. Must be "course", "book", or "cart"' });
    }

    let lineItems = [];
    let metadata = {};

    if (type === 'course') {
      // Fetch course details
      const course = await Course.findById(itemId).populate('instructor');
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      // Treat as free only when price <= 0 (ignore stale isPaid flag)
      if (!course.price || Number(course.price) <= 0) {
        return res.status(400).json({ success: false, message: 'Course is free, no payment required' });
      }

      // Check capacity
      if (course.maxStudents && course.enrolledCount >= course.maxStudents) {
        return res.status(400).json({ success: false, message: 'Course is full' });
      }

      // Check if already enrolled
      const existingEnrollment = await Enrollment.findOne({ studentId, courseId: itemId });
      if (existingEnrollment) {
        return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
      }

      // Calculate shares
      const educatorShare = Math.round(course.price * 0.6 * 100) / 100; // 60%
      const adminShare = Math.round(course.price * 0.4 * 100) / 100; // 40%

      // Create line items for course
      lineItems.push({
        price_data: {
          currency: 'bdt',
          product_data: {
            name: course.title,
            description: `Course by ${course.instructor?.name || 'Unknown Instructor'}`,
          },
          unit_amount: Math.round(course.price * 100), // Convert to paisa
        },
        quantity: 1,
      });

      // Create payment record
      const payment = new Payment({
        studentId,
        type: 'course',
        itemId: itemId,
        amount: course.price,
        status: 'pending',
        educatorShare,
        adminShare,
        // Persist educator info for reliable earnings queries later
        metadata: {
          courseName: course.title,
          educatorId: course.instructor?._id,
          educatorName: course.instructor?.name,
        }
      });
      await payment.save();

      metadata.type = 'course';
      metadata.paymentId = payment._id.toString();
      metadata.itemId = itemId;
      metadata.courseId = itemId;
      metadata.courseName = course.title;
      metadata.coursePrice = course.price.toString();
      metadata.studentId = studentId;
      // Also include educator identifiers in Stripe metadata (useful for webhook processors/analytics)
      if (course.instructor?._id) {
        metadata.educatorId = course.instructor._id.toString();
        metadata.educatorName = course.instructor?.name || '';
      }

    } else if (type === 'book') {
      if (!itemId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Book ID is required for book purchases' 
        });
      }

      const book = await Book.findById(itemId);
      if (!book) {
        return res.status(404).json({ 
          success: false, 
          message: 'Book not found' 
        });
      }

      // Check stock
      if (!book.inStock || book.stockQuantity <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Book is out of stock' 
        });
      }

      // Check if student already purchased this book
      const existingPurchase = await BookPurchase.findOne({ 
        studentId, 
        bookId: itemId,
        status: { $in: ['confirmed', 'delivered'] }
      });
      if (existingPurchase) {
        return res.status(400).json({ 
          success: false, 
          message: 'You have already purchased this book' 
        });
      }

      lineItems.push({
        price_data: {
          currency: 'bdt',
          product_data: {
            name: book.title,
            description: `by ${book.author}`,
          },
          unit_amount: Math.round(book.price * 100), // Convert to paisa
        },
        quantity: 1,
      });

      // Create payment record
      const payment = new Payment({
        studentId,
        type: 'book',
        itemId: itemId,
        amount: book.price,
        adminShare: book.price, // 100% for books
        status: 'pending'
      });
      await payment.save();

      metadata.type = 'book';
      metadata.paymentId = payment._id.toString();
      metadata.itemId = itemId;
      metadata.bookId = itemId;
      metadata.bookPrice = book.price.toString();
      metadata.bookTitle = book.title;
      metadata.studentId = studentId;

      // Capture shipping info from request (required for book purchases)
      const { shippingInfo } = req.body || {};
      const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'country'];
      for (const f of requiredFields) {
        if (!shippingInfo?.[f]) {
          return res.status(400).json({ success: false, message: `Shipping ${f} is required` });
        }
      }
      // Add minimal shipping info to metadata
      metadata.shipping_name = shippingInfo.name;
      metadata.shipping_email = shippingInfo.email;
      metadata.shipping_phone = shippingInfo.phone;
      metadata.shipping_address = shippingInfo.address;
      metadata.shipping_city = shippingInfo.city;
      metadata.shipping_postalCode = shippingInfo.postalCode || '';
      metadata.shipping_country = shippingInfo.country;

    } else if (type === 'cart') {
      // Handle cart checkout
      const Cart = (await import('../models/Cart.js')).default;
      const cart = await Cart.findOne({ userId: studentId }).populate('items.bookId');
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cart is empty' 
        });
      }

      // Calculate total amount
      let totalAmount = 0;
      
      // Create line items for each book in cart
      for (const item of cart.items) {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        
        lineItems.push({
          price_data: {
            currency: 'bdt',
            product_data: {
              name: item.bookId.title,
              description: `by ${item.bookId.author}`,
            },
            unit_amount: Math.round(item.price * 100), // Convert to paisa
          },
          quantity: item.quantity,
        });
      }

      // Create payment record
      const payment = new Payment({
        studentId,
        type: 'cart',
        amount: totalAmount,
        adminShare: totalAmount, // 100% for books in cart
        status: 'pending'
      });
      await payment.save();

      metadata.type = 'cart';
      metadata.paymentId = payment._id.toString();
      metadata.cartId = cart._id.toString();
      metadata.totalAmount = totalAmount.toString();
      metadata.studentId = studentId;

      // Optional: capture shipping info for cart checkout as well
      const { shippingInfo } = req.body || {};
      if (shippingInfo) {
        metadata.shipping_name = shippingInfo.name || '';
        metadata.shipping_email = shippingInfo.email || '';
        metadata.shipping_phone = shippingInfo.phone || '';
        metadata.shipping_address = shippingInfo.address || '';
        metadata.shipping_city = shippingInfo.city || '';
        metadata.shipping_postalCode = shippingInfo.postalCode || '';
        metadata.shipping_country = shippingInfo.country || '';
      }

    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid type. Must be "course", "book", or "cart"' 
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=${type}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      metadata,
    });

    res.json({ 
      success: true, 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error('❌ Stripe checkout error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      type: error.type,
      code: error.code
    });
    res.status(500).json({ 
      success: false, 
      message: `Failed to create checkout session: ${error.message}` 
    });
  }
};

// Legacy book payment session (kept for backward compatibility)
export const createBookPaymentSession = async (req, res) => {
  try {
    const { bookId, studentId, quantity = 1, shippingInfo } = req.body;

    // Validate shipping info
    const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'country'];
    for (const field of requiredFields) {
      if (!shippingInfo[field]) {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }

    // Fetch book and student details
    const book = await Book.findById(bookId);
    const student = await Student.findById(studentId);

    if (!book || !student) {
      return res.status(404).json({ success: false, message: 'Book or student not found' });
    }

    // Check stock
    if (!book.inStock || book.stockQuantity < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    const totalAmount = book.price * quantity;

    // Create payment record
    const payment = new Payment({
      studentId,
      type: 'book',
      itemId: bookId,
      amount: totalAmount,
      educatorShare: 0,
      adminShare: totalAmount,
      metadata: {
        bookTitle: book.title
      }
    });
    await payment.save();

    // Create book purchase record
    const bookPurchase = new BookPurchase({
      studentId,
      bookId,
      paymentId: payment._id,
      amount: totalAmount,
      quantity,
      shippingInfo
    });
    await bookPurchase.save();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'bdt',
          product_data: {
            name: book.title,
            description: `Book by ${book.author}`,
          },
          unit_amount: Math.round(book.price * 100), // Convert to paisa
        },
        quantity: quantity,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      metadata: {
        paymentId: payment._id.toString(),
        type: 'book',
        bookId: bookId,
        studentId: studentId,
        purchaseId: bookPurchase._id.toString()
      }
    });

    // Update payment with session ID
    payment.stripeSessionId = session.id;
    await payment.save();

    res.json({ success: true, sessionUrl: session.url, paymentId: payment._id });
  } catch (error) {
    console.error('Book payment session error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment session' });
  }
};

// Stripe webhook handler
export const handleStripeWebhook = async (req, res) => {
  console.log('🚀 Webhook endpoint hit!');
  console.log('Headers:', req.headers);
  console.log('Body type:', typeof req.body);
  
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // For development without webhook secret, parse directly
    if (!endpointSecret || !sig) {
      console.log('⚠️ No webhook secret or signature - parsing body directly');
      event = req.body;
    } else {
      // Verify webhook signature if secret is provided
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log('✅ Webhook signature verified');
    }
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🔔 Webhook received: ${event.type}`);
  console.log(`📋 Full event data:`, JSON.stringify(event, null, 2));

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(`💳 Processing payment completion for session: ${session.id}`);
    console.log(`📋 Session metadata:`, session.metadata);
    
    try {
      await processPaymentCompletion(session);
      console.log('✅ Payment completion processed successfully');
    } catch (error) {
      console.error('❌ Error processing payment completion:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({ error: 'Failed to process payment completion' });
    }
  } else {
    console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

// Process payment completion
const processPaymentCompletion = async (session) => {
  const metadata = session.metadata;
  const { type, studentId } = metadata;
  
  console.log(`🔄 Processing ${type} payment for student ${studentId}`);
  console.log(`🔍 Full metadata:`, metadata);

  if (type === 'course') {
    const { paymentId, itemId } = metadata;
    
    // Update payment status
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment record not found');
    }

    payment.status = 'completed';
    payment.stripePaymentIntentId = session.payment_intent;
    await payment.save();

    // Create enrollment
    const enrollment = new Enrollment({
      studentId,
      courseId: itemId,
      paymentId,
      status: 'active',
      paymentStatus: 'paid'
    });
    await enrollment.save();
    console.log(`🎓 Course enrollment created: ${enrollment._id} for course ${itemId}`);
    
    // Verify enrollment was created
    const verifyEnrollment = await Enrollment.findById(enrollment._id);
    console.log(`✅ Enrollment verification:`, verifyEnrollment);

    // Update course enrolled count
    await Course.findByIdAndUpdate(itemId, { $inc: { enrolledCount: 1 } });

    // Add student to course
    await Course.findByIdAndUpdate(itemId, { $addToSet: { students: studentId } });
    console.log(`📚 Student ${studentId} added to course ${itemId}`);

    // Update educator earnings (60%)
    const course = await Course.findById(itemId);
    if (course && course.instructor) {
      await Educator.findByIdAndUpdate(course.instructor, {
        $inc: { totalEarnings: payment.educatorShare }
      });
    }

  } else if (type === 'book') {
    const { paymentId, bookId, bookPrice } = metadata;
    
    // Update existing payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment record not found');
    }

    payment.status = 'completed';
    payment.stripeSessionId = session.id;
    await payment.save();

    // Build shipping info (prefer metadata provided at checkout)
    let shippingInfo;
    if (metadata.shipping_name) {
      shippingInfo = {
        name: metadata.shipping_name,
        email: metadata.shipping_email,
        phone: metadata.shipping_phone,
        address: metadata.shipping_address,
        city: metadata.shipping_city,
        postalCode: metadata.shipping_postalCode || '',
        country: metadata.shipping_country || 'Bangladesh'
      };
    } else {
      // Fallback to student profile if not provided
      const studentDoc = await Student.findById(studentId);
      shippingInfo = {
        name: studentDoc?.fullName || 'N/A',
        email: studentDoc?.email || 'N/A',
        phone: studentDoc?.phone || 'N/A',
        address: studentDoc?.address || 'N/A',
        city: 'N/A',
        postalCode: '',
        country: 'Bangladesh'
      };
    }

    // Create book purchase record
    const bookPurchase = new BookPurchase({
      studentId,
      bookId: bookId,
      paymentId: payment._id,
      amount: parseFloat(bookPrice),
      quantity: 1,
      status: 'confirmed',
      shippingInfo
    });
    await bookPurchase.save();
    console.log(`📚 Book purchase record created: ${bookPurchase._id}`);

    // Update book stock
    const updatedBook = await Book.findByIdAndUpdate(bookId, { 
      $inc: { stockQuantity: -1 } 
    }, { new: true });
    console.log(`📦 Book stock updated: ${updatedBook.title} - New stock: ${updatedBook.stockQuantity}`);

  } else if (type === 'cart') {
    const { paymentId, cartId, totalAmount } = metadata;
    
    // Update existing payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment record not found');
    }

    payment.status = 'completed';
    payment.stripeSessionId = session.id;
    await payment.save();

    // Get cart details
    const Cart = (await import('../models/Cart.js')).default;
    const cart = await Cart.findById(cartId).populate('items.bookId');
    if (cart && cart.items.length > 0) {

      // Build shipping info (prefer metadata provided at checkout)
      let shippingInfo;
      if (metadata.shipping_name) {
        shippingInfo = {
          name: metadata.shipping_name,
          email: metadata.shipping_email,
          phone: metadata.shipping_phone,
          address: metadata.shipping_address,
          city: metadata.shipping_city,
          postalCode: metadata.shipping_postalCode || '',
          country: metadata.shipping_country || 'Bangladesh'
        };
      } else {
        const studentDoc = await Student.findById(studentId);
        shippingInfo = {
          name: studentDoc?.fullName || 'N/A',
          email: studentDoc?.email || 'N/A',
          phone: studentDoc?.phone || 'N/A',
          address: studentDoc?.address || 'N/A',
          city: 'N/A',
          postalCode: '',
          country: 'Bangladesh'
        };
      }

      // Create book purchase records for each item
      for (const item of cart.items) {
        const bookPurchase = new BookPurchase({
          studentId,
          bookId: item.bookId._id,
          paymentId: payment._id,
          amount: item.price,
          quantity: item.quantity,
          status: 'confirmed',
          shippingInfo
        });
        await bookPurchase.save();

        // Update book stock
        await Book.findByIdAndUpdate(item.bookId._id, { 
          $inc: { stockQuantity: -item.quantity } 
        });
      }

      // Clear the cart after successful payment
      cart.items = [];
      cart.totalAmount = 0;
      await cart.save();
    }
  }

  console.log(`Payment completed for ${type}`);
};

// Manual webhook trigger for testing
export const triggerWebhookManually = async (req, res) => {
  try {
    const { sessionId } = req.body;
    console.log(`🧪 Manual webhook trigger for session: ${sessionId}`);
    
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log(`📋 Retrieved session:`, session);
    
    if (session.payment_status === 'paid') {
      await processPaymentCompletion(session);
      console.log('✅ Manual webhook processing completed');
      res.json({ success: true, message: 'Webhook processed manually' });
    } else {
      res.status(400).json({ success: false, message: 'Payment not completed' });
    }
  } catch (error) {
    console.error('❌ Manual webhook error:', error);
    res.status(500).json({ success: false, message: 'Manual webhook failed', error: error.message });
  }
};

// Handle successful payment (legacy endpoint)
export const handlePaymentSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    await processPaymentCompletion(session);

    res.json({ success: true, message: 'Payment processed successfully' });
  } catch (error) {
    console.error('Payment success handler error:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
};

// Free course enrollment
export const enrollInFreeCourse = async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Require payment when price > 0 (ignore stale isPaid flag)
    if (Number(course.price) > 0) {
      return res.status(400).json({ success: false, message: 'Course requires payment' });
    }

    // Check capacity
    if (course.maxStudents && course.enrolledCount >= course.maxStudents) {
      return res.status(400).json({ success: false, message: 'Course is full' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
    if (existingEnrollment) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      studentId,
      courseId,
      status: 'active',
      paymentStatus: 'free'
    });
    await enrollment.save();

    // Update course enrolled count
    await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });

    // Add student to course
    await Course.findByIdAndUpdate(courseId, { $addToSet: { students: studentId } });

    res.json({ success: true, message: 'Successfully enrolled in free course' });
  } catch (error) {
    console.error('Free enrollment error:', error);
    res.status(500).json({ success: false, message: 'Failed to enroll in course' });
  }
};
