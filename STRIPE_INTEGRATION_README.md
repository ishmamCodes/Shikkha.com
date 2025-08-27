# Stripe Checkout Integration - Implementation Guide

## Overview
Successfully implemented Stripe Checkout integration for Shikkha.com platform with BDT currency support, unified payment flow, and webhook handling.

## Backend Implementation

### 1. Configuration
- **Environment Variables** (`.env`):
  ```
  STRIPE_SECRET_KEY=sk_test_51RyeRYEUXsNm4S1dOEOj9LX1rLcsNPYhyESA3EhXP3yXpThpWxOG9cITiYOjaJpfFzChYhMvS0srnRXfHdoayY7W00Ive3TbOK
  STRIPE_PUBLISHABLE_KEY=pk_test_51RyeRYEUXsNm4S1d5sjLKABXrEazgnVPweh1QCHuFZ4qZiKiM76eK0lTMluSnJCRcku6eALX2TjQGKARuoQPpGAf00jR3rOWV1
  CLIENT_URL=http://localhost:5173
  STRIPE_WEBHOOK_SECRET= (optional for development)
  ```

### 2. API Endpoints

#### Unified Checkout Session
- **Endpoint**: `POST /api/payments/create-checkout-session`
- **Payload**:
  ```json
  {
    "type": "course" | "book",
    "itemId": "string",
    "studentId": "string" (optional, can be from auth)
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "url": "https://checkout.stripe.com/...",
    "paymentId": "payment_record_id"
  }
  ```

#### Stripe Webhook
- **Endpoint**: `POST /api/payments/stripe/webhook`
- **Handles**: `checkout.session.completed` events
- **Actions**:
  - Course: Creates enrollment, updates educator earnings (60%), admin share (40%)
  - Book: Creates purchase record, updates stock, admin sales

### 3. Payment Flow
1. **Course Enrollment**:
   - Free courses → Direct enrollment
   - Paid courses → Stripe checkout → Webhook enrollment
   
2. **Book Purchase**:
   - Always goes through Stripe checkout
   - Shipping info stored in localStorage temporarily
   - Stock updated via webhook

## Frontend Implementation

### 1. API Service (`/api/checkoutApi.js`)
```javascript
import { createCheckoutSession } from '../api/checkoutApi';

// Usage
const response = await createCheckoutSession('course', courseId, studentId);
if (response.success) {
  window.location.href = response.url;
}
```

### 2. Updated Components
- **CoursesPage.jsx**: Uses unified checkout for paid courses
- **CourseDetailsModal.jsx**: Integrated with new payment flow
- **BookCard.jsx**: Updated to use unified checkout
- **ShippingModal.jsx**: Compatible with new flow

### 3. Redirect Pages
- **PaymentSuccess** (`/payment-success`): Success confirmation with transaction details
- **PaymentCancel** (`/payment-cancel`): Cancellation page with retry options

## Key Features

### ✅ Implemented
1. **BDT Currency Support**: All payments in Bangladeshi Taka
2. **Unified Endpoint**: Single API for both course and book payments
3. **Webhook Processing**: Automatic enrollment/purchase completion
4. **Revenue Sharing**: 60% educator, 40% admin for courses
5. **Stock Management**: Automatic book inventory updates
6. **Error Handling**: Comprehensive error messages and fallbacks
7. **Redirect Pages**: Professional success/cancel pages
8. **Free Course Support**: Direct enrollment for free courses

### 🔧 Technical Details
- **Currency**: BDT (Bangladeshi Taka)
- **Payment Methods**: Card payments via Stripe
- **Webhook Security**: Optional signature verification
- **Session Management**: Stripe session IDs tracked in database
- **Raw Body Parsing**: Proper webhook handling with express.raw()

## Testing the Integration

### 1. Course Enrollment Test
```javascript
// Test paid course enrollment
const response = await fetch('/api/payments/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'course',
    itemId: 'course_id_here',
    studentId: 'student_id_here'
  })
});
```

### 2. Book Purchase Test
```javascript
// Test book purchase
const response = await fetch('/api/payments/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'book',
    itemId: 'book_id_here',
    studentId: 'student_id_here'
  })
});
```

### 3. Stripe Test Cards
Use Stripe test cards for testing:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0000 0000 3220`

## Webhook Setup (Production)
1. Create webhook endpoint in Stripe Dashboard
2. Point to: `https://yourdomain.com/api/payments/stripe/webhook`
3. Select event: `checkout.session.completed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET` env var

## Security Considerations
- ✅ Test keys used (sandbox mode)
- ✅ Webhook signature verification (optional)
- ✅ Server-side payment validation
- ✅ No sensitive data in frontend
- ✅ CORS properly configured

## Next Steps
1. **Production Setup**: Replace test keys with live keys
2. **Webhook Security**: Add webhook secret for production
3. **Email Notifications**: Send confirmation emails
4. **Receipt Generation**: PDF receipts for purchases
5. **Refund Handling**: Implement refund workflow

## Support
For issues or questions:
- Check server logs for webhook events
- Verify Stripe dashboard for payment status
- Test with Stripe test cards first
- Ensure proper environment variables
