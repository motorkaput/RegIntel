import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { createAuditLog } from '@/lib/audit';
import { OrgAnalysisSchema, GoalBreakdownSchema, AssignmentRecommendationSchema } from '@/lib/ai/schemas';

const updateProposalSchema = z.object({
  action: z.enum(['accept', 'modify', 'reject']),
  changes: z.any().optional(), // JSON for modified proposals
  reason: z.string().optional()
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

    const { action, changes, reason } = requestValidation.data;

    // Require reason for modify/reject
    if ((action === 'modify' || action === 'reject') && !reason) {
      return NextResponse.json({ 
        error: 'Reason is required when modifying or rejecting proposals' 
      }, { status: 400 });
    }

    // Require changes for modify
    if (action === 'modify' && !changes) {
      return NextResponse.json({ 
        error: 'Changes are required when modifying proposals' 
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
        const hasPermission = checkProposalPermissions(existingProposal.type, role, existingProposal.created_by_user_id, user_id);
        if (!hasPermission) {
          throw new Error('Insufficient permissions to update this proposal');
        }

        // Validate changes against schema if modifying
        let finalOutput = existingProposal.output;
        if (action === 'modify' && changes) {
          const schemaValidation = validateProposalChanges(existingProposal.type, changes);
          if (!schemaValidation.success) {
            throw new Error(`Invalid changes: ${schemaValidation.error}`);
          }
          finalOutput = JSON.stringify(changes);
        }

        // Map action to status
        const statusMap = {
          accept: 'accepted',
          modify: 'modified', 
          reject: 'rejected'
        } as const;

        // Update proposal
        const updatedProposal = await client.proposal.update({
          where: { id: proposalId },
          data: {
            status: statusMap[action],
            review_comment: reason,
            output: finalOutput,
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
            status_change: `${existingProposal.status} -> ${statusMap[action]}`,
            action,
            reason,
            has_changes: action === 'modify'
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

function checkProposalPermissions(
  proposalType: string, 
  userRole: string, 
  createdByUserId: string, 
  currentUserId: string
): boolean {
  // Users can always modify their own proposals
  if (createdByUserId === currentUserId) {
    return true;
  }

  // Role hierarchy permissions
  const permissions = {
    org_analysis: ['admin', 'org_leader'],
    goal_breakdown: ['admin', 'org_leader', 'functional_leader'],
    assignment: ['admin', 'org_leader', 'functional_leader', 'project_lead']
  };

  // Superior roles can modify proposals from subordinates
  const roleHierarchy = {
    admin: ['admin', 'org_leader', 'functional_leader', 'project_lead', 'team_member'],
    org_leader: ['org_leader', 'functional_leader', 'project_lead', 'team_member'],
    functional_leader: ['functional_leader', 'project_lead', 'team_member'],
    project_lead: ['project_lead', 'team_member']
  };

  const allowedRoles = permissions[proposalType as keyof typeof permissions] || [];
  const canManageType = allowedRoles.includes(userRole);
  const hierarchyRoles = roleHierarchy[userRole as keyof typeof roleHierarchy] || [];
  const hasHierarchyAccess = hierarchyRoles.length > 0;

  return canManageType && hasHierarchyAccess;
}

function validateProposalChanges(proposalType: string, changes: any): { success: boolean; error?: string } {
  try {
    const schemas = {
      org_analysis: OrgAnalysisSchema,
      goal_breakdown: GoalBreakdownSchema,
      assignment: AssignmentRecommendationSchema
    };

    const schema = schemas[proposalType as keyof typeof schemas];
    if (!schema) {
      return { success: false, error: 'Unknown proposal type' };
    }

    const validation = schema.safeParse(changes);
    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Validation failed' };
  }
}