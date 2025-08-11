import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { rotateBootstrapToken } from '@/lib/settings/service';

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
        error: 'Only administrators can rotate bootstrap tokens' 
      }, { status: 403 });
    }

    const context = {
      tenantId: tenant_id,
      userId: user_id,
      role
    };

    // Rotate the bootstrap token
    const result = await rotateBootstrapToken(tenant_id, context);

    return NextResponse.json({
      success: true,
      new_token: result.token,
      message: 'Bootstrap token has been rotated successfully. Update your deployment configuration with the new token.'
    });

  } catch (error: any) {
    console.error('Bootstrap token rotation error:', error);
    
    if (error.message.includes('Only administrators')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to rotate bootstrap token' },
      { status: 500 }
    );
  }
}