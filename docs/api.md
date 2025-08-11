# PerMeaTe Enterprise API Documentation

## Database Setup and Row Level Security

### Setting Context Variables

The application middleware must run these commands per request to enable RLS and role-based access:

```sql
-- Set the current tenant context
SELECT set_config('app.current_tenant_id', '<tenant_uuid>', true);

-- Set the current user role for permission checks
SELECT set_config('app.current_role', '<role>', true);

-- Set the current user ID for assignee checks
SELECT set_config('app.current_user_id', '<user_uuid>', true);
```

These settings are extracted from JWT claims during authentication and propagated to the database session for RLS policies.

### Local Development Setup

Run these commands in order for initial setup:

```bash
# 1. Create and apply database migrations
npm run db:migrate

# 2. Apply Row Level Security policies
npm run db:rls

# 3. Seed with demo data
npm run db:seed
```

### JWT Claims Structure

The JWT tokens include these claims for multi-tenant access control:

```typescript
interface JWTClaims {
  sub: string;           // user_id
  tenant_id: string;     // tenant UUID
  role: UserRole;        // admin | org_leader | functional_leader | project_lead | team_member
  email: string;
  iat: number;
  exp: number;
}
```

### Middleware Implementation

```typescript
// Example middleware to set database context
async function setDatabaseContext(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const claims = verifyJWT(token);
  
  // Set context in database connection
  await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${claims.tenant_id}, true)`;
  await prisma.$executeRaw`SELECT set_config('app.current_role', ${claims.role}, true)`;
  await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${claims.sub}, true)`;
  
  next();
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Email/password authentication
- `POST /api/auth/register` - Create new tenant and admin user
- `POST /api/auth/magic-link` - Send magic link for passwordless login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Invalidate session

### Tenants
- `GET /api/tenants/current` - Get current tenant info
- `PUT /api/tenants/current` - Update tenant settings (admin only)

### Users & Team Management
- `GET /api/users` - List team members
- `POST /api/users/invite` - Send invitation (admin/org_leader only)
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Remove user (admin only)

### Goals
- `GET /api/goals` - List goals with filtering
- `POST /api/goals` - Create new goal (leaders only)
- `GET /api/goals/:id` - Get goal details
- `PUT /api/goals/:id` - Update goal (leaders only)
- `DELETE /api/goals/:id` - Delete goal (admin only)
- `POST /api/goals/:id/ai-breakdown` - Generate AI project breakdown

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project (managers only)
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project (managers only)
- `DELETE /api/projects/:id` - Delete project (admin only)

### Tasks
- `GET /api/tasks` - List tasks with filters
- `POST /api/tasks` - Create task (managers only)
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task (managers/assignees can update status)
- `DELETE /api/tasks/:id` - Delete task (admin only)

### Analytics & Reporting
- `GET /api/analytics/overview` - Dashboard metrics
- `GET /api/analytics/team-performance` - Team performance data
- `GET /api/analytics/goal-progress` - Goal completion tracking
- `GET /api/analytics/usage` - Usage events and billing data

### Billing
- `GET /api/billing/subscription` - Current subscription status
- `POST /api/billing/subscription` - Create/update subscription
- `GET /api/billing/usage` - Usage metrics for billing

## Role-Based Access Control

### Permission Matrix

| Resource | Admin | Org Leader | Functional Leader | Project Lead | Team Member |
|----------|-------|------------|-------------------|--------------|-------------|
| Tenants | CRUD | R | R | R | R |
| Users | CRUD | CRUD | R (team) | R (project) | R (self) |
| Goals | CRUD | CRUD | CRUD (functional) | R | R |
| Projects | CRUD | CRUD | CRUD (owned) | CRUD (assigned) | R |
| Tasks | CRUD | CRUD | CRUD (project) | CRUD (project) | CRUD (assigned) |
| Analytics | All | All | Functional | Project | Personal |
| Billing | CRUD | R | - | - | - |

### RLS Policy Examples

```sql
-- Goals: Only leaders can create/modify
CREATE POLICY goals_leaders_insert ON goals FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid 
              AND has_role(ARRAY['admin', 'org_leader', 'functional_leader']));

-- Tasks: Team members can update status on assigned tasks
CREATE POLICY tasks_assignee_update ON tasks FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid 
         AND assignee_id = current_setting('app.current_user_id')::uuid
         AND has_role(ARRAY['team_member']));
```

## Error Handling

### Standard Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
```

### Common Error Codes
- `TENANT_NOT_FOUND` - Invalid or missing tenant context
- `INSUFFICIENT_PERMISSIONS` - User lacks required role
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `VALIDATION_ERROR` - Request body validation failed
- `RATE_LIMIT_EXCEEDED` - API rate limit exceeded

## Data Models

See `prisma/schema.prisma` for complete model definitions including:
- Multi-tenant isolation with `tenant_id` on all tables
- Role-based enum types for permissions
- Comprehensive indexing for performance
- Audit logging for compliance
- Usage tracking for billing