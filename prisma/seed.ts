import { PrismaClient } from '@prisma/client';
import { UserRole, GoalStatus, ProjectStatus, TaskStatus, Priority, BillingProvider, SubscriptionStatus, ScoreType, AssignmentRole, UsageKind } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PerMeaTe Enterprise database...');

  // Create demo tenants
  const acmeCorp = await prisma.tenant.create({
    data: {
      name: 'Acme Corp',
      domain: 'acme',
      subscription_tier: 'enterprise',
    },
  });

  const startupXYZ = await prisma.tenant.create({
    data: {
      name: 'StartupXYZ',
      domain: 'startupxyz',
      subscription_tier: 'professional',
    },
  });

  console.log('✅ Created tenants');

  // Create tenant settings
  await prisma.tenantSettings.create({
    data: {
      tenant_id: acmeCorp.id,
      payment_provider: BillingProvider.razorpay,
      razorpay_key_id: 'rzp_test_acme123',
      email_from: 'noreply@acme.local',
      data_retention_days: 365,
      rate_limit_qph: 1000,
    },
  });

  await prisma.tenantSettings.create({
    data: {
      tenant_id: startupXYZ.id,
      payment_provider: BillingProvider.razorpay,
      razorpay_key_id: 'rzp_test_startup456',
      email_from: 'noreply@startupxyz.local',
      data_retention_days: 180,
      rate_limit_qph: 500,
    },
  });

  // Create billing subscriptions
  await prisma.billingSubscription.create({
    data: {
      tenant_id: acmeCorp.id,
      provider: BillingProvider.razorpay,
      external_id: 'sub_acme_enterprise_001',
      plan_id: 'enterprise_monthly',
      status: SubscriptionStatus.active,
      current_period_start: new Date('2024-01-01'),
      current_period_end: new Date('2024-02-01'),
    },
  });

  await prisma.billingSubscription.create({
    data: {
      tenant_id: startupXYZ.id,
      provider: BillingProvider.razorpay,
      external_id: 'sub_startup_pro_001',
      plan_id: 'professional_monthly',
      status: SubscriptionStatus.active,
      current_period_start: new Date('2024-01-01'),
      current_period_end: new Date('2024-02-01'),
    },
  });

  console.log('✅ Created tenant settings and subscriptions');

  // Create users for Acme Corp
  const acmeUsers = await Promise.all([
    // Admin
    prisma.user.create({
      data: {
        tenant_id: acmeCorp.id,
        email: 'sarah.admin@acme.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.admin,
        first_name: 'Sarah',
        last_name: 'Johnson',
        email_verified: true,
      },
    }),
    // Org Leader
    prisma.user.create({
      data: {
        tenant_id: acmeCorp.id,
        email: 'michael.ceo@acme.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.org_leader,
        first_name: 'Michael',
        last_name: 'Chen',
        email_verified: true,
      },
    }),
    // Functional Leader
    prisma.user.create({
      data: {
        tenant_id: acmeCorp.id,
        email: 'lisa.engineering@acme.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.functional_leader,
        first_name: 'Lisa',
        last_name: 'Rodriguez',
        email_verified: true,
      },
    }),
    // Project Leads
    prisma.user.create({
      data: {
        tenant_id: acmeCorp.id,
        email: 'david.pm@acme.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.project_lead,
        first_name: 'David',
        last_name: 'Kumar',
        email_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        tenant_id: acmeCorp.id,
        email: 'jennifer.lead@acme.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.project_lead,
        first_name: 'Jennifer',
        last_name: 'Williams',
        email_verified: true,
      },
    }),
    // Team Members
    prisma.user.create({
      data: {
        tenant_id: acmeCorp.id,
        email: 'alex.dev@acme.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.team_member,
        first_name: 'Alex',
        last_name: 'Thompson',
        email_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        tenant_id: acmeCorp.id,
        email: 'maria.designer@acme.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.team_member,
        first_name: 'Maria',
        last_name: 'Garcia',
        email_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        tenant_id: acmeCorp.id,
        email: 'james.qa@acme.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.team_member,
        first_name: 'James',
        last_name: 'Lee',
        email_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        tenant_id: acmeCorp.id,
        email: 'emma.backend@acme.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.team_member,
        first_name: 'Emma',
        last_name: 'Davis',
        email_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        tenant_id: acmeCorp.id,
        email: 'ryan.frontend@acme.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.team_member,
        first_name: 'Ryan',
        last_name: 'Miller',
        email_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        tenant_id: acmeCorp.id,
        email: 'sophia.ops@acme.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.team_member,
        first_name: 'Sophia',
        last_name: 'Anderson',
        email_verified: true,
      },
    }),
  ]);

  // Create users for StartupXYZ
  const startupUsers = await Promise.all([
    // Admin
    prisma.user.create({
      data: {
        tenant_id: startupXYZ.id,
        email: 'admin@startupxyz.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.admin,
        first_name: 'Rachel',
        last_name: 'Green',
        email_verified: true,
      },
    }),
    // Org Leader
    prisma.user.create({
      data: {
        tenant_id: startupXYZ.id,
        email: 'founder@startupxyz.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.org_leader,
        first_name: 'Tom',
        last_name: 'Wilson',
        email_verified: true,
      },
    }),
    // Functional Leader
    prisma.user.create({
      data: {
        tenant_id: startupXYZ.id,
        email: 'tech.lead@startupxyz.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.functional_leader,
        first_name: 'Anna',
        last_name: 'Taylor',
        email_verified: true,
      },
    }),
    // Project Leads
    prisma.user.create({
      data: {
        tenant_id: startupXYZ.id,
        email: 'product.manager@startupxyz.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.project_lead,
        first_name: 'Chris',
        last_name: 'Brown',
        email_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        tenant_id: startupXYZ.id,
        email: 'scrum.master@startupxyz.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.project_lead,
        first_name: 'Nicole',
        last_name: 'White',
        email_verified: true,
      },
    }),
    // Team Members
    prisma.user.create({
      data: {
        tenant_id: startupXYZ.id,
        email: 'dev1@startupxyz.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.team_member,
        first_name: 'Kevin',
        last_name: 'Jones',
        email_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        tenant_id: startupXYZ.id,
        email: 'dev2@startupxyz.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.team_member,
        first_name: 'Ashley',
        last_name: 'Martin',
        email_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        tenant_id: startupXYZ.id,
        email: 'ux.designer@startupxyz.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.team_member,
        first_name: 'Brandon',
        last_name: 'Clark',
        email_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        tenant_id: startupXYZ.id,
        email: 'devops@startupxyz.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.team_member,
        first_name: 'Jessica',
        last_name: 'Lewis',
        email_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        tenant_id: startupXYZ.id,
        email: 'marketing@startupxyz.local',
        password_hash: '$2b$10$example.hash.for.password123',
        role: UserRole.team_member,
        first_name: 'Daniel',
        last_name: 'Moore',
        email_verified: true,
      },
    }),
  ]);

  console.log('✅ Created users for both tenants');

  // Create skills
  const acmeSkills = await Promise.all([
    prisma.skill.create({ data: { tenant_id: acmeCorp.id, name: 'JavaScript' } }),
    prisma.skill.create({ data: { tenant_id: acmeCorp.id, name: 'TypeScript' } }),
    prisma.skill.create({ data: { tenant_id: acmeCorp.id, name: 'React' } }),
    prisma.skill.create({ data: { tenant_id: acmeCorp.id, name: 'Node.js' } }),
    prisma.skill.create({ data: { tenant_id: acmeCorp.id, name: 'PostgreSQL' } }),
    prisma.skill.create({ data: { tenant_id: acmeCorp.id, name: 'AWS' } }),
    prisma.skill.create({ data: { tenant_id: acmeCorp.id, name: 'Docker' } }),
    prisma.skill.create({ data: { tenant_id: acmeCorp.id, name: 'UI/UX Design' } }),
  ]);

  const startupSkills = await Promise.all([
    prisma.skill.create({ data: { tenant_id: startupXYZ.id, name: 'Python' } }),
    prisma.skill.create({ data: { tenant_id: startupXYZ.id, name: 'Django' } }),
    prisma.skill.create({ data: { tenant_id: startupXYZ.id, name: 'React' } }),
    prisma.skill.create({ data: { tenant_id: startupXYZ.id, name: 'MongoDB' } }),
    prisma.skill.create({ data: { tenant_id: startupXYZ.id, name: 'GCP' } }),
    prisma.skill.create({ data: { tenant_id: startupXYZ.id, name: 'Kubernetes' } }),
    prisma.skill.create({ data: { tenant_id: startupXYZ.id, name: 'Machine Learning' } }),
    prisma.skill.create({ data: { tenant_id: startupXYZ.id, name: 'Data Analysis' } }),
  ]);

  // Create user skills (sample assignments)
  await Promise.all([
    // Acme Corp user skills
    prisma.userSkill.create({ data: { tenant_id: acmeCorp.id, user_id: acmeUsers[5].id, skill_id: acmeSkills[0].id, level: 5 } }), // Alex - JavaScript
    prisma.userSkill.create({ data: { tenant_id: acmeCorp.id, user_id: acmeUsers[5].id, skill_id: acmeSkills[2].id, level: 4 } }), // Alex - React
    prisma.userSkill.create({ data: { tenant_id: acmeCorp.id, user_id: acmeUsers[6].id, skill_id: acmeSkills[7].id, level: 5 } }), // Maria - UI/UX
    prisma.userSkill.create({ data: { tenant_id: acmeCorp.id, user_id: acmeUsers[8].id, skill_id: acmeSkills[3].id, level: 4 } }), // Emma - Node.js
    prisma.userSkill.create({ data: { tenant_id: acmeCorp.id, user_id: acmeUsers[9].id, skill_id: acmeSkills[2].id, level: 4 } }), // Ryan - React
    prisma.userSkill.create({ data: { tenant_id: acmeCorp.id, user_id: acmeUsers[10].id, skill_id: acmeSkills[5].id, level: 5 } }), // Sophia - AWS
    
    // StartupXYZ user skills
    prisma.userSkill.create({ data: { tenant_id: startupXYZ.id, user_id: startupUsers[5].id, skill_id: startupSkills[0].id, level: 4 } }), // Kevin - Python
    prisma.userSkill.create({ data: { tenant_id: startupXYZ.id, user_id: startupUsers[6].id, skill_id: startupSkills[1].id, level: 3 } }), // Ashley - Django
    prisma.userSkill.create({ data: { tenant_id: startupXYZ.id, user_id: startupUsers[7].id, skill_id: startupSkills[2].id, level: 5 } }), // Brandon - React
    prisma.userSkill.create({ data: { tenant_id: startupXYZ.id, user_id: startupUsers[8].id, skill_id: startupSkills[5].id, level: 4 } }), // Jessica - Kubernetes
  ]);

  console.log('✅ Created skills and user skills');

  // Create goals for Acme Corp
  const acmeGoals = await Promise.all([
    prisma.goal.create({
      data: {
        tenant_id: acmeCorp.id,
        title: 'Launch Enterprise Platform v2.0',
        description: 'Complete redesign and launch of our flagship enterprise platform with enhanced security and scalability features.',
        owner_id: acmeUsers[1].id, // Michael (Org Leader)
        status: GoalStatus.active,
        priority: Priority.critical,
        target_date: new Date('2024-06-30'),
        ai_breakdown: {
          projects: [
            {
              title: 'Platform Architecture Redesign',
              tasks: [
                { title: 'Database schema optimization', estimated_hours: 40 },
                { title: 'Microservices implementation', estimated_hours: 80 },
                { title: 'API gateway setup', estimated_hours: 32 },
              ]
            },
            {
              title: 'Security Enhancement',
              tasks: [
                { title: 'Multi-factor authentication', estimated_hours: 24 },
                { title: 'Role-based access control', estimated_hours: 36 },
                { title: 'Security audit', estimated_hours: 16 },
              ]
            }
          ]
        },
      },
    }),
    prisma.goal.create({
      data: {
        tenant_id: acmeCorp.id,
        title: 'Improve Development Workflow Efficiency',
        description: 'Streamline development processes and reduce deployment time by 50%.',
        owner_id: acmeUsers[2].id, // Lisa (Functional Leader)
        status: GoalStatus.active,
        priority: Priority.high,
        target_date: new Date('2024-04-30'),
      },
    }),
    prisma.goal.create({
      data: {
        tenant_id: acmeCorp.id,
        title: 'Team Skills Development Program',
        description: 'Enhance team technical skills through structured learning and certification programs.',
        owner_id: acmeUsers[2].id, // Lisa (Functional Leader)
        status: GoalStatus.draft,
        priority: Priority.medium,
        target_date: new Date('2024-08-31'),
      },
    }),
  ]);

  // Create goals for StartupXYZ
  const startupGoals = await Promise.all([
    prisma.goal.create({
      data: {
        tenant_id: startupXYZ.id,
        title: 'Product Market Fit Achievement',
        description: 'Achieve product-market fit through rapid iteration and customer feedback integration.',
        owner_id: startupUsers[1].id, // Tom (Org Leader)
        status: GoalStatus.active,
        priority: Priority.critical,
        target_date: new Date('2024-05-15'),
      },
    }),
    prisma.goal.create({
      data: {
        tenant_id: startupXYZ.id,
        title: 'Scale Infrastructure for Growth',
        description: 'Build scalable infrastructure to handle 10x user growth.',
        owner_id: startupUsers[2].id, // Anna (Functional Leader)
        status: GoalStatus.active,
        priority: Priority.high,
        target_date: new Date('2024-07-31'),
      },
    }),
    prisma.goal.create({
      data: {
        tenant_id: startupXYZ.id,
        title: 'Build Data-Driven Culture',
        description: 'Implement analytics and create data-driven decision making processes.',
        owner_id: startupUsers[2].id, // Anna (Functional Leader)
        status: GoalStatus.draft,
        priority: Priority.medium,
        target_date: new Date('2024-09-30'),
      },
    }),
  ]);

  console.log('✅ Created goals');

  // Create projects for Acme Corp goals
  const acmeProjects = await Promise.all([
    // Projects for Goal 1
    prisma.project.create({
      data: {
        tenant_id: acmeCorp.id,
        goal_id: acmeGoals[0].id,
        title: 'Platform Architecture Redesign',
        description: 'Complete architectural overhaul with microservices approach.',
        project_lead_id: acmeUsers[3].id, // David (Project Lead)
        status: ProjectStatus.active,
        priority: Priority.critical,
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-05-15'),
      },
    }),
    prisma.project.create({
      data: {
        tenant_id: acmeCorp.id,
        goal_id: acmeGoals[0].id,
        title: 'Security Enhancement Suite',
        description: 'Implement comprehensive security features and compliance measures.',
        project_lead_id: acmeUsers[4].id, // Jennifer (Project Lead)
        status: ProjectStatus.active,
        priority: Priority.high,
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-06-01'),
      },
    }),
    // Projects for Goal 2
    prisma.project.create({
      data: {
        tenant_id: acmeCorp.id,
        goal_id: acmeGoals[1].id,
        title: 'CI/CD Pipeline Optimization',
        description: 'Streamline deployment processes with advanced automation.',
        project_lead_id: acmeUsers[3].id, // David (Project Lead)
        status: ProjectStatus.active,
        priority: Priority.high,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-04-15'),
      },
    }),
    prisma.project.create({
      data: {
        tenant_id: acmeCorp.id,
        goal_id: acmeGoals[1].id,
        title: 'Development Tools Integration',
        description: 'Integrate and optimize development tools for better productivity.',
        project_lead_id: acmeUsers[4].id, // Jennifer (Project Lead)
        status: ProjectStatus.planning,
        priority: Priority.medium,
        start_date: new Date('2024-02-15'),
        end_date: new Date('2024-04-30'),
      },
    }),
  ]);

  // Create projects for StartupXYZ goals
  const startupProjects = await Promise.all([
    // Projects for Goal 1
    prisma.project.create({
      data: {
        tenant_id: startupXYZ.id,
        goal_id: startupGoals[0].id,
        title: 'Customer Feedback Integration',
        description: 'Build comprehensive customer feedback collection and analysis system.',
        project_lead_id: startupUsers[3].id, // Chris (Project Lead)
        status: ProjectStatus.active,
        priority: Priority.critical,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-04-30'),
      },
    }),
    prisma.project.create({
      data: {
        tenant_id: startupXYZ.id,
        goal_id: startupGoals[0].id,
        title: 'Product Iteration Framework',
        description: 'Implement rapid prototyping and iteration processes.',
        project_lead_id: startupUsers[4].id, // Nicole (Project Lead)
        status: ProjectStatus.active,
        priority: Priority.high,
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-05-01'),
      },
    }),
    // Projects for Goal 2
    prisma.project.create({
      data: {
        tenant_id: startupXYZ.id,
        goal_id: startupGoals[1].id,
        title: 'Cloud Infrastructure Setup',
        description: 'Design and implement scalable cloud infrastructure.',
        project_lead_id: startupUsers[3].id, // Chris (Project Lead)
        status: ProjectStatus.planning,
        priority: Priority.high,
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-07-15'),
      },
    }),
    prisma.project.create({
      data: {
        tenant_id: startupXYZ.id,
        goal_id: startupGoals[1].id,
        title: 'Performance Monitoring System',
        description: 'Implement comprehensive performance monitoring and alerting.',
        project_lead_id: startupUsers[4].id, // Nicole (Project Lead)
        status: ProjectStatus.planning,
        priority: Priority.medium,
        start_date: new Date('2024-04-01'),
        end_date: new Date('2024-07-31'),
      },
    }),
  ]);

  console.log('✅ Created projects');

  // Create tasks for Acme Corp projects
  const acmeTasks: any[] = [];
  for (let i = 0; i < acmeProjects.length; i++) {
    const project = acmeProjects[i];
    const taskCount = Math.floor(Math.random() * 4) + 5; // 5-8 tasks per project
    
    for (let j = 0; j < taskCount; j++) {
      const task = await prisma.task.create({
        data: {
          tenant_id: acmeCorp.id,
          project_id: project.id,
          title: `Task ${j + 1} for ${project.title}`,
          description: `Detailed task description for project ${project.title}`,
          assignee_id: acmeUsers[5 + (j % 6)].id, // Assign to team members
          status: [TaskStatus.todo, TaskStatus.in_progress, TaskStatus.review, TaskStatus.done, TaskStatus.blocked][j % 5],
          priority: [Priority.low, Priority.medium, Priority.high, Priority.critical][j % 4],
          estimated_hours: Math.floor(Math.random() * 30) + 8,
          due_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within 30 days
        },
      });
      acmeTasks.push(task);
    }
  }

  // Create tasks for StartupXYZ projects
  const startupTasks: any[] = [];
  for (let i = 0; i < startupProjects.length; i++) {
    const project = startupProjects[i];
    const taskCount = Math.floor(Math.random() * 4) + 5; // 5-8 tasks per project
    
    for (let j = 0; j < taskCount; j++) {
      const task = await prisma.task.create({
        data: {
          tenant_id: startupXYZ.id,
          project_id: project.id,
          title: `Task ${j + 1} for ${project.title}`,
          description: `Detailed task description for project ${project.title}`,
          assignee_id: startupUsers[5 + (j % 5)].id, // Assign to team members
          status: [TaskStatus.todo, TaskStatus.in_progress, TaskStatus.review, TaskStatus.done, TaskStatus.blocked][j % 5],
          priority: [Priority.low, Priority.medium, Priority.high, Priority.critical][j % 4],
          estimated_hours: Math.floor(Math.random() * 25) + 5,
          due_date: new Date(Date.now() + Math.random() * 45 * 24 * 60 * 60 * 1000), // Random date within 45 days
        },
      });
      startupTasks.push(task);
    }
  }

  console.log('✅ Created tasks');

  // Create assignments
  await Promise.all([
    // Acme Corp assignments
    prisma.assignment.create({
      data: {
        tenant_id: acmeCorp.id,
        task_id: acmeTasks[0].id,
        user_id: acmeUsers[5].id, // Alex
        role: AssignmentRole.owner,
      },
    }),
    prisma.assignment.create({
      data: {
        tenant_id: acmeCorp.id,
        task_id: acmeTasks[0].id,
        user_id: acmeUsers[6].id, // Maria
        role: AssignmentRole.contributor,
      },
    }),
    prisma.assignment.create({
      data: {
        tenant_id: acmeCorp.id,
        task_id: acmeTasks[1].id,
        user_id: acmeUsers[7].id, // James
        role: AssignmentRole.reviewer,
      },
    }),
    
    // StartupXYZ assignments
    prisma.assignment.create({
      data: {
        tenant_id: startupXYZ.id,
        task_id: startupTasks[0].id,
        user_id: startupUsers[5].id, // Kevin
        role: AssignmentRole.owner,
      },
    }),
    prisma.assignment.create({
      data: {
        tenant_id: startupXYZ.id,
        task_id: startupTasks[1].id,
        user_id: startupUsers[6].id, // Ashley
        role: AssignmentRole.contributor,
      },
    }),
  ]);

  // Create scores and score iterations
  await Promise.all([
    // Self scores
    prisma.score.create({
      data: {
        tenant_id: acmeCorp.id,
        task_id: acmeTasks[0].id,
        user_id: acmeUsers[5].id, // Alex scoring his own task
        value: 4,
        type: ScoreType.self,
        rationale: 'Task completed successfully with minor issues.',
      },
    }),
    // Review scores
    prisma.score.create({
      data: {
        tenant_id: acmeCorp.id,
        task_id: acmeTasks[0].id,
        user_id: acmeUsers[3].id, // David (Project Lead) reviewing
        value: 3,
        type: ScoreType.review,
        rationale: 'Good work but needs improvement in documentation.',
      },
    }),
    
    // Score iterations (showing changes)
    prisma.scoreIteration.create({
      data: {
        tenant_id: acmeCorp.id,
        task_id: acmeTasks[0].id,
        actor_user_id: acmeUsers[5].id, // Alex
        from_value: null,
        to_value: 4,
        reason: 'Initial self-assessment',
      },
    }),
    prisma.scoreIteration.create({
      data: {
        tenant_id: acmeCorp.id,
        task_id: acmeTasks[0].id,
        actor_user_id: acmeUsers[3].id, // David
        from_value: 4,
        to_value: 3,
        reason: 'Adjusted after code review - documentation needs improvement',
      },
    }),
  ]);

  // Create audit logs
  await Promise.all([
    prisma.auditLog.create({
      data: {
        tenant_id: acmeCorp.id,
        actor_user_id: acmeUsers[3].id, // David
        entity_type: 'Task',
        entity_id: acmeTasks[0].id,
        action: 'UPDATE',
        before: { status: 'in_progress' },
        after: { status: 'review' },
      },
    }),
    prisma.auditLog.create({
      data: {
        tenant_id: startupXYZ.id,
        actor_user_id: startupUsers[3].id, // Chris
        entity_type: 'Project',
        entity_id: startupProjects[0].id,
        action: 'CREATE',
        before: {} as any,
        after: { title: 'Customer Feedback Integration', status: 'planning' },
      },
    }),
  ]);

  // Create usage events
  await Promise.all([
    prisma.usageEvent.create({
      data: {
        tenant_id: acmeCorp.id,
        kind: UsageKind.ai_tokens,
        amount: 1250,
        occurred_at: new Date(),
        metadata: { model: 'gpt-4', operation: 'goal_breakdown' },
      },
    }),
    prisma.usageEvent.create({
      data: {
        tenant_id: acmeCorp.id,
        kind: UsageKind.active_seat,
        amount: 11,
        occurred_at: new Date(),
        metadata: { billing_period: '2024-01' },
      },
    }),
    prisma.usageEvent.create({
      data: {
        tenant_id: startupXYZ.id,
        kind: UsageKind.task_evaluated,
        amount: 45,
        occurred_at: new Date(),
        metadata: { project_id: startupProjects[0].id },
      },
    }),
  ]);

  // Create invitations
  await Promise.all([
    prisma.invitation.create({
      data: {
        tenant_id: acmeCorp.id,
        email: 'newdev@acme.local',
        role: UserRole.team_member,
        token: 'inv_acme_newdev_001',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    }),
    prisma.invitation.create({
      data: {
        tenant_id: startupXYZ.id,
        email: 'consultant@startupxyz.local',
        role: UserRole.functional_leader,
        token: 'inv_startup_consultant_001',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    }),
  ]);

  console.log('✅ Created assignments, scores, audit logs, usage events, and invitations');
  
  console.log('🎉 Seeding completed successfully!');
  console.log(`
📊 Summary:
- 2 Tenants: Acme Corp (enterprise), StartupXYZ (professional)
- 20 Users: 10 per tenant with mixed roles
- 6 Goals: 3 per tenant (strategic, operational, personal dev)
- 8 Projects: 4 per tenant, linked to goals
- ${acmeTasks.length + startupTasks.length} Tasks: Mixed statuses and priorities
- Skills and user skills mapped
- Scores, audit logs, usage events, and invitations created
- Billing subscriptions active for both tenants
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });