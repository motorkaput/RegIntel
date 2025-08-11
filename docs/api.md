# PerMeaTe Enterprise API Documentation

## Overview

PerMeaTe Enterprise uses Next.js 14 app router with route handlers for the API layer. All database operations must be wrapped in `withRLS` for Row Level Security compliance.

## Authentication

### JWT Token Management

All authentication routes return HttpOnly cookies containing JWT tokens. Tokens are valid for 7 days and include:

```typescript
{
  sub: string;        // User ID
  tenant_id: string;  // Tenant ID for RLS
  role: string;       // User role for RBAC
  email: string;      // User email
}
```

## API Endpoints

### Authentication Routes

#### POST /api/auth/register
Bootstrap organization registration.

**Request Body:**
```json
{
  "tenant_name": "Acme Corp",
  "domain": "acme",
  "admin_email": "admin@acme.com", 
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "bootstrap_token": "bootstrap-dev-token-2024"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "admin@acme.com",
    "role": "admin",
    "first_name": "John", 
    "last_name": "Doe"
  },
  "tenant": {
    "id": "tenant_id",
    "name": "Acme Corp",
    "domain": "acme"
  }
}
```

#### POST /api/auth/login
Standard email/password login.

**Request Body:**
```json
{
  "email": "user@acme.com",
  "password": "password123"
}
```

#### POST /api/auth/logout
Clears authentication cookie.

#### GET /api/auth/user
Returns current authenticated user information.

### Magic Links

#### POST /api/auth/magic-link
Generate and send magic link email.

**Request Body:**
```json
{
  "email": "user@acme.com"
}
```

#### GET /api/auth/magic-link/verify?token=xxx
Verifies magic link token and redirects to dashboard with authentication.

### Invitations

#### POST /api/invitations/create
Create user invitation (admin/org_leader only).

**Request Body:**
```json
{
  "email": "newuser@acme.com",
  "role": "team_member",
  "first_name": "Jane",
  "last_name": "Smith"
}
```

#### POST /api/invitations/accept
Accept invitation and create/update user account.

**Request Body:**
```json
{
  "token": "invitation_token",
  "password": "password123",
  "first_name": "Jane",
  "last_name": "Smith"
}
```

#### GET /api/invitations/accept?token=xxx
Invitation verification endpoint that redirects to acceptance form.

## RLS (Row Level Security) Requirements

All database operations in route handlers MUST be wrapped with `withRLS`:

```typescript
import { withRLS } from '@/lib/db/rls';
import { getJWTFromCookies } from '@/lib/auth/jwt';

export async function GET() {
  const payload = await getJWTFromCookies();
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await withRLS(
    prisma,
    { 
      tenantId: payload.tenant_id, 
      role: payload.role, 
      userId: payload.sub 
    },
    async (client) => {
      return await client.someModel.findMany({
        where: { tenant_id: payload.tenant_id }
      });
    }
  );

  return NextResponse.json(result);
}
```

## Middleware Protection

The Next.js middleware protects:
- All `/dashboard/*` routes
- All `/api/*` routes (except auth and invitation accept)

Unauthenticated requests are redirected to `/login` or return 401 for API routes.

## Email Configuration

### Development Mode

Set `DEV_EMAIL_MODE=console` to log emails to console instead of sending via Postmark:

```bash
DEV_EMAIL_MODE=console  # Logs to console (default for development)
DEV_EMAIL_MODE=postmark # Sends via Postmark (production)
```

In console mode, API responses include `devUrl` field with the action URL for easy clicking during development.

### Required Environment Variables

```bash
# Required for all modes
APP_URL=http://localhost:3000              # Used to build magic link URLs
EMAIL_FROM="no-reply@permeate.local"       # From address for emails
DEV_EMAIL_MODE=console                     # console | postmark

# Required for Postmark mode only  
POSTMARK_TOKEN=your_postmark_server_token  # Get from postmarkapp.com
```

### Email Templates

The system provides:
- Magic link authentication emails
- User invitation emails with role information
- Password reset emails (future)

## Audit Logging

All authentication events are logged to the `audit_logs` table:
- User registration
- Login/logout events  
- Magic link generation/usage
- Invitation creation/acceptance
- Password changes

## Development Features

### Console Email Mode

When `DEV_EMAIL_MODE=console`, authentication endpoints include development URLs:

**Magic Link Response (Dev Mode):**
```json
{
  "success": true,
  "message": "Magic link generated (check console for URL)",
  "devUrl": "http://localhost:3000/api/auth/magic-link/verify?token=abc123"
}
```

**Invitation Response (Dev Mode):**
```json
{
  "success": true,
  "invitation": { ... },
  "message": "Invitation created (check console for URL)", 
  "devUrl": "http://localhost:3000/api/invitations/accept?token=def456"
}
```

### Architecture Compliance

✅ **No Express remnants** - All routes are Next.js route handlers  
✅ **RLS on all DB calls** - Every database operation uses `withRLS` wrapper  
✅ **Console email fallback** - Authentication works without Postmark setup  
✅ **JWT cookies** - HttpOnly cookies for secure token management  

## Error Handling

All routes return consistent error responses:
```json
{
  "error": "Error message description"
}
```

Common status codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate resources)
- 500: Internal Server Error