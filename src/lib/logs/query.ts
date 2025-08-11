import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';

interface LogsContext {
  tenantId: string;
  userId: string;
  role: string;
}

interface LogQueryFilters {
  actor?: string; // User ID or email
  entity?: string; // Resource type
  action?: string; // Action type
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
  search?: string;
}

interface LogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_values: any;
  new_values: any;
  metadata: any;
  created_at: Date;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface PaginatedLogs {
  logs: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export async function queryAuditLogs(
  filters: LogQueryFilters,
  context: LogsContext
): Promise<PaginatedLogs> {
  // Only admins can query audit logs
  if (context.role !== 'admin') {
    throw new Error('Only administrators can view audit logs');
  }

  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 50, 100); // Cap at 100
  const offset = (page - 1) * limit;

  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Build where clause
      const whereClause: any = {
        tenant_id: context.tenantId
      };

      // Filter by actor (user)
      if (filters.actor) {
        if (filters.actor.includes('@')) {
          // Filter by email
          whereClause.user = {
            email: { contains: filters.actor, mode: 'insensitive' }
          };
        } else {
          // Filter by user ID or name
          whereClause.OR = [
            { user_id: filters.actor },
            {
              user: {
                OR: [
                  { first_name: { contains: filters.actor, mode: 'insensitive' } },
                  { last_name: { contains: filters.actor, mode: 'insensitive' } }
                ]
              }
            }
          ];
        }
      }

      // Filter by entity (resource type)
      if (filters.entity) {
        whereClause.resource_type = {
          contains: filters.entity,
          mode: 'insensitive'
        };
      }

      // Filter by action
      if (filters.action) {
        whereClause.action = {
          contains: filters.action,
          mode: 'insensitive'
        };
      }

      // Filter by date range
      if (filters.from || filters.to) {
        whereClause.created_at = {};
        if (filters.from) {
          whereClause.created_at.gte = filters.from;
        }
        if (filters.to) {
          whereClause.created_at.lte = filters.to;
        }
      }

      // Search in metadata or values
      if (filters.search) {
        whereClause.OR = [
          ...(whereClause.OR || []),
          { resource_id: { contains: filters.search, mode: 'insensitive' } },
          {
            metadata: {
              string_contains: filters.search
            }
          }
        ];
      }

      // Get total count for pagination
      const total = await client.auditLog.count({ where: whereClause });

      // Get paginated results
      const logs = await client.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit
      });

      const totalPages = Math.ceil(total / limit);

      return {
        logs: logs as LogEntry[],
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      };
    }
  );
}

export async function queryUsageEvents(
  filters: LogQueryFilters,
  context: LogsContext
): Promise<PaginatedLogs> {
  // Only admins can query usage events
  if (context.role !== 'admin') {
    throw new Error('Only administrators can view usage events');
  }

  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 50, 100);
  const offset = (page - 1) * limit;

  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Build where clause
      const whereClause: any = {
        tenant_id: context.tenantId
      };

      // Filter by event type
      if (filters.entity) {
        whereClause.event_type = {
          contains: filters.entity,
          mode: 'insensitive'
        };
      }

      // Filter by date range
      if (filters.from || filters.to) {
        whereClause.occurred_at = {};
        if (filters.from) {
          whereClause.occurred_at.gte = filters.from;
        }
        if (filters.to) {
          whereClause.occurred_at.lte = filters.to;
        }
      }

      // Search in metadata
      if (filters.search) {
        whereClause.metadata = {
          string_contains: filters.search
        };
      }

      // Get total count
      const total = await client.usageEvent.count({ where: whereClause });

      // Get paginated results
      const events = await client.usageEvent.findMany({
        where: whereClause,
        orderBy: { occurred_at: 'desc' },
        skip: offset,
        take: limit
      });

      const totalPages = Math.ceil(total / limit);

      // Transform usage events to match LogEntry format
      const logs: LogEntry[] = events.map(event => ({
        id: event.id,
        user_id: 'system',
        action: 'USAGE',
        resource_type: event.event_type,
        resource_id: event.id,
        old_values: null,
        new_values: {
          quantity: event.quantity,
          event_type: event.event_type
        },
        metadata: event.metadata,
        created_at: event.occurred_at,
        user: {
          first_name: 'System',
          last_name: 'Usage',
          email: 'system@internal'
        }
      }));

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      };
    }
  );
}

export async function getLogStatistics(
  context: LogsContext,
  timeRange: { from: Date; to: Date }
): Promise<{
  total_events: number;
  events_by_action: Record<string, number>;
  events_by_resource: Record<string, number>;
  events_by_user: Array<{ user_id: string; name: string; count: number }>;
  events_timeline: Array<{ date: string; count: number }>;
}> {
  // Only admins can view log statistics
  if (context.role !== 'admin') {
    throw new Error('Only administrators can view log statistics');
  }

  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      const whereClause = {
        tenant_id: context.tenantId,
        created_at: {
          gte: timeRange.from,
          lte: timeRange.to
        }
      };

      // Get total events
      const totalEvents = await client.auditLog.count({ where: whereClause });

      // Get events by action
      const actionStats = await client.auditLog.groupBy({
        by: ['action'],
        where: whereClause,
        _count: true
      });

      const eventsByAction: Record<string, number> = {};
      actionStats.forEach(stat => {
        eventsByAction[stat.action] = stat._count;
      });

      // Get events by resource type
      const resourceStats = await client.auditLog.groupBy({
        by: ['resource_type'],
        where: whereClause,
        _count: true
      });

      const eventsByResource: Record<string, number> = {};
      resourceStats.forEach(stat => {
        eventsByResource[stat.resource_type] = stat._count;
      });

      // Get events by user
      const userStats = await client.auditLog.groupBy({
        by: ['user_id'],
        where: whereClause,
        _count: true,
        orderBy: { _count: { user_id: 'desc' } },
        take: 10
      });

      const userIds = userStats.map(stat => stat.user_id);
      const users = await client.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          first_name: true,
          last_name: true
        }
      });

      const userMap = new Map(users.map(user => [user.id, user]));
      const eventsByUser = userStats.map(stat => {
        const user = userMap.get(stat.user_id);
        return {
          user_id: stat.user_id,
          name: user ? `${user.first_name} ${user.last_name}` : 'Unknown User',
          count: stat._count
        };
      });

      // Get events timeline (daily buckets)
      const timelineData = await client.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM audit_logs 
        WHERE tenant_id = ${context.tenantId}
          AND created_at >= ${timeRange.from}
          AND created_at <= ${timeRange.to}
        GROUP BY DATE(created_at)
        ORDER BY date
      ` as Array<{ date: Date; count: bigint }>;

      const eventsTimeline = timelineData.map(item => ({
        date: item.date.toISOString().split('T')[0],
        count: Number(item.count)
      }));

      return {
        total_events: totalEvents,
        events_by_action: eventsByAction,
        events_by_resource: eventsByResource,
        events_by_user: eventsByUser,
        events_timeline: eventsTimeline
      };
    }
  );
}

export async function exportLogs(
  filters: LogQueryFilters,
  context: LogsContext,
  format: 'csv' | 'json' = 'csv'
): Promise<string> {
  // Only admins can export logs
  if (context.role !== 'admin') {
    throw new Error('Only administrators can export logs');
  }

  // Get all matching logs (without pagination for export)
  const result = await queryAuditLogs(
    { ...filters, page: 1, limit: 10000 }, // Large limit for export
    context
  );

  if (format === 'csv') {
    return convertLogsToCSV(result.logs);
  } else {
    return JSON.stringify(result.logs, null, 2);
  }
}

function convertLogsToCSV(logs: LogEntry[]): string {
  if (logs.length === 0) {
    return 'No logs found';
  }

  const headers = [
    'Timestamp',
    'User',
    'Email',
    'Action',
    'Resource Type',
    'Resource ID',
    'Old Values',
    'New Values',
    'Metadata'
  ];

  const rows = logs.map(log => [
    log.created_at.toISOString(),
    `${log.user.first_name} ${log.user.last_name}`,
    log.user.email,
    log.action,
    log.resource_type,
    log.resource_id,
    log.old_values ? JSON.stringify(log.old_values) : '',
    log.new_values ? JSON.stringify(log.new_values) : '',
    log.metadata ? JSON.stringify(log.metadata) : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        // Escape commas and quotes in CSV
        const stringValue = String(cell || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}