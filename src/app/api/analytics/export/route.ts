import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { orgSummary, functionSummary, projectSummary, userSummary } from '@/lib/analytics/queries';

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
    const format = url.searchParams.get('format') || 'csv'; // csv only for now
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');

    if (!scope || !['org', 'function', 'project', 'user'].includes(scope)) {
      return NextResponse.json({ 
        error: 'Invalid scope. Must be: org, function, project, or user' 
      }, { status: 400 });
    }

    if (format !== 'csv') {
      return NextResponse.json({ 
        error: 'Only CSV format is supported for analytics export' 
      }, { status: 400 });
    }

    if (scope !== 'org' && !id) {
      return NextResponse.json({ 
        error: 'ID parameter required for non-org scopes' 
      }, { status: 400 });
    }

    // Check permissions
    const hasPermission = checkExportPermissions(scope, role);
    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'Insufficient permissions for this export scope' 
      }, { status: 403 });
    }

    const timeRange = {
      from: fromParam ? new Date(fromParam) : undefined,
      to: toParam ? new Date(toParam) : undefined
    };

    const context = {
      tenantId: tenant_id,
      userId: user_id,
      role
    };

    // Get data based on scope
    let data: any;
    let filename: string;

    switch (scope) {
      case 'org':
        const orgData = await orgSummary(timeRange, context);
        data = orgData.data;
        filename = `org_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'function':
        const functionData = await functionSummary(id!, timeRange, context);
        data = functionData.data;
        filename = `function_${id}_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'project':
        const projectData = await projectSummary(id!, timeRange, context);
        data = projectData.data;
        filename = `project_${id}_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'user':
        const userData = await userSummary(id!, timeRange, context);
        data = userData.data;
        filename = `user_${id}_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
    }

    // Convert to CSV
    const csv = convertAnalyticsToCSV(data, scope);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error: any) {
    console.error('Analytics export error:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

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

function convertAnalyticsToCSV(data: any, scope: string): string {
  const timestamp = new Date().toISOString();
  
  switch (scope) {
    case 'org':
      return `Organization Analytics Export
Generated: ${timestamp}

Overall Metrics
Metric,Value
Average Score,${data.overall_avg_score}
Total Tasks,${data.total_tasks}
Completed Tasks,${data.completed_tasks}
Active Projects,${data.active_projects}
Team Size,${data.team_size}

Score Distribution
Score,Count
${Object.entries(data.distribution).map(([score, count]) => `${score},${count}`).join('\n')}

Weekly Trend
Week Start,Average Score,Task Count
${data.weekly_trend.map((week: any) => `${week.week_start.toISOString().split('T')[0]},${week.avg_score},${week.count}`).join('\n')}

Top Risk Projects
Project ID,Project Name,Risk Score,Blocked Count
${data.top_risks.map((risk: any) => `${risk.project_id},${risk.project_name},${risk.risk_score},${risk.blocked_count}`).join('\n')}
`;

    case 'function':
      return `Function Analytics Export
Generated: ${timestamp}
Function: ${data.function_name}

Overall Metrics
Metric,Value
Average Score,${data.overall_avg_score}
Total Tasks,${data.total_tasks}
Completed Tasks,${data.completed_tasks}
Team Size,${data.team_size}

Score Distribution
Score,Count
${Object.entries(data.distribution).map(([score, count]) => `${score},${count}`).join('\n')}

Skills Coverage
Skill,Coverage Percentage
${Object.entries(data.skills_coverage).map(([skill, coverage]) => `${skill},${coverage}`).join('\n')}

Skill Bottlenecks
Skill,Demand,Supply,Gap
${data.bottlenecks.map((bottleneck: any) => `${bottleneck.skill},${bottleneck.demand},${bottleneck.supply},${bottleneck.gap}`).join('\n')}
`;

    case 'project':
      return `Project Analytics Export
Generated: ${timestamp}
Project: ${data.project_name}

Overall Metrics
Metric,Value
Progress Percentage,${data.progress_percentage}
Blocked Count,${data.blocked_count}

Task Breakdown
Status,Count
To Do,${data.task_breakdown.todo}
In Progress,${data.task_breakdown.in_progress}
Review,${data.task_breakdown.review}
Done,${data.task_breakdown.done}

Score Distribution
Score,Count
${Object.entries(data.score_distribution).map(([score, count]) => `${score},${count}`).join('\n')}

Team Performance
User ID,Name,Average Score,Task Count
${data.team_members.map((member: any) => `${member.user_id},${member.name},${member.avg_score},${member.task_count}`).join('\n')}

Recent Activity
Task ID,Task Title,Action,Timestamp,User Name
${data.recent_activity.map((activity: any) => `${activity.task_id},${activity.task_title},${activity.action},${activity.timestamp},${activity.user_name}`).join('\n')}
`;

    case 'user':
      return `User Analytics Export
Generated: ${timestamp}
User: ${data.user_name}

Overall Metrics
Metric,Value
Average Score,${data.avg_score}
Task Completion Rate,${data.task_completion_rate}%

Score Distribution
Score,Count
${Object.entries(data.score_distribution).map(([score, count]) => `${score},${count}`).join('\n')}

Weekly Trend
Week Start,Average Score,Task Count
${data.weekly_trend.map((week: any) => `${week.week_start.toISOString().split('T')[0]},${week.avg_score},${week.count}`).join('\n')}

Recent Feedback
Task ID,Task Title,Score,Feedback Type,Feedback,Timestamp
${data.recent_feedback.map((feedback: any) => `${feedback.task_id},${feedback.task_title},${feedback.score},${feedback.feedback_type},${feedback.feedback},${feedback.timestamp}`).join('\n')}
`;

    default:
      return 'Invalid scope';
  }
}