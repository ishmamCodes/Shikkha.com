#!/usr/bin/env node

import crypto from 'crypto';

/**
 * Generate secure random secrets for production deployment
 */
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('🔐 Generated Production Secrets:');
console.log('================================');
console.log();
console.log('JWT_SECRET=' + generateSecret(32));
console.log('SESSION_SECRET=' + generateSecret(32));
console.log();
console.log('⚠️  IMPORTANT: Store these securely and never commit them to version control!');
console.log('📝 Add these to your Render environment variables.');
console.log();
console.log('🔄 Run this script again to generate new secrets if needed.');
