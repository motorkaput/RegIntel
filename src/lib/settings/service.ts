import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';
import { randomBytes } from 'crypto';

interface SettingsContext {
  tenantId: string;
  userId: string;
  role: string;
}

const TenantSettingsSchema = z.object({
  email_from: z.string().email().optional(),
  data_retention_days: z.number().int().min(30).max(2555).optional(), // 30 days to 7 years
  rate_limit_qph: z.number().int().min(100).max(100000).optional(), // 100 to 100k queries per hour
  payment_provider: z.enum(['razorpay', 'stripe', 'mock']).optional(),
  pricing_json: z.string().optional(),
  sso_enabled: z.boolean().optional(),
  sso_provider: z.string().optional(),
  sso_client_id: z.string().optional(),
  sso_issuer: z.string().optional(),
  strict_mode: z.boolean().optional(),
  backup_enabled: z.boolean().optional(),
  api_access_enabled: z.boolean().optional()
});

export type TenantSettingsInput = z.infer<typeof TenantSettingsSchema>;

export interface TenantSettings {
  id: string;
  tenant_id: string;
  email_from: string | null;
  data_retention_days: number;
  rate_limit_qph: number;
  payment_provider: string | null;
  razorpay_key_id: string | null;
  razorpay_key_secret: string | null;
  pricing_json: string | null;
  sso_enabled: boolean;
  sso_provider: string | null;
  sso_client_id: string | null;
  sso_issuer: string | null;
  sso_metadata: any;
  strict_mode: boolean;
  backup_enabled: boolean;
  api_access_enabled: boolean;
  bootstrap_token: string;
  created_at: Date;
  updated_at: Date;
}

export async function getTenantSettings(
  tenantId: string,
  context: SettingsContext
): Promise<TenantSettings | null> {
  // Only admins can view tenant settings
  if (context.role !== 'admin') {
    throw new Error('Only administrators can view tenant settings');
  }

  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      const settings = await client.tenantSettings.findUnique({
        where: { tenant_id: tenantId }
      });

      if (!settings) {
        // Create default settings if they don't exist
        return await createDefaultSettings(tenantId, context);
      }

      return settings;
    }
  );
}

export async function updateTenantSettings(
  tenantId: string,
  updates: TenantSettingsInput,
  context: SettingsContext
): Promise<TenantSettings> {
  // Only admins can update tenant settings
  if (context.role !== 'admin') {
    throw new Error('Only administrators can update tenant settings');
  }

  // Validate input
  const validatedUpdates = TenantSettingsSchema.parse(updates);

  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Get current settings
      const currentSettings = await client.tenantSettings.findUnique({
        where: { tenant_id: tenantId }
      });

      if (!currentSettings) {
        throw new Error('Tenant settings not found');
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date()
      };

      if (validatedUpdates.email_from !== undefined) {
        updateData.email_from = validatedUpdates.email_from;
      }
      if (validatedUpdates.data_retention_days !== undefined) {
        updateData.data_retention_days = validatedUpdates.data_retention_days;
      }
      if (validatedUpdates.rate_limit_qph !== undefined) {
        updateData.rate_limit_qph = validatedUpdates.rate_limit_qph;
      }
      if (validatedUpdates.payment_provider !== undefined) {
        updateData.payment_provider = validatedUpdates.payment_provider;
      }
      if (validatedUpdates.pricing_json !== undefined) {
        updateData.pricing_json = validatedUpdates.pricing_json;
      }
      if (validatedUpdates.sso_enabled !== undefined) {
        updateData.sso_enabled = validatedUpdates.sso_enabled;
      }
      if (validatedUpdates.sso_provider !== undefined) {
        updateData.sso_provider = validatedUpdates.sso_provider;
      }
      if (validatedUpdates.sso_client_id !== undefined) {
        updateData.sso_client_id = validatedUpdates.sso_client_id;
      }
      if (validatedUpdates.sso_issuer !== undefined) {
        updateData.sso_issuer = validatedUpdates.sso_issuer;
      }
      if (validatedUpdates.strict_mode !== undefined) {
        updateData.strict_mode = validatedUpdates.strict_mode;
      }
      if (validatedUpdates.backup_enabled !== undefined) {
        updateData.backup_enabled = validatedUpdates.backup_enabled;
      }
      if (validatedUpdates.api_access_enabled !== undefined) {
        updateData.api_access_enabled = validatedUpdates.api_access_enabled;
      }

      // Update settings
      const updatedSettings = await client.tenantSettings.update({
        where: { tenant_id: tenantId },
        data: updateData
      });

      // Create audit log
      await createAuditLog(client, {
        tenant_id: tenantId,
        user_id: context.userId,
        action: 'UPDATE',
        resource_type: 'tenant_settings',
        resource_id: updatedSettings.id,
        old_values: {
          email_from: currentSettings.email_from,
          data_retention_days: currentSettings.data_retention_days,
          rate_limit_qph: currentSettings.rate_limit_qph,
          payment_provider: currentSettings.payment_provider,
          sso_enabled: currentSettings.sso_enabled,
          strict_mode: currentSettings.strict_mode
        },
        new_values: {
          email_from: updatedSettings.email_from,
          data_retention_days: updatedSettings.data_retention_days,
          rate_limit_qph: updatedSettings.rate_limit_qph,
          payment_provider: updatedSettings.payment_provider,
          sso_enabled: updatedSettings.sso_enabled,
          strict_mode: updatedSettings.strict_mode
        },
        metadata: {
          settings_update: true,
          fields_updated: Object.keys(updateData).filter(key => key !== 'updated_at')
        }
      });

      return updatedSettings;
    }
  );
}

export async function rotateBootstrapToken(
  tenantId: string,
  context: SettingsContext
): Promise<{ token: string; old_token: string }> {
  // Only admins can rotate bootstrap tokens
  if (context.role !== 'admin') {
    throw new Error('Only administrators can rotate bootstrap tokens');
  }

  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Get current settings
      const currentSettings = await client.tenantSettings.findUnique({
        where: { tenant_id: tenantId }
      });

      if (!currentSettings) {
        throw new Error('Tenant settings not found');
      }

      const oldToken = currentSettings.bootstrap_token;
      const newToken = generateBootstrapToken();

      // Update bootstrap token
      const updatedSettings = await client.tenantSettings.update({
        where: { tenant_id: tenantId },
        data: {
          bootstrap_token: newToken,
          updated_at: new Date()
        }
      });

      // Create audit log
      await createAuditLog(client, {
        tenant_id: tenantId,
        user_id: context.userId,
        action: 'UPDATE',
        resource_type: 'bootstrap_token',
        resource_id: updatedSettings.id,
        old_values: { token_length: oldToken.length },
        new_values: { token_length: newToken.length },
        metadata: {
          token_rotation: true,
          security_action: true
        }
      });

      return {
        token: newToken,
        old_token: oldToken
      };
    }
  );
}

export async function setSSOConfig(
  tenantId: string,
  config: {
    provider: string;
    clientId: string;
    issuer: string;
    enabled: boolean;
    metadata?: any;
  },
  context: SettingsContext
): Promise<TenantSettings> {
  // Only admins can configure SSO
  if (context.role !== 'admin') {
    throw new Error('Only administrators can configure SSO');
  }

  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Get current settings
      const currentSettings = await client.tenantSettings.findUnique({
        where: { tenant_id: tenantId }
      });

      if (!currentSettings) {
        throw new Error('Tenant settings not found');
      }

      // Update SSO configuration
      const updatedSettings = await client.tenantSettings.update({
        where: { tenant_id: tenantId },
        data: {
          sso_enabled: config.enabled,
          sso_provider: config.provider,
          sso_client_id: config.clientId,
          sso_issuer: config.issuer,
          sso_metadata: config.metadata || {},
          updated_at: new Date()
        }
      });

      // Create audit log
      await createAuditLog(client, {
        tenant_id: tenantId,
        user_id: context.userId,
        action: 'UPDATE',
        resource_type: 'sso_config',
        resource_id: updatedSettings.id,
        old_values: {
          sso_enabled: currentSettings.sso_enabled,
          sso_provider: currentSettings.sso_provider
        },
        new_values: {
          sso_enabled: config.enabled,
          sso_provider: config.provider
        },
        metadata: {
          sso_configuration: true,
          provider: config.provider,
          enabled: config.enabled
        }
      });

      return updatedSettings;
    }
  );
}

async function createDefaultSettings(
  tenantId: string,
  context: SettingsContext
): Promise<TenantSettings> {
  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      const defaultSettings = await client.tenantSettings.create({
        data: {
          tenant_id: tenantId,
          email_from: null,
          data_retention_days: 365, // 1 year default
          rate_limit_qph: 1000, // 1000 queries per hour default
          payment_provider: 'mock',
          pricing_json: null,
          sso_enabled: false,
          sso_provider: null,
          sso_client_id: null,
          sso_issuer: null,
          sso_metadata: {},
          strict_mode: false,
          backup_enabled: true,
          api_access_enabled: true,
          bootstrap_token: generateBootstrapToken(),
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Create audit log
      await createAuditLog(client, {
        tenant_id: tenantId,
        user_id: context.userId,
        action: 'CREATE',
        resource_type: 'tenant_settings',
        resource_id: defaultSettings.id,
        old_values: null,
        new_values: {
          data_retention_days: defaultSettings.data_retention_days,
          rate_limit_qph: defaultSettings.rate_limit_qph,
          payment_provider: defaultSettings.payment_provider
        },
        metadata: {
          default_settings_created: true
        }
      });

      return defaultSettings;
    }
  );
}

function generateBootstrapToken(): string {
  return randomBytes(32).toString('hex');
}

export async function validateAdminAccess(
  tenantId: string,
  userId: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        tenant_id: tenantId,
        is_active: true
      },
      select: { role: true }
    });

    return user?.role === 'admin';
  } catch (error) {
    console.error('Failed to validate admin access:', error);
    return false;
  }
}

export async function getAdminCount(tenantId: string): Promise<number> {
  try {
    return await prisma.user.count({
      where: {
        tenant_id: tenantId,
        role: 'admin',
        is_active: true
      }
    });
  } catch (error) {
    console.error('Failed to get admin count:', error);
    return 0;
  }
}