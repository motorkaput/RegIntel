import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { calculateCharges } from '@/lib/billing/rating';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;

    // Check permissions - only admins can sync usage
    if (!['admin', 'org_leader'].includes(role)) {
      return NextResponse.json({ 
        error: 'Only administrators can sync usage data' 
      }, { status: 403 });
    }

    // Parse request body for custom period (optional)
    let periodStart: Date;
    let periodEnd: Date;

    try {
      const body = await request.json();
      
      if (body.period_start && body.period_end) {
        periodStart = new Date(body.period_start);
        periodEnd = new Date(body.period_end);
      } else {
        // Default to current billing period (this month)
        const now = new Date();
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
    } catch (error) {
      // Use default period if no valid body
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const context = {
      tenantId: tenant_id,
      userId: user_id,
      role
    };

    // Calculate charges for the period
    const charges = await calculateCharges(
      tenant_id,
      periodStart,
      periodEnd,
      context
    );

    // Return usage preview
    return NextResponse.json({
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString()
      },
      plan: charges.plan,
      usage: charges.usage,
      line_items: charges.line_items,
      totals: {
        subtotal: charges.subtotal,
        tax: charges.tax,
        total: charges.total,
        currency: charges.currency
      },
      metadata: {
        generated_at: new Date().toISOString(),
        is_preview: true
      }
    });

  } catch (error: any) {
    console.error('Usage sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync usage data' },
      { status: 500 }
    );
  }
}