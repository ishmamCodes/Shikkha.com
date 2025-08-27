#!/usr/bin/env node

/**
 * Generate secure secrets for production deployment
 * Run with: node scripts/generate-secrets.js
 */

import crypto from 'crypto';

console.log('🔐 Generating secure secrets for production deployment...\n');

// Generate JWT Secret (32 bytes = 64 hex characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

// Generate Session Secret (32 bytes = 64 hex characters)
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('SESSION_SECRET=' + sessionSecret);

console.log('\n✅ Copy these secrets to your Render environment variables');
console.log('⚠️  Keep these secrets secure and never commit them to version control');
