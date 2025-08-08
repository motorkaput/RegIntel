import {
  users,
  subscriptionPlans,
  subscriptions,
  documents,
  performanceMetrics,
  documentAnalyses,
  openBetaUsers,
  openBetaDocumentAnalyses,
  permeateCompanies,
  permeateEmployees,
  permeateGoals,
  permeateProjects,
  permeateTasks,
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
  type OpenBetaUser,
  type InsertOpenBetaUser,
  type OpenBetaDocumentAnalysis,
  type InsertOpenBetaDocumentAnalysis,
  type PermeateCompany,
  type InsertPermeateCompany,
  type PermeateEmployee,
  type InsertPermeateEmployee,
  type PermeateGoal,
  type InsertPermeateGoal,
  type PermeateProject,
  type InsertPermeateProject,
  type PermeateTask,
  type InsertPermeateTask,
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

  // Open Beta User operations
  getOpenBetaUser(id: string): Promise<OpenBetaUser | undefined>;
  getOpenBetaUserByEmail(email: string): Promise<OpenBetaUser | undefined>;
  createOpenBetaUser(user: InsertOpenBetaUser): Promise<OpenBetaUser>;

  // Open Beta document analysis operations
  createOpenBetaDocumentAnalysis(analysis: InsertOpenBetaDocumentAnalysis): Promise<OpenBetaDocumentAnalysis>;
  getOpenBetaUserDocumentAnalyses(userId: string, limit?: number): Promise<OpenBetaDocumentAnalysis[]>;
  getOpenBetaDocumentAnalysis(id: string): Promise<OpenBetaDocumentAnalysis | undefined>;
  updateOpenBetaDocumentAnalysis(id: string, updates: Partial<OpenBetaDocumentAnalysis>): Promise<OpenBetaDocumentAnalysis>;
  deleteOpenBetaDocumentAnalysis(id: string): Promise<void>;

  // PerMeaTe Enterprise operations
  getPermeateCompany(companyId: string): Promise<PermeateCompany | undefined>;
  upsertPermeateCompany(company: InsertPermeateCompany): Promise<PermeateCompany>;
  
  // Employee operations
  getPermeateEmployees(companyId: string): Promise<PermeateEmployee[]>;
  getPermeateEmployeeByUsername(username: string): Promise<PermeateEmployee | undefined>;
  upsertPermeateEmployees(employees: InsertPermeateEmployee[]): Promise<void>;
  updateEmployeeLastLogin(employeeId: string): Promise<void>;
  
  // Goal operations
  getPermeateGoals(companyId: string): Promise<PermeateGoal[]>;
  createPermeateGoal(goal: InsertPermeateGoal): Promise<PermeateGoal>;
  updatePermeateGoal(goalId: string, updates: Partial<PermeateGoal>): Promise<PermeateGoal>;
  
  // Project operations
  getPermeateProjects(companyId: string): Promise<PermeateProject[]>;
  createPermeateProject(project: InsertPermeateProject): Promise<PermeateProject>;
  
  // Task operations
  getPermeateTasks(companyId: string): Promise<PermeateTask[]>;
  createPermeateTask(task: InsertPermeateTask): Promise<PermeateTask>;
  updatePermeateTask(taskId: string, updates: Partial<PermeateTask>): Promise<PermeateTask>;
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

  // PerMeaTe Enterprise operations - Database implementation
  async getPermeateCompany(companyId: string): Promise<PermeateCompany | undefined> {
    const [company] = await db
      .select()
      .from(permeateCompanies)
      .where(eq(permeateCompanies.id, companyId));
    return company;
  }

  async upsertPermeateCompany(company: InsertPermeateCompany): Promise<PermeateCompany> {
    const [upserted] = await db
      .insert(permeateCompanies)
      .values(company)
      .onConflictDoUpdate({
        target: permeateCompanies.id,
        set: {
          ...company,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  async getPermeateEmployees(companyId: string): Promise<PermeateEmployee[]> {
    return await db
      .select()
      .from(permeateEmployees)
      .where(eq(permeateEmployees.companyId, companyId))
      .orderBy(permeateEmployees.name);
  }

  async getPermeateEmployeeByUsername(username: string): Promise<PermeateEmployee | undefined> {
    const [employee] = await db
      .select()
      .from(permeateEmployees)
      .where(eq(permeateEmployees.email, username));
    return employee;
  }

  async getPermeateEmployeeByEmail(email: string): Promise<PermeateEmployee | undefined> {
    const [employee] = await db
      .select()
      .from(permeateEmployees)
      .where(eq(permeateEmployees.email, email));
    return employee;
  }

  async upsertPermeateEmployees(employees: InsertPermeateEmployee[]): Promise<void> {
    if (employees.length === 0) return;
    
    // Use a transaction to insert/update all employees
    await db.transaction(async (tx) => {
      for (const employee of employees) {
        await tx
          .insert(permeateEmployees)
          .values(employee)
          .onConflictDoUpdate({
            target: permeateEmployees.id,
            set: {
              ...employee,
              updatedAt: new Date(),
            },
          });
      }
    });
  }

  async updateEmployeeLastLogin(employeeId: string): Promise<void> {
    await db
      .update(permeateEmployees)
      .set({ 
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(permeateEmployees.id, employeeId));
  }

  async getPermeateGoals(companyId: string): Promise<PermeateGoal[]> {
    return await db
      .select()
      .from(permeateGoals)
      .where(eq(permeateGoals.companyId, companyId))
      .orderBy(desc(permeateGoals.createdAt));
  }

  async createPermeateGoal(goal: InsertPermeateGoal): Promise<PermeateGoal> {
    const [created] = await db
      .insert(permeateGoals)
      .values(goal)
      .returning();
    return created;
  }

  async updatePermeateGoal(goalId: string, updates: Partial<PermeateGoal>): Promise<PermeateGoal> {
    const [updated] = await db
      .update(permeateGoals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(permeateGoals.id, goalId))
      .returning();
    return updated;
  }

  async getPermeateProjects(companyId: string): Promise<PermeateProject[]> {
    return await db
      .select()
      .from(permeateProjects)
      .where(eq(permeateProjects.companyId, companyId))
      .orderBy(desc(permeateProjects.createdAt));
  }

  async createPermeateProject(project: InsertPermeateProject): Promise<PermeateProject> {
    const [created] = await db
      .insert(permeateProjects)
      .values(project)
      .returning();
    return created;
  }

  async getPermeateTasks(companyId: string): Promise<PermeateTask[]> {
    return await db
      .select()
      .from(permeateTasks)
      .where(eq(permeateTasks.companyId, companyId))
      .orderBy(desc(permeateTasks.createdAt));
  }

  async createPermeateTask(task: InsertPermeateTask): Promise<PermeateTask> {
    const [created] = await db
      .insert(permeateTasks)
      .values(task)
      .returning();
    return created;
  }

  async updatePermeateTask(taskId: string, updates: Partial<PermeateTask>): Promise<PermeateTask> {
    const [updated] = await db
      .update(permeateTasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(permeateTasks.id, taskId))
      .returning();
    return updated;
  }

  // Open Beta User operations implementation
  async getOpenBetaUser(id: string): Promise<OpenBetaUser | undefined> {
    const [user] = await db.select().from(openBetaUsers).where(eq(openBetaUsers.id, id));
    return user;
  }

  async getOpenBetaUserByEmail(email: string): Promise<OpenBetaUser | undefined> {
    const [user] = await db.select().from(openBetaUsers).where(eq(openBetaUsers.email, email));
    return user;
  }

  async createOpenBetaUser(userData: InsertOpenBetaUser): Promise<OpenBetaUser> {
    const [user] = await db
      .insert(openBetaUsers)
      .values(userData)
      .returning();
    return user;
  }

  // Open Beta document analysis operations implementation
  async createOpenBetaDocumentAnalysis(analysis: InsertOpenBetaDocumentAnalysis): Promise<OpenBetaDocumentAnalysis> {
    const [created] = await db
      .insert(openBetaDocumentAnalyses)
      .values(analysis)
      .returning();
    return created;
  }

  async getOpenBetaUserDocumentAnalyses(userId: string, limit = 50): Promise<OpenBetaDocumentAnalysis[]> {
    return await db
      .select()
      .from(openBetaDocumentAnalyses)
      .where(eq(openBetaDocumentAnalyses.userId, userId))
      .orderBy(desc(openBetaDocumentAnalyses.uploadDate))
      .limit(limit);
  }

  async getOpenBetaDocumentAnalysis(id: string): Promise<OpenBetaDocumentAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(openBetaDocumentAnalyses)
      .where(eq(openBetaDocumentAnalyses.id, id));
    return analysis;
  }

  async updateOpenBetaDocumentAnalysis(id: string, updates: Partial<OpenBetaDocumentAnalysis>): Promise<OpenBetaDocumentAnalysis> {
    const [updated] = await db
      .update(openBetaDocumentAnalyses)
      .set(updates)
      .where(eq(openBetaDocumentAnalyses.id, id))
      .returning();
    return updated;
  }

  async deleteOpenBetaDocumentAnalysis(id: string): Promise<void> {
    await db
      .delete(openBetaDocumentAnalyses)
      .where(eq(openBetaDocumentAnalyses.id, id));
  }
}

export const storage = new DatabaseStorage();
