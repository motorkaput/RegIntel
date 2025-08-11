import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { queryAuditLogs, queryUsageEvents, exportLogs } from '@/lib/logs/query';

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
        error: 'Only administrators can view logs' 
      }, { status: 403 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const actor = url.searchParams.get('actor');
    const entity = url.searchParams.get('entity');
    const action = url.searchParams.get('action');
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search');
    const type = url.searchParams.get('type') || 'audit'; // 'audit' or 'usage'
    const exportFormat = url.searchParams.get('export') as 'csv' | 'json' | null;

    const filters = {
      actor: actor || undefined,
      entity: entity || undefined,
      action: action || undefined,
      from: fromParam ? new Date(fromParam) : undefined,
      to: toParam ? new Date(toParam) : undefined,
      page,
      limit: Math.min(limit, 100), // Cap at 100
      search: search || undefined
    };

    const context = {
      tenantId: tenant_id,
      userId: user_id,
      role
    };

    // Handle export request
    if (exportFormat) {
      const exportData = await exportLogs(filters, context, exportFormat);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `logs_${type}_${timestamp}.${exportFormat}`;

      const headers = new Headers();
      headers.set('Content-Type', exportFormat === 'csv' ? 'text/csv' : 'application/json');
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);

      return new Response(exportData, { headers });
    }

    // Query logs based on type
    let result;
    if (type === 'usage') {
      result = await queryUsageEvents(filters, context);
    } else {
      result = await queryAuditLogs(filters, context);
    }

    return NextResponse.json({
      logs: result.logs,
      pagination: result.pagination,
      filters: {
        actor,
        entity,
        action,
        from: fromParam,
        to: toParam,
        search,
        type
      },
      metadata: {
        generated_at: new Date().toISOString(),
        tenant_id
      }
    });

  } catch (error: any) {
    console.error('Logs query error:', error);
    
    if (error.message.includes('Only administrators')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to query logs' },
      { status: 500 }
    );
  }
}