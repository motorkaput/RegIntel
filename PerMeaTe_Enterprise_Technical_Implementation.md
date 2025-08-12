# PerMeaTe Enterprise - Technical Implementation Guide

## Document Information
- **Version**: 1.0
- **Date**: August 12, 2025
- **Author**: Dark Street Tech Technical Team
- **Project**: PerMeaTe Enterprise Module

## 1. Technical Architecture Overview

### 1.1 System Architecture
PerMeaTe Enterprise follows a modern full-stack architecture pattern integrated within the Dark Street Tech ecosystem:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                    │
├─────────────────────────────────────────────────────────────┤
│                  API Gateway (Express.js)                   │
├─────────────────────────────────────────────────────────────┤
│              Business Logic Layer (Node.js)                 │
├─────────────────────────────────────────────────────────────┤
│                 Data Layer (PostgreSQL)                     │
├─────────────────────────────────────────────────────────────┤
│              External Services (OpenAI, Auth)               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS with shadcn/ui components
- TanStack Query for state management
- Wouter for routing
- Recharts for analytics visualization

**Backend:**
- Node.js with Express.js
- TypeScript for type safety
- Drizzle ORM for database operations
- Passport.js for authentication
- Multer for file handling

**Database:**
- PostgreSQL (Neon serverless)
- Drizzle Kit for migrations
- Session storage in PostgreSQL

**External Services:**
- OpenAI GPT-4o API for AI capabilities
- Replit Auth for authentication
- SendGrid for email notifications (if needed)

## 2. Database Schema Design

### 2.1 Core Tables

```typescript
// Organizations
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  industry: varchar("industry"),
  size: varchar("size"), // "small", "medium", "large", "enterprise"
  description: text("description"),
  settings: jsonb("settings").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users (extends existing users table)
export const enterpriseUsers = pgTable("enterprise_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  organizationId: varchar("organization_id").references(() => organizations.id),
  role: varchar("role").notNull(), // "administrator", "organization_leader", "project_leader", "team_member"
  departmentId: varchar("department_id"),
  skillsAndPreferences: jsonb("skills_and_preferences").default('{}'),
  performanceMetrics: jsonb("performance_metrics").default('{}'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Departments
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id),
  name: varchar("name").notNull(),
  description: text("description"),
  leaderId: varchar("leader_id"),
  parentDepartmentId: varchar("parent_department_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Goals
export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id),
  title: varchar("title").notNull(),
  description: text("description"),
  priority: varchar("priority").default("medium"), // "low", "medium", "high", "critical"
  status: varchar("status").default("active"), // "active", "completed", "paused", "cancelled"
  targetDate: timestamp("target_date"),
  aiBreakdown: jsonb("ai_breakdown").default('{}'),
  createdBy: varchar("created_by").references(() => enterpriseUsers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id),
  goalId: varchar("goal_id").references(() => goals.id),
  name: varchar("name").notNull(),
  description: text("description"),
  status: varchar("status").default("planning"), // "planning", "active", "completed", "on_hold"
  progress: integer("progress").default(0), // 0-100
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  leaderId: varchar("leader_id").references(() => enterpriseUsers.id),
  budget: decimal("budget"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  goalId: varchar("goal_id").references(() => goals.id),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").default("todo"), // "todo", "in_progress", "review", "completed"
  priority: varchar("priority").default("medium"),
  estimatedHours: decimal("estimated_hours"),
  actualHours: decimal("actual_hours"),
  assignedTo: varchar("assigned_to").references(() => enterpriseUsers.id),
  createdBy: varchar("created_by").references(() => enterpriseUsers.id),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  aiSuggestions: jsonb("ai_suggestions").default('{}'),
  dependencies: jsonb("dependencies").default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team Assignments
export const teamAssignments = pgTable("team_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  userId: varchar("user_id").references(() => enterpriseUsers.id),
  role: varchar("role"), // "leader", "member", "contributor"
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Activity Logs
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id),
  userId: varchar("user_id").references(() => enterpriseUsers.id),
  action: varchar("action").notNull(),
  entityType: varchar("entity_type"), // "task", "project", "goal", "user"
  entityId: varchar("entity_id"),
  details: jsonb("details").default('{}'),
  timestamp: timestamp("timestamp").defaultNow(),
});
```

### 2.2 Relations

```typescript
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(enterpriseUsers),
  departments: many(departments),
  goals: many(goals),
  projects: many(projects),
  activityLogs: many(activityLogs),
}));

export const enterpriseUsersRelations = relations(enterpriseUsers, ({ one, many }) => ({
  user: one(users, { fields: [enterpriseUsers.userId], references: [users.id] }),
  organization: one(organizations, { fields: [enterpriseUsers.organizationId], references: [organizations.id] }),
  assignedTasks: many(tasks, { relationName: "assignedTasks" }),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
  ledProjects: many(projects),
  teamAssignments: many(teamAssignments),
}));

// Additional relations for goals, projects, tasks, etc.
```

## 3. API Design

### 3.1 Authentication & Authorization

```typescript
// Middleware for role-based access control
export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as EnterpriseUser;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

// Example usage in routes
app.get("/api/enterprise/admin/users", 
  isAuthenticated, 
  requireRole(["administrator"]), 
  getUsersList
);
```

### 3.2 Core API Endpoints

```typescript
// Organization Management
POST   /api/enterprise/organizations              // Create organization (admin only)
GET    /api/enterprise/organizations/:id          // Get organization details
PUT    /api/enterprise/organizations/:id          // Update organization
DELETE /api/enterprise/organizations/:id          // Delete organization (admin only)

// User Management
POST   /api/enterprise/users                      // Create user (admin/org_leader)
GET    /api/enterprise/users                      // List users (role-filtered)
GET    /api/enterprise/users/:id                  // Get user details
PUT    /api/enterprise/users/:id                  // Update user
DELETE /api/enterprise/users/:id                  // Delete user (admin only)
POST   /api/enterprise/users/bulk-import          // CSV bulk import (admin only)

// Goal Management
POST   /api/enterprise/goals                      // Create goal (admin/org_leader)
GET    /api/enterprise/goals                      // List goals (role-filtered)
GET    /api/enterprise/goals/:id                  // Get goal details
PUT    /api/enterprise/goals/:id                  // Update goal
DELETE /api/enterprise/goals/:id                  // Delete goal
POST   /api/enterprise/goals/:id/ai-breakdown     // AI goal breakdown

// Project Management
POST   /api/enterprise/projects                   // Create project
GET    /api/enterprise/projects                   // List projects (role-filtered)
GET    /api/enterprise/projects/:id               // Get project details
PUT    /api/enterprise/projects/:id               // Update project
DELETE /api/enterprise/projects/:id               // Delete project

// Task Management
POST   /api/enterprise/tasks                      // Create task
GET    /api/enterprise/tasks                      // List tasks (role-filtered)
GET    /api/enterprise/tasks/:id                  // Get task details
PUT    /api/enterprise/tasks/:id                  // Update task
DELETE /api/enterprise/tasks/:id                  // Delete task
POST   /api/enterprise/tasks/:id/ai-suggest       // AI task suggestions

// Analytics
GET    /api/enterprise/analytics/dashboard        // Role-specific dashboard data
GET    /api/enterprise/analytics/performance      // Performance metrics
GET    /api/enterprise/analytics/reports          // Generate reports
```

### 3.3 OpenAI Integration Service

```typescript
export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async breakdownGoal(goal: Goal): Promise<TaskSuggestion[]> {
    const prompt = `
    Break down this organizational goal into specific, actionable tasks:
    
    Goal: ${goal.title}
    Description: ${goal.description}
    Priority: ${goal.priority}
    Target Date: ${goal.targetDate}
    
    Provide a JSON response with tasks including:
    - title: clear, actionable task title
    - description: detailed task description
    - estimatedHours: realistic time estimate
    - priority: task priority level
    - dependencies: array of dependent task indices
    - suggestedRole: recommended role for assignment
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  }

  async suggestTaskAssignment(task: Task, availableUsers: EnterpriseUser[]): Promise<AssignmentSuggestion> {
    const prompt = `
    Suggest the best user assignment for this task:
    
    Task: ${task.title}
    Description: ${task.description}
    Required Skills: ${task.aiSuggestions?.requiredSkills || 'Not specified'}
    Estimated Hours: ${task.estimatedHours}
    
    Available Users:
    ${availableUsers.map(user => `
    - ${user.userId}: Role: ${user.role}, Skills: ${JSON.stringify(user.skillsAndPreferences)}
    `).join('\n')}
    
    Provide a JSON response with:
    - recommendedUserId: best user ID for assignment
    - confidence: confidence level (0-1)
    - reasoning: explanation for recommendation
    - alternatives: array of alternative user IDs with reasons
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
```

## 4. Frontend Implementation

### 4.1 Component Architecture

```typescript
// Role-based routing
export function EnterpriseApp() {
  const { user } = useAuth();
  const enterpriseUser = useEnterpriseUser();

  if (!enterpriseUser) {
    return <OnboardingWizard />;
  }

  return (
    <Router>
      <Switch>
        {/* Administrator Routes */}
        {enterpriseUser.role === 'administrator' && (
          <>
            <Route path="/enterprise/admin" component={AdminDashboard} />
            <Route path="/enterprise/admin/users" component={UserManagement} />
            <Route path="/enterprise/admin/settings" component={SystemSettings} />
          </>
        )}
        
        {/* Organization Leader Routes */}
        {['administrator', 'organization_leader'].includes(enterpriseUser.role) && (
          <>
            <Route path="/enterprise/goals" component={GoalManagement} />
            <Route path="/enterprise/analytics" component={OrgAnalytics} />
          </>
        )}
        
        {/* Project Leader Routes */}
        {['administrator', 'organization_leader', 'project_leader'].includes(enterpriseUser.role) && (
          <>
            <Route path="/enterprise/projects" component={ProjectManagement} />
            <Route path="/enterprise/teams" component={TeamManagement} />
          </>
        )}
        
        {/* Common Routes */}
        <Route path="/enterprise/tasks" component={TaskManagement} />
        <Route path="/enterprise/profile" component={UserProfile} />
        <Route path="/enterprise" component={Dashboard} />
      </Switch>
    </Router>
  );
}
```

### 4.2 State Management with TanStack Query

```typescript
// Custom hooks for enterprise data
export function useEnterpriseUser() {
  return useQuery({
    queryKey: ['/api/enterprise/users/me'],
    queryFn: getQueryFn(),
  });
}

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['/api/enterprise/tasks', filters],
    queryFn: getQueryFn(),
  });
}

export function useCreateTask() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      const res = await apiRequest('POST', '/api/enterprise/tasks', taskData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise/tasks'] });
      toast({ title: "Task created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create task", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}
```

### 4.3 Onboarding Wizard Component

```typescript
export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [organizationData, setOrganizationData] = useState<OrganizationSetup>({});
  
  const steps = [
    { id: 1, title: "Organization Details", component: OrgDetailsStep },
    { id: 2, title: "Goal Definition", component: GoalDefinitionStep },
    { id: 3, title: "Team Structure", component: TeamStructureStep },
    { id: 4, title: "User Import", component: UserImportStep },
    { id: 5, title: "Final Setup", component: FinalSetupStep },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8">
        <WizardProgress steps={steps} currentStep={currentStep} />
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          </CardHeader>
          <CardContent>
            {React.createElement(steps[currentStep - 1].component, {
              data: organizationData,
              onUpdate: setOrganizationData,
              onNext: () => setCurrentStep(prev => prev + 1),
              onPrev: () => setCurrentStep(prev => prev - 1),
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

## 5. File Structure

```
client/src/
├── pages/
│   ├── enterprise/
│   │   ├── onboarding/
│   │   │   ├── onboarding-wizard.tsx
│   │   │   ├── steps/
│   │   │   │   ├── org-details-step.tsx
│   │   │   │   ├── goal-definition-step.tsx
│   │   │   │   ├── team-structure-step.tsx
│   │   │   │   ├── user-import-step.tsx
│   │   │   │   └── final-setup-step.tsx
│   │   ├── dashboard.tsx
│   │   ├── admin/
│   │   │   ├── admin-dashboard.tsx
│   │   │   ├── user-management.tsx
│   │   │   └── system-settings.tsx
│   │   ├── goals/
│   │   │   ├── goal-management.tsx
│   │   │   ├── goal-creation.tsx
│   │   │   └── ai-breakdown.tsx
│   │   ├── projects/
│   │   │   ├── project-management.tsx
│   │   │   ├── project-details.tsx
│   │   │   └── team-assignments.tsx
│   │   ├── tasks/
│   │   │   ├── task-management.tsx
│   │   │   ├── task-board.tsx
│   │   │   └── task-details.tsx
│   │   └── analytics/
│   │       ├── org-analytics.tsx
│   │       ├── performance-dashboard.tsx
│   │       └── reports.tsx
├── components/
│   ├── enterprise/
│   │   ├── role-guard.tsx
│   │   ├── task-card.tsx
│   │   ├── project-card.tsx
│   │   ├── user-selector.tsx
│   │   ├── goal-breakdown-ai.tsx
│   │   └── analytics-charts.tsx
├── hooks/
│   ├── use-enterprise-auth.ts
│   ├── use-tasks.ts
│   ├── use-projects.ts
│   ├── use-goals.ts
│   └── use-analytics.ts
└── lib/
    ├── enterprise-api.ts
    ├── csv-parser.ts
    └── role-permissions.ts

server/
├── routes/
│   └── enterprise/
│       ├── organizations.ts
│       ├── users.ts
│       ├── goals.ts
│       ├── projects.ts
│       ├── tasks.ts
│       └── analytics.ts
├── services/
│   ├── ai-service.ts
│   ├── csv-service.ts
│   ├── analytics-service.ts
│   └── notification-service.ts
├── middleware/
│   ├── enterprise-auth.ts
│   └── role-guard.ts
└── storage/
    └── enterprise-storage.ts

shared/
└── enterprise-schema.ts
```

## 6. Security Implementation

### 6.1 Role-Based Access Control

```typescript
export const RolePermissions = {
  administrator: {
    organizations: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    goals: ['create', 'read', 'update', 'delete'],
    projects: ['create', 'read', 'update', 'delete'],
    tasks: ['create', 'read', 'update', 'delete'],
    analytics: ['read'],
    settings: ['read', 'update'],
  },
  organization_leader: {
    organizations: ['read', 'update'],
    users: ['read'],
    goals: ['create', 'read', 'update'],
    projects: ['read'],
    tasks: ['read'],
    analytics: ['read'],
  },
  project_leader: {
    projects: ['read', 'update'], // only assigned projects
    tasks: ['create', 'read', 'update'], // only within assigned projects
    users: ['read'], // only team members
    analytics: ['read'], // only project-level
  },
  team_member: {
    tasks: ['read', 'update'], // only assigned tasks
    projects: ['read'], // only assigned projects
    users: ['read'], // only profile
    analytics: ['read'], // only personal metrics
  },
};
```

### 6.2 Data Validation

```typescript
// Zod schemas for data validation
export const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  targetDate: z.string().datetime().optional(),
  organizationId: z.string().uuid(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  projectId: z.string().uuid().optional(),
  goalId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  estimatedHours: z.number().positive().optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
});
```

## 7. Testing Strategy

### 7.1 Unit Testing
- Jest for business logic testing
- React Testing Library for component testing
- Supertest for API endpoint testing

### 7.2 Integration Testing
- Database integration tests
- OpenAI API integration tests
- Role-based access control tests

### 7.3 End-to-End Testing
- Playwright for user workflow testing
- Role-specific user journey tests
- CSV import/export functionality tests

## 8. Deployment and DevOps

### 8.1 Environment Configuration
```typescript
// Environment variables required
OPENAI_API_KEY_PE=your_openai_api_key
DATABASE_URL=your_postgresql_url
SESSION_SECRET=your_session_secret
ENTERPRISE_FEATURE_FLAG=enabled
```

### 8.2 Database Migrations
```bash
# Run migrations for enterprise features
npm run db:push

# Seed initial data if needed
npm run db:seed:enterprise
```

### 8.3 Monitoring and Logging
- Application performance monitoring
- OpenAI API usage tracking
- User activity logging
- Error tracking and alerting

## 9. Performance Optimization

### 9.1 Database Optimization
- Proper indexing on frequently queried columns
- Connection pooling for database connections
- Query optimization for analytics endpoints

### 9.2 API Optimization
- Caching strategies for frequently accessed data
- Pagination for large data sets
- Rate limiting for OpenAI API calls

### 9.3 Frontend Optimization
- Code splitting for role-specific components
- Memoization for expensive calculations
- Optimistic updates for better UX

## 10. Maintenance and Support

### 10.1 Monitoring
- Real-time performance dashboards
- OpenAI API cost tracking
- User engagement metrics

### 10.2 Backup and Recovery
- Automated database backups
- Disaster recovery procedures
- Data export capabilities

### 10.3 Updates and Maintenance
- Regular security updates
- OpenAI API version management
- Feature flag management for gradual rollouts

---

**Implementation Timeline**: 6-8 weeks
**Team Requirements**: 2-3 Full-Stack Developers
**Testing Phase**: 2 weeks
**Deployment Strategy**: Feature-flagged gradual rollout