import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { createAuditLog } from '@/lib/audit';

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  parent_id: z.string().uuid().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;
    const taskId = params.id;

    // Get comments for task
    const comments = await withRLS(
      prisma,
      { tenantId: tenant_id, userId: user_id, role },
      async (client) => {
        // Verify task exists and user has access
        const task = await client.task.findUnique({
          where: { id: taskId, tenant_id }
        });

        if (!task) {
          throw new Error('Task not found');
        }

        // Get comments with author info
        return await client.taskComment.findMany({
          where: { 
            task_id: taskId,
            tenant_id 
          },
          include: {
            author: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                profile_image_url: true
              }
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    profile_image_url: true
                  }
                }
              },
              orderBy: { created_at: 'asc' }
            }
          },
          where: {
            parent_id: null // Only top-level comments, replies are included
          },
          orderBy: { created_at: 'desc' }
        });
      }
    );

    return NextResponse.json(comments);

  } catch (error: any) {
    console.error('Get comments error:', error);
    
    if (error.message.includes('Task not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;
    const taskId = params.id;

    // Validate request body
    const body = await request.json();
    const requestValidation = createCommentSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: requestValidation.error.errors 
      }, { status: 400 });
    }

    const { content, parent_id } = requestValidation.data;

    // Create comment
    const comment = await withRLS(
      prisma,
      { tenantId: tenant_id, userId: user_id, role },
      async (client) => {
        // Verify task exists and user has access
        const task = await client.task.findUnique({
          where: { id: taskId, tenant_id }
        });

        if (!task) {
          throw new Error('Task not found');
        }

        // Verify parent comment exists if specified
        if (parent_id) {
          const parentComment = await client.taskComment.findUnique({
            where: { 
              id: parent_id,
              tenant_id,
              task_id: taskId 
            }
          });

          if (!parentComment) {
            throw new Error('Parent comment not found');
          }
        }

        // Create comment
        const newComment = await client.taskComment.create({
          data: {
            task_id: taskId,
            tenant_id,
            author_id: user_id,
            content,
            parent_id,
            created_at: new Date(),
            updated_at: new Date()
          },
          include: {
            author: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                profile_image_url: true
              }
            }
          }
        });

        // Create audit log
        await createAuditLog(client, {
          tenant_id,
          user_id,
          action: 'CREATE',
          resource_type: 'task_comment',
          resource_id: newComment.id,
          old_values: null,
          new_values: {
            task_id: taskId,
            content,
            parent_id
          },
          metadata: {
            task_title: task.title
          }
        });

        return newComment;
      }
    );

    return NextResponse.json(comment, { status: 201 });

  } catch (error: any) {
    console.error('Create comment error:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}