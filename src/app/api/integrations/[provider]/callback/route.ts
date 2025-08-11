import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { getProvider } from '@/lib/integrations';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;
    const providerName = params.provider;

    // Parse query parameters
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = url.searchParams.get('error_description') || 'Authorization failed';
      return NextResponse.redirect(
        new URL(`/dashboard/settings/integrations?error=${encodeURIComponent(errorDescription)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=No authorization code received', request.url)
      );
    }

    // TODO: Validate state parameter for security
    // In production, verify the state matches what was stored

    // Check permissions
    if (!['admin', 'org_leader'].includes(role)) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=Insufficient permissions', request.url)
      );
    }

    // Exchange code for tokens
    const provider = getProvider(providerName);
    const tokens = await provider.exchangeCode(code);

    // Test the connection by fetching user's projects
    let projects = [];
    try {
      projects = await provider.getProjects(tokens);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=Failed to connect to provider', request.url)
      );
    }

    // Store integration and tokens
    await withRLS(
      prisma,
      { tenantId: tenant_id, userId: user_id, role },
      async (client) => {
        // Check if integration already exists
        const existingIntegration = await client.toolIntegration.findFirst({
          where: {
            tenant_id,
            provider_name: providerName
          }
        });

        const integrationData = {
          tenant_id,
          provider_name: providerName,
          display_name: `${provider.name} Integration`,
          access_token: JSON.stringify(tokens),
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at,
          scope: tokens.scope,
          is_active: true,
          created_by_user_id: user_id,
          config: {
            projects: [], // Will be configured later
            sync_frequency: 15, // minutes
            webhook_enabled: false
          },
          connected_at: new Date(),
          last_sync_at: null,
          sync_status: 'pending',
          updated_at: new Date()
        };

        let integration;
        if (existingIntegration) {
          // Update existing integration
          integration = await client.toolIntegration.update({
            where: { id: existingIntegration.id },
            data: integrationData
          });
        } else {
          // Create new integration
          integration = await client.toolIntegration.create({
            data: {
              ...integrationData,
              created_at: new Date()
            }
          });
        }

        // Create audit log
        await createAuditLog(client, {
          tenant_id,
          user_id,
          action: existingIntegration ? 'UPDATE' : 'CREATE',
          resource_type: 'tool_integration',
          resource_id: integration.id,
          old_values: existingIntegration || null,
          new_values: {
            provider_name: providerName,
            connected: true,
            projects_available: projects.length
          },
          metadata: {
            provider: providerName,
            projects_discovered: projects.map(p => ({ id: p.id, name: p.name }))
          }
        });
      }
    );

    // Redirect back to integrations page with success
    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?success=Integration connected successfully', request.url)
    );

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/settings/integrations?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}