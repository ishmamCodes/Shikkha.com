#!/usr/bin/env node

import fetch from 'node-fetch';

const BACKEND_URL = process.env.BACKEND_URL || 'https://your-render-app.onrender.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-vercel-app.vercel.app';

async function checkHealth(url, name) {
  try {
    console.log(`🔍 Checking ${name}...`);
    const response = await fetch(url, { 
      method: 'GET',
      timeout: 10000 
    });
    
    if (response.ok) {
      console.log(`✅ ${name} is healthy (${response.status})`);
      return true;
    } else {
      console.log(`❌ ${name} returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🏥 Deployment Health Check');
  console.log('==========================');
  console.log();
  
  const backendHealthy = await checkHealth(`${BACKEND_URL}/api/health`, 'Backend API');
  const frontendHealthy = await checkHealth(FRONTEND_URL, 'Frontend App');
  
  console.log();
  if (backendHealthy && frontendHealthy) {
    console.log('🎉 All services are healthy!');
    process.exit(0);
  } else {
    console.log('⚠️  Some services are not responding correctly.');
    process.exit(1);
  }
}

main();
