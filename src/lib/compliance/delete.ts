import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { createAuditLog } from '@/lib/audit';

interface ComplianceContext {
  tenantId: string;
  userId: string;
  role: string;
}

interface DeletionImpact {
  users_affected: number;
  tasks_affected: number;
  projects_affected: number;
  scores_affected: number;
  comments_affected: number;
  attachments_affected: number;
  audit_logs_affected: number;
}

export async function deleteUserData(
  targetUserId: string,
  context: ComplianceContext,
  options: {
    hard_delete?: boolean;
    anonymize_instead?: boolean;
  } = {}
): Promise<{ impact: DeletionImpact; deletion_id: string }> {
  // Only admins can delete user data
  if (context.role !== 'admin') {
    throw new Error('Only administrators can delete user data');
  }

  const deletionId = `del_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Verify target user exists and belongs to tenant
      const targetUser = await client.user.findUnique({
        where: { 
          id: targetUserId,
          tenant_id: context.tenantId 
        }
      });

      if (!targetUser) {
        throw new Error('Target user not found or not accessible');
      }

      // Prevent deletion of the last admin
      if (targetUser.role === 'admin') {
        const adminCount = await client.user.count({
          where: {
            tenant_id: context.tenantId,
            role: 'admin',
            is_active: true
          }
        });

        if (adminCount <= 1) {
          throw new Error('Cannot delete the last active administrator');
        }
      }

      // Calculate impact before deletion
      const impact = await calculateDeletionImpact(targetUserId, context);

      if (options.anonymize_instead) {
        // Anonymize user data instead of deleting
        await anonymizeUserData(targetUserId, context, deletionId);
      } else if (options.hard_delete) {
        // Hard delete - remove all records
        await hardDeleteUserData(targetUserId, context, deletionId);
      } else {
        // Soft delete - mark as deleted but keep records
        await softDeleteUserData(targetUserId, context, deletionId);
      }

      // Create audit log for deletion
      await createAuditLog(client, {
        tenant_id: context.tenantId,
        user_id: context.userId,
        action: 'DELETE',
        resource_type: 'user_data',
        resource_id: deletionId,
        old_values: {
          target_user_id: targetUserId,
          target_email: targetUser.email,
          target_role: targetUser.role
        },
        new_values: {
          deletion_type: options.hard_delete ? 'hard' : options.anonymize_instead ? 'anonymize' : 'soft',
          impact
        },
        metadata: {
          compliance_deletion: true,
          gdpr_request: true,
          deletion_id: deletionId
        }
      });

      return { impact, deletion_id: deletionId };
    }
  );
}

export async function redactPII(
  targetUserId: string,
  context: ComplianceContext,
  fields: string[] = ['email', 'first_name', 'last_name', 'phone']
): Promise<{ redacted_fields: string[]; redaction_id: string }> {
  // Only admins can redact PII
  if (context.role !== 'admin') {
    throw new Error('Only administrators can redact PII');
  }

  const redactionId = `red_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Verify target user exists
      const targetUser = await client.user.findUnique({
        where: { 
          id: targetUserId,
          tenant_id: context.tenantId 
        }
      });

      if (!targetUser) {
        throw new Error('Target user not found or not accessible');
      }

      const originalData = {
        email: targetUser.email,
        first_name: targetUser.first_name,
        last_name: targetUser.last_name
      };

      // Prepare redacted data
      const updateData: any = {};
      const redactedFields: string[] = [];

      if (fields.includes('email') && targetUser.email) {
        updateData.email = `redacted_${redactionId}@example.com`;
        redactedFields.push('email');
      }

      if (fields.includes('first_name') && targetUser.first_name) {
        updateData.first_name = '[REDACTED]';
        redactedFields.push('first_name');
      }

      if (fields.includes('last_name') && targetUser.last_name) {
        updateData.last_name = '[REDACTED]';
        redactedFields.push('last_name');
      }

      // Update user with redacted data
      if (Object.keys(updateData).length > 0) {
        await client.user.update({
          where: { id: targetUserId },
          data: {
            ...updateData,
            updated_at: new Date()
          }
        });
      }

      // Redact PII in comments
      if (redactedFields.length > 0) {
        await client.taskComment.updateMany({
          where: {
            author_id: targetUserId,
            tenant_id: context.tenantId
          },
          data: {
            content: `[COMMENT REDACTED - User PII removal on ${new Date().toISOString()}]`,
            updated_at: new Date()
          }
        });

        // Redact PII in audit logs (update metadata to indicate redaction)
        await client.auditLog.updateMany({
          where: {
            user_id: targetUserId,
            tenant_id: context.tenantId
          },
          data: {
            metadata: {
              pii_redacted: true,
              redaction_id: redactionId,
              redacted_at: new Date().toISOString()
            }
          }
        });
      }

      // Create audit log for redaction
      await createAuditLog(client, {
        tenant_id: context.tenantId,
        user_id: context.userId,
        action: 'REDACT',
        resource_type: 'user_pii',
        resource_id: redactionId,
        old_values: originalData,
        new_values: updateData,
        metadata: {
          compliance_redaction: true,
          gdpr_request: true,
          redaction_id: redactionId,
          target_user_id: targetUserId,
          redacted_fields: redactedFields
        }
      });

      return { redacted_fields: redactedFields, redaction_id: redactionId };
    }
  );
}

async function calculateDeletionImpact(
  targetUserId: string,
  context: ComplianceContext
): Promise<DeletionImpact> {
  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      const [
        tasksCount,
        projectsCount,
        scoresCount,
        commentsCount,
        attachmentsCount,
        auditLogsCount
      ] = await Promise.all([
        // Tasks assigned to user
        client.taskAssignee.count({
          where: { 
            user_id: targetUserId,
            task: { tenant_id: context.tenantId }
          }
        }),
        // Projects where user is a member
        client.projectMember.count({
          where: { 
            user_id: targetUserId,
            project: { tenant_id: context.tenantId }
          }
        }),
        // Scores created by user
        client.taskScore.count({
          where: {
            OR: [
              { self_scored_by: targetUserId },
              { reviewed_by: targetUserId },
              { overridden_by: targetUserId }
            ],
            tenant_id: context.tenantId
          }
        }),
        // Comments by user
        client.taskComment.count({
          where: { 
            author_id: targetUserId,
            tenant_id: context.tenantId 
          }
        }),
        // Attachments uploaded by user
        client.taskAttachment.count({
          where: { 
            uploaded_by: targetUserId,
            tenant_id: context.tenantId 
          }
        }),
        // Audit logs by user
        client.auditLog.count({
          where: { 
            user_id: targetUserId,
            tenant_id: context.tenantId 
          }
        })
      ]);

      return {
        users_affected: 1, // The user being deleted
        tasks_affected: tasksCount,
        projects_affected: projectsCount,
        scores_affected: scoresCount,
        comments_affected: commentsCount,
        attachments_affected: attachmentsCount,
        audit_logs_affected: auditLogsCount
      };
    }
  );
}

async function softDeleteUserData(
  targetUserId: string,
  context: ComplianceContext,
  deletionId: string
): Promise<void> {
  await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Mark user as deleted
      await client.user.update({
        where: { id: targetUserId },
        data: {
          is_active: false,
          email: `deleted_${deletionId}@example.com`,
          first_name: '[DELETED]',
          last_name: '[DELETED]',
          updated_at: new Date()
        }
      });

      // Remove from task assignments
      await client.taskAssignee.deleteMany({
        where: { 
          user_id: targetUserId,
          task: { tenant_id: context.tenantId }
        }
      });

      // Remove from project memberships
      await client.projectMember.deleteMany({
        where: { 
          user_id: targetUserId,
          project: { tenant_id: context.tenantId }
        }
      });

      // Mark comments as deleted
      await client.taskComment.updateMany({
        where: {
          author_id: targetUserId,
          tenant_id: context.tenantId
        },
        data: {
          content: `[COMMENT DELETED - User deletion on ${new Date().toISOString()}]`,
          updated_at: new Date()
        }
      });
    }
  );
}

async function hardDeleteUserData(
  targetUserId: string,
  context: ComplianceContext,
  deletionId: string
): Promise<void> {
  await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Delete in order to respect foreign key constraints
      
      // Delete task assignments
      await client.taskAssignee.deleteMany({
        where: { 
          user_id: targetUserId,
          task: { tenant_id: context.tenantId }
        }
      });

      // Delete project memberships
      await client.projectMember.deleteMany({
        where: { 
          user_id: targetUserId,
          project: { tenant_id: context.tenantId }
        }
      });

      // Delete comments
      await client.taskComment.deleteMany({
        where: {
          author_id: targetUserId,
          tenant_id: context.tenantId
        }
      });

      // Delete attachments
      await client.taskAttachment.deleteMany({
        where: {
          uploaded_by: targetUserId,
          tenant_id: context.tenantId
        }
      });

      // Anonymize scores (keep for data integrity)
      await client.taskScore.updateMany({
        where: {
          OR: [
            { self_scored_by: targetUserId },
            { reviewed_by: targetUserId },
            { overridden_by: targetUserId }
          ],
          tenant_id: context.tenantId
        },
        data: {
          self_scored_by: null,
          reviewed_by: null,
          overridden_by: null,
          self_rationale: null,
          review_rationale: null,
          override_rationale: null,
          updated_at: new Date()
        }
      });

      // Delete user record
      await client.user.delete({
        where: { id: targetUserId }
      });
    }
  );
}

async function anonymizeUserData(
  targetUserId: string,
  context: ComplianceContext,
  deletionId: string
): Promise<void> {
  await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Anonymize user data
      await client.user.update({
        where: { id: targetUserId },
        data: {
          email: `anonymous_${deletionId}@example.com`,
          first_name: 'Anonymous',
          last_name: 'User',
          is_active: false,
          updated_at: new Date()
        }
      });

      // Anonymize comments
      await client.taskComment.updateMany({
        where: {
          author_id: targetUserId,
          tenant_id: context.tenantId
        },
        data: {
          content: `[COMMENT ANONYMIZED - User anonymization on ${new Date().toISOString()}]`,
          updated_at: new Date()
        }
      });

      // Anonymize score rationales
      await client.taskScore.updateMany({
        where: {
          OR: [
            { self_scored_by: targetUserId },
            { reviewed_by: targetUserId },
            { overridden_by: targetUserId }
          ],
          tenant_id: context.tenantId
        },
        data: {
          self_rationale: null,
          review_rationale: null,
          override_rationale: null,
          updated_at: new Date()
        }
      });
    }
  );
}

export async function getDeletionHistory(
  context: ComplianceContext,
  limit: number = 20
): Promise<any[]> {
  // Only admins can view deletion history
  if (context.role !== 'admin') {
    throw new Error('Only administrators can view deletion history');
  }

  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      const deletions = await client.auditLog.findMany({
        where: {
          tenant_id: context.tenantId,
          resource_type: { in: ['user_data', 'user_pii'] },
          action: { in: ['DELETE', 'REDACT'] }
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      });

      return deletions.map(deletion => ({
        deletion_id: deletion.resource_id,
        action: deletion.action,
        target_user_id: deletion.old_values?.target_user_id,
        target_email: deletion.old_values?.target_email,
        deletion_type: deletion.new_values?.deletion_type,
        impact: deletion.new_values?.impact,
        created_at: deletion.created_at,
        created_by: {
          name: `${deletion.user.first_name} ${deletion.user.last_name}`,
          email: deletion.user.email
        }
      }));
    }
  );
}