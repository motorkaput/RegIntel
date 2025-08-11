import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { getScoresByTeam } from '@/lib/scoring/aggregate';

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

    // Check permissions - functional leaders and above can view function scores
    if (!['functional_leader', 'org_leader', 'admin'].includes(role)) {
      return NextResponse.json({ 
        error: 'Only functional leaders and above can view function scores' 
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
    const scores = await getScoresByTeam(
      functionId,
      timeRange,
      { tenantId: tenant_id, userId: user_id, role }
    );

    return NextResponse.json(scores);

  } catch (error: any) {
    console.error('Function scores aggregation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}