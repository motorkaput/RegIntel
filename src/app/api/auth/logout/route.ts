import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/auth/session';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get current session for audit logging
    const session = await getServerSession();
    
    if (session) {
      // Audit log logout
      await prisma.auditLog.create({
        data: {
          tenant_id: session.tenantId,
          actor_user_id: session.userId,
          entity_type: 'User',
          entity_id: session.userId,
          action: 'LOGOUT',
          before: {} as any,
          after: { email: session.email },
        },
      });
    }

    // Clear auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if audit log fails, clear the cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } finally {
    await prisma.$disconnect();
  }
}