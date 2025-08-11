import { NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';

export async function GET() {
  try {
    const payload = await getJWTFromCookies();
    
    if (!payload) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const user = await withRLS(
      prisma,
      { tenantId: payload.tenant_id, role: payload.role, userId: payload.sub },
      async (client) => {
        return await client.user.findUnique({
          where: { id: payload.sub },
          include: { tenant: true },
        });
      }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        domain: user.tenant.domain,
      },
    });
  } catch (error) {
    console.error('PerMeaTe user fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}