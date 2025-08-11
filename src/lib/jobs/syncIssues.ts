import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { getProvider } from '@/lib/integrations';
import { createAuditLog } from '@/lib/audit';
import type { WorkItemInput } from '@/lib/integrations/provider';

interface SyncContext {
  tenantId: string;
  userId: string;
  role: string;
}

export async function syncAllIntegrations(): Promise<void> {
  console.log('Starting background sync of all integrations...');
  
  try {
    // Get all active integrations
    const integrations = await prisma.toolIntegration.findMany({
      where: {
        is_active: true,
        access_token: { not: null }
      }
    });

    for (const integration of integrations) {
      try {
        await syncIntegration(integration.id);
      } catch (error) {
        console.error(`Failed to sync integration ${integration.id}:`, error);
      }
    }
    
    console.log(`Completed sync of ${integrations.length} integrations`);
  } catch (error) {
    console.error('Failed to sync integrations:', error);
  }
}

export async function syncIntegration(integrationId: string): Promise<void> {
  const integration = await prisma.toolIntegration.findUnique({
    where: { id: integrationId },
    include: {
      tenant: true,
      created_by_user: true
    }
  });
  
  if (!integration || !integration.is_active || !integration.access_token) {
    console.warn(`Integration ${integrationId} not found or inactive`);
    return;
  }

  const provider = getProvider(integration.provider_name);
  const context: SyncContext = {
    tenantId: integration.tenant_id,
    userId: integration.created_by_user_id,
    role: 'admin' // Background jobs run with admin privileges
  };

  try {
    // Parse stored tokens
    const tokens = JSON.parse(integration.access_token);
    
    // Get configured projects for this integration
    const projectKeys = integration.config?.projects || [];
    
    for (const projectKey of projectKeys) {
      try {
        // Get last sync time for this project
        const lastSync = integration.last_sync_at || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago default
        
        // Fetch issues since last sync
        const issues = await provider.listIssues(tokens, projectKey, lastSync);
        
        console.log(`Found ${issues.length} updated issues for project ${projectKey}`);
        
        // Process each issue
        for (const issue of issues) {
          await upsertWorkItem(provider.toWorkItem(issue), context);
        }
        
      } catch (error) {
        console.error(`Failed to sync project ${projectKey}:`, error);
      }
    }
    
    // Update last sync time
    await prisma.toolIntegration.update({
      where: { id: integrationId },
      data: { 
        last_sync_at: new Date(),
        sync_status: 'completed',
        sync_error: null
      }
    });
    
  } catch (error: any) {
    console.error(`Integration sync failed for ${integrationId}:`, error);
    
    // Update sync status with error
    await prisma.toolIntegration.update({
      where: { id: integrationId },
      data: {
        sync_status: 'failed',
        sync_error: error.message
      }
    });
  }
}

export async function upsertWorkItem(
  workItemData: WorkItemInput,
  context: SyncContext
): Promise<void> {
  await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      try {
        // Check if work item already exists
        const existingWorkItem = await client.workItem.findUnique({
          where: {
            tenant_id_external_system_external_id: {
              tenant_id: context.tenantId,
              external_system: workItemData.external_system,
              external_id: workItemData.external_id
            }
          }
        });

        const workItemPayload = {
          tenant_id: context.tenantId,
          external_system: workItemData.external_system,
          external_id: workItemData.external_id,
          external_key: workItemData.external_key,
          title: workItemData.title,
          description: workItemData.description,
          status: workItemData.status,
          priority: workItemData.priority,
          assignee_email: workItemData.assignee_email,
          labels: workItemData.labels,
          external_created_at: workItemData.created_at,
          external_updated_at: workItemData.updated_at,
          due_date: workItemData.due_date,
          external_url: workItemData.external_url,
          synced_at: new Date()
        };

        let workItem;
        let action: 'CREATE' | 'UPDATE';

        if (existingWorkItem) {
          // Update existing work item
          workItem = await client.workItem.update({
            where: { id: existingWorkItem.id },
            data: {
              ...workItemPayload,
              updated_at: new Date()
            }
          });
          action = 'UPDATE';
        } else {
          // Create new work item
          workItem = await client.workItem.create({
            data: {
              ...workItemPayload,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          action = 'CREATE';
        }

        // Try to link to existing tasks
        await linkWorkItemToTasks(workItem.id, workItemData, context);

        // Create audit log
        await createAuditLog(client, {
          tenant_id: context.tenantId,
          user_id: context.userId,
          action,
          resource_type: 'work_item',
          resource_id: workItem.id,
          old_values: existingWorkItem || null,
          new_values: workItem,
          metadata: {
            sync_source: workItemData.external_system,
            external_key: workItemData.external_key,
            auto_sync: true
          }
        });

      } catch (error) {
        console.error('Failed to upsert work item:', error);
        throw error;
      }
    }
  );
}

async function linkWorkItemToTasks(
  workItemId: string,
  workItemData: WorkItemInput,
  context: SyncContext
): Promise<void> {
  await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Look for potential task matches
      const potentialTasks = await client.task.findMany({
        where: {
          tenant_id: context.tenantId,
          OR: [
            // Direct match by external key
            { external_key: workItemData.external_key },
            // Fuzzy match by title and assignee
            {
              AND: [
                { title: { contains: workItemData.title.substring(0, 20), mode: 'insensitive' } },
                workItemData.assignee_email ? {
                  assignees: {
                    some: {
                      user: {
                        email: workItemData.assignee_email
                      }
                    }
                  }
                } : {}
              ]
            }
          ]
        }
      });

      for (const task of potentialTasks) {
        // Check if link already exists
        const existingLink = await client.taskWorkItem.findUnique({
          where: {
            task_id_work_item_id: {
              task_id: task.id,
              work_item_id: workItemId
            }
          }
        });

        if (!existingLink) {
          // Create link
          await client.taskWorkItem.create({
            data: {
              task_id: task.id,
              work_item_id: workItemId,
              tenant_id: context.tenantId,
              linked_by: context.userId,
              link_type: 'auto', // vs 'manual'
              created_at: new Date()
            }
          });

          // Update task external_key if not set
          if (!task.external_key) {
            await client.task.update({
              where: { id: task.id },
              data: { external_key: workItemData.external_key }
            });
          }
        }
      }
    }
  );
}

export async function scheduleIntegrationSync(): Promise<void> {
  // In a production environment, this would integrate with a job scheduler
  // like node-cron, Bull Queue, or external services like GitHub Actions
  
  console.log('Scheduling integration sync job...');
  
  // For development, we'll just run immediately
  // In production, this would run on a schedule (e.g., every 15 minutes)
  try {
    await syncAllIntegrations();
    console.log('Integration sync job completed successfully');
  } catch (error) {
    console.error('Failed to run integration sync job:', error);
  }
}

// Helper function to determine if sync is needed based on webhook vs polling strategy
export function shouldSyncIntegration(integration: any): boolean {
  // Skip if not active or no tokens
  if (!integration.is_active || !integration.access_token) {
    return false;
  }

  // Always sync if no last sync
  if (!integration.last_sync_at) {
    return true;
  }

  // Sync if last attempt failed
  if (integration.sync_status === 'failed') {
    return true;
  }

  // Sync based on configured frequency
  const syncFrequency = integration.config?.sync_frequency || 15; // minutes
  const lastSync = new Date(integration.last_sync_at);
  const nextSync = new Date(lastSync.getTime() + syncFrequency * 60 * 1000);
  
  return new Date() >= nextSync;
}