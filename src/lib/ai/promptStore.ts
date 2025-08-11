import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';

interface PromptTemplate {
  name: string;
  version: string;
  checksum: string;
  content: string;
}

interface PromptVersion {
  id: string;
  tenant_id: string;
  name: string;
  checksum: string;
  created_at: Date;
}

const PROMPT_DIRECTORY = path.join(process.cwd(), 'src/lib/ai/prompts');

function computeChecksum(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function extractVersion(content: string): string {
  // Simple versioning based on content hash (first 8 chars)
  const checksum = computeChecksum(content);
  return checksum.substring(0, 8);
}

async function loadPromptFile(filename: string): Promise<PromptTemplate> {
  const filePath = path.join(PROMPT_DIRECTORY, filename);
  
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const checksum = computeChecksum(content);
    const version = extractVersion(content);
    const name = filename.replace('.txt', '');
    
    return {
      name,
      version,
      checksum,
      content: content.trim()
    };
  } catch (error) {
    throw new Error(`Failed to load prompt template: ${filename}`);
  }
}

export async function getPromptTemplate(templateName: string): Promise<PromptTemplate> {
  const filename = `${templateName}.txt`;
  return await loadPromptFile(filename);
}

export async function trackPromptUsage(
  tenantId: string,
  template: PromptTemplate,
  context: { userId: string; role: string }
): Promise<void> {
  try {
    await withRLS(
      prisma,
      { tenantId, userId: context.userId, role: context.role },
      async (client) => {
        // Check if this prompt version is already tracked
        const existing = await client.promptVersion.findUnique({
          where: {
            tenant_id_name_checksum: {
              tenant_id: tenantId,
              name: template.name,
              checksum: template.checksum
            }
          }
        });

        if (!existing) {
          // Track new prompt version
          await client.promptVersion.create({
            data: {
              tenant_id: tenantId,
              name: template.name,
              version: template.version,
              checksum: template.checksum,
              content: template.content,
              created_at: new Date()
            }
          });
        }
      }
    );
  } catch (error) {
    console.error('Failed to track prompt usage:', error);
    // Don't throw - this shouldn't break AI operations
  }
}

export async function getAllPromptTemplates(): Promise<PromptTemplate[]> {
  try {
    const files = await fs.readdir(PROMPT_DIRECTORY);
    const promptFiles = files.filter(file => file.endsWith('.txt'));
    
    const templates = await Promise.all(
      promptFiles.map(file => loadPromptFile(file))
    );
    
    return templates;
  } catch (error) {
    console.error('Failed to load prompt templates:', error);
    return [];
  }
}

export async function getPromptHistory(
  tenantId: string,
  templateName: string,
  context: { userId: string; role: string }
): Promise<PromptVersion[]> {
  return await withRLS(
    prisma,
    { tenantId, userId: context.userId, role: context.role },
    async (client) => {
      return await client.promptVersion.findMany({
        where: {
          tenant_id: tenantId,
          name: templateName
        },
        orderBy: {
          created_at: 'desc'
        }
      });
    }
  );
}

// Template variable replacement
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const replacement = typeof value === 'object' 
      ? JSON.stringify(value, null, 2) 
      : String(value);
    result = result.replaceAll(placeholder, replacement);
  }
  
  return result;
}