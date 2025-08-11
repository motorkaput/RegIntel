# Authentication API Documentation

## Overview

PerMeaTe Enterprise uses JWT-based authentication with multi-tenant support and role-based access control (RBAC). All authentication endpoints are secured and include comprehensive audit logging.

## Cookie Configuration

- **Name**: `auth-token`
- **Type**: httpOnly, secure, sameSite=lax
- **Expiration**: 7 days
- **Path**: `/`

## JWT Claims Structure

```typescript
{
  sub: string;          // user_id
  tenant_id: string;    // tenant UUID
  role: string;         // UserRole
  email: string;
  iat: number;          // issued at
  exp: number;          // expires at
}
```

## Authentication Flow

### 1. Registration (Bootstrap)

**Endpoint**: `POST /api/auth/register`

Creates a new tenant with an admin user using a bootstrap token.

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_name": "Acme Corp",
    "domain": "acme",
    "admin_email": "admin@acme.com",
    "password": "securepassword123",
    "first_name": "John",
    "last_name": "Doe",
    "bootstrap_token": "bootstrap-dev-token-2024"
  }'
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@acme.com",
    "role": "admin",
    "first_name": "John",
    "last_name": "Doe"
  },
  "tenant": {
    "id": "tenant-uuid",
    "name": "Acme Corp",
    "domain": "acme"
  }
}
```

### 2. Email/Password Login

**Endpoint**: `POST /api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "securepassword123"
  }'
```

**Rate Limiting**: 5 attempts per email+IP, 15-minute lockout

### 3. Magic Link Authentication

**Request Magic Link**: `POST /api/auth/magic-link`

```bash
curl -X POST http://localhost:3000/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com"
  }'
```

**Verify Magic Link**: `POST /api/auth/magic-link/verify`

```bash
curl -X POST http://localhost:3000/api/auth/magic-link/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "magic-link-token",
    "email": "admin@acme.com"
  }'
```

**Expiration**: 15 minutes, single-use

### 4. Logout

**Endpoint**: `POST /api/auth/logout`

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: auth-token=your-jwt-token"
```

## Team Invitations

### Create Invitation (Admin/Org Leader Only)

**Endpoint**: `POST /api/invitations/create`

```bash
curl -X POST http://localhost:3000/api/invitations/create \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=your-jwt-token" \
  -d '{
    "email": "newuser@example.com",
    "role": "project_lead"
  }'
```

### Accept Invitation

**Endpoint**: `POST /api/invitations/accept`

```bash
curl -X POST http://localhost:3000/api/invitations/accept \
  -H "Content-Type: application/json" \
  -d '{
    "token": "invitation-token",
    "email": "newuser@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "password": "securepassword123"
  }'
```

## Role-Based Access Control

### Available Roles
- `admin`: Full system access
- `org_leader`: Organization management
- `functional_leader`: Functional area leadership
- `project_lead`: Project management
- `team_member`: Basic task access

### Permission Matrix

| Resource | Read | Write | Delete |
|----------|------|-------|--------|
| Users | All | Admin | Admin |
| Goals | All | Leaders+ | Admin |
| Projects | All | Managers+ | Admin |
| Tasks | All | All* | Admin |
| Billing | Org+ | Admin | Admin |
| Settings | Org+ | Admin | Admin |
| Invitations | Org+ | Org+ | Org+ |

*Team members can only modify assigned tasks

## Row Level Security (RLS) Integration

Every API request that touches the database must use the `withRLS` wrapper:

```typescript
import { withRLSFromRequest } from '@/lib/db/rls';

export async function GET(request: Request) {
  return withRLSFromRequest(prisma, request, async () => {
    // Database operations here - RLS context is set automatically
    const goals = await prisma.goal.findMany();
    return NextResponse.json({ goals });
  });
}
```

**Required PostgreSQL Session Variables**:
- `app.current_tenant_id`: Set from JWT tenant_id
- `app.current_role`: Set from JWT role  
- `app.current_user_id`: Set from JWT sub

## Middleware Protection

The Next.js middleware automatically:

1. Validates JWT tokens on all protected routes
2. Sets auth headers (`x-tenant-id`, `x-user-id`, `x-role`)
3. Redirects unauthenticated users to `/login`
4. Handles token rotation for long-lived sessions

**Public Routes**:
- `/`, `/login`, `/register`, `/magic-link/*`
- `/api/auth/*`

**Protected Routes**:
- Everything under `/(dashboard)`
- All `/api/*` except auth endpoints

## Security Features

### Brute Force Protection
- Rate limiting on login attempts
- Email + IP-based tracking
- Exponential backoff

### Password Security
- bcrypt hashing with 12 rounds
- Minimum 8 character requirement
- Server-side validation

### CSRF Protection
- All write operations via POST
- httpOnly cookies
- SameSite=lax configuration

### Audit Logging
All authentication events are logged:
- `REGISTER_ADMIN`
- `LOGIN_SUCCESS` / `LOGIN_FAILED`
- `MAGIC_LINK_REQUESTED`
- `INVITE_CREATED` / `INVITE_ACCEPTED`
- `LOGOUT`

## Error Responses

All authentication errors return structured JSON:

```json
{
  "error": "Invalid credentials",
  "details": ["Validation error details if applicable"]
}
```

**Common HTTP Status Codes**:
- `400`: Validation error
- `401`: Authentication required / Invalid credentials
- `403`: Insufficient permissions
- `409`: Conflict (email exists, domain taken)
- `429`: Rate limited

## Environment Variables

```bash
JWT_SECRET="your-256-bit-secret"
BOOTSTRAP_TOKEN="secure-bootstrap-token"
POSTMARK_API_TOKEN="pm-token"
FROM_EMAIL="noreply@yourapp.com"
NEXTAUTH_URL="https://yourdomain.com"
```

## Testing Authentication

Use the provided test credentials from the database seed:

**Acme Corp Admin**:
- Email: `admin@acme.com`
- Password: `adminpass123`

**StartupXYZ Admin**:
- Email: `admin@startupxyz.com` 
- Password: `adminpass123`

Remember: The `rls-fixed.sql` expects proper `set_config` calls per request for tenant isolation to work correctly.