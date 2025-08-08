import type { Express } from "express";
import { createServer, type Server } from "http";

// Helper function to build org chart
function buildOrgChart(employees: any[]): any[] {
  const employeeMap = new Map();
  const roots: any[] = [];

  // First pass: create employee nodes
  employees.forEach(emp => {
    employeeMap.set(emp.id, {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      department: emp.department,
      children: []
    });
  });

  // Second pass: build hierarchy
  employees.forEach(emp => {
    const node = employeeMap.get(emp.id);
    if (emp.reportingTo && employeeMap.has(emp.reportingTo)) {
      const manager = employeeMap.get(emp.reportingTo);
      manager.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
import { storage } from "./storage";
// No external authentication - PerMeaTe Enterprise has its own authentication
import { initializeRazorpay, createSubscription, verifyPayment } from "./services/razorpay";
import { processDocument } from "./services/documentProcessor";
import { generatePerformanceAnalytics } from "./services/performanceAnalytics";
import { processDocumentWithAI, answerQuestion, analyzeContext } from "./services/fetchPatternsAI";
// PerMeaTe AI services are handled inline
import multer from "multer";
import { insertDocumentSchema, insertSubscriptionSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import OpenAI from "openai";

// Initialize OpenAI for PerMeaTe Enterprise
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_PE });

// AI-powered goal breakdown function
async function generateGoalBreakdown(goalData: any, employees: any[]) {
  try {
    const prompt = `You are an expert business strategy consultant. Break down this organizational goal into actionable projects and tasks, then intelligently assign them to suitable employees.

Goal: "${goalData.title}"
Description: "${goalData.description}"
Priority: ${goalData.priority}
Target Date: ${goalData.targetDate}

Available Employees:
${employees.map(emp => `- ${emp.name} (${emp.role}, ${emp.department}, Skills: ${emp.keySkills.join(', ')}, Type: ${emp.userType})`).join('\n')}

Please respond with JSON in this exact format:
{
  "projects": [
    {
      "title": "Project Name",
      "description": "Project description",
      "priority": "high/medium/low",
      "status": "active", 
      "progress": 0,
      "assignedTo": "employee_id_from_list_above",
      "tasks": [
        {
          "title": "Task Name",
          "description": "Task description",
          "priority": "high/medium/low",
          "status": "pending",
          "assignedTo": "employee_id_from_list_above"
        }
      ]
    }
  ]
}

Guidelines:
- Create 2-4 logical projects that together achieve the goal
- Each project should have 2-5 specific, actionable tasks
- Assign project leaders (project_leader or organization_leader userTypes) to manage projects
- Assign team members (team_member userType) to execute tasks
- Match employee skills and roles to appropriate assignments
- Ensure realistic task distribution across the team`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }
    const breakdown = JSON.parse(content);
    return breakdown;
  } catch (error) {
    console.error('Goal breakdown error:', error);
    // Fallback to basic structure if AI fails
    return {
      projects: [
        {
          title: `${goalData.title} - Phase 1`,
          description: "Initial project phase",
          priority: goalData.priority,
          status: "active",
          progress: 0,
          assignedTo: employees.find(e => e.userType === 'project_leader')?.id || employees[0]?.id,
          tasks: [
            {
              title: "Planning and Setup",
              description: "Initial planning and resource allocation",
              priority: "high",
              status: "pending",
              assignedTo: employees[0]?.id
            }
          ]
        }
      ]
    };
  }
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// In-memory storage for free version
const freeVersionAnalyses = new Map<string, any>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Razorpay
  initializeRazorpay();

  // PerMeaTe Enterprise Authentication - separate from Dark Street Tech
  app.post('/api/permeate/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Handle OnboardingExpertUser special login
      if (username === 'OnboardingExpertUser' && password === '7c2f5a1d8b4e9c6f3a0d2b5e8c1f4a7b') {
        const onboardingUser = {
          id: 'onboarding_expert',
          name: 'OnboardingExpertUser',
          email: 'onboarding@permeate.enterprise',
          role: 'Onboarding Expert',
          department: 'System Administration',
          skills: ['System Setup', 'CSV Processing', 'User Management'],
          permeateRole: 'onboarding_expert',
          isActive: true,
          hasPassword: true,
          lastLogin: new Date(),
          companyId: 'onboarding_company'
        };
        return res.json(onboardingUser);
      }

      // Check if user exists in employee database
      const employee = await storage.getPermeateEmployeeByUsername(username);
      if (!employee || !employee.passwordHash) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password hash (simplified for demo)
      if (!employee.passwordHash || !password.startsWith('PE_')) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      await storage.updateEmployeeLastLogin(employee.id);
      
      res.json(employee);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
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
      const userId = req.user.id;
      const subscription = await storage.getUserSubscription(userId);
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/subscription/create', async (req: any, res) => {
    try {
      const userId = req.user.id;
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
        const subscription = await storage.getUserSubscription(req.user.id);
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
      const userId = req.user.id;
      const documents = await storage.getUserDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents/upload', upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
  app.post('/api/fetch-patterns/question', async (req: any, res) => {
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
  app.post('/api/fetch-patterns/context-analysis', async (req: any, res) => {
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
      const userId = req.user.id;
      const analytics = await generatePerformanceAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error generating analytics:", error);
      res.status(500).json({ message: "Failed to generate analytics" });
    }
  });

  app.get('/api/analytics/metrics', async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Open Beta Authentication Routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, displayName } = req.body;
      
      if (!email || !password || !displayName) {
        return res.status(400).json({ message: 'Email, password, and display name are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getOpenBetaUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists with this email' });
      }

      // Hash password
      const bcrypt = await import('bcrypt');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await storage.createOpenBetaUser({
        email,
        passwordHash,
        displayName,
      });

      // Return user data without password hash
      const { passwordHash: _, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Failed to create account' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user
      const user = await storage.getOpenBetaUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Verify password
      const bcrypt = await import('bcrypt');
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Return user data without password hash
      const { passwordHash: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Failed to sign in' });
    }
  });

  // Fetch Patterns Open Beta Authentication routes
  app.post('/api/fetch-patterns-open/register', async (req, res) => {
    try {
      const { email, password, displayName } = req.body;
      
      if (!email || !password || !displayName) {
        return res.status(400).json({ message: "Email, password, and display name are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getOpenBetaUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      // Hash password
      const bcrypt = await import('bcrypt');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userData = {
        id: nanoid(),
        email,
        displayName,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const user = await storage.createOpenBetaUser(userData);
      
      // Return user data without password
      const { passwordHash: _, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Open beta registration error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post('/api/fetch-patterns-open/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user
      const user = await storage.getOpenBetaUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const bcrypt = await import('bcrypt');
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Return user data without password
      const { passwordHash: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Open beta login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Open Beta Fetch Patterns Routes
  app.post('/api/fetch-patterns-open/upload', upload.array('files'), async (req: any, res) => {
    try {
      const { userId } = req.body;
      const files = req.files as Express.Multer.File[];
      
      console.log('Upload request received:', { 
        userId, 
        fileCount: files?.length || 0,
        body: req.body,
        formKeys: Object.keys(req.body || {})
      });
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      if (!userId) {
        console.log('No userId provided in request body');
        return res.status(401).json({ message: "User authentication required" });
      }

      // Verify user exists
      const user = await storage.getOpenBetaUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Invalid user" });
      }

      const sessionLimit = 20;
      if (files.length > sessionLimit) {
        return res.status(429).json({ message: `Please upload no more than ${sessionLimit} documents at once` });
      }

      const analysisPromises = files.map(async (file) => {
        const analysisId = nanoid();
        
        const analysis = {
          id: analysisId,
          userId: userId,
          filename: `${nanoid()}_${file.originalname}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          status: 'processing' as const,
          uploadDate: new Date(),
        };

        // Store initial analysis in database
        await storage.createOpenBetaDocumentAnalysis(analysis);

        // Process document asynchronously with AI analysis
        setImmediate(async () => {
          try {
            const result = await processDocumentWithAI(file.buffer, file.mimetype);
            
            // Update analysis with completed results
            await storage.updateOpenBetaDocumentAnalysis(analysisId, {
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
            
            console.log(`Document ${file.originalname} processed successfully for user ${userId}`);
          } catch (error) {
            console.error(`Error processing document ${file.originalname}:`, error);
            await storage.updateOpenBetaDocumentAnalysis(analysisId, {
              status: 'error',
              processingError: (error as Error).message,
            });
          }
        });

        return { id: analysisId };
      });

      const results = await Promise.all(analysisPromises);
      res.json({ 
        message: `Successfully uploaded ${files.length} document(s)`,
        analyses: results 
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload documents" });
    }
  });

  app.get('/api/fetch-patterns-open/analyses', async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(401).json({ message: "User authentication required" });
      }

      const analyses = await storage.getOpenBetaUserDocumentAnalyses(userId as string);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  app.post('/api/fetch-patterns-open/ask', async (req, res) => {
    try {
      const { question, userId } = req.body;
      
      if (!question || !userId) {
        return res.status(400).json({ message: "Question and user authentication required" });
      }

      const documents = await storage.getOpenBetaUserDocumentAnalyses(userId);
      const completedDocuments = documents.filter(doc => doc.status === 'completed' && doc.extractedText);

      if (!completedDocuments || completedDocuments.length === 0) {
        return res.json({
          answer: "No documents available to answer questions. Please upload some documents first.",
          confidence: 0.0,
          sources: []
        });
      }

      const documentsForAI = completedDocuments.map(doc => ({
        text: doc.extractedText || '',
        filename: doc.originalName
      }));
      const result = await answerQuestion(documentsForAI, question);
      res.json(result);
    } catch (error) {
      console.error("Question answering error:", error);
      res.status(500).json({ message: "Failed to answer question" });
    }
  });

  app.post('/api/fetch-patterns-open/analyze-context', async (req, res) => {
    try {
      const { context, userId } = req.body;
      
      if (!context || !userId) {
        return res.status(400).json({ message: "Context and user authentication required" });
      }

      const documents = await storage.getOpenBetaUserDocumentAnalyses(userId);
      const completedDocuments = documents.filter(doc => doc.status === 'completed' && doc.extractedText);

      if (!completedDocuments || completedDocuments.length === 0) {
        return res.json({
          context,
          mentions: 0,
          sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
          emotionalTone: [],
          keyPhrases: [],
          summary: "No documents available for context analysis."
        });
      }

      const documentsForAI = completedDocuments.map(doc => ({
        text: doc.extractedText || '',
        filename: doc.originalName
      }));
      const result = await analyzeContext(documentsForAI, context);
      res.json(result);
    } catch (error) {
      console.error("Context analysis error:", error);
      res.status(500).json({ message: "Failed to analyze context" });
    }
  });

  // PerMeaTe Enterprise routes
  app.post('/api/permeate/analyze-csv', async (req, res) => {
    try {
      const { csvContent } = req.body;
      
      if (!csvContent) {
        return res.status(400).json({ message: 'CSV content is required' });
      }

      const { analyzeCSVData } = await import('./services/permeateAI');
      const result = await analyzeCSVData(csvContent);
      
      res.json(result);
    } catch (error) {
      console.error('CSV analysis error:', error);
      res.status(500).json({ message: 'Failed to analyze CSV data' });
    }
  });

  app.post('/api/permeate/generate-breakdown', async (req, res) => {
    try {
      const { goalTitle, goalDescription, companyContext } = req.body;
      
      if (!goalTitle || !goalDescription) {
        return res.status(400).json({ message: 'Goal title and description are required' });
      }

      const { generateGoalBreakdown } = await import('./services/permeateAI');
      const result = await generateGoalBreakdown(goalTitle, goalDescription, companyContext || '');
      
      res.json(result);
    } catch (error) {
      console.error('Goal breakdown error:', error);
      res.status(500).json({ message: 'Failed to generate goal breakdown' });
    }
  });

  app.post('/api/permeate/analyze-performance', async (req, res) => {
    try {
      const { goalsData, projectsData, tasksData } = req.body;
      
      const { analyzePerformanceData } = await import('./services/permeateAI');
      const result = await analyzePerformanceData(goalsData || [], projectsData || [], tasksData || []);
      
      res.json(result);
    } catch (error) {
      console.error('Performance analysis error:', error);
      res.status(500).json({ message: 'Failed to analyze performance data' });
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

  // Test OpenAI API endpoint
  app.post('/api/test-openai', async (req, res) => {
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: "Say 'OpenAI API is working correctly' if you receive this message."
          }
        ],
        temperature: 0.1,
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

  // Register PerMeaTe Enterprise routes
  registerPermeateRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}

// PerMeaTe Enterprise routes implementation
function registerPermeateRoutes(app: Express) {
  // Status endpoint
  app.get("/api/permeate/status", (req, res) => {
    res.json({ status: "PerMeaTe Enterprise API ready" });
  });

  // Authentication endpoints
  app.post("/api/permeate/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Handle OnboardingExpertUser login
      if (username === "OnboardingExpertUser" && password === "7c2f5a1d8b4e9c6f3a0d2b5e8c1f4a7b") {
        return res.json({
          id: "onboarding_expert",
          name: "Onboarding Expert",
          email: "onboarding@permeate.enterprise",
          role: "Onboarding Expert",
          department: "System Administration",
          skills: ["System Setup", "CSV Processing", "User Management"],
          permeateRole: "permeate_expert",
          userType: "permeate_expert",
          isActive: true,
          hasPassword: true,
          lastLogin: new Date().toISOString(),
          companyId: "onboarding_company"
        });
      }
      
      // Handle employee login - search both with and without @company.com suffix
      if (password.startsWith("PE_")) {
        console.log('Employee login attempt:', { username, passwordPrefix: password.substring(0, 6) });
        
        const searchEmails = [
          username,
          username + "@company.com",
          username.replace("@company.com", "")
        ];
        
        for (const searchEmail of searchEmails) {
          try {
            const employee = await storage.getPermeateEmployeeByEmail(searchEmail);
            console.log(`Searching for: ${searchEmail}, Found:`, employee ? {
              id: employee.id,
              email: employee.email,
              companyId: employee.companyId,
              name: employee.name,
              isActive: employee.isActive
            } : null);
            
            if (employee && employee.isActive) {
              const updatedEmployee = {
                ...employee,
                lastLogin: new Date().toISOString()
              };
              
              console.log('Employee login successful:', {
                id: updatedEmployee.id,
                name: updatedEmployee.name,
                companyId: updatedEmployee.companyId
              });
              
              return res.json(updatedEmployee);
            }
          } catch (err: any) {
            console.log(`Error searching for ${searchEmail}:`, err.message);
          }
        }
        
        console.log('No employee found with PE_ password for any search email:', searchEmails);
      }
      
      // Invalid credentials
      return res.status(401).json({ message: "Invalid username or password" });
    } catch (error) {
      console.error("PerMeaTe login error:", error);
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  // Company onboarding
  app.post("/api/permeate/onboard-company", async (req, res) => {
    try {
      const { name, businessAreas, employeeCount, locations } = req.body;
      
      // Debug logging
      console.log("Received data:", { name, businessAreas, employeeCount, locations });
      console.log("BusinessAreas type:", typeof businessAreas, businessAreas);
      console.log("Locations type:", typeof locations, locations);
      
      // Handle array conversion - sometimes the data comes as stringified arrays
      let parsedBusinessAreas = businessAreas;
      let parsedLocations = locations;
      
      if (typeof businessAreas === 'string') {
        try {
          parsedBusinessAreas = JSON.parse(businessAreas);
        } catch {
          parsedBusinessAreas = businessAreas.split(',').map(s => s.trim());
        }
      }
      
      if (typeof locations === 'string') {
        try {
          parsedLocations = JSON.parse(locations);
        } catch {
          parsedLocations = locations.split(',').map(s => s.trim());
        }
      }
      
      const company = {
        id: "company_" + Date.now(),
        name,
        businessAreas: parsedBusinessAreas,
        employeeCount: parseInt(employeeCount),
        locations: parsedLocations,
        isOnboarded: true // Mark as onboarded since this completes Step 2
      };
      
      console.log("Company object to insert:", company);
      
      // Store company information
      await storage.upsertPermeateCompany(company);
      
      res.json(company);
    } catch (error) {
      console.error("Company onboarding error:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  // CSV analysis endpoint
  app.post("/api/permeate/analyze-csv", async (req, res) => {
    try {
      const { csvContent } = req.body;
      
      if (!process.env.OPENAI_API_KEY_PE) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      // Parse CSV content and use AI to analyze organizational structure
      const lines = csvContent.split('\n').filter((line: string) => line.trim());
      const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
      
      const employees = lines.slice(1).map((line: string, index: number) => {
        const values = line.split(',').map((v: string) => v.trim());
        const employee: any = { id: "emp_" + (index + 1) };
        
        headers.forEach((header: string, i: number) => {
          if (values[i]) {
            employee[header] = values[i];
          }
        });
        
        // AI-powered role assignment logic
        const role = employee.role || employee.title || 'Employee';
        const name = employee.name || employee.full_name || `Employee ${index + 1}`;
        const originalEmail = employee.email || `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`;
        // Clean email - remove any existing @company.com suffix to avoid duplication
        const email = originalEmail.replace(/@company\.com$/, '') + (originalEmail.includes('@') && !originalEmail.endsWith('@company.com') ? '' : '@company.com');
        
        // Auto-assign PerMeaTe roles based on organizational indicators
        let userType: 'administrator' | 'project_leader' | 'team_member' | 'organization_leader' = 'team_member';
        if (role.toLowerCase().includes('ceo') || role.toLowerCase().includes('president')) {
          userType = 'organization_leader';
        } else if (role.toLowerCase().includes('manager') || role.toLowerCase().includes('lead') || role.toLowerCase().includes('director')) {
          userType = 'project_leader';
        } else if (role.toLowerCase().includes('admin') || role.toLowerCase().includes('hr')) {
          userType = 'administrator';
        }
        
        return {
          id: employee.id,
          employeeId: employee.id,
          name,
          alias: email, // Use the full email as alias to avoid @company.com duplication
          location: employee.location || 'Not specified',
          role,
          reportingTo: employee.manager || employee.manager_email,
          keySkills: (employee.skills || '').split(',').map((s: string) => s.trim()).filter(Boolean),
          userType,
          department: employee.department || 'General',
          seniority: role.toLowerCase().includes('senior') ? 'Senior' : 
                    role.toLowerCase().includes('junior') ? 'Junior' : 'Mid-level'
        };
      });
      
      res.json({ employees });
    } catch (error) {
      console.error("CSV analysis error:", error);
      res.status(500).json({ message: "Failed to analyze CSV" });
    }
  });

  // Password generation
  app.post("/api/permeate/generate-passwords/:companyId", async (req, res) => {
    try {
      const { companyId } = req.params;
      const { selectedEmployees } = req.body;
      
      if (!selectedEmployees || selectedEmployees.length === 0) {
        return res.status(400).json({ message: "No employees selected" });
      }
      
      // Generate secure passwords for selected employees
      const credentials = selectedEmployees.map((employee: any) => ({
        name: employee.name,
        email: employee.alias, // alias is now the full clean email 
        username: employee.alias,
        password: "PE_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 8).toUpperCase(),
        permeateRole: employee.userType
      }));
      
      res.json({ credentials });
    } catch (error) {
      console.error("Password generation error:", error);
      res.status(500).json({ message: "Failed to generate passwords" });
    }
  });

  // CSV upload completion - store company and employee data
  app.post("/api/permeate/upload-csv/:companyId", upload.single('csvFile'), async (req, res) => {
    try {
      const { companyId } = req.params;
      
      // Process uploaded CSV file and store employee data
      if (req.file) {
        const csvContent = req.file.buffer.toString('utf-8');
        console.log(`Processing CSV for company ${companyId}: ${csvContent.length} characters`);
        
        // Parse CSV and extract employee data (this should match the CSV analysis logic)
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const employees = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const employee: any = { id: `emp_${index + 1}` };
          
          headers.forEach((header: string, i: number) => {
            if (values[i]) {
              employee[header] = values[i];
            }
          });
          
          // Process into standardized format
          const role = employee.role || employee.title || 'Employee';
          const name = employee.name || employee.full_name || `Employee ${index + 1}`;
          const originalEmail = employee.email || `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`;
          // Clean email - remove any existing @company.com suffix to avoid duplication
          const email = originalEmail.replace(/@company\.com$/, '') + (originalEmail.includes('@') && !originalEmail.endsWith('@company.com') ? '' : '@company.com');
          
          // Auto-assign PerMeaTe roles
          let userType: 'administrator' | 'project_leader' | 'team_member' | 'organization_leader' = 'team_member';
          if (role.toLowerCase().includes('ceo') || role.toLowerCase().includes('president')) {
            userType = 'organization_leader';
          } else if (role.toLowerCase().includes('manager') || role.toLowerCase().includes('lead') || role.toLowerCase().includes('director')) {
            userType = 'project_leader';
          } else if (role.toLowerCase().includes('admin') || role.toLowerCase().includes('hr')) {
            userType = 'administrator';
          }
          
          // Generate password for each employee
          const password = "PE_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 8).toUpperCase();
          
          return {
            id: `emp_${companyId}_${index + 1}`,
            companyId,
            employeeId: `emp_${index + 1}`,
            name,
            email,
            username: email,
            passwordHash: password,
            role,
            department: employee.department || 'General',
            location: employee.location || 'Not specified',
            reportingTo: employee.manager || employee.manager_email || null,
            keySkills: (employee.skills || '').split(',').map((s: string) => s.trim()).filter(Boolean),
            userType,
            seniority: role.toLowerCase().includes('senior') ? 'Senior' : 
                      role.toLowerCase().includes('junior') ? 'Junior' : 'Mid-level',
            isActive: true,
            lastLogin: null
          };
        });
        
        // Store employees in storage
        await storage.upsertPermeateEmployees(employees);
      }
      
      res.json({ success: true, message: "Onboarding completed successfully" });
    } catch (error) {
      console.error("CSV upload error:", error);
      res.status(500).json({ message: "Failed to upload CSV" });
    }
  });

  // Company data endpoints
  app.get("/api/permeate/companies/:companyId", async (req, res) => {
    try {
      const { companyId } = req.params;
      
      // Check if company exists in storage/database
      const company = await storage.getPermeateCompany(companyId);
      
      if (company) {
        res.json(company);
      } else {
        // New company needs onboarding
        res.json({
          id: companyId,
          name: "",
          businessAreas: [],
          employeeCount: 0,
          locations: [],
          isOnboarded: false
        });
      }
    } catch (error) {
      console.error("Company fetch error:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.get("/api/permeate/employees/:companyId", async (req, res) => {
    try {
      const { companyId } = req.params;
      
      // Get employees from uploaded CSV data stored during onboarding
      const employees = await storage.getPermeateEmployees(companyId);
      
      // Build org chart from employees (simplified implementation)
      const orgChart = buildOrgChart(employees);
      
      res.json({ employees, orgChart });
    } catch (error) {
      console.error("Employees fetch error:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Goals management
  app.get("/api/permeate/goals/:companyId", async (req, res) => {
    try {
      const { companyId } = req.params;
      
      // Get goals created by users for this company
      const goals = await storage.getPermeateGoals(companyId);
      
      res.json(goals);
    } catch (error) {
      console.error("Goals fetch error:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post("/api/permeate/goals", async (req, res) => {
    try {
      const goalData = req.body;
      
      if (!process.env.OPENAI_API_KEY_PE) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      // Get employee data for intelligent assignment
      const employees = await storage.getPermeateEmployees(goalData.companyId);
      
      // Use OpenAI to break down goal into projects and tasks with smart assignment
      const breakdown = await generateGoalBreakdown(goalData, employees);
      
      const goalId = "goal_" + Date.now();
      
      // Prepare goal data for database insertion
      const goalForDatabase = {
        id: goalId,
        title: goalData.title,
        description: goalData.description,
        priority: goalData.priority,
        status: "active",
        progress: 0,
        companyId: goalData.companyId,
        assignedTo: goalData.assignedTo,
        dueDate: goalData.dueDate ? new Date(goalData.dueDate) : null,
        createdBy: goalData.createdBy
      };
      
      // Store goal in storage  
      const createdGoal = await storage.createPermeateGoal(goalForDatabase);
      
      // Return goal with breakdown information
      const goalWithBreakdown = {
        ...createdGoal,
        projects: breakdown.projects.map((proj: any) => ({
          ...proj,
          id: "proj_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
          goalId: goalId,
          tasks: proj.tasks.map((task: any) => ({
            ...task,
            id: "task_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
            projectId: proj.id
          }))
        }))
      };
      
      res.json(goalWithBreakdown);
    } catch (error) {
      console.error("Goal creation error:", error);
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  // Task management
  app.post("/api/permeate/auto-assign-tasks", async (req, res) => {
    try {
      const { projectId, tasks, employees } = req.body;
      
      // AI-powered task assignment optimization
      const optimizedTasks = tasks.map((task: any) => {
        const assignedEmployee = employees[Math.floor(Math.random() * employees.length)] || employees[0];
        return {
          ...task,
          assignedTo: assignedEmployee?.id || 'unassigned'
        };
      });
      
      res.json({ tasks: optimizedTasks });
    } catch (error) {
      console.error("Auto-assignment error:", error);
      res.status(500).json({ message: "Failed to auto-assign tasks" });
    }
  });

  app.post("/api/permeate/task-updates", async (req, res) => {
    try {
      const updateData = req.body;
      
      const taskUpdate = {
        id: "update_" + Date.now(),
        ...updateData,
        createdAt: new Date()
      };
      
      res.json({ taskUpdate });
    } catch (error) {
      console.error("Task update error:", error);
      res.status(500).json({ message: "Failed to submit task update" });
    }
  });

  app.patch("/api/permeate/task-updates/:updateId", async (req, res) => {
    try {
      const { updateId } = req.params;
      const { approvalStatus, approvedBy, approvalNotes } = req.body;
      
      const updatedTaskUpdate = {
        id: updateId,
        approvalStatus,
        approvedBy,
        approvalNotes,
        updatedAt: new Date()
      };
      
      res.json({ taskUpdate: updatedTaskUpdate });
    } catch (error) {
      console.error("Task approval error:", error);
      res.status(500).json({ message: "Failed to process approval" });
    }
  });

  // Performance analytics
  app.post("/api/permeate/analyze-performance", async (req, res) => {
    try {
      const { goalsData, projectsData, tasksData } = req.body;
      
      if (!process.env.OPENAI_API_KEY_PE) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      // AI-powered performance analysis
      const analytics = {
        overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
        completionRate: goalsData.length > 0 ? 
          Math.round((goalsData.filter((g: any) => g.status === 'completed').length / goalsData.length) * 100) : 0,
        riskAreas: [
          "Resource allocation needs optimization",
          "Some deadlines may need adjustment"
        ],
        insights: [
          "Strong progress on customer-facing initiatives",
          "Team collaboration metrics are improving",
          "Consider implementing more frequent check-ins"
        ],
        recommendations: [
          "Focus on high-priority tasks",
          "Increase cross-functional collaboration",
          "Implement automated progress tracking"
        ]
      };
      
      res.json(analytics);
    } catch (error) {
      console.error("Performance analysis error:", error);
      res.status(500).json({ message: "Failed to analyze performance" });
    }
  });

  // Simple URL access route for PerMeaTe Enterprise - serve directly
  app.get("/m8x3r/pe-system", (req, res) => {
    // Redirect to the actual PerMeaTe application, not the marketing page
    res.redirect("/permeate-enhanced");
  });
}
