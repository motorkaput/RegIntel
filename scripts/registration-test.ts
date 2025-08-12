#!/usr/bin/env tsx

import { execSync } from 'child_process';

console.log('🧪 Testing Registration System End-to-End...\n');

const testData = {
  company_name: "TestCorp Inc",
  domain: "testcorp-" + Date.now(), // Unique domain to avoid conflicts
  admin_email: "admin@testcorp-" + Date.now() + ".com",
  password: "admin123",
  first_name: "Test",
  last_name: "Admin",
  bootstrap_token: "bootstrap-dev-token-2024"
};

console.log('📝 Test Data:', JSON.stringify(testData, null, 2));

// Test 1: Registration API directly
console.log('\n1️⃣ Testing Registration API directly...');
try {
  const curlCommand = `curl -s -X POST "http://localhost:5000/api/tenants/register" \\
    -H "Content-Type: application/json" \\
    -d '${JSON.stringify(testData)}'`;
    
  const response = execSync(curlCommand, { encoding: 'utf8', timeout: 10000 });
  const parsed = JSON.parse(response);
  
  if (parsed.success) {
    console.log('✅ Registration API - SUCCESS');
    console.log(`   Created user: ${parsed.user.email} (${parsed.user.role})`);
    console.log(`   Created tenant: ${parsed.tenant.name} (domain: ${parsed.tenant.domain})`);
  } else {
    console.log('❌ Registration API - FAILED');
    console.log('   Response:', response);
  }
} catch (error) {
  console.log('❌ Registration API - ERROR');
  console.log('   Error:', error instanceof Error ? error.message : String(error));
}

// Test 2: Frontend form submission simulation
console.log('\n2️⃣ Testing Frontend Form Submission...');
try {
  // Simulate the frontend apiRequest call pattern
  const frontendTestCommand = `node -e "
    const fetch = require('node-fetch');
    
    async function testFrontend() {
      try {
        const response = await fetch('http://localhost:5000/api/tenants/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(${JSON.stringify(testData).replace(/"/g, '\\"')}),
          credentials: 'include'
        });
        
        const result = await response.json();
        console.log('Frontend test result:', JSON.stringify(result, null, 2));
        
        if (response.ok && result.success) {
          console.log('✅ Frontend simulation - SUCCESS');
        } else {
          console.log('❌ Frontend simulation - FAILED');
          console.log('Status:', response.status, response.statusText);
        }
      } catch (error) {
        console.log('❌ Frontend simulation - ERROR');
        console.log('Error:', error.message);
      }
    }
    
    testFrontend();
  "`;
  
  execSync(frontendTestCommand, { 
    encoding: 'utf8', 
    timeout: 10000,
    stdio: 'inherit'
  });
  
} catch (error) {
  console.log('❌ Frontend simulation failed to run');
  console.log('   This may be expected - testing alternate method...');
  
  // Fallback test using curl with same headers as frontend
  try {
    const frontendCurlCommand = `curl -s -X POST "http://localhost:5000/api/tenants/register" \\
      -H "Content-Type: application/json" \\
      -H "Cookie: " \\
      -d '${JSON.stringify({...testData, domain: testData.domain + "-alt"})}'`;
      
    const response = execSync(frontendCurlCommand, { encoding: 'utf8', timeout: 10000 });
    const parsed = JSON.parse(response);
    
    if (parsed.success) {
      console.log('✅ Frontend-style request - SUCCESS');
    } else {
      console.log('❌ Frontend-style request - FAILED');
      console.log('   Response:', response);
    }
  } catch (fallbackError) {
    console.log('❌ Frontend-style request - ERROR');
    console.log('   Error:', fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
  }
}

console.log('\n📊 Registration Test Complete');
console.log('\n💡 If both tests pass, the registration system is working correctly.');
console.log('   If frontend simulation fails but API test passes, the issue is in the client-side code.');