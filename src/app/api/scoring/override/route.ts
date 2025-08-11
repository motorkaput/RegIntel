import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { overrideFinalScore } from '@/lib/scoring/service';

const overrideScoreSchema = z.object({
  task_id: z.string().uuid(),
  value: z.number().int().min(1).max(5),
  rationale: z.string().min(1, 'Rationale is required for score overrides')
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;

    // Check role permissions
    if (!['project_lead', 'functional_leader', 'org_leader', 'admin'].includes(role)) {
      return NextResponse.json({ 
        error: 'Only project leads and above can override scores' 
      }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const requestValidation = overrideScoreSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: requestValidation.error.errors 
      }, { status: 400 });
    }

    const { task_id, value, rationale } = requestValidation.data;

    // Submit override
    await overrideFinalScore(
      { task_id, value, rationale },
      { tenantId: tenant_id, userId: user_id, role }
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Score override error:', error);
    
    if (error.message.includes('can only override scores') || error.message.includes('Rationale is required')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    if (error.message.includes('Task not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}