# Registration System Fix Guide

## Issue Identified
The registration form shows the error: "Failed to execute 'fetch' on Window '/api/tenants/register' is not a valid HTTP method"

This indicates the frontend `apiRequest` function is being called with incorrect parameter order.

## Root Cause
In `client/src/pages/public-register.tsx`, the mutation is calling:
```typescript
await apiRequest("POST", "/api/tenants/register", data);
```

But the function signature was incorrectly defined as:
```typescript
apiRequest(url: string, method: string, data?: unknown)
```

## Fix Applied
Updated `client/src/lib/queryClient.ts` to correct parameter order:
```typescript
export async function apiRequest(
  method: string,  // ✅ Fixed: method first
  url: string,     // ✅ Fixed: url second  
  data?: unknown   // ✅ Unchanged
): Promise<Response>
```

## Verification Steps
1. **API Test**: ✅ Direct curl to `/api/tenants/register` works correctly
2. **Frontend Test**: The fix should resolve the "not a valid HTTP method" error
3. **Form Submission**: Registration form should now submit successfully

## Test Data
Use these values to test the registration form:
```
Company Name: TestCorp Inc
Domain: testcorp
First Name: Test
Last Name: Admin
Email: admin@testcorp.com
Password: admin123
Bootstrap Token: bootstrap-dev-token-2024
```

## Expected Result
After successful registration:
- User should see "Registration successful" toast
- Automatic redirect to dashboard after 1 second
- User will be logged in as admin of the new organization

## Backup Access
If registration still has issues, access the system via:
- URL: `/permeate-login`
- Email: admin@democo.com
- Password: admin123

This bypasses registration and provides access to test other features.