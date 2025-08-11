import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { deleteUserData } from '@/lib/compliance/delete';

const deleteUserSchema = z.object({
  user_id: z.string().uuid(),
  hard_delete: z.boolean().optional().default(false),
  anonymize_instead: z.boolean().optional().default(false),
  confirmation: z.string().refine(
    (val) => val === 'DELETE_USER_DATA',
    'Confirmation must be exactly "DELETE_USER_DATA"'
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
        error: 'Only administrators can delete user data' 
      }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const requestValidation = deleteUserSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: requestValidation.error.errors 
      }, { status: 400 });
    }

    const { user_id: targetUserId, hard_delete, anonymize_instead } = requestValidation.data;

    // Prevent self-deletion
    if (targetUserId === user_id) {
      return NextResponse.json({ 
        error: 'You cannot delete your own user data' 
      }, { status: 400 });
    }

    const context = {
      tenantId: tenant_id,
      userId: user_id,
      role
    };

    // Delete user data
    const result = await deleteUserData(
      targetUserId,
      context,
      {
        hard_delete,
        anonymize_instead
      }
    );

    const deletionType = hard_delete ? 'hard delete' : anonymize_instead ? 'anonymization' : 'soft delete';

    return NextResponse.json({
      success: true,
      deletion_id: result.deletion_id,
      deletion_type: deletionType,
      impact: result.impact,
      message: `User data ${deletionType} completed successfully`
    });

  } catch (error: any) {
    console.error('User data deletion error:', error);
    
    if (error.message.includes('Only administrators')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    if (error.message.includes('not found') || error.message.includes('Cannot delete')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to delete user data' },
      { status: 500 }
    );
  }
}