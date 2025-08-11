import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { setSSOConfig } from '@/lib/settings/service';

const ssoConfigSchema = z.object({
  provider: z.string().min(1),
  clientId: z.string().min(1),
  issuer: z.string().url(),
  enabled: z.boolean(),
  metadata: z.record(z.any()).optional()
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
        error: 'Only administrators can configure SSO' 
      }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const requestValidation = ssoConfigSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json({ 
        error: 'Invalid SSO configuration', 
        details: requestValidation.error.errors 
      }, { status: 400 });
    }

    const { provider, clientId, issuer, enabled, metadata } = requestValidation.data;

    const context = {
      tenantId: tenant_id,
      userId: user_id,
      role
    };

    // Configure SSO
    const updatedSettings = await setSSOConfig(
      tenant_id,
      {
        provider,
        clientId,
        issuer,
        enabled,
        metadata
      },
      context
    );

    return NextResponse.json({
      success: true,
      sso_config: {
        provider: updatedSettings.sso_provider,
        enabled: updatedSettings.sso_enabled,
        issuer: updatedSettings.sso_issuer
      },
      message: enabled 
        ? `SSO has been enabled with ${provider}` 
        : 'SSO has been disabled'
    });

  } catch (error: any) {
    console.error('SSO configuration error:', error);
    
    if (error.message.includes('Only administrators')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to configure SSO' },
      { status: 500 }
    );
  }
}