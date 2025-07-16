import {
  users,
  subscriptionPlans,
  subscriptions,
  documents,
  performanceMetrics,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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
}

export const storage = new DatabaseStorage();
