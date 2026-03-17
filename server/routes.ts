import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerRegTechRoutes } from "./routes/regtech";
import { storage } from "./storage";
import { initializeRazorpay, createSubscription, verifyPayment } from "./services/razorpay";
import { generatePerformanceAnalytics } from "./services/performanceAnalytics";
import { regtechUsers } from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";
import { initializeAdminUser } from "./initAdmin";

function isAuthenticated(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// Simple in-memory rate limiter for AI endpoints
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(windowMs: number, maxRequests: number) {
  return (req: any, res: any, next: any) => {
    const key = `${req.session?.userId || req.ip}:${req.path}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= maxRequests) {
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }
    entry.count++;
    next();
  };
}

// Clean up expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

export async function registerRoutes(app: Express): Promise<Server> {
  initializeRazorpay();
  await initializeAdminUser();

  // Health check endpoint - verifies database connectivity
  app.get('/api/health', async (_req, res) => {
    try {
      await db.execute(sql`SELECT 1`);
      res.json({ status: 'healthy', timestamp: new Date().toISOString(), database: 'connected' });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({ status: 'unhealthy', timestamp: new Date().toISOString(), database: 'disconnected' });
    }
  });

  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const loginSchema = z.object({
        email: z.string().email('Valid email is required'),
        password: z.string().min(1, 'Password is required'),
      });
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0].message });
      }
      const { email, password } = validation.data;
      let user = await storage.getUserByEmail(email);
      let isRegtechUser = false;
      if (!user) {
        const [regtechUser] = await db.select().from(regtechUsers).where(eq(regtechUsers.email, email)).limit(1);
        if (regtechUser) {
          user = regtechUser as any;
          isRegtechUser = true;
        }
      }
      if (!user || !user.password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      req.session.regenerate((err: any) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ message: 'Login failed' });
        }
        req.session.userId = user.id;
        req.session.isRegtechUser = isRegtechUser;
        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ message: 'Login failed' });
          }
          const { password: _, ...userWithoutPassword } = user;
          res.json(userWithoutPassword);
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      let user = await storage.getUser(req.session.userId);
      if (!user) {
        const [regtechUser] = await db.select().from(regtechUsers).where(eq(regtechUsers.id, req.session.userId)).limit(1);
        if (regtechUser) {
          user = regtechUser as any;
        }
      }
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
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
      const userId = req.session.userId;
      const subscription = await storage.getUserSubscription(userId);
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/subscription/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { planId } = req.body;

      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }

      const razorpaySubscription = await createSubscription(plan);

      const subscription = await storage.createSubscription({
        id: nanoid(),
        userId,
        planId,
        razorpaySubscriptionId: (razorpaySubscription as any)?.id || '',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      res.json({ subscription, razorpaySubscription });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.post('/api/subscription/verify', isAuthenticated, async (req: any, res) => {
    try {
      const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

      const isValid = verifyPayment(razorpay_payment_id, razorpay_subscription_id, razorpay_signature);

      if (isValid) {
        const subscription = await storage.getUserSubscription(req.session.userId);
        if (subscription) {
          await storage.updateSubscription(subscription.id, { status: 'active' });
        }
        res.json({ success: true });
      } else {
        res.status(400).json({ message: "Invalid payment signature" });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Performance analytics routes
  app.get('/api/analytics/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const analytics = await generatePerformanceAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error generating analytics:", error);
      res.status(500).json({ message: "Failed to generate analytics" });
    }
  });

  app.get('/api/analytics/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { type, startDate, endDate } = req.query;

      let metrics;
      if (startDate && endDate) {
        metrics = await storage.getMetricsByDateRange(
          userId,
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        metrics = await storage.getUserMetrics(userId, type as string);
      }

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Initialize default subscription plans matching RegIntel pricing tiers
  const initializePlans = async () => {
    try {
      const existingPlans = await storage.getSubscriptionPlans();
      if (existingPlans.length === 0) {
        await storage.createSubscriptionPlan({
          id: 'pilot',
          name: 'Pilot',
          description: '3 users, 200 RegIntel Intelligence units/mo, 5 active alert sets',
          price: '299.00',
          currency: 'USD',
          interval: 'monthly',
          documentsLimit: 200,
          features: ['3 team members', '200 Intelligence units/month', '5 active alert sets', 'Document analysis', 'Obligation extraction', 'Email support'],
        });

        await storage.createSubscriptionPlan({
          id: 'professional',
          name: 'Professional',
          description: '10 users, 1,000 RegIntel Intelligence units/mo, 25 active alert sets',
          price: '799.00',
          currency: 'USD',
          interval: 'monthly',
          documentsLimit: 1000,
          features: ['10 team members', '1,000 Intelligence units/month', '25 active alert sets', 'Advanced analysis', 'Priority support', 'API access'],
        });

        await storage.createSubscriptionPlan({
          id: 'enterprise',
          name: 'Enterprise',
          description: 'Unlimited users, custom units, unlimited alert sets',
          price: '1500.00',
          currency: 'USD',
          interval: 'monthly',
          documentsLimit: -1,
          features: ['Unlimited team members', 'Custom Intelligence units', 'Unlimited alert sets', 'Dedicated support', 'On-premise deployment', 'SLA guarantees', 'Custom integrations'],
        });
      }
    } catch (error) {
      console.error("Error initializing subscription plans:", error);
    }
  };

  initializePlans();

  // Register RegTech routes
  registerRegTechRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
