import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { functionSummary } from '@/lib/analytics/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;
    const functionId = params.id;

    // Check permissions - functional leaders and above can view function analytics
    if (!['functional_leader', 'org_leader', 'admin'].includes(role)) {
      return NextResponse.json({ 
        error: 'Only functional leaders and above can view function analytics' 
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

    // Get function summary
    const { data: summary, etag } = await functionSummary(
      functionId,
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
    response.headers.set('Cache-Control', 'private, max-age=60');

    return response;

  } catch (error: any) {
    console.error('Function analytics error:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}