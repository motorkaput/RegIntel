import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import multer from 'multer';
import { nanoid } from 'nanoid';
import OpenAI from 'openai';

// OpenAI initialization
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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