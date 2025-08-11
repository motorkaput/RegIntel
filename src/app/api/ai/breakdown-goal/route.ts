import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { breakDownGoal } from '@/lib/ai';
import { createAuditLog } from '@/lib/audit';

const goalBreakdownRequestSchema = z.object({
  goal_text: z.string().min(10, 'Goal description must be at least 10 characters'),
  timeline: z.string().optional(),
  budget_info: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;

    // Check permissions - Admin/Org Leader/Functional Leader only
    if (!['admin', 'org_leader', 'functional_leader'].includes(role)) {
      return NextResponse.json({ 
        error: 'Only administrators, organization leaders, and functional leaders can run goal breakdown' 
      }, { status: 403 });
    }

    const body = await request.json();
    const requestValidation = goalBreakdownRequestSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: requestValidation.error.errors 
      }, { status: 400 });
    }

    const { goal_text, timeline, budget_info } = requestValidation.data;

    // Get team context within RLS
    const teamContext = await withRLS(
      prisma,
      { tenantId: tenant_id, role, userId: user_id },
      async (client) => {
        // Get team roster
        const teamRoster = await client.user.findMany({
          where: { tenant_id, is_active: true },
          include: {
            skills: {
              include: {
                skill: true
              }
            }
          }
        });

        // Get available skills
        const allSkills = await client.skill.findMany({
          where: { tenant_id }
        });

        return {
          teamRoster: teamRoster.map(user => ({
            user_id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            role: user.role,
            location: user.location,
            skills: user.skills.map(us => us.skill.name),
            current_workload: 80 // This would come from actual workload tracking
          })),
          availableSkills: allSkills.map(skill => skill.name)
        };
      }
    );

    // Get tenant info for organization name
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenant_id }
    });

    // Run AI goal breakdown
    const aiResult = await breakDownGoal(goal_text, {
      organizationName: tenant?.name || 'Organization',
      teamSize: teamContext.teamRoster.length,
      timeline,
      budgetInfo: budget_info,
      teamRoster: teamContext.teamRoster,
      availableSkills: teamContext.availableSkills
    }, { tenantId: tenant_id, userId: user_id, role });

    // Save as proposal
    const proposal = await withRLS(
      prisma,
      { tenantId: tenant_id, role, userId: user_id },
      async (client) => {
        return await client.proposal.create({
          data: {
            tenant_id,
            type: 'goal_breakdown',
            input: JSON.stringify({
              goal_text,
              timeline,
              budget_info,
              team_size: teamContext.teamRoster.length
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
          metadata: { ai_service: 'goal_breakdown' }
        });
      }
    );

    return NextResponse.json({
      proposal_id: proposal.id,
      output: aiResult
    });

  } catch (error) {
    console.error('Goal breakdown error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}