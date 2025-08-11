import OpenAI from 'openai';
import { getPromptTemplate, trackPromptUsage, replaceTemplateVariables } from './promptStore';
import { createAuditLog } from '@/lib/audit';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OpenAIRequest {
  promptTemplate: string;
  variables: Record<string, any>;
  schema?: any;
  maxRetries?: number;
  tenantId: string;
  userId: string;
  role: string;
}

interface OpenAIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  retries?: number;
  promptVersion?: string;
  rawOutput?: string;
}

function safeJSONParse<T>(jsonString: string, schema?: any): T | null {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Validate against schema if provided
    if (schema) {
      const validation = schema.safeParse(parsed);
      if (!validation.success) {
        console.error('Schema validation failed:', validation.error);
        return null;
      }
      return validation.data;
    }
    
    return parsed;
  } catch (error) {
    console.error('JSON parsing failed:', error);
    return null;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function callOpenAI<T>(request: OpenAIRequest): Promise<OpenAIResponse<T>> {
  const { promptTemplate, variables, schema, maxRetries = 3, tenantId, userId, role } = request;
  
  try {
    // Load versioned prompt template
    const template = await getPromptTemplate(promptTemplate);
    
    // Track prompt usage
    await trackPromptUsage(tenantId, template, { userId, role });
    
    // Prepare prompt with variables
    const prompt = replaceTemplateVariables(template.content, variables);
    
    let lastError: string = '';
    let rawOutput: string = '';
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Exponential backoff for retries
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
          await sleep(delay);
        }
        
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini', // The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: 'system',
              content: 'You are a precise business analyst. Respond only with valid JSON matching the requested schema. Do not include any explanatory text outside the JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        });
        
        const content = response.choices[0]?.message?.content;
        if (!content) {
          lastError = 'No content in OpenAI response';
          continue;
        }
        
        rawOutput = content;
        
        // Parse and validate JSON
        const parsedData = safeJSONParse<T>(content, schema);
        if (parsedData === null) {
          lastError = 'Failed to parse or validate JSON response';
          
          // Log invalid AI output for debugging
          if (schema) {
            try {
              await createAuditLog(null, {
                tenant_id: tenantId,
                user_id: userId,
                action: 'CREATE',
                resource_type: 'ai_output_invalid',
                resource_id: `${promptTemplate}-${Date.now()}`,
                old_values: null,
                new_values: {
                  prompt_template: promptTemplate,
                  prompt_version: template.version,
                  raw_output: content,
                  validation_error: 'Schema validation failed',
                  schema_name: schema.constructor.name
                },
                metadata: { 
                  ai_service: promptTemplate,
                  attempt: attempt + 1
                }
              });
            } catch (auditError) {
              console.error('Failed to log invalid AI output:', auditError);
            }
          }
          
          continue;
        }
        
        return {
          success: true,
          data: parsedData,
          retries: attempt,
          promptVersion: template.version,
          rawOutput: content
        };
        
      } catch (error: any) {
        lastError = error.message || 'Unknown OpenAI API error';
        console.error(`OpenAI attempt ${attempt + 1} failed:`, error);
      }
    }
    
    return {
      success: false,
      error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
      rawOutput
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error in callOpenAI'
    };
  }
}

// Helper function for testing with mocked responses
export function createMockOpenAIResponse<T>(data: T): OpenAIResponse<T> {
  return {
    success: true,
    data,
    retries: 0
  };
}

// Environment check for testing
export const isTestEnvironment = process.env.NODE_ENV === 'test';