import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const checks = {
    db: false,
    env: false,
    overall: false
  };

  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'SESSION_SECRET',
    'BOOTSTRAP_TOKEN'
  ];

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    checks.db = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  // Check required environment variables
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  checks.env = missingEnvVars.length === 0;

  // Overall readiness
  checks.overall = checks.db && checks.env;

  const response = {
    ok: checks.overall,
    time: new Date().toISOString(),
    service: 'permeate-enterprise',
    checks: {
      database: checks.db ? 'healthy' : 'unhealthy',
      environment: checks.env ? 'configured' : 'missing_variables',
      missing_env_vars: missingEnvVars
    }
  };

  const status = checks.overall ? 200 : 503;
  return NextResponse.json(response, { status });
}