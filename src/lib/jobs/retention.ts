import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { createAuditLog } from '@/lib/audit';

interface RetentionConfig {
  tenant_id: string;
  data_retention_days: number;
  enabled: boolean;
}

export async function runDataRetentionJob(): Promise<void> {
  console.log('Starting data retention job...');

  try {
    // Get all tenants with their retention settings
    const tenants = await prisma.tenant.findMany({
      where: { is_active: true },
      include: {
        settings: {
          select: {
            data_retention_days: true
          }
        }
      }
    });

    console.log(`Processing data retention for ${tenants.length} tenants`);

    for (const tenant of tenants) {
      try {
        const retentionDays = tenant.settings?.data_retention_days || 365; // Default 1 year
        await runRetentionForTenant(tenant.id, retentionDays);
      } catch (error) {
        console.error(`Failed to run retention for tenant ${tenant.id}:`, error);
        // Continue with other tenants
      }
    }

    console.log('Completed data retention job');
  } catch (error) {
    console.error('Failed to run data retention job:', error);
    throw error;
  }
}

export async function runRetentionForTenant(
  tenantId: string,
  retentionDays: number
): Promise<{
  audit_logs_deleted: number;
  usage_events_deleted: number;
  old_attachments_deleted: number;
  iterations_deleted: number;
}> {
  console.log(`Running retention for tenant ${tenantId} with ${retentionDays} day retention`);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // Use system context for retention operations
  const context = {
    tenantId,
    userId: 'system',
    role: 'admin'
  };

  return await withRLS(
    prisma,
    context,
    async (client) => {
      let auditLogsDeleted = 0;
      let usageEventsDeleted = 0;
      let attachmentsDeleted = 0;
      let iterationsDeleted = 0;

      // Delete old audit logs (except critical actions)
      const criticalActions = ['DELETE', 'EXPORT', 'REDACT'];
      const oldAuditLogs = await client.auditLog.findMany({
        where: {
          tenant_id: tenantId,
          created_at: { lt: cutoffDate },
          action: { notIn: criticalActions }
        },
        select: { id: true }
      });

      if (oldAuditLogs.length > 0) {
        const auditLogIds = oldAuditLogs.map(log => log.id);
        const deleteResult = await client.auditLog.deleteMany({
          where: { id: { in: auditLogIds } }
        });
        auditLogsDeleted = deleteResult.count;
      }

      // Delete old usage events
      const oldUsageEvents = await client.usageEvent.findMany({
        where: {
          tenant_id: tenantId,
          occurred_at: { lt: cutoffDate }
        },
        select: { id: true }
      });

      if (oldUsageEvents.length > 0) {
        const usageEventIds = oldUsageEvents.map(event => event.id);
        const deleteResult = await client.usageEvent.deleteMany({
          where: { id: { in: usageEventIds } }
        });
        usageEventsDeleted = deleteResult.count;
      }

      // Delete old task attachments (files)
      const oldAttachments = await client.taskAttachment.findMany({
        where: {
          tenant_id: tenantId,
          created_at: { lt: cutoffDate }
        },
        select: { id: true, storage_path: true, filename: true }
      });

      if (oldAttachments.length > 0) {
        // Delete files from storage
        for (const attachment of oldAttachments) {
          try {
            await deleteAttachmentFile(attachment.storage_path);
          } catch (error) {
            console.warn(`Failed to delete attachment file ${attachment.filename}:`, error);
          }
        }

        // Delete attachment records
        const attachmentIds = oldAttachments.map(att => att.id);
        const deleteResult = await client.taskAttachment.deleteMany({
          where: { id: { in: attachmentIds } }
        });
        attachmentsDeleted = deleteResult.count;
      }

      // Delete old score iterations (keep final scores)
      const oldIterations = await client.scoreIteration.findMany({
        where: {
          tenant_id: tenantId,
          created_at: { lt: cutoffDate }
        },
        select: { id: true }
      });

      if (oldIterations.length > 0) {
        const iterationIds = oldIterations.map(iter => iter.id);
        const deleteResult = await client.scoreIteration.deleteMany({
          where: { id: { in: iterationIds } }
        });
        iterationsDeleted = deleteResult.count;
      }

      // Create audit log for retention run
      await createAuditLog(client, {
        tenant_id: tenantId,
        user_id: 'system',
        action: 'DELETE',
        resource_type: 'retention_job',
        resource_id: `retention_${Date.now()}`,
        old_values: {
          cutoff_date: cutoffDate.toISOString(),
          retention_days: retentionDays
        },
        new_values: {
          audit_logs_deleted: auditLogsDeleted,
          usage_events_deleted: usageEventsDeleted,
          attachments_deleted: attachmentsDeleted,
          iterations_deleted: iterationsDeleted
        },
        metadata: {
          retention_job: true,
          automated_cleanup: true
        }
      });

      console.log(`Retention completed for tenant ${tenantId}:`, {
        auditLogsDeleted,
        usageEventsDeleted,
        attachmentsDeleted,
        iterationsDeleted
      });

      return {
        audit_logs_deleted: auditLogsDeleted,
        usage_events_deleted: usageEventsDeleted,
        old_attachments_deleted: attachmentsDeleted,
        iterations_deleted: iterationsDeleted
      };
    }
  );
}

async function deleteAttachmentFile(storagePath: string): Promise<void> {
  const storageMode = process.env.DEV_STORAGE_MODE || 'local';
  
  if (storageMode === 'local') {
    // Delete from local filesystem
    const { promises: fs } = await import('fs');
    try {
      await fs.unlink(storagePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, which is fine
    }
  } else {
    // TODO: Delete from S3 or other cloud storage
    console.warn('Cloud storage deletion not implemented yet');
  }
}

export async function getRetentionSettings(tenantId: string): Promise<RetentionConfig> {
  try {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenant_id: tenantId },
      select: { data_retention_days: true }
    });

    return {
      tenant_id: tenantId,
      data_retention_days: settings?.data_retention_days || 365,
      enabled: true
    };
  } catch (error) {
    console.error('Failed to get retention settings:', error);
    return {
      tenant_id: tenantId,
      data_retention_days: 365,
      enabled: false
    };
  }
}

export async function scheduleRetentionJob(): Promise<void> {
  // In a production environment, this would integrate with a job scheduler
  // like node-cron, Bull Queue, or external services
  
  console.log('Scheduling data retention job...');
  
  // For development, we'll just run immediately
  // In production, this would run on a schedule (e.g., weekly)
  try {
    await runDataRetentionJob();
    console.log('Data retention job scheduled and completed successfully');
  } catch (error) {
    console.error('Failed to run scheduled retention job:', error);
  }
}

export async function previewRetentionImpact(
  tenantId: string,
  retentionDays: number
): Promise<{
  cutoff_date: Date;
  audit_logs_to_delete: number;
  usage_events_to_delete: number;
  attachments_to_delete: number;
  iterations_to_delete: number;
  estimated_space_freed_mb: number;
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    const [
      auditLogsCount,
      usageEventsCount,
      attachmentsData,
      iterationsCount
    ] = await Promise.all([
      // Count old audit logs (except critical actions)
      prisma.auditLog.count({
        where: {
          tenant_id: tenantId,
          created_at: { lt: cutoffDate },
          action: { notIn: ['DELETE', 'EXPORT', 'REDACT'] }
        }
      }),
      
      // Count old usage events
      prisma.usageEvent.count({
        where: {
          tenant_id: tenantId,
          occurred_at: { lt: cutoffDate }
        }
      }),
      
      // Get old attachments with file sizes
      prisma.taskAttachment.findMany({
        where: {
          tenant_id: tenantId,
          created_at: { lt: cutoffDate }
        },
        select: { file_size: true }
      }),
      
      // Count old score iterations
      prisma.scoreIteration.count({
        where: {
          tenant_id: tenantId,
          created_at: { lt: cutoffDate }
        }
      })
    ]);

    const totalFileSize = attachmentsData.reduce((sum, att) => sum + (att.file_size || 0), 0);
    const estimatedSpaceFreedMB = Math.round(totalFileSize / (1024 * 1024) * 100) / 100;

    return {
      cutoff_date: cutoffDate,
      audit_logs_to_delete: auditLogsCount,
      usage_events_to_delete: usageEventsCount,
      attachments_to_delete: attachmentsData.length,
      iterations_to_delete: iterationsCount,
      estimated_space_freed_mb: estimatedSpaceFreedMB
    };
  } catch (error) {
    console.error('Failed to preview retention impact:', error);
    return {
      cutoff_date: cutoffDate,
      audit_logs_to_delete: 0,
      usage_events_to_delete: 0,
      attachments_to_delete: 0,
      iterations_to_delete: 0,
      estimated_space_freed_mb: 0
    };
  }
}