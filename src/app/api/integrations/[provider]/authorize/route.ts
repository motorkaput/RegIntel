import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { getProvider } from '@/lib/integrations';
import { randomUUID } from 'crypto';

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

    // Validate provider
    try {
      const provider = getProvider(providerName);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid provider',
        available_providers: ['jira', 'trello', 'asana', 'mock']
      }, { status: 400 });
    }

    // Check permissions - only admins and org leaders can configure integrations
    if (!['admin', 'org_leader'].includes(role)) {
      return NextResponse.json({ 
        error: 'Only organization leaders and admins can configure integrations' 
      }, { status: 403 });
    }

    // Generate OAuth state parameter for security
    const state = randomUUID();
    
    // Store state in session/cache for validation
    // In a real implementation, you'd store this securely
    const stateData = {
      user_id,
      tenant_id,
      provider: providerName,
      timestamp: Date.now()
    };

    // Get provider and generate authorization URL
    const provider = getProvider(providerName);
    const authorizeUrl = provider.authorizeUrl(state);

    // For mock provider, handle immediate "authorization"
    if (providerName === 'mock') {
      return NextResponse.redirect(new URL(authorizeUrl, request.url));
    }

    return NextResponse.json({
      authorize_url: authorizeUrl,
      state,
      provider: providerName
    });

  } catch (error: any) {
    console.error('Authorization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}