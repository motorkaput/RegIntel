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
import { sql } from "drizzle-orm";
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

// PerMeaTe Enterprise Tables
export const permeateCompanies = pgTable("permeate_companies", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  businessAreas: varchar("business_areas").array(),
  employeeCount: integer("employee_count"),
  locations: varchar("locations").array(),
  isOnboarded: boolean("is_onboarded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const permeateEmployees = pgTable("permeate_employees", {
  id: varchar("id").primaryKey(),
  companyId: varchar("company_id").notNull().references(() => permeateCompanies.id),
  employeeId: varchar("employee_id").notNull(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  username: varchar("username").notNull(),
  passwordHash: varchar("password_hash"),
  role: varchar("role"),
  department: varchar("department"),
  location: varchar("location"),
  reportingTo: varchar("reporting_to"),
  keySkills: jsonb("key_skills"),
  userType: varchar("user_type").notNull(),
  seniority: varchar("seniority"),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const permeateGoals = pgTable("permeate_goals", {
  id: varchar("id").primaryKey(),
  companyId: varchar("company_id").notNull().references(() => permeateCompanies.id),
  title: varchar("title").notNull(),
  description: text("description"),
  assignedTo: varchar("assigned_to").references(() => permeateEmployees.id),
  status: varchar("status").default("active"),
  priority: varchar("priority").default("medium"),
  dueDate: timestamp("due_date"),
  aiBreakdown: jsonb("ai_breakdown"),
  progress: integer("progress").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const permeateProjects = pgTable("permeate_projects", {
  id: varchar("id").primaryKey(),
  goalId: varchar("goal_id").notNull().references(() => permeateGoals.id),
  companyId: varchar("company_id").notNull().references(() => permeateCompanies.id),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").default("active"), // active, completed, paused, cancelled
  progress: integer("progress").default(0),
  priority: varchar("priority").default("medium"), // low, medium, high, critical
  dueDate: timestamp("due_date"),
  createdBy: varchar("created_by").notNull().references(() => permeateEmployees.id),
  assignedTo: varchar("assigned_to").array(), // employee IDs
  projectLeader: varchar("project_leader").references(() => permeateEmployees.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const permeateTasks = pgTable("permeate_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => permeateProjects.id),
  goalId: varchar("goal_id").notNull().references(() => permeateGoals.id),
  companyId: varchar("company_id").notNull().references(() => permeateCompanies.id),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").default("todo"), // todo, in_progress, completed, rejected
  progress: integer("progress").default(0),
  priority: varchar("priority").default("medium"), // low, medium, high, critical
  score: integer("score").default(0),
  selfScore: integer("self_score"),
  dueDate: timestamp("due_date"),
  createdBy: varchar("created_by").notNull().references(() => permeateEmployees.id),
  assignedTo: varchar("assigned_to").references(() => permeateEmployees.id),
  approvedBy: varchar("approved_by").references(() => permeateEmployees.id),
  statusNotes: text("status_notes"),
  externalIntegration: jsonb("external_integration"), // data from Jira, Asana, Trello, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const permeateTaskUpdates = pgTable("permeate_task_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => permeateTasks.id),
  employeeId: varchar("employee_id").notNull().references(() => permeateEmployees.id),
  status: varchar("status").notNull(),
  score: integer("score"),
  notes: text("notes"),
  attachments: jsonb("attachments"), // file paths or external links
  approvalStatus: varchar("approval_status").default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => permeateEmployees.id),
  approvalNotes: text("approval_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// PerMeaTe Relations
export const permeateCompaniesRelations = relations(permeateCompanies, ({ many }) => ({
  employees: many(permeateEmployees),
  goals: many(permeateGoals),
  projects: many(permeateProjects),
  tasks: many(permeateTasks),
}));

export const permeateEmployeesRelations = relations(permeateEmployees, ({ one, many }) => ({
  company: one(permeateCompanies, {
    fields: [permeateEmployees.companyId],
    references: [permeateCompanies.id],
  }),
  taskUpdates: many(permeateTaskUpdates),
}));

export const permeateGoalsRelations = relations(permeateGoals, ({ one, many }) => ({
  company: one(permeateCompanies, {
    fields: [permeateGoals.companyId],
    references: [permeateCompanies.id],
  }),
  projects: many(permeateProjects),
  tasks: many(permeateTasks),
}));

export const permeateProjectsRelations = relations(permeateProjects, ({ one, many }) => ({
  goal: one(permeateGoals, {
    fields: [permeateProjects.goalId],
    references: [permeateGoals.id],
  }),
  company: one(permeateCompanies, {
    fields: [permeateProjects.companyId],
    references: [permeateCompanies.id],
  }),
  creator: one(permeateEmployees, {
    fields: [permeateProjects.createdBy],
    references: [permeateEmployees.id],
    relationName: "projectCreator",
  }),
  leader: one(permeateEmployees, {
    fields: [permeateProjects.projectLeader],
    references: [permeateEmployees.id],
    relationName: "projectLeader",
  }),
  tasks: many(permeateTasks),
}));

export const permeateTasksRelations = relations(permeateTasks, ({ one, many }) => ({
  project: one(permeateProjects, {
    fields: [permeateTasks.projectId],
    references: [permeateProjects.id],
  }),
  goal: one(permeateGoals, {
    fields: [permeateTasks.goalId],
    references: [permeateGoals.id],
  }),
  company: one(permeateCompanies, {
    fields: [permeateTasks.companyId],
    references: [permeateCompanies.id],
  }),
  creator: one(permeateEmployees, {
    fields: [permeateTasks.createdBy],
    references: [permeateEmployees.id],
    relationName: "taskCreator",
  }),
  assignee: one(permeateEmployees, {
    fields: [permeateTasks.assignedTo],
    references: [permeateEmployees.id],
    relationName: "taskAssignee",
  }),
  approver: one(permeateEmployees, {
    fields: [permeateTasks.approvedBy],
    references: [permeateEmployees.id],
  }),
  updates: many(permeateTaskUpdates),
}));

// PerMeaTe Enterprise types
export type PermeateCompany = typeof permeateCompanies.$inferSelect;
export type InsertPermeateCompany = typeof permeateCompanies.$inferInsert;
export type PermeateEmployee = typeof permeateEmployees.$inferSelect;
export type InsertPermeateEmployee = typeof permeateEmployees.$inferInsert;
export type PermeateGoal = typeof permeateGoals.$inferSelect;
export type InsertPermeateGoal = typeof permeateGoals.$inferInsert;
export type PermeateProject = typeof permeateProjects.$inferSelect;
export type InsertPermeateProject = typeof permeateProjects.$inferInsert;
export type PermeateTask = typeof permeateTasks.$inferSelect;
export type InsertPermeateTask = typeof permeateTasks.$inferInsert;

// PerMeaTe Zod schemas
export const insertPermeateCompanySchema = createInsertSchema(permeateCompanies);
export const insertPermeateEmployeeSchema = createInsertSchema(permeateEmployees);
export const insertPermeateGoalSchema = createInsertSchema(permeateGoals);
export const insertPermeateProjectSchema = createInsertSchema(permeateProjects);
export const insertPermeateTaskSchema = createInsertSchema(permeateTasks);
export const insertPermeateTaskUpdateSchema = createInsertSchema(permeateTaskUpdates);


