import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { updateTenantSettings, getTenantSettings } from '@/lib/settings/service';

export async function GET(request: NextRequest) {
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
        error: 'Only administrators can view tenant settings' 
      }, { status: 403 });
    }

    const context = {
      tenantId: tenant_id,
      userId: user_id,
      role
    };

    // Get current settings
    const settings = await getTenantSettings(tenant_id, context);

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    // Return settings without sensitive data
    const publicSettings = {
      id: settings.id,
      tenant_id: settings.tenant_id,
      email_from: settings.email_from,
      data_retention_days: settings.data_retention_days,
      rate_limit_qph: settings.rate_limit_qph,
      payment_provider: settings.payment_provider,
      sso_enabled: settings.sso_enabled,
      sso_provider: settings.sso_provider,
      strict_mode: settings.strict_mode,
      backup_enabled: settings.backup_enabled,
      api_access_enabled: settings.api_access_enabled,
      created_at: settings.created_at,
      updated_at: settings.updated_at
    };

    return NextResponse.json(publicSettings);

  } catch (error: any) {
    console.error('Get tenant settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get tenant settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
        error: 'Only administrators can update tenant settings' 
      }, { status: 403 });
    }

    // Parse request body
    const updates = await request.json();

    const context = {
      tenantId: tenant_id,
      userId: user_id,
      role
    };

    // Update settings
    const updatedSettings = await updateTenantSettings(tenant_id, updates, context);

    // Return updated settings without sensitive data
    const publicSettings = {
      id: updatedSettings.id,
      tenant_id: updatedSettings.tenant_id,
      email_from: updatedSettings.email_from,
      data_retention_days: updatedSettings.data_retention_days,
      rate_limit_qph: updatedSettings.rate_limit_qph,
      payment_provider: updatedSettings.payment_provider,
      sso_enabled: updatedSettings.sso_enabled,
      sso_provider: updatedSettings.sso_provider,
      strict_mode: updatedSettings.strict_mode,
      backup_enabled: updatedSettings.backup_enabled,
      api_access_enabled: updatedSettings.api_access_enabled,
      updated_at: updatedSettings.updated_at
    };

    return NextResponse.json(publicSettings);

  } catch (error: any) {
    console.error('Update tenant settings error:', error);
    
    if (error.message.includes('Only administrators')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to update tenant settings' },
      { status: 500 }
    );
  }
}