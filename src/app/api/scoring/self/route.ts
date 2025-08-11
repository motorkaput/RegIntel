import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { submitSelfScore } from '@/lib/scoring/service';

const selfScoreSchema = z.object({
  task_id: z.string().uuid(),
  value: z.number().int().min(1).max(5),
  rationale: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;

    // Validate request body
    const body = await request.json();
    const requestValidation = selfScoreSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: requestValidation.error.errors 
      }, { status: 400 });
    }

    const { task_id, value, rationale } = requestValidation.data;

    // Submit self score
    await submitSelfScore(
      { task_id, value, rationale },
      { tenantId: tenant_id, userId: user_id, role }
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Self score submission error:', error);
    
    if (error.message.includes('only self-score tasks assigned')) {
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