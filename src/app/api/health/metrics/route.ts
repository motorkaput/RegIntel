import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Basic metrics - placeholder for Prometheus integration
    const [
      activeTenantsCount,
      totalUsersCount,
      activeTascsCount,
      recentLogsCount
    ] = await Promise.all([
      prisma.tenant.count({ where: { is_active: true } }),
      prisma.user.count({ where: { is_active: true } }),
      prisma.task.count({ where: { status: { in: ['todo', 'in_progress', 'review'] } } }),
      prisma.auditLog.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    const metrics = {
      timestamp: new Date().toISOString(),
      service: 'permeate-enterprise',
      counters: {
        active_tenants: activeTenantsCount,
        total_users: totalUsersCount,
        active_tasks: activeTascsCount,
        recent_audit_logs: recentLogsCount
      },
      gauges: {
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        uptime_seconds: Math.floor(process.uptime()),
        node_version: process.version
      },
      info: {
        node_env: process.env.NODE_ENV,
        version: process.env.npm_package_version || 'unknown'
      }
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Metrics collection failed:', error);
    return NextResponse.json(
      {
        error: 'Metrics collection failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}