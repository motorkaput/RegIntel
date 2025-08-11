import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { getScoresByUser, getScoresByTeam, getScoresByProject, getScoresByOrg } from '@/lib/scoring/aggregate';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;

    // Parse query parameters
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope'); // org|function|project|user
    const id = url.searchParams.get('id');
    const format = url.searchParams.get('format') || 'json'; // csv|json
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');

    if (!scope || !['org', 'function', 'project', 'user'].includes(scope)) {
      return NextResponse.json({ error: 'Invalid scope. Must be: org, function, project, or user' }, { status: 400 });
    }

    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Must be: csv or json' }, { status: 400 });
    }

    if (scope !== 'org' && !id) {
      return NextResponse.json({ error: 'ID parameter required for non-org scopes' }, { status: 400 });
    }

    const timeRange = {
      from: fromParam ? new Date(fromParam) : undefined,
      to: toParam ? new Date(toParam) : undefined
    };

    // Check permissions
    const hasPermission = checkExportPermissions(scope, role);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions for this export scope' }, { status: 403 });
    }

    // Get detailed export data
    const exportData = await getExportData(scope, id, timeRange, { tenantId: tenant_id, userId: user_id, role });

    if (format === 'csv') {
      const csv = convertToCSV(exportData);
      const filename = `${scope}_scores_${new Date().toISOString().split('T')[0]}.csv`;
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    } else {
      const filename = `${scope}_scores_${new Date().toISOString().split('T')[0]}.json`;
      
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

  } catch (error: any) {
    console.error('Score export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function checkExportPermissions(scope: string, role: string): boolean {
  const permissions = {
    user: ['team_member', 'project_lead', 'functional_leader', 'org_leader', 'admin'],
    project: ['project_lead', 'functional_leader', 'org_leader', 'admin'],
    function: ['functional_leader', 'org_leader', 'admin'],
    org: ['org_leader', 'admin']
  };

  return permissions[scope as keyof typeof permissions]?.includes(role) || false;
}

async function getExportData(
  scope: string,
  id: string | null,
  timeRange: { from?: Date; to?: Date },
  context: { tenantId: string; userId: string; role: string }
): Promise<any[]> {
  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      let whereClause: any = {
        tenant_id: context.tenantId,
        final_score: { not: null }
      };

      if (timeRange.from || timeRange.to) {
        whereClause.updated_at = {};
        if (timeRange.from) whereClause.updated_at.gte = timeRange.from;
        if (timeRange.to) whereClause.updated_at.lte = timeRange.to;
      }

      // Add scope-specific filters
      if (scope === 'user' && id) {
        whereClause.task = {
          assignees: {
            some: { user_id: id }
          }
        };
      } else if (scope === 'project' && id) {
        whereClause.task = {
          project_id: id
        };
      } else if (scope === 'function' && id) {
        // Get users in function first
        const functionUsers = await client.user.findMany({
          where: { tenant_id: context.tenantId, function_id: id },
          select: { id: true }
        });
        const userIds = functionUsers.map(u => u.id);
        
        whereClause.task = {
          assignees: {
            some: { user_id: { in: userIds } }
          }
        };
      }

      const scores = await client.taskScore.findMany({
        where: whereClause,
        include: {
          task: {
            include: {
              project: { select: { name: true } },
              assignees: {
                include: {
                  user: {
                    select: {
                      first_name: true,
                      last_name: true,
                      email: true
                    }
                  }
                }
              }
            }
          },
          self_scorer: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          },
          reviewer: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          },
          overrider: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          }
        },
        orderBy: { updated_at: 'desc' }
      });

      return scores.map(score => ({
        task_id: score.task_id,
        task_title: score.task.title,
        project_name: score.task.project.name,
        assignees: score.task.assignees.map(a => `${a.user.first_name} ${a.user.last_name}`).join(', '),
        self_score: score.self_score,
        self_rationale: score.self_rationale,
        self_scorer: score.self_scorer ? `${score.self_scorer.first_name} ${score.self_scorer.last_name}` : null,
        self_scored_at: score.self_scored_at?.toISOString(),
        review_score: score.review_score,
        review_rationale: score.review_rationale,
        reviewer: score.reviewer ? `${score.reviewer.first_name} ${score.reviewer.last_name}` : null,
        reviewed_at: score.reviewed_at?.toISOString(),
        override_score: score.override_score,
        override_rationale: score.override_rationale,
        overrider: score.overrider ? `${score.overrider.first_name} ${score.overrider.last_name}` : null,
        overridden_at: score.overridden_at?.toISOString(),
        final_score: score.final_score,
        updated_at: score.updated_at.toISOString()
      }));
    }
  );
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) {
    return 'No data available';
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}