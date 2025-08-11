interface AuditLogData {
  tenant_id: string;
  user_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  resource_type: string;
  resource_id: string;
  old_values: any;
  new_values: any;
  metadata?: any;
}

export async function createAuditLog(
  tx: any, // Prisma transaction client
  data: AuditLogData
): Promise<void> {
  await tx.auditLog.create({
    data: {
      tenant_id: data.tenant_id,
      user_id: data.user_id,
      action: data.action,
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      old_values: data.old_values ? JSON.stringify(data.old_values) : null,
      new_values: data.new_values ? JSON.stringify(data.new_values) : null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      created_at: new Date(),
    },
  });
}