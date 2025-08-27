# Deployment Checklist for Shikkha.com

## Pre-Deployment Setup

### 1. MongoDB Atlas Configuration
- [ ] MongoDB Atlas cluster is running
- [ ] Database user credentials are correct
- [ ] IP whitelist includes `0.0.0.0/0` (for Render) or specific Render IPs
- [ ] Connection string is working and accessible

### 2. Stripe Configuration
- [ ] Stripe account is set up
- [ ] Test keys are working in development
- [ ] Production keys are ready (for live deployment)
- [ ] Webhook endpoints will be updated post-deployment

### 3. Security Keys Generation
Generate strong secrets (32+ characters) for:
- [ ] JWT_SECRET
- [ ] SESSION_SECRET

Use this command to generate secure keys:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Backend Deployment (Render)

### 1. Repository Setup
- [ ] Code is pushed to GitHub repository
- [ ] `.env` files are in `.gitignore`
- [ ] `server` folder contains all backend code

### 2. Render Service Creation
- [ ] Create new Web Service on Render
- [ ] Connect GitHub repository
- [ ] Set root directory to `server`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`

### 3. Environment Variables (Render Dashboard)
Add these environment variables:
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `MONGO_URI=mongodb+srv://...`
- [ ] `MONGO_DB=shikkha`
- [ ] `JWT_SECRET=your_generated_secret`
- [ ] `SESSION_SECRET=your_generated_secret`
- [ ] `STRIPE_SECRET_KEY=sk_live_...` (or sk_test_ for testing)
- [ ] `STRIPE_PUBLISHABLE_KEY=pk_live_...` (or pk_test_ for testing)
- [ ] `CLIENT_URL=https://your-vercel-app.vercel.app` (update after frontend deployment)
- [ ] `CORS_ORIGINS=https://your-vercel-app.vercel.app`

### 4. Deploy Backend
- [ ] Click "Deploy" on Render
- [ ] Wait for deployment to complete
- [ ] Check logs for any errors
- [ ] Note the Render URL (e.g., https://shikkha-backend.onrender.com)

## Frontend Deployment (Vercel)

### 1. Repository Setup
- [ ] Frontend code is in `client` folder
- [ ] `vercel.json` configuration is present
- [ ] `.env` files are in `.gitignore`

### 2. Vercel Project Creation
- [ ] Create new project on Vercel
- [ ] Connect GitHub repository
- [ ] Set root directory to `client`
- [ ] Framework preset: Vite
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`

### 3. Environment Variables (Vercel Dashboard)
Add these environment variables:
- [ ] `VITE_API_BASE_URL=https://your-render-url.onrender.com/api`
- [ ] `VITE_API_URL=https://your-render-url.onrender.com/api`
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...` (or pk_test_ for testing)
- [ ] `VITE_APP_NAME=Shikkha.com`
- [ ] `VITE_APP_VERSION=1.0.0`

### 4. Deploy Frontend
- [ ] Click "Deploy" on Vercel
- [ ] Wait for deployment to complete
- [ ] Check for any build errors
- [ ] Note the Vercel URL (e.g., https://shikkha-com.vercel.app)

## Post-Deployment Configuration

### 1. Update Backend CORS Settings
In Render dashboard, update these environment variables:
- [ ] `CLIENT_URL=https://your-actual-vercel-url.vercel.app`
- [ ] `CORS_ORIGINS=https://your-actual-vercel-url.vercel.app`
- [ ] Redeploy backend service

### 2. Update Stripe Webhooks
- [ ] Go to Stripe Dashboard → Webhooks
- [ ] Update webhook endpoint URL to: `https://your-render-url.onrender.com/api/payments/stripe/webhook`
- [ ] Ensure webhook is listening for `checkout.session.completed` events

### 3. Test API Connectivity
- [ ] Visit `https://your-render-url.onrender.com` - should show "Shikkha API is running!"
- [ ] Test API endpoints from frontend
- [ ] Check browser network tab for CORS errors

## Functionality Testing

### 1. Authentication
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens are being set correctly
- [ ] Session persistence works

### 2. Core Features
- [ ] Course browsing works
- [ ] Course enrollment (free) works
- [ ] Payment system works (test with Stripe test cards)
- [ ] Exam system works
- [ ] Appointment booking works
- [ ] File uploads work (if applicable)

### 3. Payment Testing
Use Stripe test cards:
- [ ] Test successful payment: `4242424242424242`
- [ ] Test declined payment: `4000000000000002`
- [ ] Verify webhook receives payment events
- [ ] Check enrollment/purchase completion

## Performance & Security

### 1. Performance
- [ ] Frontend loads quickly
- [ ] API responses are reasonable (<2s)
- [ ] Images and assets load properly
- [ ] Mobile responsiveness works

### 2. Security
- [ ] HTTPS is working on both domains
- [ ] No sensitive data in browser console
- [ ] Environment variables are not exposed
- [ ] CORS is properly configured

## Monitoring Setup

### 1. Error Tracking
- [ ] Check Render logs for backend errors
- [ ] Check Vercel function logs for frontend errors
- [ ] Set up error monitoring (optional: Sentry)

### 2. Uptime Monitoring
- [ ] Set up Render service monitoring
- [ ] Monitor MongoDB Atlas performance
- [ ] Set up alerts for service downtime

## Final Verification

### 1. End-to-End Test
- [ ] Complete user journey: Register → Browse → Enroll → Pay → Take Exam
- [ ] Test from different devices/browsers
- [ ] Verify email notifications work (if implemented)

### 2. Documentation
- [ ] Update README with live URLs
- [ ] Document any deployment-specific configurations
- [ ] Share credentials securely with team

## Troubleshooting Common Issues

### Backend Issues
- **503 Service Unavailable**: Check Render logs, likely MongoDB connection issue
- **CORS Errors**: Verify CORS_ORIGINS environment variable
- **500 Internal Server Error**: Check environment variables and MongoDB connection

### Frontend Issues
- **API Connection Failed**: Verify VITE_API_BASE_URL points to correct Render URL
- **Build Failures**: Check for missing dependencies or environment variables
- **Routing Issues**: Ensure vercel.json has proper route configuration

### Database Issues
- **Connection Timeout**: Check MongoDB Atlas IP whitelist
- **Authentication Failed**: Verify MongoDB credentials
- **Slow Queries**: Check MongoDB Atlas performance insights

## Post-Launch Tasks

- [ ] Monitor application performance for 24-48 hours
- [ ] Set up regular database backups
- [ ] Plan for scaling if needed
- [ ] Document any issues encountered
- [ ] Create maintenance schedule

---

**Deployment URLs:**
- Backend: `https://your-render-app.onrender.com`
- Frontend: `https://your-vercel-app.vercel.app`
- Database: MongoDB Atlas Cluster

**Important:** Keep this checklist and update it based on your actual deployment experience!
