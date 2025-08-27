# Deployment Guide for Shikkha.com

This guide covers deploying the Shikkha.com MERN stack application to production using Render (backend) and Vercel (frontend).

## Architecture Overview

- **Backend**: Node.js/Express API deployed on Render
- **Frontend**: React/Vite app deployed on Vercel  
- **Database**: MongoDB Atlas
- **Payments**: Stripe integration

## Prerequisites

1. **Accounts Required**:
   - [Render](https://render.com) account
   - [Vercel](https://vercel.com) account
   - [MongoDB Atlas](https://cloud.mongodb.com) account
   - [Stripe](https://stripe.com) account

2. **Local Setup**:
   ```bash
   # Run the setup script
   chmod +x scripts/deploy-setup.sh
   ./scripts/deploy-setup.sh
   ```

## Step 1: Database Setup (MongoDB Atlas)

1. Create a new cluster on MongoDB Atlas
2. Create a database user with read/write permissions
3. Whitelist your IP addresses (or use 0.0.0.0/0 for all IPs)
4. Get your connection string (replace `<password>` with actual password)

## Step 2: Generate Production Secrets

```bash
node scripts/generate-secrets.js
```

Copy the generated secrets - you'll need them for environment variables.

## Step 3: Backend Deployment (Render)

1. **Connect Repository**:
   - Go to Render dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `server` folder as root directory

2. **Configure Build Settings**:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `server`

3. **Environment Variables**:
   Add these in Render dashboard:
   ```
   NODE_ENV=production
   PORT=4000
   MONGO_URI=your_mongodb_atlas_connection_string
   MONGO_DB=shikkha
   JWT_SECRET=your_generated_jwt_secret
   SESSION_SECRET=your_generated_session_secret
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
   CLIENT_URL=https://your-vercel-app.vercel.app
   CORS_ORIGINS=https://your-vercel-app.vercel.app
   ```

4. **Deploy**: Click "Create Web Service"

## Step 4: Frontend Deployment (Vercel)

1. **Connect Repository**:
   - Go to Vercel dashboard
   - Click "New Project"
   - Import your GitHub repository
   - Set root directory to `client`

2. **Build Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Install Command**: `npm install`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`

3. **Environment Variables**:
   Add these in Vercel dashboard:
   ```
   VITE_API_BASE_URL=https://your-render-app.onrender.com
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
   VITE_NODE_ENV=production
   VITE_PAYMENT_SUCCESS_URL=https://your-vercel-app.vercel.app/payment-success
   VITE_PAYMENT_CANCEL_URL=https://your-vercel-app.vercel.app/payment-cancel
   ```

4. **Deploy**: Click "Deploy"

## Step 5: Configure Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-render-app.onrender.com/api/payments/stripe/webhook`
3. Select events: `checkout.session.completed`
4. Copy the webhook signing secret and add to Render environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

## Step 6: Update CORS Origins

After deployment, update the backend CORS configuration:

1. In Render dashboard, update `CORS_ORIGINS` environment variable with your actual Vercel URL
2. Redeploy the backend service

## Step 7: Verification

Run the health check script:
```bash
BACKEND_URL=https://your-render-app.onrender.com FRONTEND_URL=https://your-vercel-app.vercel.app node scripts/health-check.js
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `CLIENT_URL` and `CORS_ORIGINS` match your Vercel domain exactly
2. **Database Connection**: Verify MongoDB Atlas connection string and IP whitelist
3. **Environment Variables**: Double-check all environment variables are set correctly
4. **Build Failures**: Check build logs in Render/Vercel dashboards

### Logs

- **Render**: View logs in the service dashboard
- **Vercel**: Check function logs and build logs
- **MongoDB**: Monitor connections in Atlas dashboard

## Security Checklist

- [ ] All production secrets are unique and secure
- [ ] Database user has minimal required permissions
- [ ] CORS origins are restricted to your domains
- [ ] Stripe webhook endpoint is secured
- [ ] Environment variables are not exposed in client code

## Maintenance

### Updates
1. Push changes to your GitHub repository
2. Render and Vercel will auto-deploy from the main branch
3. Monitor deployment status in respective dashboards

### Monitoring
- Set up uptime monitoring for both services
- Monitor database performance in MongoDB Atlas
- Track payment events in Stripe dashboard

## Support

For deployment issues:
- Check the deployment logs first
- Refer to platform documentation (Render, Vercel, MongoDB Atlas)
- Ensure all environment variables are correctly configured
