import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { saveToStorage } from '@/lib/storage/local';
import { createAuditLog } from '@/lib/audit';

// Zod schema for CSV validation
const csvRowSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'org_leader', 'functional_leader', 'project_lead', 'team_member'], {
    errorMap: () => ({ message: 'Invalid role' })
  }),
  manager_email: z.string().email('Valid email required').optional().or(z.literal('')),
  skills: z.string().transform(s => 
    s ? s.split(/[|,]/).map(x => x.trim()).filter(Boolean) : []
  ).optional(),
  location: z.string().optional(),
  aliases: z.string().transform(s => 
    s ? s.split(/[|,]/).map(x => x.trim()).filter(Boolean) : []
  ).optional(),
});

const uploadRequestSchema = z.object({
  data: z.array(csvRowSchema)
});

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;

    // Only admins can upload organization data
    if (role !== 'admin') {
      return NextResponse.json({ 
        error: 'Only administrators can upload organization data' 
      }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate request structure
    const requestValidation = uploadRequestSchema.safeParse(body);
    if (!requestValidation.success) {
      const errors: ValidationError[] = [];
      requestValidation.error.errors.forEach(error => {
        const path = error.path.join('.');
        errors.push({
          row: 0,
          field: path,
          message: error.message
        });
      });
      return NextResponse.json({ errors }, { status: 400 });
    }

    const { data: csvData } = requestValidation.data;

    // Detailed validation with row numbers
    const validationErrors: ValidationError[] = [];
    const validRows: any[] = [];

    for (let i = 0; i < csvData.length; i++) {
      const rowValidation = csvRowSchema.safeParse(csvData[i]);
      if (!rowValidation.success) {
        rowValidation.error.errors.forEach(error => {
          validationErrors.push({
            row: i + 1,
            field: error.path[0] as string,
            message: error.message
          });
        });
      } else {
        validRows.push(rowValidation.data);
      }
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return NextResponse.json({ errors: validationErrors }, { status: 400 });
    }

    // Process upload in transaction
    const result = await withRLS(
      prisma,
      { tenantId: tenant_id, role, userId: user_id },
      async (client) => {
        return await client.$transaction(async (tx) => {
          let created = 0;
          let updated = 0;
          let skillsAdded = 0;
          const userMap = new Map<string, string>(); // email -> id

          // First pass: Create/update users
          for (const row of validRows) {
            const existingUser = await tx.user.findUnique({
              where: {
                tenant_id_email: {
                  tenant_id,
                  email: row.email
                }
              }
            });

            const userData = {
              email: row.email,
              first_name: row.first_name,
              last_name: row.last_name,
              role: row.role,
              location: row.location || null,
              tenant_id,
              is_active: true,
            };

            let userId: string;

            if (existingUser) {
              // Update existing user
              const updatedUser = await tx.user.update({
                where: { id: existingUser.id },
                data: userData
              });
              userId = updatedUser.id;
              updated++;

              // Log update
              await createAuditLog(tx, {
                tenant_id,
                user_id: user_id,
                action: 'UPDATE',
                resource_type: 'user',
                resource_id: userId,
                old_values: existingUser,
                new_values: updatedUser,
                metadata: { source: 'csv_upload' }
              });
            } else {
              // Create new user
              const newUser = await tx.user.create({
                data: userData
              });
              userId = newUser.id;
              created++;

              // Log creation
              await createAuditLog(tx, {
                tenant_id,
                user_id: user_id,
                action: 'CREATE',
                resource_type: 'user',
                resource_id: userId,
                old_values: null,
                new_values: newUser,
                metadata: { source: 'csv_upload' }
              });
            }

            userMap.set(row.email, userId);

            // Handle skills
            if (row.skills && row.skills.length > 0) {
              for (const skillName of row.skills) {
                // Create skill if it doesn't exist
                const skill = await tx.skill.upsert({
                  where: {
                    tenant_id_name: {
                      tenant_id,
                      name: skillName
                    }
                  },
                  create: {
                    name: skillName,
                    tenant_id
                  },
                  update: {}
                });

                // Create user_skill relationship
                await tx.userSkill.upsert({
                  where: {
                    user_id_skill_id: {
                      user_id: userId,
                      skill_id: skill.id
                    }
                  },
                  create: {
                    user_id: userId,
                    skill_id: skill.id,
                    proficiency_level: 'intermediate' // Default
                  },
                  update: {}
                });

                skillsAdded++;
              }
            }

            // Handle aliases
            if (row.aliases && row.aliases.length > 0) {
              for (const aliasValue of row.aliases) {
                await tx.userAlias.upsert({
                  where: {
                    user_id_alias: {
                      user_id: userId,
                      alias: aliasValue
                    }
                  },
                  create: {
                    user_id: userId,
                    alias: aliasValue
                  },
                  update: {}
                });
              }
            }
          }

          // Second pass: Set up reporting relationships
          for (const row of validRows) {
            if (row.manager_email) {
              const managerId = userMap.get(row.manager_email);
              const userId = userMap.get(row.email);

              if (managerId && userId) {
                await tx.user.update({
                  where: { id: userId },
                  data: { manager_id: managerId }
                });
              }
            }
          }

          return { created, updated, skillsAdded };
        });
      }
    );

    // Save original CSV to storage
    const csvContent = convertToCSV(csvData);
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const uploadUrl = await saveToStorage(
      `tenants/${tenant_id}/uploads/${timestamp}.csv`,
      csvContent
    );

    return NextResponse.json({
      ok: true,
      created: result.created,
      updated: result.updated,
      skills_added: result.skillsAdded,
      upload_url: uploadUrl
    });

  } catch (error) {
    console.error('Organization upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (Array.isArray(value)) {
          return value.join('|');
        }
        return value || '';
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
}