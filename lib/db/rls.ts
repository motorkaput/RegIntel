import { PrismaClient } from '@prisma/client';

export interface RLSContext {
  tenantId: string;
  role: string;
  userId: string;
}

export async function withRLS<T>(
  prisma: PrismaClient,
  context: RLSContext,
  fn: () => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Set PostgreSQL session variables for RLS
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${context.tenantId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.current_role', ${context.role}, true)`;
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${context.userId}, true)`;
    
    // Execute the function with RLS context set
    return await fn();
  });
}

export function getRLSContextFromHeaders(headers: Headers): RLSContext {
  const tenantId = headers.get('x-tenant-id');
  const role = headers.get('x-role');
  const userId = headers.get('x-user-id');

  if (!tenantId || !role || !userId) {
    throw new Error('Missing required RLS context headers');
  }

  return { tenantId, role, userId };
}

export async function withRLSFromRequest<T>(
  prisma: PrismaClient,
  request: Request,
  fn: () => Promise<T>
): Promise<T> {
  const context = getRLSContextFromHeaders(new Headers(request.headers));
  return await withRLS(prisma, context, fn);
}