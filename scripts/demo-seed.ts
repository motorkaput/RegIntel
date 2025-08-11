import { prisma } from '../src/lib/db';
import { createAuditLog } from '../src/lib/audit';
import { recordAiTokens, recordActiveSeat, recordTaskEvaluated } from '../src/lib/billing/usage';
import { randomBytes } from 'crypto';

interface DemoUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'org_leader' | 'functional_leader' | 'project_lead' | 'team_member';
  function_id?: string;
}

interface DemoData {
  tenantId: string;
  users: DemoUser[];
  functions: any[];
  projects: any[];
  tasks: any[];
  goals: any[];
}

async function main() {
  console.log('🌟 Creating PerMeaTe Enterprise Demo Data...');

  try {
    // Create demo tenant
    const demoTenant = await prisma.tenant.create({
      data: {
        id: 'demo-tenant-' + Date.now(),
        name: 'DemoCo Enterprise',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    console.log(`✓ Created tenant: ${demoTenant.name} (${demoTenant.id})`);

    // Create tenant settings
    const hasRazorpayKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;
    const paymentProvider = hasRazorpayKeys ? 'razorpay' : 'mock';

    await prisma.tenantSettings.create({
      data: {
        tenant_id: demoTenant.id,
        email_from: 'noreply@democo.com',
        data_retention_days: 365,
        rate_limit_qph: 2000,
        payment_provider: paymentProvider,
        pricing_json: JSON.stringify({
          plans: [
            {
              id: 'starter',
              name: 'Starter',
              base: 0,
              per_ai_token: 0.00002,
              per_active_seat: 2,
              per_task_eval: 0.01,
              currency: 'USD'
            },
            {
              id: 'pro',
              name: 'Professional',
              base: 99,
              per_ai_token: 0.000015,
              per_active_seat: 1.5,
              per_task_eval: 0.008,
              currency: 'USD'
            }
          ]
        }),
        sso_enabled: false,
        strict_mode: false,
        backup_enabled: true,
        api_access_enabled: true,
        bootstrap_token: randomBytes(32).toString('hex'),
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    console.log(`✓ Created tenant settings with ${paymentProvider} payment provider`);

    // Create organizational functions
    const functions = await createFunctions(demoTenant.id);
    console.log(`✓ Created ${functions.length} organizational functions`);

    // Create users
    const users = await createUsers(demoTenant.id, functions);
    console.log(`✓ Created ${users.length} users across all roles`);

    // Create goals
    const goals = await createGoals(demoTenant.id, users);
    console.log(`✓ Created ${goals.length} strategic goals`);

    // Create projects
    const projects = await createProjects(demoTenant.id, users, functions);
    console.log(`✓ Created ${projects.length} projects`);

    // Create tasks
    const tasks = await createTasks(demoTenant.id, users, projects);
    console.log(`✓ Created ${tasks.length} tasks`);

    // Create proposals
    await createProposals(demoTenant.id, users, goals, projects);
    console.log(`✓ Created AI proposals for goal breakdown and task assignment`);

    // Create scores and iterations
    await createScores(demoTenant.id, users, tasks);
    console.log(`✓ Created task scores and evaluation iterations`);

    // Create usage events
    await createUsageEvents(demoTenant.id, users, tasks);
    console.log(`✓ Created billing usage events`);

    // Create audit logs
    await createAuditLogs(demoTenant.id, users);
    console.log(`✓ Created representative audit logs`);

    console.log(`\n🎉 Demo data created successfully!`);
    console.log(`📋 Tenant ID: ${demoTenant.id}`);
    console.log(`👤 Admin user: admin@democo.com`);
    console.log(`🔑 Bootstrap token configured`);
    console.log(`💳 Payment provider: ${paymentProvider}`);
    console.log(`\n🚀 Start the demo with: npm run demo:start`);

  } catch (error) {
    console.error('❌ Failed to create demo data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createFunctions(tenantId: string) {
  const functions = [
    { name: 'Engineering', description: 'Software development and technical architecture' },
    { name: 'Product', description: 'Product management and strategy' },
    { name: 'Design', description: 'User experience and visual design' },
    { name: 'Marketing', description: 'Growth and customer acquisition' },
    { name: 'Sales', description: 'Revenue generation and customer relationships' }
  ];

  const createdFunctions = [];
  for (const func of functions) {
    const created = await prisma.organizationFunction.create({
      data: {
        tenant_id: tenantId,
        name: func.name,
        description: func.description,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    createdFunctions.push(created);
  }

  return createdFunctions;
}

async function createUsers(tenantId: string, functions: any[]) {
  const userTemplates = [
    // Admin
    { 
      email: 'admin@democo.com', 
      first_name: 'Alice', 
      last_name: 'Administrator', 
      role: 'admin',
      function_id: null
    },
    // Org Leader
    { 
      email: 'ceo@democo.com', 
      first_name: 'Bob', 
      last_name: 'CEO', 
      role: 'org_leader',
      function_id: null
    },
    // Functional Leaders
    { 
      email: 'eng-lead@democo.com', 
      first_name: 'Carol', 
      last_name: 'Engineer', 
      role: 'functional_leader',
      function_id: functions.find(f => f.name === 'Engineering')?.id
    },
    { 
      email: 'product-lead@democo.com', 
      first_name: 'David', 
      last_name: 'Product', 
      role: 'functional_leader',
      function_id: functions.find(f => f.name === 'Product')?.id
    },
    // Project Leads
    { 
      email: 'pm1@democo.com', 
      first_name: 'Eve', 
      last_name: 'Manager', 
      role: 'project_lead',
      function_id: functions.find(f => f.name === 'Engineering')?.id
    },
    { 
      email: 'pm2@democo.com', 
      first_name: 'Frank', 
      last_name: 'Leader', 
      role: 'project_lead',
      function_id: functions.find(f => f.name === 'Product')?.id
    },
    // Team Members
    { 
      email: 'dev1@democo.com', 
      first_name: 'Grace', 
      last_name: 'Developer', 
      role: 'team_member',
      function_id: functions.find(f => f.name === 'Engineering')?.id
    },
    { 
      email: 'dev2@democo.com', 
      first_name: 'Henry', 
      last_name: 'Coder', 
      role: 'team_member',
      function_id: functions.find(f => f.name === 'Engineering')?.id
    },
    { 
      email: 'designer@democo.com', 
      first_name: 'Ivy', 
      last_name: 'Designer', 
      role: 'team_member',
      function_id: functions.find(f => f.name === 'Design')?.id
    },
    { 
      email: 'marketer@democo.com', 
      first_name: 'Jack', 
      last_name: 'Marketer', 
      role: 'team_member',
      function_id: functions.find(f => f.name === 'Marketing')?.id
    },
    { 
      email: 'sales1@democo.com', 
      first_name: 'Kate', 
      last_name: 'Sales', 
      role: 'team_member',
      function_id: functions.find(f => f.name === 'Sales')?.id
    },
    { 
      email: 'qa@democo.com', 
      first_name: 'Liam', 
      last_name: 'Tester', 
      role: 'team_member',
      function_id: functions.find(f => f.name === 'Engineering')?.id
    }
  ];

  const createdUsers = [];
  for (const template of userTemplates) {
    const user = await prisma.user.create({
      data: {
        tenant_id: tenantId,
        email: template.email,
        first_name: template.first_name,
        last_name: template.last_name,
        role: template.role as any,
        function_id: template.function_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Add skills for users
    const skills = getSkillsForRole(template.role, template.function_id ? functions.find(f => f.id === template.function_id)?.name : null);
    for (const skill of skills) {
      await prisma.userSkill.create({
        data: {
          tenant_id: tenantId,
          user_id: user.id,
          skill_name: skill.name,
          proficiency_level: skill.level,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }

    createdUsers.push(user);
  }

  return createdUsers;
}

function getSkillsForRole(role: string, functionName: string | null) {
  const skillSets: Record<string, any[]> = {
    'Engineering': [
      { name: 'JavaScript', level: 4 },
      { name: 'TypeScript', level: 4 },
      { name: 'React', level: 4 },
      { name: 'Node.js', level: 3 },
      { name: 'PostgreSQL', level: 3 },
      { name: 'System Design', level: 3 }
    ],
    'Product': [
      { name: 'Product Strategy', level: 4 },
      { name: 'User Research', level: 3 },
      { name: 'Analytics', level: 3 },
      { name: 'Roadmap Planning', level: 4 },
      { name: 'Stakeholder Management', level: 4 }
    ],
    'Design': [
      { name: 'UI Design', level: 4 },
      { name: 'UX Research', level: 3 },
      { name: 'Figma', level: 4 },
      { name: 'Prototyping', level: 3 },
      { name: 'Design Systems', level: 3 }
    ],
    'Marketing': [
      { name: 'Digital Marketing', level: 4 },
      { name: 'Content Strategy', level: 3 },
      { name: 'SEO', level: 3 },
      { name: 'Analytics', level: 3 },
      { name: 'Brand Management', level: 4 }
    ],
    'Sales': [
      { name: 'Sales Strategy', level: 4 },
      { name: 'CRM Management', level: 3 },
      { name: 'Negotiation', level: 4 },
      { name: 'Lead Generation', level: 3 },
      { name: 'Customer Success', level: 4 }
    ]
  };

  if (role === 'admin' || role === 'org_leader') {
    return [
      { name: 'Leadership', level: 5 },
      { name: 'Strategic Planning', level: 4 },
      { name: 'Team Management', level: 4 },
      { name: 'Business Strategy', level: 4 }
    ];
  }

  return skillSets[functionName || 'Engineering'] || skillSets['Engineering'];
}

async function createGoals(tenantId: string, users: any[]) {
  const orgLeader = users.find(u => u.role === 'org_leader');
  
  const goalTemplates = [
    {
      title: 'Increase Customer Satisfaction Score',
      description: 'Improve our customer satisfaction score from 4.2 to 4.6 by end of Q4 through enhanced product features and support.',
      success_criteria: JSON.stringify([
        'Achieve CSAT score of 4.6 or higher',
        'Reduce support ticket resolution time by 30%',
        'Implement 5 top-requested customer features',
        'Achieve 95% uptime for all services'
      ]),
      priority: 'high',
      status: 'active'
    },
    {
      title: 'Launch Mobile Application',
      description: 'Develop and launch native mobile applications for iOS and Android to expand our market reach.',
      success_criteria: JSON.stringify([
        'Complete mobile app development',
        'Achieve 10,000 downloads in first month',
        'Maintain 4+ star rating in app stores',
        'Implement core features from web platform'
      ]),
      priority: 'high',
      status: 'active'
    },
    {
      title: 'Expand to European Markets',
      description: 'Establish market presence in 3 European countries with localized product offerings.',
      success_criteria: JSON.stringify([
        'Complete GDPR compliance implementation',
        'Launch in UK, Germany, and France',
        'Acquire 500 European customers',
        'Establish local partnerships'
      ]),
      priority: 'medium',
      status: 'planning'
    }
  ];

  const createdGoals = [];
  for (const template of goalTemplates) {
    const goal = await prisma.goal.create({
      data: {
        tenant_id: tenantId,
        title: template.title,
        description: template.description,
        success_criteria: template.success_criteria,
        priority: template.priority as any,
        status: template.status as any,
        owner_id: orgLeader?.id,
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    createdGoals.push(goal);
  }

  return createdGoals;
}

async function createProjects(tenantId: string, users: any[], functions: any[]) {
  const projectTemplates = [
    {
      name: 'Customer Dashboard Redesign',
      description: 'Redesign the customer dashboard with improved UX and new analytics features',
      function_id: functions.find(f => f.name === 'Engineering')?.id,
      lead_id: users.find(u => u.role === 'project_lead' && u.function_id === functions.find(f => f.name === 'Engineering')?.id)?.id
    },
    {
      name: 'Mobile App MVP',
      description: 'Develop minimum viable product for mobile application',
      function_id: functions.find(f => f.name === 'Engineering')?.id,
      lead_id: users.find(u => u.role === 'project_lead' && u.function_id === functions.find(f => f.name === 'Engineering')?.id)?.id
    },
    {
      name: 'Customer Feedback System',
      description: 'Implement comprehensive customer feedback collection and analysis system',
      function_id: functions.find(f => f.name === 'Product')?.id,
      lead_id: users.find(u => u.role === 'project_lead' && u.function_id === functions.find(f => f.name === 'Product')?.id)?.id
    },
    {
      name: 'European Market Research',
      description: 'Conduct market research for European expansion strategy',
      function_id: functions.find(f => f.name === 'Marketing')?.id,
      lead_id: users.find(u => u.role === 'functional_leader' && u.function_id === functions.find(f => f.name === 'Marketing')?.id)?.id
    },
    {
      name: 'GDPR Compliance Implementation',
      description: 'Implement GDPR compliance features and processes',
      function_id: functions.find(f => f.name === 'Engineering')?.id,
      lead_id: users.find(u => u.role === 'project_lead' && u.function_id === functions.find(f => f.name === 'Engineering')?.id)?.id
    },
    {
      name: 'Sales Process Optimization',
      description: 'Optimize sales processes and implement new CRM workflows',
      function_id: functions.find(f => f.name === 'Sales')?.id,
      lead_id: users.find(u => u.role === 'functional_leader' && u.function_id === functions.find(f => f.name === 'Sales')?.id)?.id
    }
  ];

  const createdProjects = [];
  for (const template of projectTemplates) {
    const project = await prisma.project.create({
      data: {
        tenant_id: tenantId,
        name: template.name,
        description: template.description,
        function_id: template.function_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Add project members
    if (template.lead_id) {
      await prisma.projectMember.create({
        data: {
          tenant_id: tenantId,
          project_id: project.id,
          user_id: template.lead_id,
          role: 'lead',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }

    // Add 2-3 team members per project
    const functionUsers = users.filter(u => u.function_id === template.function_id && u.role === 'team_member');
    for (let i = 0; i < Math.min(3, functionUsers.length); i++) {
      await prisma.projectMember.create({
        data: {
          tenant_id: tenantId,
          project_id: project.id,
          user_id: functionUsers[i].id,
          role: 'member',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }

    createdProjects.push(project);
  }

  return createdProjects;
}

async function createTasks(tenantId: string, users: any[], projects: any[]) {
  const taskTemplates = [
    // Customer Dashboard Redesign tasks
    {
      title: 'Design new dashboard wireframes',
      description: 'Create wireframes for the redesigned customer dashboard',
      project_index: 0,
      status: 'done',
      priority: 'high'
    },
    {
      title: 'Implement dashboard API endpoints',
      description: 'Build backend API endpoints for dashboard data',
      project_index: 0,
      status: 'done',
      priority: 'high'
    },
    {
      title: 'Build responsive dashboard components',
      description: 'Develop React components for the new dashboard',
      project_index: 0,
      status: 'in_progress',
      priority: 'high'
    },
    {
      title: 'Implement real-time data updates',
      description: 'Add WebSocket support for real-time dashboard updates',
      project_index: 0,
      status: 'todo',
      priority: 'medium'
    },
    {
      title: 'Dashboard performance optimization',
      description: 'Optimize dashboard loading times and responsiveness',
      project_index: 0,
      status: 'todo',
      priority: 'medium'
    },

    // Mobile App MVP tasks
    {
      title: 'Mobile app architecture design',
      description: 'Design the overall architecture for the mobile application',
      project_index: 1,
      status: 'done',
      priority: 'high'
    },
    {
      title: 'Implement user authentication',
      description: 'Build authentication flow for mobile app',
      project_index: 1,
      status: 'in_progress',
      priority: 'high'
    },
    {
      title: 'Create core navigation components',
      description: 'Develop main navigation and routing for mobile app',
      project_index: 1,
      status: 'todo',
      priority: 'high'
    },
    {
      title: 'Implement offline data sync',
      description: 'Add offline capability with data synchronization',
      project_index: 1,
      status: 'todo',
      priority: 'medium'
    },

    // Customer Feedback System tasks
    {
      title: 'Design feedback collection UI',
      description: 'Create user interface for feedback collection',
      project_index: 2,
      status: 'done',
      priority: 'high'
    },
    {
      title: 'Build feedback analytics dashboard',
      description: 'Develop analytics dashboard for customer feedback',
      project_index: 2,
      status: 'in_progress',
      priority: 'medium'
    },
    {
      title: 'Implement feedback categorization',
      description: 'Build automatic categorization system for feedback',
      project_index: 2,
      status: 'todo',
      priority: 'medium'
    },

    // Additional tasks for other projects
    {
      title: 'Market research survey design',
      description: 'Design comprehensive market research survey for European markets',
      project_index: 3,
      status: 'done',
      priority: 'high'
    },
    {
      title: 'GDPR audit and gap analysis',
      description: 'Conduct comprehensive GDPR compliance audit',
      project_index: 4,
      status: 'in_progress',
      priority: 'high'
    },
    {
      title: 'Sales CRM workflow optimization',
      description: 'Optimize current CRM workflows for better efficiency',
      project_index: 5,
      status: 'todo',
      priority: 'medium'
    }
  ];

  const createdTasks = [];
  for (const template of taskTemplates) {
    const project = projects[template.project_index];
    
    // Get project members for assignment
    const projectMembers = await prisma.projectMember.findMany({
      where: { project_id: project.id },
      include: { user: true }
    });

    const assignee = projectMembers[Math.floor(Math.random() * projectMembers.length)];

    const task = await prisma.task.create({
      data: {
        tenant_id: tenantId,
        project_id: project.id,
        title: template.title,
        description: template.description,
        status: template.status as any,
        priority: template.priority as any,
        due_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Random due date within 30 days
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Assign task to a project member
    if (assignee) {
      await prisma.taskAssignee.create({
        data: {
          tenant_id: tenantId,
          task_id: task.id,
          user_id: assignee.user_id,
          assigned_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }

    createdTasks.push(task);
  }

  return createdTasks;
}

async function createProposals(tenantId: string, users: any[], goals: any[], projects: any[]) {
  const admin = users.find(u => u.role === 'admin');
  const orgLeader = users.find(u => u.role === 'org_leader');

  // Create organization analysis proposal
  await prisma.proposal.create({
    data: {
      tenant_id: tenantId,
      type: 'organization_analysis',
      title: 'Q4 Organizational Analysis',
      description: 'Comprehensive analysis of organizational structure and capacity for Q4 goals',
      status: 'accepted',
      created_by: admin?.id || users[0].id,
      prompt_template: JSON.stringify({
        version: '1.0',
        template: 'Analyze organizational capacity for goals: {goals}',
        variables: { goals: goals.map(g => g.title) }
      }),
      ai_response: JSON.stringify({
        analysis: 'Current organizational structure shows strong engineering capacity but needs additional product management resources for mobile initiative.',
        recommendations: [
          'Hire 2 additional mobile developers',
          'Establish dedicated product team for European expansion',
          'Implement cross-functional collaboration processes'
        ],
        risk_assessment: 'Medium risk due to resource constraints in Q4'
      }),
      human_feedback: 'Analysis approved. Proceeding with recommended hiring plan.',
      metadata: { ai_tokens_used: 1250, confidence_score: 0.87 },
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    }
  });

  // Create goal breakdown proposal
  const goal = goals[0]; // Customer Satisfaction goal
  await prisma.proposal.create({
    data: {
      tenant_id: tenantId,
      type: 'goal_breakdown',
      title: `Goal Breakdown: ${goal.title}`,
      description: 'AI-generated breakdown of customer satisfaction improvement goal',
      status: 'proposed',
      created_by: orgLeader?.id || users[1].id,
      prompt_template: JSON.stringify({
        version: '1.0',
        template: 'Break down goal into actionable projects: {goal_title}',
        variables: { goal_title: goal.title }
      }),
      ai_response: JSON.stringify({
        breakdown: [
          {
            project: 'Customer Dashboard Redesign',
            tasks: ['Design new dashboard wireframes', 'Implement dashboard API endpoints'],
            timeline: '8 weeks',
            resources: '2 developers, 1 designer'
          },
          {
            project: 'Customer Feedback System',
            tasks: ['Design feedback collection UI', 'Build feedback analytics dashboard'],
            timeline: '6 weeks',
            resources: '1 developer, 1 product manager'
          }
        ],
        success_metrics: ['CSAT score improvement', 'Feature adoption rate', 'Support ticket reduction']
      }),
      metadata: { ai_tokens_used: 980, confidence_score: 0.92 },
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  });

  // Create task assignment proposal
  const project = projects[0]; // Customer Dashboard Redesign
  await prisma.proposal.create({
    data: {
      tenant_id: tenantId,
      type: 'assignment_recommendation',
      title: `Task Assignments: ${project.name}`,
      description: 'AI-recommended task assignments based on team skills and capacity',
      status: 'review',
      created_by: admin?.id || users[0].id,
      prompt_template: JSON.stringify({
        version: '1.0',
        template: 'Recommend task assignments for project: {project_name}',
        variables: { project_name: project.name }
      }),
      ai_response: JSON.stringify({
        assignments: [
          {
            task: 'Design new dashboard wireframes',
            recommended_assignee: 'Ivy Designer',
            reasoning: 'Strong UI design skills and experience with dashboard interfaces',
            confidence: 0.95
          },
          {
            task: 'Implement dashboard API endpoints',
            recommended_assignee: 'Grace Developer',
            reasoning: 'Expert in Node.js and API development with available capacity',
            confidence: 0.88
          }
        ]
      }),
      metadata: { ai_tokens_used: 750, confidence_score: 0.85 },
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('✓ Created 3 AI proposals with different statuses');
}

async function createScores(tenantId: string, users: any[], tasks: any[]) {
  const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'in_progress');
  
  for (const task of completedTasks) {
    // Get task assignee
    const assignee = await prisma.taskAssignee.findFirst({
      where: { task_id: task.id }
    });

    if (!assignee) continue;

    // Create task score with different scoring scenarios
    const selfScore = Math.floor(Math.random() * 2) + 3; // 3-4 (self scores tend to be moderate)
    const reviewScore = Math.floor(Math.random() * 3) + 3; // 3-5 (reviews can vary more)
    const hasOverride = Math.random() < 0.2; // 20% chance of override
    const overrideScore = hasOverride ? Math.floor(Math.random() * 2) + 4 : null; // 4-5 (overrides tend to be positive)

    const taskScore = await prisma.taskScore.create({
      data: {
        tenant_id: tenantId,
        task_id: task.id,
        self_score: selfScore,
        self_rationale: getSampleRationale('self', selfScore),
        self_scored_by: assignee.user_id,
        self_scored_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        review_score: reviewScore,
        review_rationale: getSampleRationale('review', reviewScore),
        reviewed_by: users.find(u => u.role === 'project_lead')?.id || users[0].id,
        reviewed_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
        override_score: overrideScore,
        override_rationale: overrideScore ? getSampleRationale('override', overrideScore) : null,
        overridden_by: hasOverride ? (users.find(u => u.role === 'functional_leader')?.id || users[0].id) : null,
        overridden_at: hasOverride ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000) : null,
        final_score: overrideScore || reviewScore,
        created_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000)
      }
    });

    // Create score iterations to show the evaluation timeline
    const iterations = [
      { type: 'self' as const, score: selfScore, actor_id: assignee.user_id },
      { type: 'review' as const, score: reviewScore, actor_id: users.find(u => u.role === 'project_lead')?.id || users[0].id }
    ];

    if (hasOverride && overrideScore) {
      iterations.push({ 
        type: 'override' as const, 
        score: overrideScore, 
        actor_id: users.find(u => u.role === 'functional_leader')?.id || users[0].id 
      });
    }

    for (let i = 0; i < iterations.length; i++) {
      const iteration = iterations[i];
      await prisma.scoreIteration.create({
        data: {
          tenant_id: tenantId,
          task_score_id: taskScore.id,
          iteration_number: i + 1,
          score_type: iteration.type,
          score_value: iteration.score,
          actor_id: iteration.actor_id,
          created_at: new Date(Date.now() - (iterations.length - i) * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - (iterations.length - i) * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  console.log(`✓ Created scores for ${completedTasks.length} completed tasks`);
}

function getSampleRationale(type: 'self' | 'review' | 'override', score: number): string {
  const rationales = {
    self: {
      3: "Completed the task as required, though it took longer than expected due to some technical challenges.",
      4: "Successfully delivered the feature with good quality. Happy with the outcome and implementation approach.",
      5: "Exceptional work completed ahead of schedule with additional optimizations and comprehensive testing."
    },
    review: {
      3: "Work meets requirements but could benefit from better documentation and test coverage.",
      4: "Good quality delivery with solid implementation. Minor suggestions for future improvements.",
      5: "Outstanding work that exceeds expectations. Excellent code quality and attention to detail."
    },
    override: {
      4: "Upgrading score due to exceptional problem-solving during implementation that wasn't initially apparent.",
      5: "This work had significant positive impact beyond the original scope and demonstrates exceptional quality."
    }
  };

  return rationales[type][score as keyof typeof rationales[typeof type]] || "Good work on this task.";
}

async function createUsageEvents(tenantId: string, users: any[], tasks: any[]) {
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  // Create AI token usage events
  for (let i = 0; i < 50; i++) {
    const tokens = Math.floor(Math.random() * 5000) + 1000; // 1000-6000 tokens
    const eventDate = new Date(startDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    await recordAiTokens({
      tenantId,
      amount: tokens,
      meta: {
        model: 'gpt-4o',
        operation: ['organization_analysis', 'goal_breakdown', 'assignment_recommendation'][Math.floor(Math.random() * 3)],
        prompt_tokens: Math.floor(tokens * 0.6),
        completion_tokens: Math.floor(tokens * 0.4)
      }
    });
  }

  // Create active seat events (one per user per day for the last 30 days)
  for (const user of users) {
    for (let day = 0; day < 30; day++) {
      const shouldBeActive = Math.random() < 0.8; // 80% chance user is active each day
      if (shouldBeActive) {
        await recordActiveSeat({
          tenantId,
          userId: user.id
        });
      }
    }
  }

  // Create task evaluation events
  const scoredTasks = tasks.filter(t => t.status === 'done' || t.status === 'in_progress');
  for (const task of scoredTasks) {
    // Self evaluation
    await recordTaskEvaluated({
      tenantId,
      taskId: task.id,
      evaluationType: 'self'
    });

    // Review evaluation
    await recordTaskEvaluated({
      tenantId,
      taskId: task.id,
      evaluationType: 'review'
    });

    // 20% chance of override evaluation
    if (Math.random() < 0.2) {
      await recordTaskEvaluated({
        tenantId,
        taskId: task.id,
        evaluationType: 'override'
      });
    }
  }

  console.log('✓ Created comprehensive usage events for billing');
}

async function createAuditLogs(tenantId: string, users: any[]) {
  const admin = users.find(u => u.role === 'admin');
  const orgLeader = users.find(u => u.role === 'org_leader');

  // Create representative audit logs
  const auditEvents = [
    {
      user_id: admin?.id || users[0].id,
      action: 'CREATE',
      resource_type: 'tenant',
      resource_id: tenantId,
      new_values: { name: 'DemoCo Enterprise' },
      metadata: { tenant_creation: true }
    },
    {
      user_id: admin?.id || users[0].id,
      action: 'UPDATE',
      resource_type: 'tenant_settings',
      resource_id: 'settings-1',
      old_values: { rate_limit_qph: 1000 },
      new_values: { rate_limit_qph: 2000 },
      metadata: { settings_update: true }
    },
    {
      user_id: orgLeader?.id || users[1].id,
      action: 'CREATE',
      resource_type: 'goal',
      resource_id: 'goal-1',
      new_values: { title: 'Increase Customer Satisfaction Score' },
      metadata: { goal_creation: true }
    },
    {
      user_id: admin?.id || users[0].id,
      action: 'EXPORT',
      resource_type: 'tenant_data',
      resource_id: 'export-1',
      new_values: { scope: 'org', format: 'csv' },
      metadata: { compliance_export: true, gdpr_request: true }
    },
    {
      user_id: users[2]?.id || users[0].id,
      action: 'UPDATE',
      resource_type: 'task_score',
      resource_id: 'score-1',
      old_values: { final_score: null },
      new_values: { final_score: 4 },
      metadata: { scoring_update: true }
    }
  ];

  for (const event of auditEvents) {
    await createAuditLog(prisma, {
      tenant_id: tenantId,
      user_id: event.user_id,
      action: event.action as any,
      resource_type: event.resource_type,
      resource_id: event.resource_id,
      old_values: event.old_values || null,
      new_values: event.new_values,
      metadata: event.metadata
    });
  }

  console.log('✓ Created representative audit logs');
}

// Run the demo seed
main().catch(console.error);