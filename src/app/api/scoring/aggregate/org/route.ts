import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { getScoresByOrg } from '@/lib/scoring/aggregate';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;

    // Check permissions - org leaders and admins can view org-wide scores
    if (!['org_leader', 'admin'].includes(role)) {
      return NextResponse.json({ 
        error: 'Only organization leaders and admins can view organization-wide scores' 
      }, { status: 403 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');

    const timeRange = {
      from: fromParam ? new Date(fromParam) : undefined,
      to: toParam ? new Date(toParam) : undefined
    };

    // Get aggregated scores
    const scores = await getScoresByOrg(
      timeRange,
      { tenantId: tenant_id, userId: user_id, role }
    );

    return NextResponse.json(scores);

  } catch (error: any) {
    console.error('Organization scores aggregation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}