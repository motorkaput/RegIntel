# Quick Test Guide - PerMeaTe Enterprise

## 🚀 App Access
**URL**: http://localhost:5000
**Status**: ✅ Running and ready for testing

## 🏢 Test Company: DemoCo Enterprise

### Key Test Credentials (Sequential Testing Order)

#### 1. System Administrator - Alice Administrator
- **Email**: `admin@democo.com`
- **Access**: http://localhost:5000/auth/login
- **Test Areas**: 
  - Settings & Configuration: `/dashboard/settings`
  - User Management: `/dashboard/users` 
  - Billing Portal: `/dashboard/settings/billing`
  - Audit Logs: `/dashboard/logs`

#### 2. Organization Leader - Bob CEO  
- **Email**: `ceo@democo.com`
- **Access**: http://localhost:5000/auth/login
- **Test Areas**:
  - Strategic Dashboard: `/dashboard/analytics/org`
  - Goal Management: `/dashboard/goals`
  - AI Analysis: `/dashboard/analysis`

#### 3. Engineering Leader - Carol Engineer
- **Email**: `eng-lead@democo.com` 
- **Access**: http://localhost:5000/auth/login
- **Test Areas**:
  - Function Analytics: `/dashboard/analytics/function`
  - Team Performance: `/dashboard/team`
  - Resource Planning: `/dashboard/resources`

#### 4. Project Manager - Eve Manager
- **Email**: `pm1@democo.com`
- **Access**: http://localhost:5000/auth/login  
- **Test Areas**:
  - Kanban Board: `/dashboard/tracking/board`
  - Task Management: `/dashboard/tasks`
  - Project Analytics: `/dashboard/analytics/project`

#### 5. Developer - Grace Developer
- **Email**: `dev1@democo.com`
- **Access**: http://localhost:5000/auth/login
- **Test Areas**:
  - Personal Dashboard: `/dashboard/user`
  - Task Scoring: `/dashboard/tasks`
  - Personal Analytics: `/dashboard/analytics/user`

## 🎯 Quick Test Scenarios

### Scenario A: Admin Setup (5 minutes)
1. Login as `admin@democo.com`
2. Visit `/dashboard/settings/billing` 
3. Check usage metrics and billing status
4. Visit `/dashboard/logs` to see system activity

### Scenario B: Strategic Overview (5 minutes)  
1. Login as `ceo@democo.com`
2. Visit `/dashboard/analytics/org`
3. Test drill-down: Click on Engineering function
4. Navigate through: Org → Function → Project → User

### Scenario C: Task Management (5 minutes)
1. Login as `pm1@democo.com` 
2. Visit `/dashboard/tracking/board`
3. Try dragging tasks between columns
4. Click on a task to view details
5. Test task scoring workflow

### Scenario D: Developer Experience (5 minutes)
1. Login as `dev1@democo.com`
2. Visit `/dashboard/tasks` 
3. Open a task and submit self-score
4. Visit `/dashboard/analytics/user` for personal metrics

## 🔧 Authentication Notes

**Login Method**: Development mode - simplified authentication
- Just enter the email address and click "Login"
- No password required in development mode
- Magic links work via console (check logs if needed)

## 📊 Expected Features to Test

### ✅ Two-Tier Navigation
- Company header (top tier)
- App navigation (second tier)
- Consistent across all pages

### ✅ Role-Based Dashboards
- Different views for each user role
- Appropriate data access controls
- Role-specific navigation options

### ✅ Analytics Drill-Down
- Org → Function → Project → User navigation
- Breadcrumb navigation
- Data filtering and export

### ✅ Task Management
- Kanban board with drag-and-drop
- Task scoring workflow (self/review/override)
- Status updates and progress tracking

### ✅ AI Features
- Proposal generation and review
- Organization analysis
- Assignment recommendations

### ✅ Billing & Usage
- Usage metrics and cost preview  
- Mock payment processing
- Invoice generation and history

## 🚨 Known Limitations

- Demo mode with mock data
- Email delivery via console logs
- Payment processing in mock mode
- Some advanced features may be placeholder implementations

## 📞 Support

If you encounter any issues:
1. Check console logs in browser developer tools
2. Check server logs in the terminal
3. Refresh the page and try again
4. Use different user roles to test access permissions

The system is designed to provide a complete enterprise workflow simulation with realistic data and interactions.