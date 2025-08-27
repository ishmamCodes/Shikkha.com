#!/bin/bash

# Deployment Setup Script for Shikkha.com
# This script helps prepare your project for deployment

echo "🚀 Shikkha.com Deployment Setup"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo ""

# Check for required files
echo "1. Checking required files..."
if [ -f "server/package.json" ]; then
    echo "   ✅ Backend package.json found"
else
    echo "   ❌ Backend package.json missing"
fi

if [ -f "client/package.json" ]; then
    echo "   ✅ Frontend package.json found"
else
    echo "   ❌ Frontend package.json missing"
fi

if [ -f "server/.env.example" ]; then
    echo "   ✅ Backend .env.example found"
else
    echo "   ❌ Backend .env.example missing"
fi

if [ -f "client/.env.example" ]; then
    echo "   ✅ Frontend .env.example found"
else
    echo "   ❌ Frontend .env.example missing"
fi

echo ""
echo "2. Generating security secrets..."
echo "   Run: node scripts/generate-secrets.js"
echo ""

echo "3. Environment setup checklist:"
echo "   📝 Update MongoDB Atlas IP whitelist"
echo "   📝 Get Stripe API keys (test/production)"
echo "   📝 Prepare domain names for CORS"
echo ""

echo "4. Deployment order:"
echo "   1️⃣  Deploy backend to Render first"
echo "   2️⃣  Note the Render URL"
echo "   3️⃣  Update frontend environment variables"
echo "   4️⃣  Deploy frontend to Vercel"
echo "   5️⃣  Update backend CORS with Vercel URL"
echo ""

echo "📖 For detailed instructions, see:"
echo "   - DEPLOYMENT.md (comprehensive guide)"
echo "   - deploy-checklist.md (step-by-step checklist)"
echo ""

echo "🔧 Useful commands:"
echo "   Generate secrets: node scripts/generate-secrets.js"
echo "   Health check: node scripts/health-check.js <url>"
echo ""

echo "✨ Ready to deploy! Follow the checklist for best results."
