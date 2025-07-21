import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { initializeRazorpay, createSubscription, verifyPayment } from "./services/razorpay";
import { processDocument } from "./services/documentProcessor";
import { generatePerformanceAnalytics } from "./services/performanceAnalytics";
import { processDocumentWithAI, answerQuestion, analyzeContext } from "./services/fetchPatternsAI";
import multer from "multer";
import { insertDocumentSchema, insertSubscriptionSchema } from "@shared/schema";
import { nanoid } from "nanoid";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize Razorpay
  initializeRazorpay();

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

  app.post('/api/subscription/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post('/api/subscription/verify', isAuthenticated, async (req: any, res) => {
    try {
      const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
      
      const isValid = verifyPayment(razorpay_payment_id, razorpay_subscription_id, razorpay_signature);
      
      if (isValid) {
        // Update subscription status
        const subscription = await storage.getUserSubscription(req.user.claims.sub);
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
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getUserDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
            score: analysis.score,
          });

          // Record performance metric
          await storage.createPerformanceMetric({
            userId,
            metricType: 'document_processed',
            value: 1,
            metadata: { documentId: document.id },
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

  app.get('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Fetch Patterns API routes
  app.get('/api/fetch-patterns/analyses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analyses = await storage.getUserDocumentAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching document analyses:", error);
      res.status(500).json({ message: "Failed to fetch document analyses" });
    }
  });

  app.post('/api/fetch-patterns/upload', isAuthenticated, upload.array('files'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // Check user's document limit
      const documentCount = await storage.getUserDocumentAnalysisCount(userId);
      const subscription = await storage.getUserSubscription(userId);
      
      let limit = 10; // Default for trial users
      if (subscription?.planId) {
        const plan = await storage.getSubscriptionPlan(subscription.planId);
        limit = plan?.documentsLimit || 10;
      }

      if (documentCount + files.length > limit) {
        return res.status(429).json({ message: "Document limit exceeded for your subscription" });
      }

      const analysisPromises = files.map(async (file) => {
        const analysisId = nanoid();
        
        const analysis = await storage.createDocumentAnalysis({
          id: analysisId,
          userId,
          filename: `${nanoid()}_${file.originalname}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          status: 'processing',
          uploadDate: new Date(),
        });

        // Process document asynchronously with AI analysis
        setImmediate(async () => {
          try {
            const result = await processDocumentWithAI(file.buffer, file.mimetype);
            
            await storage.updateDocumentAnalysis(analysisId, {
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
            });
          } catch (error) {
            console.error(`Error processing document ${file.originalname}:`, error);
            await storage.updateDocumentAnalysis(analysisId, {
              status: 'error',
              processingError: (error as Error).message,
            });
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

  app.get('/api/fetch-patterns/analysis/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analysisId = req.params.id;
      
      const analysis = await storage.getDocumentAnalysis(analysisId);
      if (!analysis || analysis.userId !== userId) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  app.delete('/api/fetch-patterns/analysis/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analysisId = req.params.id;
      
      const analysis = await storage.getDocumentAnalysis(analysisId);
      if (!analysis || analysis.userId !== userId) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      await storage.deleteDocumentAnalysis(analysisId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting analysis:", error);
      res.status(500).json({ message: "Failed to delete analysis" });
    }
  });

  // Question answering endpoint
  app.post('/api/fetch-patterns/question', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }

      // Get user's documents
      const analyses = await storage.getUserDocumentAnalyses(userId);
      const documents = analyses
        .filter(a => a.status === 'completed' && a.extractedText)
        .map(a => ({ text: a.extractedText!, filename: a.originalName }));

      if (documents.length === 0) {
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

  // Context analysis endpoint
  app.post('/api/fetch-patterns/context-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { context } = req.body;
      
      if (!context) {
        return res.status(400).json({ message: "Context is required" });
      }

      // Get user's documents
      const analyses = await storage.getUserDocumentAnalyses(userId);
      const documents = analyses
        .filter(a => a.status === 'completed' && a.extractedText)
        .map(a => ({ text: a.extractedText!, filename: a.originalName }));

      if (documents.length === 0) {
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
  app.get('/api/analytics/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analytics = await generatePerformanceAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error generating analytics:", error);
      res.status(500).json({ message: "Failed to generate analytics" });
    }
  });

  app.get('/api/analytics/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  return httpServer;
}
