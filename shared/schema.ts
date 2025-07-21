import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  decimal,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  subscriptionId: varchar("subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("trial"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  interval: varchar("interval").default("monthly"), // monthly, yearly
  features: jsonb("features"),
  documentsLimit: integer("documents_limit"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  planId: varchar("plan_id").references(() => subscriptionPlans.id),
  razorpaySubscriptionId: varchar("razorpay_subscription_id"),
  status: varchar("status").default("active"), // active, cancelled, expired
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents uploaded by users
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type"),
  size: integer("size"),
  status: varchar("status").default("processing"), // processing, completed, failed
  extractedText: text("extracted_text"),
  analysis: jsonb("analysis"),
  sentiment: varchar("sentiment"),
  score: decimal("score", { precision: 5, scale: 2 }),
  processingError: text("processing_error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Performance metrics
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  metricType: varchar("metric_type").notNull(), // document_count, processing_time, accuracy_score
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  metadata: jsonb("metadata"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Fetch Patterns document analyses
export const documentAnalyses = pgTable("document_analyses", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type"),
  size: integer("size"),
  status: varchar("status").default("processing"), // processing, completed, error
  extractedText: text("extracted_text"),
  classification: varchar("classification"),
  sentiment: jsonb("sentiment"), // {label, score, reasoning}
  keywords: jsonb("keywords"), // string[]
  insights: jsonb("insights"), // string[]
  riskFlags: jsonb("risk_flags"), // string[]
  summary: text("summary"),
  wordCloud: jsonb("word_cloud"), // {text: string, value: number}[]
  processingError: text("processing_error"),
  uploadDate: timestamp("upload_date").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  documents: many(documents),
  metrics: many(performanceMetrics),
  subscription: one(subscriptions, {
    fields: [users.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  user: one(users, {
    fields: [performanceMetrics.userId],
    references: [users.id],
  }),
}));

export const documentAnalysesRelations = relations(documentAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [documentAnalyses.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertDocumentSchema = createInsertSchema(documents);
export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics);
export const insertDocumentAnalysisSchema = createInsertSchema(documentAnalyses);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;
export type DocumentAnalysis = typeof documentAnalyses.$inferSelect;
export type InsertDocumentAnalysis = typeof documentAnalyses.$inferInsert;
