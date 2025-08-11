# PerMeaTe Enterprise Testing Scenarios

## App Access

**Current App URL**: http://localhost:5000
**Status**: Running locally - no deployment needed for testing

The app is currently running on your local development server. You can access it directly at http://localhost:5000.

## DemoCo Enterprise - Test Company

A realistic company has been seeded with complete organizational structure:

### Company Overview
- **Company**: DemoCo Enterprise
- **Industry**: Technology Services
- **Size**: 12 employees across 5 functions
- **Tenant ID**: Available in logs after seeding

---

## Testing User Credentials

### 1. Administrator (System Setup & Management)
**Email**: `admin@democo.com`
**Role**: Admin
**Name**: Alice Administrator
**Purpose**: Complete system administration, tenant settings, compliance features

**Testing Flow**:
- Initial login and dashboard overview
- Navigate to `/dashboard/settings` for tenant configuration
- Review `/dashboard/logs` for audit trail
- Test `/dashboard/settings/billing` for usage and plan management
- Explore `/dashboard/compliance` for data export/GDPR features

---

### 2. CEO/Organization Leader (Strategic Overview)
**Email**: `ceo@democo.com`  
**Role**: Organization Leader
**Name**: Bob CEO
**Purpose**: High-level analytics, goal management, strategic insights

**Testing Flow**:
- Login to see org-level dashboard
- Navigate to `/dashboard/analytics/org` for organizational insights
- Review `/dashboard/goals` to see strategic objectives
- Explore drill-down capabilities: Org → Function → Project → User
- Test analytics export functionality

---

### 3. Engineering Leader (Functional Management)
**Email**: `eng-lead@democo.com`
**Role**: Functional Leader  
**Name**: Carol Engineer
**Purpose**: Function-level analytics, team management, resource allocation

**Testing Flow**:
- Access function-specific dashboard
- Navigate to `/dashboard/analytics/function` for engineering metrics
- Review team performance and skills coverage
- Test AI proposals for resource planning
- Manage function-level settings and permissions

---

### 4. Project Manager (Project Execution)
**Email**: `pm1@democo.com`
**Role**: Project Lead
**Name**: Eve Manager  
**Purpose**: Project tracking, task management, team coordination

**Testing Flow**:
- Access project dashboard with active projects
- Navigate to `/dashboard/tracking/board` for kanban view
- Test task scoring workflow (review team member scores)
- Switch to `/dashboard/tracking/list` for table view
- Test drag-and-drop task status updates
- Review project analytics and progress tracking

---

### 5. Software Developer (Task Execution & Self-Assessment)
**Email**: `dev1@democo.com`
**Role**: Team Member
**Name**: Grace Developer
**Purpose**: Task execution, self-scoring, day-to-day workflow

**Testing Flow**:
- Login to see personal dashboard
- Navigate to `/dashboard/tasks` for assigned work
- Test self-scoring workflow on completed tasks
- Review personal analytics and feedback
- Test task comments and collaboration features

---

## Sequential Testing Scenarios

### Scenario 1: New Company Onboarding (Admin)
1. Login as `admin@democo.com`
2. Navigate to `/dashboard/onboarding/org-upload`
3. Upload the sample CSV: `docs/samples/employees-valid.csv`
4. Review validation and preview
5. Submit and verify users are created
6. Check audit logs for import activity

### Scenario 2: Strategic Planning (CEO)
1. Login as `ceo@democo.com`
2. Navigate to `/dashboard/goals`
3. Review existing strategic goals
4. Navigate to `/dashboard/analysis`
5. Create new organization analysis proposal
6. Test AI-powered goal breakdown
7. Review and approve/modify AI recommendations

### Scenario 3: Team Management (Engineering Leader)
1. Login as `eng-lead@democo.com`
2. Navigate to `/dashboard/analytics/function`
3. Review team performance metrics
4. Navigate to `/dashboard/tracking/board`
5. Review engineering projects and tasks
6. Test team member scoring and feedback

### Scenario 4: Project Execution (Project Manager)
1. Login as `pm1@democo.com`
2. Navigate to `/dashboard/tracking/board`
3. Test kanban board functionality:
   - Drag tasks between columns
   - Update task status
   - Assign team members
4. Navigate to individual tasks
5. Test task scoring workflow (review scores)
6. Test integration linking (MockProvider)

### Scenario 5: Daily Work (Developer)
1. Login as `dev1@democo.com`
2. Navigate to `/dashboard/tasks`
3. View assigned tasks
4. Open a completed task
5. Test self-scoring workflow:
   - Submit self-assessment (score 1-5)
   - Add rationale and comments
6. Navigate to `/dashboard/analytics/user`
7. Review personal performance metrics

### Scenario 6: Billing & Usage (Admin)
1. Login as `admin@democo.com`
2. Navigate to `/dashboard/settings/billing`
3. Review current usage metrics
4. Test usage sync and preview
5. Review invoice history
6. Test plan upgrade flow (mock mode)
7. Check usage events and cost breakdown

### Scenario 7: Compliance & Data Management (Admin)
1. Login as `admin@democo.com`
2. Navigate to `/dashboard/compliance`
3. Test data export functionality:
   - Export organization data
   - Export specific user data
4. Test PII redaction features
5. Review audit log browser with filters
6. Test data retention policies

---

## Authentication Method

**Current Mode**: Development with console email delivery

For testing, the system will automatically log you in without requiring email verification. Just click "Login" with the provided email addresses.

If you encounter login issues, the system supports a bootstrap token approach for initial setup.

---

## Demo Data Overview

The seeded data includes:
- **3 Strategic Goals** with success criteria
- **6 Active Projects** across different functions  
- **15+ Tasks** in various states (todo, in_progress, done)
- **AI Proposals** in different stages (proposed, review, accepted)
- **Task Scores** with self/review/override examples
- **Usage Events** for billing demonstration
- **Audit Logs** for compliance demonstration

---

## Expected Test Results

- **Dashboard Views**: Role-specific dashboards with appropriate data
- **Analytics Drill-down**: Smooth navigation from org → function → project → user
- **Task Management**: Working kanban board with drag-and-drop
- **Scoring Workflow**: Complete self/review/override cycle
- **AI Features**: Proposal creation and review workflow
- **Billing**: Usage tracking and mock payment processing
- **Compliance**: Data export and audit log functionality

The system maintains the two-tier sticky header and company footer throughout all pages, with proper navigation and branding consistency.