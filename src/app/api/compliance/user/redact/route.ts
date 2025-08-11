import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { redactPII } from '@/lib/compliance/delete';

const redactPIISchema = z.object({
  user_id: z.string().uuid(),
  fields: z.array(z.enum(['email', 'first_name', 'last_name', 'phone'])).optional().default(['email', 'first_name', 'last_name']),
  confirmation: z.string().refine(
    (val) => val === 'REDACT_USER_PII',
    'Confirmation must be exactly "REDACT_USER_PII"'
  )
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;

    // Check permissions
    if (role !== 'admin') {
      return NextResponse.json({ 
        error: 'Only administrators can redact user PII' 
      }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const requestValidation = redactPIISchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: requestValidation.error.errors 
      }, { status: 400 });
    }

    const { user_id: targetUserId, fields } = requestValidation.data;

    // Prevent self-redaction
    if (targetUserId === user_id) {
      return NextResponse.json({ 
        error: 'You cannot redact your own user PII' 
      }, { status: 400 });
    }

    const context = {
      tenantId: tenant_id,
      userId: user_id,
      role
    };

    // Redact user PII
    const result = await redactPII(targetUserId, context, fields);

    return NextResponse.json({
      success: true,
      redaction_id: result.redaction_id,
      redacted_fields: result.redacted_fields,
      message: `PII redaction completed successfully for fields: ${result.redacted_fields.join(', ')}`
    });

  } catch (error: any) {
    console.error('PII redaction error:', error);
    
    if (error.message.includes('Only administrators')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to redact user PII' },
      { status: 500 }
    );
  }
}