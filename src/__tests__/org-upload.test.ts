import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { POST } from '@/app/api/org-upload/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

// Mock data
const validCSVData = [
  {
    first_name: 'Asha',
    last_name: 'Menon',
    email: 'asha@acme.local',
    role: 'org_leader',
    manager_email: '',
    skills: 'product strategy|design leadership',
    location: 'Bengaluru',
    aliases: 'asham|asha.m'
  },
  {
    first_name: 'Ravi',
    last_name: 'Kapoor', 
    email: 'ravi@acme.local',
    role: 'functional_leader',
    manager_email: 'asha@acme.local',
    skills: 'backend',
    location: 'Delhi',
    aliases: 'r.kapoor'
  }
];

const invalidCSVData = [
  {
    first_name: '',
    last_name: 'Menon',
    email: 'asha@acme.local',
    role: 'org_leader',
    manager_email: '',
    skills: 'strategy',
    location: 'Bengaluru',
    aliases: ''
  },
  {
    first_name: 'Ravi',
    last_name: 'Kapoor',
    email: 'ravi-at-acme.local', // Invalid email
    role: 'functional_leader',
    manager_email: 'asha@acme.local',
    skills: 'backend',
    location: 'Delhi',
    aliases: ''
  }
];

// Mock JWT verification
jest.mock('@/lib/auth/jwt', () => ({
  getJWTFromCookies: jest.fn().mockResolvedValue({
    success: true,
    payload: {
      user_id: 'test-user-id',
      tenant_id: 'test-tenant-id',
      role: 'admin'
    }
  })
}));

// Mock storage
jest.mock('@/lib/storage/local', () => ({
  saveToStorage: jest.fn().mockResolvedValue('file:///tmp/test-upload.csv')
}));

// Mock withRLS
jest.mock('@/lib/db/rls', () => ({
  withRLS: jest.fn().mockImplementation(async (client, context, operation) => {
    return await operation(client);
  })
}));

describe('Organization Upload API', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({ where: { tenant_id: 'test-tenant-id' } });
    await prisma.userSkill.deleteMany({});
    await prisma.userAlias.deleteMany({});
    await prisma.user.deleteMany({ where: { tenant_id: 'test-tenant-id' } });
    await prisma.skill.deleteMany({ where: { tenant_id: 'test-tenant-id' } });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({ where: { tenant_id: 'test-tenant-id' } });
    await prisma.userSkill.deleteMany({});
    await prisma.userAlias.deleteMany({});
    await prisma.user.deleteMany({ where: { tenant_id: 'test-tenant-id' } });
    await prisma.skill.deleteMany({ where: { tenant_id: 'test-tenant-id' } });
  });

  describe('CSV Validation', () => {
    it('should validate valid CSV data', async () => {
      const request = new NextRequest('http://localhost:3000/api/org-upload', {
        method: 'POST',
        body: JSON.stringify({ data: validCSVData })
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.created).toBe(2);
    });

    it('should return validation errors for invalid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/org-upload', {
        method: 'POST',
        body: JSON.stringify({ data: invalidCSVData })
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const firstNameError = result.errors.find((e: any) => 
        e.field === 'first_name' && e.message === 'First name is required'
      );
      expect(firstNameError).toBeDefined();

      const emailError = result.errors.find((e: any) => 
        e.field === 'email' && e.message === 'Valid email is required'
      );
      expect(emailError).toBeDefined();
    });

    it('should handle invalid roles', async () => {
      const dataWithInvalidRole = [{
        ...validCSVData[0],
        role: 'cto' // Invalid role
      }];

      const request = new NextRequest('http://localhost:3000/api/org-upload', {
        method: 'POST',
        body: JSON.stringify({ data: dataWithInvalidRole })
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.errors).toBeDefined();
      
      const roleError = result.errors.find((e: any) => e.field === 'role');
      expect(roleError).toBeDefined();
    });
  });

  describe('Database Operations', () => {
    it('should create users and skills', async () => {
      const request = new NextRequest('http://localhost:3000/api/org-upload', {
        method: 'POST',
        body: JSON.stringify({ data: validCSVData })
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.created).toBe(2);
      expect(result.skills_added).toBeGreaterThan(0);

      // Verify users were created
      const users = await prisma.user.findMany({
        where: { tenant_id: 'test-tenant-id' }
      });
      expect(users.length).toBe(2);

      // Verify skills were created
      const skills = await prisma.skill.findMany({
        where: { tenant_id: 'test-tenant-id' }
      });
      expect(skills.length).toBeGreaterThan(0);

      // Verify reporting relationship
      const ravi = users.find(u => u.email === 'ravi@acme.local');
      const asha = users.find(u => u.email === 'asha@acme.local');
      expect(ravi?.manager_id).toBe(asha?.id);
    });

    it('should update existing users', async () => {
      // First upload
      const request1 = new NextRequest('http://localhost:3000/api/org-upload', {
        method: 'POST',
        body: JSON.stringify({ data: [validCSVData[0]] })
      });
      await POST(request1);

      // Second upload with updated data
      const updatedData = {
        ...validCSVData[0],
        location: 'Mumbai' // Changed location
      };

      const request2 = new NextRequest('http://localhost:3000/api/org-upload', {
        method: 'POST',
        body: JSON.stringify({ data: [updatedData] })
      });

      const response = await POST(request2);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);

      // Verify location was updated
      const user = await prisma.user.findUnique({
        where: {
          tenant_id_email: {
            tenant_id: 'test-tenant-id',
            email: 'asha@acme.local'
          }
        }
      });
      expect(user?.location).toBe('Mumbai');
    });

    it('should create audit logs', async () => {
      const request = new NextRequest('http://localhost:3000/api/org-upload', {
        method: 'POST',
        body: JSON.stringify({ data: [validCSVData[0]] })
      });

      await POST(request);

      // Verify audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: { tenant_id: 'test-tenant-id' }
      });
      expect(auditLogs.length).toBeGreaterThan(0);

      const createLog = auditLogs.find(log => log.action === 'CREATE');
      expect(createLog).toBeDefined();
      expect(createLog?.resource_type).toBe('user');
    });
  });

  describe('Authorization', () => {
    it('should reject non-admin users', async () => {
      // Mock non-admin user
      const { getJWTFromCookies } = require('@/lib/auth/jwt');
      getJWTFromCookies.mockResolvedValueOnce({
        success: true,
        payload: {
          user_id: 'test-user-id',
          tenant_id: 'test-tenant-id',
          role: 'team_member' // Non-admin role
        }
      });

      const request = new NextRequest('http://localhost:3000/api/org-upload', {
        method: 'POST',
        body: JSON.stringify({ data: validCSVData })
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('should reject unauthenticated requests', async () => {
      const { getJWTFromCookies } = require('@/lib/auth/jwt');
      getJWTFromCookies.mockResolvedValueOnce({
        success: false,
        payload: null
      });

      const request = new NextRequest('http://localhost:3000/api/org-upload', {
        method: 'POST',
        body: JSON.stringify({ data: validCSVData })
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });
});