import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { orgSummary } from '@/lib/analytics/queries';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;

    // Check permissions - only org leaders and admins can view org analytics
    if (!['org_leader', 'admin'].includes(role)) {
      return NextResponse.json({ 
        error: 'Only organization leaders and admins can view organization analytics' 
      }, { status: 403 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const timeRange = {
      from: fromParam ? new Date(fromParam) : undefined,
      to: toParam ? new Date(toParam) : undefined
    };

    const context = {
      tenantId: tenant_id,
      userId: user_id,
      role
    };

    // Get organization summary
    const { data: summary, etag } = await orgSummary(
      timeRange, 
      context, 
      { page, limit }
    );

    const response = NextResponse.json({
      data: summary,
      metadata: {
        generated_at: new Date().toISOString(),
        time_window: {
          from: timeRange.from?.toISOString(),
          to: timeRange.to?.toISOString()
        },
        pagination: {
          page,
          limit,
          total_pages: Math.ceil(summary.total_tasks / limit)
        }
      }
    });

    // Set ETag for caching
    response.headers.set('ETag', etag);
    response.headers.set('Cache-Control', 'private, max-age=60'); // 60 second cache

    return response;

  } catch (error: any) {
    console.error('Organization analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}