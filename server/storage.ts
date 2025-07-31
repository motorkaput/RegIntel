import {
  users,
  subscriptionPlans,
  subscriptions,
  documents,
  performanceMetrics,
  documentAnalyses,
  type User,
  type UpsertUser,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Subscription,
  type InsertSubscription,
  type Document,
  type InsertDocument,
  type PerformanceMetric,
  type InsertPerformanceMetric,
  type DocumentAnalysis,
  type InsertDocumentAnalysis,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Subscription operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  
  // Document operations
  createDocument(doc: InsertDocument): Promise<Document>;
  getUserDocuments(userId: string, limit?: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  getUserDocumentCount(userId: string): Promise<number>;
  
  // Performance metrics
  createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric>;
  getUserMetrics(userId: string, type?: string): Promise<PerformanceMetric[]>;
  getMetricsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<PerformanceMetric[]>;

  // Fetch Patterns document analysis operations
  createDocumentAnalysis(analysis: InsertDocumentAnalysis): Promise<DocumentAnalysis>;
  getUserDocumentAnalyses(userId: string, limit?: number): Promise<DocumentAnalysis[]>;
  getDocumentAnalysis(id: string): Promise<DocumentAnalysis | undefined>;
  updateDocumentAnalysis(id: string, updates: Partial<DocumentAnalysis>): Promise<DocumentAnalysis>;
  deleteDocumentAnalysis(id: string): Promise<void>;
  getUserDocumentAnalysisCount(userId: string): Promise<number>;

  // PerMeaTe Enterprise operations
  getCompany(companyId: string): Promise<any>;
  upsertCompany(company: any): Promise<any>;
  getEmployees(companyId: string): Promise<any[]>;
  upsertEmployees(companyId: string, employees: any[]): Promise<void>;
  getOrgChart(companyId: string): Promise<any[]>;
  getGoals(companyId: string): Promise<any[]>;
  createGoal(goal: any): Promise<any>;
  updateGoal(goalId: string, updates: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // First try to find existing user by email
      const existingUser = await this.getUserByEmail(userData.email || '');
      
      if (existingUser) {
        // Update existing user
        const [updatedUser] = await db
          .update(users)
          .set({
            id: userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email || ''))
          .returning();
        return updatedUser;
      } else {
        // Create new user
        const [newUser] = await db
          .insert(users)
          .values(userData)
          .returning();
        return newUser;
      }
    } catch (error) {
      console.error('Error in upsertUser:', error);
      throw error;
    }
  }

  // Subscription operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [createdPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
    return createdPlan;
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [created] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return created;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  // Document operations
  async createDocument(doc: InsertDocument): Promise<Document> {
    const [created] = await db
      .insert(documents)
      .values(doc)
      .returning();
    return created;
  }

  async getUserDocuments(userId: string, limit = 50): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt))
      .limit(limit);
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document> {
    const [updated] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async getUserDocumentCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.userId, userId));
    return result.count;
  }

  // Performance metrics
  async createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const [created] = await db
      .insert(performanceMetrics)
      .values(metric)
      .returning();
    return created;
  }

  async getUserMetrics(userId: string, type?: string): Promise<PerformanceMetric[]> {
    const conditions = [eq(performanceMetrics.userId, userId)];
    if (type) {
      conditions.push(eq(performanceMetrics.metricType, type));
    }
    
    return await db
      .select()
      .from(performanceMetrics)
      .where(and(...conditions))
      .orderBy(desc(performanceMetrics.recordedAt));
  }

  async getMetricsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<PerformanceMetric[]> {
    return await db
      .select()
      .from(performanceMetrics)
      .where(
        and(
          eq(performanceMetrics.userId, userId),
          gte(performanceMetrics.recordedAt, startDate),
          lte(performanceMetrics.recordedAt, endDate)
        )
      )
      .orderBy(desc(performanceMetrics.recordedAt));
  }

  // Fetch Patterns document analysis operations
  async createDocumentAnalysis(analysis: InsertDocumentAnalysis): Promise<DocumentAnalysis> {
    const [created] = await db
      .insert(documentAnalyses)
      .values(analysis)
      .returning();
    return created;
  }

  async getUserDocumentAnalyses(userId: string, limit: number = 50): Promise<DocumentAnalysis[]> {
    return await db
      .select()
      .from(documentAnalyses)
      .where(eq(documentAnalyses.userId, userId))
      .orderBy(desc(documentAnalyses.uploadDate))
      .limit(limit);
  }

  async getDocumentAnalysis(id: string): Promise<DocumentAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(documentAnalyses)
      .where(eq(documentAnalyses.id, id));
    return analysis;
  }

  async updateDocumentAnalysis(id: string, updates: Partial<DocumentAnalysis>): Promise<DocumentAnalysis> {
    const [updated] = await db
      .update(documentAnalyses)
      .set(updates)
      .where(eq(documentAnalyses.id, id))
      .returning();
    return updated;
  }

  async deleteDocumentAnalysis(id: string): Promise<void> {
    await db
      .delete(documentAnalyses)
      .where(eq(documentAnalyses.id, id));
  }

  async getUserDocumentAnalysisCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(documentAnalyses)
      .where(eq(documentAnalyses.userId, userId));
    return result.count;
  }

  // PerMeaTe Enterprise operations (using in-memory storage for now)
  private permeateData: Map<string, any> = new Map();

  async getCompany(companyId: string): Promise<any> {
    return this.permeateData.get(`company_${companyId}`) || null;
  }

  async upsertCompany(company: any): Promise<any> {
    this.permeateData.set(`company_${company.id}`, company);
    return company;
  }

  async getEmployees(companyId: string): Promise<any[]> {
    return this.permeateData.get(`employees_${companyId}`) || [];
  }

  async upsertEmployees(companyId: string, employees: any[]): Promise<void> {
    this.permeateData.set(`employees_${companyId}`, employees);
    
    // Generate org chart from employee data
    const orgChart = this.buildOrgChart(employees);
    this.permeateData.set(`orgChart_${companyId}`, orgChart);
  }

  async getOrgChart(companyId: string): Promise<any[]> {
    return this.permeateData.get(`orgChart_${companyId}`) || [];
  }

  async getGoals(companyId: string): Promise<any[]> {
    return this.permeateData.get(`goals_${companyId}`) || [];
  }

  async createGoal(goal: any): Promise<any> {
    const companyId = goal.companyId;
    const goals = await this.getGoals(companyId);
    goals.push(goal);
    this.permeateData.set(`goals_${companyId}`, goals);
    return goal;
  }

  async updateGoal(goalId: string, updates: any): Promise<any> {
    // Find and update goal across all companies
    for (const [key, value] of Array.from(this.permeateData.entries())) {
      if (key.startsWith('goals_')) {
        const goals = value as any[];
        const goalIndex = goals.findIndex(g => g.id === goalId);
        if (goalIndex !== -1) {
          goals[goalIndex] = { ...goals[goalIndex], ...updates };
          this.permeateData.set(key, goals);
          return goals[goalIndex];
        }
      }
    }
    return null;
  }

  private buildOrgChart(employees: any[]): any[] {
    // Build hierarchical org chart from flat employee list
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
}

export const storage = new DatabaseStorage();
