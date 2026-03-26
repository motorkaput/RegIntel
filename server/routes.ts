import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerRegTechRoutes } from "./routes/regtech";
import { storage } from "./storage";
import { initializeRazorpay, createOrder, verifyPayment } from "./services/razorpay";
import { processDocument } from "./services/documentProcessor";
import { generatePerformanceAnalytics } from "./services/performanceAnalytics";
import { processDocumentWithAI, answerQuestion, analyzeContext } from "./services/fetchPatternsAI";
import multer from "multer";
import { regtechUsers, users } from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { initializeAdminUser } from "./initAdmin";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const JWT_SECRET = process.env.JWT_SECRET || "fallback-jwt-secret-change-in-production";
const TRIAL_DAYS = 14;

// In-memory storage for free version
const freeVersionAnalyses = new Map<string, any>();

function generateToken(user: any): string {
  return jwt.sign(
    { userId: user.id, email: user.email, isAdmin: user.isAdmin || false },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.session?.userId) return next();
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as any;
      req.session.userId = decoded.userId;
      return next();
    } catch (_e) { /* invalid token */ }
  }
  return res.status(401).json({ message: "Unauthorized" });
}

// Trial/paywall middleware
export async function requireActiveAccess(req: any, res: any, next: any) {
  if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
  const user = await storage.getUser(req.session.userId);
  if (!user) return res.status(401).json({ message: "User not found" });
  if (user.isAdmin) return next();
  const status = user.subscriptionStatus || "trial";
  if (status === "active") return next();
  if (status === "trial") {
    const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    if (trialEnd && trialEnd > new Date()) return next();
    return res.status(403).json({ message: "Your free trial has expired. Please subscribe to continue.", code: "TRIAL_EXPIRED" });
  }
  return res.status(403).json({ message: "Your subscription is inactive. Please subscribe to continue.", code: "SUBSCRIPTION_INACTIVE" });
}

// Rate limiter
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
    if (entry.count >= maxRequests) return res.status(429).json({ message: "Too many requests." });
    entry.count++;
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

// Send email via Resend
async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.warn("RESEND_API_KEY not set"); return; }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({ from: "RegIntel <hello@darkstreet.org>", to, subject, html });
  } catch (error) { console.error("Failed to send email:", error); }
}

export async function registerRoutes(app: Express): Promise<Server> {
  initializeRazorpay();
  await initializeAdminUser();

  // Health
  app.get("/api/health", async (_req, res) => {
    try {
      await db.execute(sql`SELECT 1`);
      res.json({ status: "healthy", timestamp: new Date().toISOString(), database: "connected" });
    } catch (error) {
      res.status(503).json({ status: "unhealthy", database: "disconnected" });
    }
  });

  // Public config (safe client-side keys only)
  app.get("/api/config", (_req, res) => {
    res.json({
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
      googleClientId: process.env.GOOGLE_CLIENT_ID ? true : false,
    });
  });

  // ===== AUTH =====
  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const s = z.object({
        email: z.string().email(),
        password: z.string().min(8, "Password must be at least 8 characters"),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      });
      const v = s.safeParse(req.body);
      if (!v.success) return res.status(400).json({ message: v.error.errors[0].message });
      const { email, password, firstName, lastName } = v.data;

      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(409).json({ message: "An account with this email already exists." });

      const hashedPassword = await bcrypt.hash(password, 10);
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

      const user = await storage.createUser({
        id: nanoid(),
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        isAdmin: false,
        subscriptionStatus: "trial",
        trialEndsAt,
      });

      req.session.regenerate((err: any) => {
        if (err) return res.status(500).json({ message: "Registration failed" });
        req.session.userId = user.id;
        req.session.save((saveErr: any) => {
          if (saveErr) return res.status(500).json({ message: "Registration failed" });
          const token = generateToken(user);
          const { password: _, ...safe } = user;
          res.json({ ...safe, token });
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const s = z.object({ email: z.string().email(), password: z.string().min(1) });
      const v = s.safeParse(req.body);
      if (!v.success) return res.status(400).json({ message: v.error.errors[0].message });
      const { email, password } = v.data;

      let user = await storage.getUserByEmail(email);
      if (!user) {
        const [ru] = await db.select().from(regtechUsers).where(eq(regtechUsers.email, email)).limit(1);
        if (ru) user = ru as any;
      }
      if (!user || !user.password) return res.status(401).json({ message: "Invalid credentials" });

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

      req.session.regenerate((err: any) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        req.session.userId = user!.id;
        req.session.save((saveErr: any) => {
          if (saveErr) return res.status(500).json({ message: "Login failed" });
          const token = generateToken(user);
          const { password: _, ...safe } = user!;
          res.json({ ...safe, token });
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Google OAuth
  app.get("/api/auth/google", (_req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectBase = process.env.OAUTH_REDIRECT_BASE || "http://localhost:5000";
    if (!clientId) return res.status(500).json({ message: "Google OAuth not configured" });
    const redirectUri = `${redirectBase}/api/auth/google/callback`;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;
    res.redirect(url);
  });

  app.get("/api/auth/google/callback", async (req: any, res) => {
    try {
      const { code } = req.query;
      if (!code) return res.redirect("/?error=no_code");
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectBase = process.env.OAUTH_REDIRECT_BASE || "http://localhost:5000";
      const redirectUri = `${redirectBase}/api/auth/google/callback`;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code: code as string, client_id: clientId!, client_secret: clientSecret!, redirect_uri: redirectUri, grant_type: "authorization_code" }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) return res.redirect("/?error=token_failed");

      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await userInfoRes.json();
      if (!profile.email) return res.redirect("/?error=no_email");

      let user = await storage.getUserByEmail(profile.email);
      if (!user) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);
        user = await storage.createUser({
          id: nanoid(), email: profile.email, password: null,
          firstName: profile.given_name || null, lastName: profile.family_name || null,
          profileImageUrl: profile.picture || null, isAdmin: false,
          subscriptionStatus: "trial", trialEndsAt,
        });
      }

      req.session.regenerate((err: any) => {
        if (err) return res.redirect("/?error=session_failed");
        req.session.userId = user!.id;
        req.session.save(() => res.redirect("/regtech/documents"));
      });
    } catch (error) {
      console.error("Google OAuth error:", error);
      res.redirect("/?error=oauth_failed");
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req: any, res) => {
    try {
      if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
      let user = await storage.getUser(req.session.userId);
      if (!user) {
        const [ru] = await db.select().from(regtechUsers).where(eq(regtechUsers.id, req.session.userId)).limit(1);
        if (ru) user = ru as any;
      }
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safe } = user;
      let trialDaysRemaining = 0;
      if (user.subscriptionStatus === "trial" && user.trialEndsAt) {
        trialDaysRemaining = Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      }
      res.json({ ...safe, trialDaysRemaining });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Forgot/Reset password
  app.post("/api/auth/forgot-password", async (req: any, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });
      const user = await storage.getUserByEmail(email);
      if (!user) return res.json({ message: "If that email exists, a reset link has been sent." });
      const resetToken = jwt.sign({ userId: user.id, purpose: "reset" }, JWT_SECRET, { expiresIn: "1h" });
      const redirectBase = process.env.OAUTH_REDIRECT_BASE || "http://localhost:5000";
      const resetUrl = `${redirectBase}/?reset=${resetToken}`;
      await sendEmail(email, "Reset your RegIntel password", `
        <div style="font-family:'Inter',sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#001D51;font-family:'Playfair Display',serif;font-size:24px;margin:0;">regintel</h1>
            <p style="color:#666;font-size:12px;margin:4px 0 0;">by Dark Street Tech</p>
          </div>
          <p style="color:#333;font-size:14px;line-height:1.6;">You requested a password reset. Click below to set a new password. This link expires in 1 hour.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="background:#001D51;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Reset Password</a>
          </div>
          <p style="color:#999;font-size:12px;">If you didn't request this, ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:32px 0;"/>
          <p style="color:#999;font-size:11px;text-align:center;"><a href="https://darkstreet.tech" style="color:#D4AF37;">darkstreet.tech</a> &middot; hello@darkstreet.org</p>
        </div>`);
      res.json({ message: "If that email exists, a reset link has been sent." });
    } catch (error) {
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.post("/api/auth/reset-password", async (req: any, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) return res.status(400).json({ message: "Token and password are required" });
      if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.purpose !== "reset") return res.status(400).json({ message: "Invalid reset token" });
      const hashed = await bcrypt.hash(password, 10);
      await storage.updateUserPassword(decoded.userId, hashed);
      res.json({ message: "Password reset successfully." });
    } catch (error: any) {
      if (error.name === "TokenExpiredError") return res.status(400).json({ message: "Reset link has expired." });
      res.status(400).json({ message: "Invalid or expired reset token" });
    }
  });

  // ===== SUBSCRIPTIONS =====
  app.get("/api/subscription/status", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      let trialDaysRemaining = 0;
      let isTrialExpired = false;
      if (user.subscriptionStatus === "trial" && user.trialEndsAt) {
        trialDaysRemaining = Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        isTrialExpired = trialDaysRemaining === 0;
      }
      res.json({ subscriptionStatus: user.subscriptionStatus || "trial", trialDaysRemaining, isTrialExpired, isAdmin: user.isAdmin });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription status" });
    }
  });

  app.post("/api/subscription/create-order", isAuthenticated, async (req: any, res) => {
    try {
      const { planId } = req.body;
      const plans: Record<string, { amount: number; name: string }> = {
        professional_monthly: { amount: 199, name: "Professional Monthly" },
        professional_yearly: { amount: 1990, name: "Professional Yearly" },
      };
      const plan = plans[planId];
      if (!plan) return res.status(400).json({ message: "Invalid plan" });
      const order = await createOrder(plan.amount, "USD");
      res.json({ order, planId, planName: plan.name });
    } catch (error) {
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.post("/api/subscription/verify-payment", isAuthenticated, async (req: any, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
      const isValid = verifyPayment(razorpay_payment_id, razorpay_order_id, razorpay_signature);
      if (!isValid) return res.status(400).json({ message: "Invalid payment signature" });

      const accessExpiresAt = new Date();
      if (planId === "professional_yearly") accessExpiresAt.setFullYear(accessExpiresAt.getFullYear() + 1);
      else accessExpiresAt.setMonth(accessExpiresAt.getMonth() + 1);

      await db.update(users).set({
        subscriptionStatus: "active", subscriptionId: razorpay_payment_id,
        accessExpiresAt, updatedAt: new Date(),
      }).where(eq(users.id, req.session.userId));

      res.json({ success: true, message: "Subscription activated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  app.get("/api/subscription-plans", async (_req, res) => {
    res.json([
      {
        id: "professional_monthly", name: "Professional", description: "All features, billed monthly",
        price: "199.00", currency: "USD", interval: "monthly",
        features: ["Unlimited regulatory documents", "AI-powered Q&A with citations", "Regulatory change tracking & diff", "Obligation extraction & analysis", "Custom alert profiles", "Session tracking & audit trail", "Priority support"],
      },
      {
        id: "professional_yearly", name: "Professional", description: "All features, billed annually (save $398)",
        price: "1990.00", currency: "USD", interval: "yearly",
        features: ["Everything in monthly, plus:", "2 months free", "Annual billing convenience"],
      },
      {
        id: "institutional", name: "Institutional", description: "Custom pricing for teams",
        price: "0", currency: "USD", interval: "custom",
        features: ["Multi-user access & roles", "Organization-level document sharing", "Custom integrations & API", "Dedicated account manager", "Custom SLAs"],
      },
    ]);
  });

  // ===== DOCUMENTS =====
  app.get("/api/documents", isAuthenticated, async (req: any, res) => {
    try { res.json(await storage.getUserDocuments(req.session.userId)); }
    catch { res.status(500).json({ message: "Failed to fetch documents" }); }
  });

  app.post("/api/documents/upload", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });
      const doc = await storage.createDocument({
        userId: req.session.userId, filename: `${nanoid()}_${file.originalname}`,
        originalName: file.originalname, mimeType: file.mimetype, size: file.size, status: "processing",
      });
      processDocument(doc.id.toString(), file.buffer, file.mimetype)
        .then(async (a) => {
          await storage.updateDocument(doc.id, { status: "completed", extractedText: a.text, analysis: a.insights, sentiment: a.sentiment, score: a.score.toString() });
          await storage.createPerformanceMetric({ userId: req.session.userId, metricType: "document_processed", value: "1", metadata: { documentId: doc.id.toString() } });
        })
        .catch(async (e) => { await storage.updateDocument(doc.id, { status: "failed", processingError: e.message }); });
      res.json(doc);
    } catch { res.status(500).json({ message: "Failed to upload document" }); }
  });

  app.get("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const doc = await storage.getDocument(parseInt(req.params.id));
      if (!doc || doc.userId !== req.session.userId) return res.status(404).json({ message: "Not found" });
      res.json(doc);
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const doc = await storage.getDocument(parseInt(req.params.id));
      if (!doc || doc.userId !== req.session.userId) return res.status(404).json({ message: "Not found" });
      await storage.deleteDocument(parseInt(req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  // ===== FETCH PATTERNS =====
  app.get("/api/fetch-patterns/analyses", async (_req, res) => {
    res.json(Array.from(freeVersionAnalyses.values()));
  });

  app.post("/api/fetch-patterns/upload", upload.array("files"), async (req: any, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files?.length) return res.status(400).json({ message: "No files uploaded" });
      if (files.length > 20) return res.status(429).json({ message: "Max 20 files at once" });
      const analyses = files.map((file) => {
        const id = nanoid();
        const a = { id, userId: "free-user", filename: `${nanoid()}_${file.originalname}`, originalName: file.originalname, mimeType: file.mimetype, size: file.size, status: "processing" as const, uploadDate: new Date() };
        freeVersionAnalyses.set(id, a);
        setImmediate(async () => {
          try {
            const r = await processDocumentWithAI(file.buffer, file.mimetype);
            freeVersionAnalyses.set(id, { ...a, status: "completed", ...r, completedAt: new Date() });
          } catch (e) { freeVersionAnalyses.set(id, { ...a, status: "error", processingError: (e as Error).message }); }
        });
        return a;
      });
      res.json({ message: `${files.length} files uploaded`, analyses });
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  app.get("/api/fetch-patterns/analysis/:id", (req, res) => {
    const a = freeVersionAnalyses.get(req.params.id);
    if (!a) return res.status(404).json({ message: "Not found" });
    res.json(a);
  });

  app.delete("/api/fetch-patterns/analysis/:id", (req, res) => {
    freeVersionAnalyses.delete(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/fetch-patterns/question", rateLimit(60000, 10), async (req: any, res) => {
    try {
      const { question, documents } = req.body;
      if (!question) return res.status(400).json({ message: "Question required" });
      if (!documents?.length) return res.json({ answer: "No documents available.", confidence: 0, sources: [] });
      res.json(await answerQuestion(documents, question));
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  app.post("/api/fetch-patterns/context-analysis", rateLimit(60000, 10), async (req: any, res) => {
    try {
      const { context, documents } = req.body;
      if (!context) return res.status(400).json({ message: "Context required" });
      if (!documents?.length) return res.json({ context, mentions: 0, sentimentBreakdown: { positive: 0, negative: 0, neutral: 100 }, emotionalTone: ["neutral"], keyPhrases: [], summary: "No documents." });
      res.json(await analyzeContext(documents, context));
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  // ===== ANALYTICS =====
  app.get("/api/analytics/dashboard", isAuthenticated, async (req: any, res) => {
    try { res.json(await generatePerformanceAnalytics(req.session.userId)); }
    catch { res.status(500).json({ message: "Failed" }); }
  });

  app.get("/api/analytics/metrics", isAuthenticated, async (req: any, res) => {
    try {
      const { type, startDate, endDate } = req.query;
      const metrics = startDate && endDate
        ? await storage.getMetricsByDateRange(req.session.userId, new Date(startDate as string), new Date(endDate as string))
        : await storage.getUserMetrics(req.session.userId, type as string);
      res.json(metrics);
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  // ===== ADMIN =====
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const u = await storage.getUser(req.session.userId);
      if (!u?.isAdmin) return res.status(403).json({ message: "Admin required" });
      const all = await storage.getAllUsers();
      res.json(all.map(({ password: _, ...u }) => u));
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  app.put("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const cu = await storage.getUser(req.session.userId);
      if (!cu?.isAdmin) return res.status(403).json({ message: "Admin required" });
      const { subscriptionStatus, isAdmin, role } = req.body;
      const updates: any = { updatedAt: new Date() };
      if (subscriptionStatus !== undefined) updates.subscriptionStatus = subscriptionStatus;
      if (isAdmin !== undefined) updates.isAdmin = isAdmin;
      if (role !== undefined) updates.role = role;
      if (subscriptionStatus === "active") {
        const exp = new Date(); exp.setFullYear(exp.getFullYear() + 1); updates.accessExpiresAt = exp;
      }
      const updated = await storage.updateUser(req.params.id, updates);
      const { password: _, ...safe } = updated;
      res.json(safe);
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  // Initialize default plans
  (async () => {
    try {
      const plans = await storage.getSubscriptionPlans();
      if (plans.length === 0) {
        await storage.createSubscriptionPlan({ id: "professional_monthly", name: "Professional", description: "Monthly", price: "199.00", currency: "USD", interval: "monthly", documentsLimit: -1, features: ["All features"] });
        await storage.createSubscriptionPlan({ id: "professional_yearly", name: "Professional", description: "Yearly", price: "1990.00", currency: "USD", interval: "yearly", documentsLimit: -1, features: ["All features", "2 months free"] });
      }
    } catch (e) { console.error("Plan init error:", e); }
  })();

  registerRegTechRoutes(app);
  return createServer(app);
}
