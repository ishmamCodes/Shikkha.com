#!/usr/bin/env node

/**
 * Health check script for deployment verification
 * Run with: node scripts/health-check.js <backend-url>
 */

import axios from 'axios';

const backendUrl = process.argv[2] || 'http://localhost:4000';

async function healthCheck() {
  console.log('🏥 Running health check for Shikkha.com backend...\n');
  console.log(`Target URL: ${backendUrl}`);
  
  try {
    // Test basic connectivity
    console.log('1. Testing basic connectivity...');
    const response = await axios.get(backendUrl, { timeout: 10000 });
    console.log('✅ Basic connectivity: OK');
    console.log(`   Response: ${response.data}`);
    
    // Test API health endpoint
    console.log('\n2. Testing API health...');
    const apiResponse = await axios.get(`${backendUrl}/api/auth/health`, { 
      timeout: 10000,
      validateStatus: () => true // Accept any status code
    });
    
    if (apiResponse.status === 200) {
      console.log('✅ API health: OK');
    } else if (apiResponse.status === 404) {
      console.log('⚠️  API health endpoint not found (this is normal)');
    } else {
      console.log(`⚠️  API health: Status ${apiResponse.status}`);
    }
    
    // Test CORS headers
    console.log('\n3. Testing CORS configuration...');
    if (apiResponse.headers['access-control-allow-origin']) {
      console.log('✅ CORS headers: Present');
      console.log(`   Origin: ${apiResponse.headers['access-control-allow-origin']}`);
    } else {
      console.log('⚠️  CORS headers: Not found in response');
    }
    
    console.log('\n🎉 Health check completed successfully!');
    console.log('\nNext steps:');
    console.log('- Test your frontend connection to this backend');
    console.log('- Verify environment variables are set correctly');
    console.log('- Test API endpoints from your frontend application');
    
  } catch (error) {
    console.log('❌ Health check failed!');
    console.log(`Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔍 Troubleshooting:');
      console.log('- Check if the server is running');
      console.log('- Verify the URL is correct');
      console.log('- Check firewall settings');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n🔍 Troubleshooting:');
      console.log('- Check if the domain name is correct');
      console.log('- Verify DNS resolution');
      console.log('- Check if the service is deployed');
    }
    
    process.exit(1);
  }
}

// Run the health check
healthCheck();
