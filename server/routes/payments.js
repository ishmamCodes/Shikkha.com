import express from 'express';
import { 
  createCheckoutSession, 
  handleStripeWebhook, 
  enrollInFreeCourse, 
  handlePaymentSuccess,
  createBookPaymentSession,
  triggerWebhookManually
} from '../controllers/paymentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Unified checkout session endpoint
router.post('/create-checkout-session', authMiddleware, createCheckoutSession);

// Stripe webhook endpoint (handled at server level with raw body)
router.post('/stripe/webhook', handleStripeWebhook);

// Manual webhook trigger for testing
router.post('/trigger-webhook', authMiddleware, triggerWebhookManually);

// Legacy endpoints (kept for backward compatibility)
router.post('/course/free', enrollInFreeCourse);
router.post('/success', handlePaymentSuccess);
router.post('/book/payment', createBookPaymentSession);

export default router;
