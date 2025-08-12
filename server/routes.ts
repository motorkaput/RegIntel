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

  // Public tenant registration endpoint
  app.post('/api/tenants/register', async (req, res) => {
    try {
      const { company_name, domain, admin_email, password, first_name, last_name, bootstrap_token } = req.body;

      // For development - allow bootstrap token or bypass in dev mode
      const validTokens = ['bootstrap-dev-token-2024', 'demo-token'];
      const isDev = process.env.NODE_ENV === 'development';
      
      if (!isDev && !validTokens.includes(bootstrap_token)) {
        return res.status(403).json({ error: 'Invalid bootstrap token' });
      }

      // Basic validation
      if (!company_name || !domain || !admin_email || !password || !first_name || !last_name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate domain format
      const domainRegex = /^[a-z0-9-]+$/;
      if (!domainRegex.test(domain)) {
        return res.status(400).json({ error: 'Invalid domain format' });
      }

      // For development mode - create simplified tenant
      if (isDev || bootstrap_token === 'bootstrap-dev-token-2024') {
        // Set auth cookie for automatic login
        res.cookie('permeate-auth-token', 'demo-jwt-token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
        });

        res.json({
          success: true,
          user: {
            id: `admin-${domain}`,
            email: admin_email,
            role: 'admin',
            first_name,
            last_name,
          },
          tenant: {
            id: `tenant-${domain}`,
            name: company_name,
            domain,
          },
        });
        return;
      }

      // Production registration would go here
      res.status(500).json({ error: 'Production registration not yet implemented' });
    } catch (error) {
      console.error('Tenant registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Simple development login endpoint
  app.post('/api/permeate/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    // For development - accept demo credentials
    if (email === 'admin@democo.com' && password === 'admin123') {
      // Set auth cookie
      res.cookie('permeate-auth-token', 'demo-jwt-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      res.json({
        success: true,
        user: {
          id: 'demo-admin',
          email: 'admin@democo.com',
          role: 'admin',
          first_name: 'Admin',
          last_name: 'User',
        },
        tenant: {
          id: 'demo-tenant',
          name: 'DemoCo Enterprise',
          domain: 'democo',
        },
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
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

      // For development - accept demo token
      if (token === 'demo-jwt-token') {
        res.json({
          id: 'demo-admin',
          email: 'admin@democo.com',
          role: 'admin',
          first_name: 'Admin',
          last_name: 'User',
          tenant: {
            id: 'demo-tenant',
            name: 'DemoCo Enterprise',
            domain: 'democo',
          },
        });
        return;
      }

      // For production - verify JWT
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