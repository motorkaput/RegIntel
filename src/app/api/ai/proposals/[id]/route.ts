import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { createAuditLog } from '@/lib/audit';

const updateProposalSchema = z.object({
  status: z.enum(['accepted', 'modified', 'rejected']),
  reason: z.string().optional(),
  modified_output: z.any().optional() // JSON for modified proposals
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;
    const proposalId = params.id;

    const body = await request.json();
    const requestValidation = updateProposalSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: requestValidation.error.errors 
      }, { status: 400 });
    }

    const { status, reason, modified_output } = requestValidation.data;

    // Require reason for modify/reject
    if ((status === 'modified' || status === 'rejected') && !reason) {
      return NextResponse.json({ 
        error: 'Reason is required when modifying or rejecting proposals' 
      }, { status: 400 });
    }

    // Update proposal within RLS
    const result = await withRLS(
      prisma,
      { tenantId: tenant_id, role, userId: user_id },
      async (client) => {
        // Get existing proposal
        const existingProposal = await client.proposal.findUnique({
          where: { id: proposalId, tenant_id }
        });

        if (!existingProposal) {
          throw new Error('Proposal not found');
        }

        // Check permissions based on proposal type
        const hasPermission = checkProposalPermissions(existingProposal.type, role);
        if (!hasPermission) {
          throw new Error('Insufficient permissions to update this proposal');
        }

        // Update proposal
        const updatedProposal = await client.proposal.update({
          where: { id: proposalId },
          data: {
            status,
            review_comment: reason,
            output: status === 'modified' && modified_output 
              ? JSON.stringify(modified_output)
              : existingProposal.output,
            updated_at: new Date()
          }
        });

        // Create audit log
        await createAuditLog(client, {
          tenant_id,
          user_id,
          action: 'UPDATE',
          resource_type: 'proposal',
          resource_id: proposalId,
          old_values: existingProposal,
          new_values: updatedProposal,
          metadata: { 
            status_change: `${existingProposal.status} -> ${status}`,
            reason 
          }
        });

        return updatedProposal;
      }
    );

    return NextResponse.json({
      success: true,
      proposal: result
    });

  } catch (error: any) {
    console.error('Proposal update error:', error);
    
    if (error.message === 'Proposal not found') {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }
    
    if (error.message === 'Insufficient permissions to update this proposal') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;
    const proposalId = params.id;

    // Get proposal within RLS
    const proposal = await withRLS(
      prisma,
      { tenantId: tenant_id, role, userId: user_id },
      async (client) => {
        return await client.proposal.findUnique({
          where: { id: proposalId, tenant_id },
          include: {
            created_by: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        });
      }
    );

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    return NextResponse.json({ proposal });

  } catch (error) {
    console.error('Proposal fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function checkProposalPermissions(proposalType: string, userRole: string): boolean {
  const permissions = {
    org_analysis: ['admin', 'org_leader'],
    goal_breakdown: ['admin', 'org_leader', 'functional_leader'],
    assignment: ['admin', 'org_leader', 'functional_leader', 'project_lead']
  };

  const allowedRoles = permissions[proposalType as keyof typeof permissions] || [];
  return allowedRoles.includes(userRole);
}