import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { createAuditLog } from '@/lib/audit';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const STORAGE_MODE = process.env.DEV_STORAGE_MODE || 'local';
const STORAGE_BASE = process.env.DEV_STORAGE_MODE === 'local' 
  ? '/tmp/permeate-storage' 
  : process.env.S3_BUCKET || 'permeate-files';

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

    // Get attachments for task
    const attachments = await withRLS(
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

        // Get attachments with uploader info
        return await client.taskAttachment.findMany({
          where: { 
            task_id: taskId,
            tenant_id 
          },
          include: {
            uploaded_by_user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        });
      }
    );

    return NextResponse.json(attachments);

  } catch (error: any) {
    console.error('Get attachments error:', error);
    
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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'File type not allowed' 
      }, { status: 400 });
    }

    // Create attachment record and store file
    const attachment = await withRLS(
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

        // Generate unique file ID and storage path
        const fileId = randomUUID();
        const fileExtension = path.extname(file.name);
        const storedFileName = `${fileId}${fileExtension}`;
        
        let filePath: string;
        let fileUrl: string;

        if (STORAGE_MODE === 'local') {
          // Local development storage
          const storageDir = path.join(STORAGE_BASE, 'tenants', tenant_id, 'attachments');
          filePath = path.join(storageDir, storedFileName);
          fileUrl = `/api/files/attachments/${tenant_id}/${storedFileName}`;
          
          // Ensure directory exists
          await fs.mkdir(storageDir, { recursive: true });
          
          // Write file to disk
          const arrayBuffer = await file.arrayBuffer();
          await fs.writeFile(filePath, Buffer.from(arrayBuffer));
        } else {
          // S3 storage (placeholder for production)
          filePath = `tenants/${tenant_id}/attachments/${storedFileName}`;
          fileUrl = `https://${STORAGE_BASE}.s3.amazonaws.com/${filePath}`;
          
          // TODO: Implement S3 upload
          throw new Error('S3 storage not implemented yet');
        }

        // Create attachment record
        const newAttachment = await client.taskAttachment.create({
          data: {
            task_id: taskId,
            tenant_id,
            filename: file.name,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type,
            storage_path: filePath,
            file_url: fileUrl,
            uploaded_by: user_id,
            created_at: new Date()
          },
          include: {
            uploaded_by_user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        });

        // Create audit log
        await createAuditLog(client, {
          tenant_id,
          user_id,
          action: 'CREATE',
          resource_type: 'task_attachment',
          resource_id: newAttachment.id,
          old_values: null,
          new_values: {
            task_id: taskId,
            filename: file.name,
            file_size: file.size,
            mime_type: file.type
          },
          metadata: {
            task_title: task.title,
            storage_mode: STORAGE_MODE
          }
        });

        return newAttachment;
      }
    );

    return NextResponse.json(attachment, { status: 201 });

  } catch (error: any) {
    console.error('Upload attachment error:', error);
    
    if (error.message.includes('Task not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get attachment ID from query params
    const url = new URL(request.url);
    const attachmentId = url.searchParams.get('attachment_id');
    
    if (!attachmentId) {
      return NextResponse.json({ error: 'Attachment ID required' }, { status: 400 });
    }

    // Delete attachment
    await withRLS(
      prisma,
      { tenantId: tenant_id, userId: user_id, role },
      async (client) => {
        // Get attachment details
        const attachment = await client.taskAttachment.findUnique({
          where: { 
            id: attachmentId,
            task_id: taskId,
            tenant_id 
          },
          include: {
            task: { select: { title: true } }
          }
        });

        if (!attachment) {
          throw new Error('Attachment not found');
        }

        // Check permissions - only uploader, task assignees, or project leads can delete
        const canDelete = attachment.uploaded_by === user_id || 
                          ['project_lead', 'functional_leader', 'org_leader', 'admin'].includes(role);
        
        if (!canDelete) {
          throw new Error('Insufficient permissions to delete this attachment');
        }

        // Delete file from storage
        if (STORAGE_MODE === 'local') {
          try {
            await fs.unlink(attachment.storage_path);
          } catch (error) {
            console.warn('Failed to delete file from disk:', error);
          }
        } else {
          // TODO: Delete from S3
        }

        // Delete attachment record
        await client.taskAttachment.delete({
          where: { id: attachmentId }
        });

        // Create audit log
        await createAuditLog(client, {
          tenant_id,
          user_id,
          action: 'DELETE',
          resource_type: 'task_attachment',
          resource_id: attachmentId,
          old_values: {
            filename: attachment.filename,
            file_size: attachment.file_size
          },
          new_values: null,
          metadata: {
            task_title: attachment.task.title,
            storage_mode: STORAGE_MODE
          }
        });
      }
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete attachment error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}