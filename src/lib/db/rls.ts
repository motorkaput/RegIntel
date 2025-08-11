import { PrismaClient } from '@prisma/client';

interface RLSContext {
  tenantId: string;
  role: string;
  userId: string;
}

export async function withRLS<T>(
  prisma: PrismaClient,
  context: RLSContext,
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  // Set RLS context using PostgreSQL session variables
  await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${context.tenantId}, true)`;
  await prisma.$executeRaw`SELECT set_config('app.current_role', ${context.role}, true)`;
  await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${context.userId}, true)`;
  
  try {
    const result = await fn(prisma);
    return result;
  } finally {
    // Clear context after operation
    await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', '', true)`;
    await prisma.$executeRaw`SELECT set_config('app.current_role', '', true)`;
    await prisma.$executeRaw`SELECT set_config('app.current_user_id', '', true)`;
  }
}