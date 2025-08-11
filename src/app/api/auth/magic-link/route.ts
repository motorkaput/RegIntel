import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { sendMagicLink } from '@/lib/email/postmark';

const prisma = new PrismaClient();

const magicLinkSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = magicLinkSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      // For security, don't reveal if email exists
      return NextResponse.json({
        success: true,
        message: 'If the email exists, a magic link has been sent.',
      });
    }

    // Generate magic link token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with magic link token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        magic_link_token: token,
        magic_link_expires: expires,
      },
    });

    // Create magic link URL
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const magicLinkUrl = `${baseUrl}/magic-link/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email
    await sendMagicLink(email, magicLinkUrl);

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenant_id: user.tenant_id,
        actor_user_id: null,
        entity_type: 'User',
        entity_id: user.id,
        action: 'MAGIC_LINK_REQUESTED',
        before: {} as any,
        after: { email, token_expires: expires },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email address.',
    });
  } catch (error) {
    console.error('Magic link error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}