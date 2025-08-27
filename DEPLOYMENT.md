# Shikkha.com Deployment Guide

This guide covers deploying the Shikkha.com MERN stack application with:
- **Backend**: Render
- **Frontend**: Vercel  
- **Database**: MongoDB Atlas

## Prerequisites

1. MongoDB Atlas cluster set up and running
2. Stripe account with API keys
3. Render account
4. Vercel account
5. GitHub repository with your code

## Backend Deployment (Render)

### 1. Environment Variables Setup

In your Render service dashboard, add these environment variables:

```bash
# Database
MONGO_URI=mongodb+srv://shikkha_admin:Shikkha123@cluster0.xrtd0cz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGO_DB=shikkha

# Server
NODE_ENV=production
PORT=10000

# Security (Generate strong random strings)
JWT_SECRET=your_super_strong_jwt_secret_key_minimum_32_characters_long
SESSION_SECRET=your_super_strong_session_secret_key_minimum_32_characters_long

# Stripe (Use your production keys)
STRIPE_SECRET_KEY=sk_live_your_production_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_production_stripe_publishable_key_here

# Client URL (Update after Vercel deployment)
CLIENT_URL=https://your-vercel-app.vercel.app

# CORS Origins (Update after Vercel deployment)
CORS_ORIGINS=https://your-vercel-app.vercel.app,https://shikkha-com.vercel.app
```

### 2. Deploy to Render

1. Connect your GitHub repository
2. Select the `server` folder as root directory
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add all environment variables listed above
6. Deploy

## Frontend Deployment (Vercel)

### 1. Environment Variables Setup

In your Vercel project dashboard, add these environment variables:

```bash
# API Configuration (Update with your Render URL)
VITE_API_BASE_URL=https://your-render-app.onrender.com/api
VITE_API_URL=https://your-render-app.onrender.com/api

# Stripe (Use publishable key - safe for frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_stripe_publishable_key_here

# App Configuration
VITE_APP_NAME=Shikkha.com
VITE_APP_VERSION=1.0.0
```

### 2. Deploy to Vercel

1. Connect your GitHub repository
2. Select the `client` folder as root directory
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add all environment variables listed above
6. Deploy

## Post-Deployment Configuration

### 1. Update Backend CORS

After Vercel deployment, update these environment variables in Render:

```bash
CLIENT_URL=https://your-actual-vercel-url.vercel.app
CORS_ORIGINS=https://your-actual-vercel-url.vercel.app
```

### 2. Update Frontend API URL

After Render deployment, update these environment variables in Vercel:

```bash
VITE_API_BASE_URL=https://your-actual-render-url.onrender.com/api
VITE_API_URL=https://your-actual-render-url.onrender.com/api
```

### 3. Test the Deployment

1. Visit your Vercel URL
2. Test user registration/login
3. Test course enrollment
4. Test payment functionality
5. Test exam system
6. Test appointment booking

## Security Checklist

- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Generate strong SESSION_SECRET (32+ characters)  
- [ ] Use production Stripe keys
- [ ] Update CORS_ORIGINS with actual domain
- [ ] Verify MongoDB Atlas IP whitelist includes Render IPs
- [ ] Test all API endpoints work with HTTPS
- [ ] Verify session cookies work with secure flag

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS_ORIGINS includes your exact Vercel domain
2. **API Connection Failed**: Verify VITE_API_BASE_URL points to correct Render URL
3. **Database Connection**: Check MongoDB Atlas IP whitelist and connection string
4. **Stripe Webhooks**: Update webhook endpoint URL in Stripe dashboard
5. **File Uploads**: Render has ephemeral storage - consider cloud storage for production

### Logs

- **Render**: Check service logs in Render dashboard
- **Vercel**: Check function logs in Vercel dashboard
- **MongoDB**: Check Atlas monitoring for connection issues

## Performance Optimization

1. Enable Render auto-deploy on git push
2. Configure Vercel edge functions for better performance
3. Set up MongoDB Atlas performance monitoring
4. Consider CDN for static assets
5. Implement Redis for session storage (optional)

## Monitoring

1. Set up Render service monitoring
2. Configure Vercel analytics
3. Monitor MongoDB Atlas metrics
4. Set up error tracking (Sentry recommended)
5. Monitor Stripe webhook delivery

## Backup Strategy

1. MongoDB Atlas automatic backups
2. Regular code commits to GitHub
3. Environment variables documented securely
4. Database export scripts for critical data
