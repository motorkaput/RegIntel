import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { analyzeOrganization } from '@/lib/ai';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;

    // Check permissions - Admin/Org Leader only
    if (!['admin', 'org_leader'].includes(role)) {
      return NextResponse.json({ 
        error: 'Only administrators and organization leaders can run organization analysis' 
      }, { status: 403 });
    }

    // Get organization data within RLS context
    const analysisData = await withRLS(
      prisma,
      { tenantId: tenant_id, role, userId: user_id },
      async (client) => {
        // Get employee roster
        const roster = await client.user.findMany({
          where: { tenant_id, is_active: true },
          include: {
            skills: {
              include: {
                skill: true
              }
            },
            manager: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            },
            directReports: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        });

        // Build reporting structure
        const reporting = roster.map(user => ({
          user_id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
          manager_id: user.manager_id,
          direct_reports: user.directReports.map(report => report.id)
        }));

        // Build skills matrix
        const skills = roster.map(user => ({
          user_id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          skills: user.skills.map(us => ({
            name: us.skill.name,
            proficiency: us.proficiency_level
          }))
        }));

        return { roster, reporting, skills };
      }
    );

    // Run AI analysis
    const aiResult = await analyzeOrganization(
      analysisData.roster,
      analysisData.reporting,
      analysisData.skills
    );

    // Save as proposal
    const proposal = await withRLS(
      prisma,
      { tenantId: tenant_id, role, userId: user_id },
      async (client) => {
        return await client.proposal.create({
          data: {
            tenant_id,
            type: 'org_analysis',
            input: JSON.stringify({
              roster_count: analysisData.roster.length,
              analysis_timestamp: new Date().toISOString()
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
          metadata: { ai_service: 'org_analysis' }
        });
      }
    );

    return NextResponse.json({
      proposal_id: proposal.id,
      output: aiResult
    });

  } catch (error) {
    console.error('Organization analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}