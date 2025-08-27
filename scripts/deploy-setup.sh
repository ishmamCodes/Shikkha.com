#!/bin/bash

# Deployment Setup Script for Shikkha.com
# This script prepares the project for deployment

echo "🚀 Shikkha.com Deployment Setup"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install
cd ..

echo "🔐 Generating production secrets..."
node scripts/generate-secrets.js

echo "📋 Pre-deployment checklist:"
echo "1. ✅ Dependencies installed"
echo "2. 🔐 Secrets generated (copy them to your deployment platform)"
echo "3. 📝 Update .env.production files with your actual values"
echo "4. 🌐 Set up MongoDB Atlas database"
echo "5. 💳 Configure Stripe keys"
echo "6. 🚀 Deploy to Render (backend) and Vercel (frontend)"

echo ""
echo "📖 Next steps:"
echo "- Read DEPLOYMENT.md for detailed instructions"
echo "- Use deploy-checklist.md to track your progress"
echo ""
echo "✨ Setup complete! Ready for deployment."
