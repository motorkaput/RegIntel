import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import multer from 'multer';
import { nanoid } from 'nanoid';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';

// OpenAI initialization
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Prisma client for PerMeaTe Enterprise
const prisma = new PrismaClient();

// JWT secret for PerMeaTe Enterprise
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

// Helper functions for PerMeaTe Enterprise auth
async function signJWT(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware for existing Replit Auth
  await setupAuth(app);

  // PerMeaTe Enterprise Authentication Routes
  // Registration (Bootstrap)
  app.post('/api/permeate/auth/register', async (req, res) => {
    try {
      const { tenant_name, domain, admin_email, password, first_name, last_name, bootstrap_token } = req.body;

      // Verify bootstrap token
      if (bootstrap_token !== process.env.BOOTSTRAP_TOKEN) {
        return res.status(403).json({ error: 'Invalid bootstrap token' });
      }

      // Check if tenant domain already exists
      const existingTenant = await prisma.tenant.findUnique({
        where: { domain }
      });

      if (existingTenant) {
        return res.status(409).json({ error: 'Domain already exists' });
      }

      // Check if user email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: admin_email }
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create tenant and admin user in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create tenant
        const tenant = await tx.tenant.create({
          data: {
            name: tenant_name,
            domain,
            settings: {},
          },
        });

        // Create admin user
        const user = await tx.user.create({
          data: {
            tenant_id: tenant.id,
            email: admin_email,
            password_hash: hashedPassword,
            role: 'admin',
            first_name,
            last_name,
            email_verified: true,
          },
        });

        // Create billing subscription
        await tx.billingSubscription.create({
          data: {
            tenant_id: tenant.id,
            plan_name: 'starter',
            status: 'active',
            provider: 'razorpay',
            starts_at: new Date(),
            ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            tenant_id: tenant.id,
            actor_user_id: user.id,
            entity_type: 'Tenant',
            entity_id: tenant.id,
            action: 'REGISTER_ADMIN',
            before: {} as any,
            after: { tenant_name, admin_email, role: 'admin' },
          },
        });

        return { user, tenant };
      });

      // Generate JWT
      const jwtToken = await signJWT({
        sub: result.user.id,
        tenant_id: result.tenant.id,
        role: result.user.role,
        email: result.user.email,
      });

      // Set cookie and return response
      res.cookie('permeate-auth-token', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.json({
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          first_name: result.user.first_name,
          last_name: result.user.last_name,
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          domain: result.tenant.domain,
        },
      });
    } catch (error) {
      console.error('PerMeaTe registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login
  app.post('/api/permeate/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true },
      });

      if (!user || !await bcrypt.compare(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const jwtToken = await signJWT({
        sub: user.id,
        tenant_id: user.tenant_id,
        role: user.role,
        email: user.email,
      });

      // Set cookie
      res.cookie('permeate-auth-token', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenant_id: user.tenant_id,
          actor_user_id: user.id,
          entity_type: 'User',
          entity_id: user.id,
          action: 'LOGIN_SUCCESS',
          before: {} as any,
          after: { email, timestamp: new Date() },
        },
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
        },
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          domain: user.tenant.domain,
        },
      });
    } catch (error) {
      console.error('PerMeaTe login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Logout
  app.post('/api/permeate/auth/logout', (req, res) => {
    res.clearCookie('permeate-auth-token');
    res.json({ success: true });
  });

  // Get current user
  app.get('/api/permeate/auth/user', async (req, res) => {
    try {
      const token = req.cookies['permeate-auth-token'];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const payload = await verifyJWT(token);
      if (!payload) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub as string },
        include: { tenant: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          domain: user.tenant.domain,
        },
      });
    } catch (error) {
      console.error('PerMeaTe user fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Subscription routes
  app.get('/api/subscription-plans', async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getUserSubscription(userId);
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Document routes (protected)
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const documents = await storage.getUserDocuments(userId, limit);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Performance metrics routes
  app.get('/api/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const type = req.query.type as string;
      const metrics = await storage.getUserMetrics(userId, type);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Fetch Patterns Beta Login
  app.post('/api/beta-login', async (req, res) => {
    const { username, password } = req.body;
    const validCredentials = username === "BetaUser" && password === "9f4e7d2a8b1c5e3f6a0d7b9c2e4f8a1b";

    if (!validCredentials) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = {
      id: 'beta_user_fp',
      username: 'BetaUser',
      email: 'beta@fetchpatterns.com',
      userType: 'beta_user',
    };

    // Store user in session for Fetch Patterns
    req.session.fetchPatternsUser = user;
    
    res.json(user);
  });

  // Fetch Patterns document analysis routes
  app.get('/api/fp/analyses', async (req, res) => {
    try {
      const sessionUser = req.session.fetchPatternsUser;
      if (!sessionUser?.id) {
        return res.status(401).json({ message: "Please log in to access your analyses" });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const analyses = await storage.getUserDocumentAnalyses(sessionUser.id, limit);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  // Document upload for Fetch Patterns
  app.post('/api/fp/upload', upload.array('documents', 20), async (req, res) => {
    try {
      const sessionUser = req.session.fetchPatternsUser;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      if (!sessionUser?.id) {
        return res.status(401).json({ message: "User not authenticated. Please log in again." });
      }

      const sessionLimit = 20;
      if (files.length > sessionLimit) {
        return res.status(429).json({ message: `Please upload no more than ${sessionLimit} documents at once` });
      }

      const analysisPromises = files.map(async (file) => {
        const analysisId = nanoid();
        
        const analysis = {
          id: analysisId,
          userId: sessionUser.id,
          filename: `${nanoid()}_${file.originalname}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          status: 'processing' as const,
          uploadDate: new Date(),
        };

        // Store initial analysis in database
        await storage.createDocumentAnalysis(analysis);

        // Return initial response
        return {
          id: analysisId,
          filename: analysis.filename,
          originalName: analysis.originalName,
          status: 'processing'
        };
      });

      const results = await Promise.all(analysisPromises);
      res.json({
        message: "Files uploaded successfully",
        analyses: results
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // OpenAI API test endpoint
  app.get('/api/test-openai', async (req, res) => {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Say "OpenAI API is working correctly!"' }],
        max_tokens: 50
      });

      res.json({
        success: true,
        message: "OpenAI API is working",
        response: response.choices[0].message.content,
        apiKeyExists: !!process.env.OPENAI_API_KEY,
        apiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + "..." : "Not found"
      });
    } catch (error) {
      console.error("OpenAI API Test Error:", error);
      res.json({
        success: false,
        error: (error as Error).message,
        apiKeyExists: !!process.env.OPENAI_API_KEY,
        apiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + "..." : "Not found"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}