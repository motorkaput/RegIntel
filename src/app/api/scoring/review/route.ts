import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { submitLeadReview } from '@/lib/scoring/service';

const reviewScoreSchema = z.object({
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
    const requestValidation = reviewScoreSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: requestValidation.error.errors 
      }, { status: 400 });
    }

    const { task_id, value, rationale } = requestValidation.data;

    // Submit lead review
    await submitLeadReview(
      { task_id, value, rationale },
      { tenantId: tenant_id, userId: user_id, role }
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Lead review submission error:', error);
    
    if (error.message.includes('Only project leads') || error.message.includes('only review tasks')) {
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