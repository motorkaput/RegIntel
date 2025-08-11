import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { createAuditLog } from '@/lib/audit';
import { Readable } from 'stream';

interface ExportContext {
  tenantId: string;
  userId: string;
  role: string;
}

interface ExportOptions {
  scope: 'org' | 'function' | 'project' | 'user';
  scope_id?: string;
  format: 'jsonl' | 'csv';
  include_pii?: boolean;
  date_from?: Date;
  date_to?: Date;
}

interface ExportMetadata {
  export_id: string;
  tenant_id: string;
  scope: string;
  scope_id?: string;
  format: string;
  record_count: number;
  file_size_bytes: number;
  created_at: Date;
  expires_at: Date;
}

export async function exportTenantData(
  options: ExportOptions,
  context: ExportContext
): Promise<{ stream: Readable; metadata: ExportMetadata }> {
  // Only admins can export data
  if (context.role !== 'admin') {
    throw new Error('Only administrators can export data');
  }

  const exportId = `exp_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Validate scope and permissions
      await validateExportScope(options, context);

      // Create audit log for export initiation
      await createAuditLog(client, {
        tenant_id: context.tenantId,
        user_id: context.userId,
        action: 'EXPORT',
        resource_type: 'tenant_data',
        resource_id: exportId,
        old_values: null,
        new_values: {
          scope: options.scope,
          scope_id: options.scope_id,
          format: options.format,
          include_pii: options.include_pii || false
        },
        metadata: {
          compliance_export: true,
          gdpr_request: true,
          export_id: exportId
        }
      });

      // Generate export data based on scope
      const exportData = await generateExportData(options, context);

      // Create readable stream
      const stream = createExportStream(exportData, options.format);

      // Create metadata
      const metadata: ExportMetadata = {
        export_id: exportId,
        tenant_id: context.tenantId,
        scope: options.scope,
        scope_id: options.scope_id,
        format: options.format,
        record_count: exportData.length,
        file_size_bytes: 0, // Will be calculated during streaming
        created_at: new Date(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      return { stream, metadata };
    }
  );
}

async function validateExportScope(
  options: ExportOptions,
  context: ExportContext
): Promise<void> {
  // Validate scope-specific permissions
  switch (options.scope) {
    case 'user':
      if (!options.scope_id) {
        throw new Error('User ID required for user scope export');
      }
      
      // Verify user exists and belongs to tenant
      const user = await prisma.user.findUnique({
        where: { 
          id: options.scope_id,
          tenant_id: context.tenantId 
        }
      });
      
      if (!user) {
        throw new Error('User not found or not accessible');
      }
      break;

    case 'project':
      if (!options.scope_id) {
        throw new Error('Project ID required for project scope export');
      }
      
      const project = await prisma.project.findUnique({
        where: { 
          id: options.scope_id,
          tenant_id: context.tenantId 
        }
      });
      
      if (!project) {
        throw new Error('Project not found or not accessible');
      }
      break;

    case 'function':
      if (!options.scope_id) {
        throw new Error('Function ID required for function scope export');
      }
      
      const func = await prisma.organizationFunction.findUnique({
        where: { 
          id: options.scope_id,
          tenant_id: context.tenantId 
        }
      });
      
      if (!func) {
        throw new Error('Function not found or not accessible');
      }
      break;

    case 'org':
      // Organization scope is allowed for admins
      break;

    default:
      throw new Error('Invalid export scope');
  }
}

async function generateExportData(
  options: ExportOptions,
  context: ExportContext
): Promise<any[]> {
  const data: any[] = [];

  // Build date filter
  const dateFilter: any = {};
  if (options.date_from || options.date_to) {
    if (options.date_from) dateFilter.gte = options.date_from;
    if (options.date_to) dateFilter.lte = options.date_to;
  }

  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Export users
      const userFilter: any = { tenant_id: context.tenantId };
      if (options.scope === 'user' && options.scope_id) {
        userFilter.id = options.scope_id;
      } else if (options.scope === 'function' && options.scope_id) {
        userFilter.function_id = options.scope_id;
      }

      const users = await client.user.findMany({
        where: userFilter,
        select: {
          id: true,
          email: options.include_pii ? true : false,
          first_name: options.include_pii ? true : false,
          last_name: options.include_pii ? true : false,
          role: true,
          function_id: true,
          skills: true,
          is_active: true,
          created_at: true,
          updated_at: true
        }
      });

      data.push(...users.map(user => ({
        type: 'user',
        ...user,
        // Redact PII if not explicitly requested
        email: options.include_pii ? user.email : '[REDACTED]',
        first_name: options.include_pii ? user.first_name : '[REDACTED]',
        last_name: options.include_pii ? user.last_name : '[REDACTED]'
      })));

      // Export projects if in scope
      if (['org', 'function', 'project'].includes(options.scope)) {
        const projectFilter: any = { tenant_id: context.tenantId };
        if (options.scope === 'project' && options.scope_id) {
          projectFilter.id = options.scope_id;
        }

        const projects = await client.project.findMany({
          where: projectFilter,
          include: {
            tasks: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                due_date: true,
                created_at: true,
                updated_at: true
              }
            }
          }
        });

        data.push(...projects.map(project => ({
          type: 'project',
          ...project
        })));
      }

      // Export audit logs
      const auditFilter: any = { 
        tenant_id: context.tenantId,
        ...(dateFilter && Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {})
      };

      if (options.scope === 'user' && options.scope_id) {
        auditFilter.user_id = options.scope_id;
      }

      const auditLogs = await client.auditLog.findMany({
        where: auditFilter,
        orderBy: { created_at: 'desc' },
        take: 10000 // Limit to prevent overwhelming exports
      });

      data.push(...auditLogs.map(log => ({
        type: 'audit_log',
        ...log
      })));

      // Export usage events
      const usageFilter: any = { 
        tenant_id: context.tenantId,
        ...(dateFilter && Object.keys(dateFilter).length > 0 ? { occurred_at: dateFilter } : {})
      };

      const usageEvents = await client.usageEvent.findMany({
        where: usageFilter,
        orderBy: { occurred_at: 'desc' },
        take: 10000
      });

      data.push(...usageEvents.map(event => ({
        type: 'usage_event',
        ...event
      })));

      // Export scores and evaluations
      if (['org', 'function', 'project', 'user'].includes(options.scope)) {
        const scoreFilter: any = { 
          tenant_id: context.tenantId,
          ...(dateFilter && Object.keys(dateFilter).length > 0 ? { updated_at: dateFilter } : {})
        };

        const scores = await client.taskScore.findMany({
          where: scoreFilter,
          include: {
            task: {
              select: {
                id: true,
                title: true,
                project_id: true
              }
            }
          }
        });

        data.push(...scores.map(score => ({
          type: 'task_score',
          ...score
        })));
      }

      return data;
    }
  );
}

function createExportStream(data: any[], format: 'jsonl' | 'csv'): Readable {
  let index = 0;

  return new Readable({
    objectMode: false,
    read() {
      if (index >= data.length) {
        this.push(null); // End of stream
        return;
      }

      const record = data[index++];
      
      if (format === 'jsonl') {
        this.push(JSON.stringify(record) + '\n');
      } else if (format === 'csv') {
        if (index === 1) {
          // Add CSV header
          const headers = Object.keys(record).join(',');
          this.push(headers + '\n');
        }
        
        // Add CSV row
        const values = Object.values(record).map(value => {
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          // Escape commas and quotes
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',');
        
        this.push(values + '\n');
      }
    }
  });
}

export async function getExportHistory(
  context: ExportContext,
  limit: number = 20
): Promise<any[]> {
  // Only admins can view export history
  if (context.role !== 'admin') {
    throw new Error('Only administrators can view export history');
  }

  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      const exports = await client.auditLog.findMany({
        where: {
          tenant_id: context.tenantId,
          resource_type: 'tenant_data',
          action: 'EXPORT'
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

      return exports.map(exp => ({
        export_id: exp.resource_id,
        scope: exp.new_values?.scope,
        format: exp.new_values?.format,
        created_at: exp.created_at,
        created_by: {
          name: `${exp.user.first_name} ${exp.user.last_name}`,
          email: exp.user.email
        },
        include_pii: exp.new_values?.include_pii || false
      }));
    }
  );
}