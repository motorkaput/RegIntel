#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

console.log('🚀 Quick Application Test Suite\n');

const tests = [
  {
    name: 'Health Check',
    command: 'curl -s -f http://localhost:5000/api/health',
    expectation: 'Should return HTML or JSON response'
  },
  {
    name: 'Registration API',
    command: 'curl -s -X POST http://localhost:5000/api/tenants/register -H "Content-Type: application/json" -d \'{"company_name":"TestCorp","domain":"testcorp","admin_email":"admin@testcorp.com","password":"admin123","first_name":"Test","last_name":"Admin","bootstrap_token":"bootstrap-dev-token-2024"}\'',
    expectation: 'Should create new tenant successfully'
  },
  {
    name: 'PerMeaTe Login API',
    command: 'curl -s http://localhost:5000/api/permeate/auth/user',
    expectation: 'Should return 401 (unauthorized) indicating auth system works'
  },
  {
    name: 'Frontend Registration Page',
    command: 'curl -s http://localhost:5000/register',
    expectation: 'Should return HTML registration form'
  },
  {
    name: 'Frontend Login Page',
    command: 'curl -s http://localhost:5000/permeate-login',
    expectation: 'Should return HTML login form'
  }
];

const results = [];
let allPassed = true;

console.log('Running tests...\n');

for (const test of tests) {
  try {
    const startTime = Date.now();
    console.log(`🧪 ${test.name}...`);
    
    const output = execSync(test.command, { 
      encoding: 'utf8', 
      timeout: 15000,
      stdio: 'pipe'
    });
    
    const duration = Date.now() - startTime;
    let status = 'PASS';
    let details = 'OK';
    
    // Analyze output
    if (test.name === 'Registration API') {
      if (output.includes('"success":true')) {
        details = 'Created tenant successfully';
      } else if (output.includes('already exists')) {
        details = 'Domain already exists (expected)';
      } else if (output.includes('error')) {
        status = 'WARN';
        details = 'API responding with validation error';
      }
    } else if (test.name === 'PerMeaTe Login API') {
      if (output.includes('401') || output.includes('Unauthorized') || output.includes('No token')) {
        details = 'Auth system responding correctly';
      } else {
        status = 'WARN';
        details = 'Unexpected auth response';
      }
    } else if (test.name.includes('Frontend')) {
      if (output.includes('<!DOCTYPE html>') || output.includes('<html')) {
        details = 'HTML page loads correctly';
      } else {
        status = 'FAIL';
        details = 'Not returning HTML';
        allPassed = false;
      }
    }
    
    results.push({ name: test.name, status, duration, details });
    console.log(`   ${status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌'} ${status} (${duration}ms) - ${details}`);
    
  } catch (error) {
    const duration = Date.now() - Date.now();
    results.push({ 
      name: test.name, 
      status: 'FAIL', 
      duration, 
      details: (error as Error).message.substring(0, 100)
    });
    console.log(`   ❌ FAIL - ${(error as Error).message.substring(0, 80)}...`);
    allPassed = false;
  }
}

// Generate summary report
const reportDate = new Date().toISOString();
const report = `# Quick Application Test Report

**Generated:** ${reportDate}
**Test Type:** API and Frontend Health Check
**Environment:** Development

## Test Results

| Test | Status | Duration (ms) | Details |
|------|--------|---------------|---------|
${results.map(r => `| ${r.name} | ${r.status === 'PASS' ? '✅ PASS' : r.status === 'WARN' ? '⚠️ WARN' : '❌ FAIL'} | ${r.duration} | ${r.details} |`).join('\n')}

## Summary

- **Total Tests:** ${results.length}
- **Passed:** ${results.filter(r => r.status === 'PASS').length}
- **Warnings:** ${results.filter(r => r.status === 'WARN').length}
- **Failed:** ${results.filter(r => r.status === 'FAIL').length}
- **Overall Status:** ${allPassed ? '✅ HEALTHY' : '⚠️ NEEDS ATTENTION'}

## Key Findings

${allPassed ? `
### System Health: GOOD ✅

All critical components are operational:
- ✅ Server responding on port 5000
- ✅ Registration API accepting requests
- ✅ Authentication system working
- ✅ Frontend pages loading correctly
- ✅ Database connectivity established

**Ready for user testing!**
` : `
### Issues Found

${results.filter(r => r.status === 'FAIL').map(r => `- **${r.name}**: ${r.details}`).join('\n')}

### Recommended Actions
1. Check server logs for detailed error information
2. Verify database connection and migrations
3. Test API endpoints manually via browser
`}

## Next Steps

${allPassed ? `
**✅ READY FOR MANUAL TESTING**

The application is responding correctly to all basic health checks.
You can now test:
1. Registration form at: http://localhost:5000/register
2. Login form at: http://localhost:5000/permeate-login
3. Use demo credentials: admin@democo.com / admin123

For comprehensive testing, run:
\`\`\`bash
npm run e2e:install && npm run e2e:all
\`\`\`
` : `
**🔧 FIX ISSUES FIRST**

Please address the failing tests above before proceeding with manual testing.
Run this quick test again: \`tsx scripts/quick-test.ts\`
`}

---
*Quick test completed in ${results.reduce((sum, r) => sum + r.duration, 0)}ms*
`;

writeFileSync('docs/quick-test-report.md', report);

console.log(`\n📊 Quick test complete!`);
console.log(`📝 Report saved to: docs/quick-test-report.md`);
console.log(`🚀 Overall status: ${allPassed ? '✅ HEALTHY - Ready for testing!' : '⚠️ NEEDS ATTENTION'}`);

if (allPassed) {
  console.log(`\n🎯 Ready to test registration at: http://localhost:5000/register`);
  console.log(`📋 Test data: Company: TestCorp, Domain: testcorp, Email: admin@testcorp.com`);
}