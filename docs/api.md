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

## CSV Organization Upload

### Endpoint
`POST /api/org-upload`

### Description
Bulk upload employee data via CSV file. Admin-only endpoint that validates, processes, and stores organizational structure data.

### Required Headers
```
Content-Type: application/json
Cookie: auth-token=<jwt_token>
```

### Request Body
```json
{
  "data": [
    {
      "first_name": "Asha",
      "last_name": "Menon", 
      "email": "asha@acme.local",
      "role": "org_leader",
      "manager_email": "",
      "skills": "product strategy|design leadership",
      "location": "Bengaluru",
      "aliases": "asham|asha.m"
    }
  ]
}
```

### CSV Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `first_name` | string | Yes | Employee first name |
| `last_name` | string | Yes | Employee last name |
| `email` | string | Yes | Valid email address (unique per tenant) |
| `role` | enum | Yes | One of: admin, org_leader, functional_leader, project_lead, team_member |
| `manager_email` | string | No | Email of reporting manager (must exist in same upload) |
| `skills` | string | No | Comma or pipe-separated list of skills |
| `location` | string | No | Employee work location |
| `aliases` | string | No | Comma or pipe-separated list of name aliases |

### Sample CSV (Valid)
```csv
first_name,last_name,email,role,manager_email,skills,location,aliases
Asha,Menon,asha@acme.local,org_leader,,product strategy|design leadership,Bengaluru,asham|asha.m
Ravi,Kapoor,ravi@acme.local,functional_leader,asha@acme.local,backend,Delhi,r.kapoor
Nina,Sharma,nina@acme.local,project_lead,ravi@acme.local,frontend,Remote,nina.s
Dev,Patel,dev@acme.local,team_member,nina@acme.local,react|javascript,Bengaluru,dev.p
Meera,Iyer,meera@acme.local,team_member,nina@acme.local,testing|qa,Bengaluru,meera
```

### Sample CSV (With Errors)
```csv
first_name,last_name,email,role,manager_email,skills,location,aliases
,Menon,asha@acme.local,org_leader,,strategy,Bengaluru,
Ravi,Kapoor,ravi-at-acme.local,functional_leader,asha@acme.local,backend,Delhi,
Nina,Sharma,nina@acme.local,cto,ravi@acme.local,frontend,Remote,
Dev,Patel,dev@acme.local,team_member,unknown@acme.local,react,Bengaluru,
```

### Response Format

**Success Response (200)**
```json
{
  "ok": true,
  "created": 4,
  "updated": 1,
  "skills_added": 8,
  "upload_url": "file:///tmp/permeate-storage/tenants/123/uploads/2024-01-15T10-30-00.csv"
}
```

**Validation Error Response (400)**
```json
{
  "errors": [
    {
      "row": 1,
      "field": "first_name", 
      "message": "First name is required"
    },
    {
      "row": 2,
      "field": "email",
      "message": "Valid email is required"
    },
    {
      "row": 3,
      "field": "role",
      "message": "Invalid role"
    }
  ]
}
```

### Processing Flow

1. **Authentication**: Verify admin role via JWT token
2. **Validation**: Validate each CSV row against Zod schema
3. **Error Reporting**: Return all validation errors without committing
4. **Storage**: Save original CSV to tenant storage directory
5. **Transaction**: Process all valid rows in single database transaction:
   - Upsert users by (tenant_id, email)
   - Create/update skills and user_skill relationships
   - Set up reporting relationships via manager_email
   - Create audit log entries for all changes
6. **Response**: Return counts of created/updated records

### Common Validation Errors

- **Missing required fields**: first_name, last_name, email
- **Invalid email format**: Must contain @ symbol and be valid email
- **Invalid role**: Must be one of the 5 predefined roles
- **Unknown manager**: manager_email references non-existent user (warning only)
- **Duplicate emails**: Same email appears multiple times in CSV
- **Self-reporting**: User lists themselves as manager

### Storage Configuration

**Development Mode** (`DEV_STORAGE_MODE=local`):
- Files saved to `/tmp/permeate-storage/tenants/{tenant_id}/uploads/`
- Returns `file://` URLs for local access

**Production Mode**:
- Files saved to S3-compatible storage
- Returns `https://` URLs

### Security & Permissions

- **Admin Only**: Only users with `role=admin` can upload organization data
- **Row Level Security**: All database operations wrapped with `withRLS`
- **Tenant Isolation**: All data scoped to authenticated user's tenant
- **Audit Logging**: All create/update operations logged with before/after values

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