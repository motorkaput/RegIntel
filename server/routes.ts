import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerRegTechRoutes } from "./routes/regtech";
import { storage } from "./storage";
import { initializeRazorpay, createSubscription, verifyPayment } from "./services/razorpay";
import { processDocument } from "./services/documentProcessor";
import { generatePerformanceAnalytics } from "./services/performanceAnalytics";
import { processDocumentWithAI, answerQuestion, analyzeContext } from "./services/fetchPatternsAI";
import multer from "multer";
import { regtechUsers } from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";
import { initializeAdminUser } from "./initAdmin";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// In-memory storage for free version
const freeVersionAnalyses = new Map<string, any>();

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

  app.get('/api/subscription', async (req: any, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const subscription = await storage.getUserSubscription(userId);
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/subscription/create', async (req: any, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
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
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      res.json({ subscription, razorpaySubscription });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.post('/api/subscription/verify', async (req: any, res) => {
    try {
      const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
      
      const isValid = verifyPayment(razorpay_payment_id, razorpay_subscription_id, razorpay_signature);
      
      if (isValid) {
        // Update subscription status
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

  // Document routes
  app.get('/api/documents', async (req: any, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const documents = await storage.getUserDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents/upload', upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Check user's document limit based on subscription
      const documentCount = await storage.getUserDocumentCount(userId);
      const subscription = await storage.getUserSubscription(userId);
      
      // Default limits for trial users
      let limit = 10;
      if (subscription?.planId) {
        const plan = await storage.getSubscriptionPlan(subscription.planId);
        limit = plan?.documentsLimit || 10;
      }

      if (documentCount >= limit) {
        return res.status(429).json({ message: "Document limit exceeded for your subscription" });
      }

      const document = await storage.createDocument({
        userId,
        filename: `${nanoid()}_${file.originalname}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        status: 'processing',
      });

      // Process document asynchronously
      processDocument(document.id.toString(), file.buffer, file.mimetype)
        .then(async (analysis) => {
          await storage.updateDocument(document.id, {
            status: 'completed',
            extractedText: analysis.text,
            analysis: analysis.insights,
            sentiment: analysis.sentiment,
            score: analysis.score.toString(),
          });

          // Record performance metric
          await storage.createPerformanceMetric({
            userId,
            metricType: 'document_processed',
            value: "1",
            metadata: { documentId: document.id.toString() },
          });
        })
        .catch(async (error) => {
          await storage.updateDocument(document.id, {
            status: 'failed',
            processingError: error.message,
          });
        });

      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get('/api/documents/:id', async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const documentId = parseInt(req.params.id);
      
      const document = await storage.getDocument(documentId);
      if (!document || document.userId !== userId) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.delete('/api/documents/:id', async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const documentId = parseInt(req.params.id);
      
      const document = await storage.getDocument(documentId);
      if (!document || document.userId !== userId) {
        return res.status(404).json({ message: "Document not found" });
      }

      await storage.deleteDocument(documentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Fetch Patterns API routes - now free


  app.get('/api/fetch-patterns/analyses', async (req: any, res) => {
    try {
      // Return analyses from in-memory storage for free version
      const analyses = Array.from(freeVersionAnalyses.values());
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching document analyses:", error);
      res.status(500).json({ message: "Failed to fetch document analyses" });
    }
  });



  // Original Fetch Patterns upload endpoint  
  app.post('/api/fetch-patterns/upload', upload.array('files'), async (req: any, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // For free version, use a reasonable session limit
      const sessionLimit = 20; // Allow up to 20 documents per session
      
      if (files.length > sessionLimit) {
        return res.status(429).json({ message: `Please upload no more than ${sessionLimit} documents at once` });
      }

      const analysisPromises = files.map(async (file) => {
        const analysisId = nanoid();
        
        // Create temporary analysis object without database storage for free version
        const analysis = {
          id: analysisId,
          userId: 'free-user', // No real user ID for free version
          filename: `${nanoid()}_${file.originalname}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          status: 'processing' as const,
          uploadDate: new Date(),
        };

        // Store initial analysis in memory
        freeVersionAnalyses.set(analysisId, analysis);

        // Process document asynchronously with AI analysis
        setImmediate(async () => {
          try {
            const result = await processDocumentWithAI(file.buffer, file.mimetype);
            
            // Update analysis with completed results in memory
            const completedAnalysis = {
              ...analysis,
              status: 'completed',
              extractedText: result.extractedText,
              classification: result.classification,
              sentiment: result.sentiment,
              keywords: result.keywords,
              insights: result.insights,
              riskFlags: result.riskFlags,
              summary: result.summary,
              wordCloud: result.wordCloud,
              completedAt: new Date(),
            };
            
            freeVersionAnalyses.set(analysisId, completedAnalysis);
            console.log(`Document ${file.originalname} processed successfully (free version)`);
          } catch (error) {
            console.error(`Error processing document ${file.originalname}:`, error);
            // Update with error status
            const errorAnalysis = {
              ...analysis,
              status: 'error',
              processingError: (error as Error).message,
            };
            freeVersionAnalyses.set(analysisId, errorAnalysis);
          }
        });

        return analysis;
      });

      const analyses = await Promise.all(analysisPromises);
      res.json({ message: `${files.length} files uploaded successfully`, analyses });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  app.get('/api/fetch-patterns/analysis/:id', async (req: any, res) => {
    try {
      const analysisId = req.params.id;
      
      // Get analysis from in-memory storage
      const analysis = freeVersionAnalyses.get(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  app.delete('/api/fetch-patterns/analysis/:id', async (req: any, res) => {
    try {
      const analysisId = req.params.id;
      
      // Delete from in-memory storage
      freeVersionAnalyses.delete(analysisId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting analysis:", error);
      res.status(500).json({ message: "Failed to delete analysis" });
    }
  });



  // Question answering endpoint - now free
  app.post('/api/fetch-patterns/question', rateLimit(60000, 10), async (req: any, res) => {
    try {
      const { question, documents } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }

      if (!documents || documents.length === 0) {
        return res.json({
          answer: "No documents available to answer questions. Please upload some documents first.",
          confidence: 0.0,
          sources: []
        });
      }

      const result = await answerQuestion(documents, question);
      res.json(result);
    } catch (error) {
      console.error("Error answering question:", error);
      res.status(500).json({ message: "Failed to answer question" });
    }
  });



  // Context analysis endpoint - now free
  app.post('/api/fetch-patterns/context-analysis', rateLimit(60000, 10), async (req: any, res) => {
    try {
      const { context, documents } = req.body;
      
      if (!context) {
        return res.status(400).json({ message: "Context is required" });
      }

      if (!documents || documents.length === 0) {
        return res.json({
          context,
          mentions: 0,
          sentimentBreakdown: { positive: 0, negative: 0, neutral: 100 },
          emotionalTone: ['neutral'],
          keyPhrases: [],
          summary: "No documents available for context analysis."
        });
      }

      const result = await analyzeContext(documents, context);
      res.json(result);
    } catch (error) {
      console.error("Error analyzing context:", error);
      res.status(500).json({ message: "Failed to analyze context" });
    }
  });

  // Performance analytics routes
  app.get('/api/analytics/dashboard', async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const analytics = await generatePerformanceAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error generating analytics:", error);
      res.status(500).json({ message: "Failed to generate analytics" });
    }
  });

  app.get('/api/analytics/metrics', async (req: any, res) => {
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

  // Initialize default subscription plans
  const initializePlans = async () => {
    try {
      const existingPlans = await storage.getSubscriptionPlans();
      if (existingPlans.length === 0) {
        await storage.createSubscriptionPlan({
          id: 'starter',
          name: 'Starter',
          description: 'Perfect for individuals getting started',
          price: '29.00',
          currency: 'USD',
          interval: 'monthly',
          documentsLimit: 1000,
          features: ['Up to 1,000 documents/month', 'Basic AI analysis', 'Email support', 'Dashboard access'],
        });

        await storage.createSubscriptionPlan({
          id: 'professional',
          name: 'Professional',
          description: 'For growing businesses',
          price: '99.00',
          currency: 'USD',
          interval: 'monthly',
          documentsLimit: 10000,
          features: ['Up to 10,000 documents/month', 'Advanced AI analysis', 'Priority support', 'Custom integrations', 'API access'],
        });

        await storage.createSubscriptionPlan({
          id: 'enterprise',
          name: 'Enterprise',
          description: 'For large organizations',
          price: '299.00',
          currency: 'USD',
          interval: 'monthly',
          documentsLimit: -1, // unlimited
          features: ['Unlimited documents', 'Custom AI models', '24/7 dedicated support', 'On-premise deployment', 'SLA guarantees'],
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
