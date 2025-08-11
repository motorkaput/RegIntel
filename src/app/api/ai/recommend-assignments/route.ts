import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { recommendAssignments } from '@/lib/ai';
import { createAuditLog } from '@/lib/audit';

const assignmentRequestSchema = z.object({
  task_description: z.string().min(10, 'Task description must be at least 10 characters'),
  required_skills: z.array(z.string()),
  estimated_hours: z.number().min(1, 'Estimated hours must be at least 1'),
  timeline: z.string().optional(),
  location_preference: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;

    // Check permissions - Project Leads and above
    if (!['admin', 'org_leader', 'functional_leader', 'project_lead'].includes(role)) {
      return NextResponse.json({ 
        error: 'Only project leads and above can request assignment recommendations' 
      }, { status: 403 });
    }

    const body = await request.json();
    const requestValidation = assignmentRequestSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: requestValidation.error.errors 
      }, { status: 400 });
    }

    const { 
      task_description, 
      required_skills, 
      estimated_hours, 
      timeline, 
      location_preference 
    } = requestValidation.data;

    // Get team roster within RLS
    const roster = await withRLS(
      prisma,
      { tenantId: tenant_id, role, userId: user_id },
      async (client) => {
        return await client.user.findMany({
          where: { tenant_id, is_active: true },
          include: {
            skills: {
              include: {
                skill: true
              }
            }
          }
        });
      }
    );

    // Format roster for AI analysis
    const formattedRoster = roster.map(user => ({
      user_id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      location: user.location,
      skills: user.skills.map(us => ({
        name: us.skill.name,
        proficiency: us.proficiency_level
      })),
      current_capacity: 75 // This would come from actual workload tracking
    }));

    // Run AI assignment recommendations
    const aiResult = await recommendAssignments({
      description: task_description,
      requiredSkills: required_skills,
      estimatedHours: estimated_hours,
      timeline,
      locationPreference: location_preference
    }, formattedRoster);

    // Save as proposal
    const proposal = await withRLS(
      prisma,
      { tenantId: tenant_id, role, userId: user_id },
      async (client) => {
        return await client.proposal.create({
          data: {
            tenant_id,
            type: 'assignment',
            input: JSON.stringify({
              task_description,
              required_skills,
              estimated_hours,
              timeline,
              location_preference,
              team_size: formattedRoster.length
            }),
            output: JSON.stringify(aiResult),
            status: 'proposed',
            created_by_user_id: user_id
          }
        });
      }
    );

    // Create audit log
    await withRLS(
      prisma,
      { tenantId: tenant_id, role, userId: user_id },
      async (client) => {
        await createAuditLog(client, {
          tenant_id,
          user_id,
          action: 'CREATE',
          resource_type: 'proposal',
          resource_id: proposal.id,
          old_values: null,
          new_values: proposal,
          metadata: { ai_service: 'assignment_recommendation' }
        });
      }
    );

    return NextResponse.json({
      proposal_id: proposal.id,
      output: aiResult
    });

  } catch (error) {
    console.error('Assignment recommendation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}