import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { exportTenantData } from '@/lib/compliance/export';

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
        error: 'Only administrators can export data' 
      }, { status: 403 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope') as 'org' | 'function' | 'project' | 'user';
    const scopeId = url.searchParams.get('id');
    const format = url.searchParams.get('format') as 'jsonl' | 'csv' || 'jsonl';
    const includePII = url.searchParams.get('include_pii') === 'true';
    const dateFrom = url.searchParams.get('from');
    const dateTo = url.searchParams.get('to');

    // Validate required parameters
    if (!scope || !['org', 'function', 'project', 'user'].includes(scope)) {
      return NextResponse.json({ 
        error: 'Invalid scope. Must be: org, function, project, or user' 
      }, { status: 400 });
    }

    if (scope !== 'org' && !scopeId) {
      return NextResponse.json({ 
        error: 'ID parameter required for non-org scopes' 
      }, { status: 400 });
    }

    const context = {
      tenantId: tenant_id,
      userId: user_id,
      role
    };

    const options = {
      scope,
      scope_id: scopeId || undefined,
      format,
      include_pii: includePII,
      date_from: dateFrom ? new Date(dateFrom) : undefined,
      date_to: dateTo ? new Date(dateTo) : undefined
    };

    // Generate export
    const { stream, metadata } = await exportTenantData(options, context);

    // Determine filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${scope}_export_${scopeId || 'all'}_${timestamp}.${format}`;

    // Set response headers for file download
    const headers = new Headers();
    headers.set('Content-Type', format === 'csv' ? 'text/csv' : 'application/x-ndjson');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('X-Export-ID', metadata.export_id);
    headers.set('X-Record-Count', metadata.record_count.toString());

    // Convert stream to Response
    return new Response(stream as any, { headers });

  } catch (error: any) {
    console.error('Data export error:', error);
    
    if (error.message.includes('Only administrators')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    if (error.message.includes('not found') || error.message.includes('not accessible')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}