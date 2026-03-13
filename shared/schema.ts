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
  vector,
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

// Organizations for multi-tenancy
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().notNull(),
  name: varchar("name").notNull(),
  domain: varchar("domain"), // Optional company domain
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role"), // CCO, MLRO, Financial Crime Head, AML Ops, Compliance Analyst, Business Analyst
  organizationId: varchar("organization_id").references(() => organizations.id),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  subscriptionId: varchar("subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("trial"),
  trialEndsAt: timestamp("trial_ends_at"),
  accessExpiresAt: timestamp("access_expires_at"),
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

// Session archives - saved analysis sessions as PDFs
export const sessionArchives = pgTable("session_archives", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  pdfData: text("pdf_data").notNull(), // Base64 encoded PDF
  sessionSummary: text("session_summary"),
  documentCount: integer("document_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
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

export const sessionArchivesRelations = relations(sessionArchives, ({ one }) => ({
  user: one(users, {
    fields: [sessionArchives.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertOrganizationSchema = createInsertSchema(organizations);
export const insertUserSchema = createInsertSchema(users);
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertDocumentSchema = createInsertSchema(documents);
export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics);
export const insertDocumentAnalysisSchema = createInsertSchema(documentAnalyses);
export const insertSessionArchiveSchema = createInsertSchema(sessionArchives).omit({ id: true, createdAt: true });

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;
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
export type SessionArchive = typeof sessionArchives.$inferSelect;
export type InsertSessionArchive = z.infer<typeof insertSessionArchiveSchema>;

// ============================================================================
// RegTech Edition Tables - Regulatory Document Tracking & Analysis
// ============================================================================

// RegTech Organizations - separate from main organizations table
export const regtechOrganizations = pgTable("regtech_organizations", {
  id: varchar("id").primaryKey().notNull(),
  name: varchar("name").notNull(),
  domain: varchar("domain"),
  industry: varchar("industry"), // Banking, Insurance, Securities, Fintech, Crypto/VASP
  jurisdictions: varchar("jurisdictions").array(), // operating jurisdictions
  licenseType: varchar("license_type"), // type of financial license
  employeeCount: integer("employee_count"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// RegTech Users - separate from main users table  
export const regtechUsers = pgTable("regtech_users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role"), // cco, mlro, financial_crime_head, aml_ops, compliance_analyst, business_analyst
  organizationId: varchar("organization_id").references(() => regtechOrganizations.id),
  isAdmin: boolean("is_admin").default(false),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alert Configurations - user-defined alert rules
export const alertConfigurations = pgTable("alert_configurations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  alertType: varchar("alert_type").notNull(), // keyword, phrase, url, regulator
  keywords: varchar("keywords").array(), // keywords to match
  phrases: text("phrases").array(), // exact phrases to match
  urls: text("urls").array(), // specific URLs to monitor
  regulators: varchar("regulators").array(), // regulators to track
  jurisdictions: varchar("jurisdictions").array(), // jurisdictions to track
  frequency: varchar("frequency").default("immediate"), // immediate, daily, weekly
  isActive: boolean("is_active").default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Regulatory documents from global FIU/AML/FATF regulators
export const regulatoryDocuments = pgTable("regulatory_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  originalFilename: text("original_filename"), // Original uploaded filename
  url: text("url"),
  jurisdiction: varchar("jurisdiction").notNull(), // US, IN, UK, SG, AU, CA, EU
  regulator: varchar("regulator").notNull(), // FinCEN, FIU-IND, FCA, MAS, AUSTRAC, FINTRAC, FATF
  instrumentType: varchar("instrument_type"), // circular, gazette, consultation, guidance, amendment
  publishedAt: timestamp("published_at"),
  effectiveAt: timestamp("effective_at"),
  replacesDocId: integer("replaces_doc_id").references((): any => regulatoryDocuments.id),
  status: varchar("status").default("active"), // active, superseded, archived
  version: varchar("version"),
  contentHash: varchar("content_hash"), // for change detection
  storagePath: text("storage_path"), // path to stored original document
  extractedText: text("extracted_text"),
  metadata: jsonb("metadata"), // additional fields like topics, tags
  uploadedBy: varchar("uploaded_by"), // Can be regtech_users.id or users.id
  classification: varchar("classification"), // regulatory, legal, guidance, policy, other
  classificationConfidence: decimal("classification_confidence", { precision: 3, scale: 2 }), // 0.00-1.00
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document chunks with embeddings for vector search
export const documentChunks = pgTable("document_chunks", {
  id: serial("id").primaryKey(),
  docId: integer("doc_id").notNull().references(() => regulatoryDocuments.id),
  ordinal: integer("ordinal").notNull(), // chunk order in document
  text: text("text").notNull(),
  tokens: integer("tokens"),
  embedding: vector("embedding", { dimensions: 2000 }), // text-embedding-3-large with reduced dimensions
  sectionRef: varchar("section_ref"), // e.g., "3.1(b)" or "para 12"
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("document_chunks_embedding_idx").using("ivfflat", table.embedding.op("vector_cosine_ops")).with({ lists: 100 }),
]);

// Extracted regulatory obligations
export const obligations = pgTable("obligations", {
  id: serial("id").primaryKey(),
  docId: integer("doc_id").notNull().references(() => regulatoryDocuments.id),
  area: varchar("area").notNull(), // KYC, Sanctions, Reporting, RecordKeeping, Training, Others
  actor: varchar("actor"), // Bank, NBFC, VASP, PSP, EMI, Brokerage, Fintech, All
  requirement: text("requirement").notNull(),
  deadline: timestamp("deadline"),
  penalty: text("penalty"),
  citationRef: jsonb("citation_ref").notNull(), // {url, section}
  impactScore: decimal("impact_score", { precision: 3, scale: 2 }), // 0-10
  createdAt: timestamp("created_at").defaultNow(),
});

// Document version changesets
export const changesets = pgTable("changesets", {
  id: serial("id").primaryKey(),
  docIdNew: integer("doc_id_new").notNull().references(() => regulatoryDocuments.id),
  docIdOld: integer("doc_id_old").references(() => regulatoryDocuments.id),
  diffSummary: text("diff_summary"),
  sectionsAdded: jsonb("sections_added"), // array of section refs
  sectionsRemoved: jsonb("sections_removed"),
  sectionsAmended: jsonb("sections_amended"),
  obligationChanges: jsonb("obligation_changes"), // changes to obligations
  impactScore: decimal("impact_score", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// User alert profiles and preferences
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  jurisdictions: varchar("jurisdictions").array(), // preferred jurisdictions
  topics: varchar("topics").array(), // KYC, AML, Sanctions, VASPs, Crypto, Reporting
  regulators: varchar("regulators").array(), // specific regulators to track
  actorType: varchar("actor_type"), // Bank, VASP, etc.
  alertFrequency: varchar("alert_frequency").default("immediate"), // immediate, daily, weekly
  emailNotifications: boolean("email_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Proactive alerts
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  docId: integer("doc_id").notNull().references(() => regulatoryDocuments.id),
  changesetId: integer("changeset_id").references(() => changesets.id),
  alertType: varchar("alert_type").notNull(), // new_document, updated_document, deadline_approaching
  title: text("title").notNull(),
  summary: text("summary"),
  impactScore: decimal("impact_score", { precision: 3, scale: 2 }),
  actionItems: jsonb("action_items"), // array of action items
  status: varchar("status").default("unread"), // unread, read, dismissed, actioned
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// Classification disagreements - user feedback on AI classifications
export const classificationDisagreements = pgTable("classification_disagreements", {
  id: serial("id").primaryKey(),
  docId: integer("doc_id").notNull().references(() => regulatoryDocuments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  originalClassification: varchar("original_classification").notNull(),
  suggestedClassification: varchar("suggested_classification").notNull(),
  reason: text("reason"),
  status: varchar("status").default("pending"), // pending, reviewed, accepted, rejected
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Personal document folders - hierarchical organization with up to 5 levels
export const documentFolders = pgTable("document_folders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: integer("parent_id"), // null for root folders, self-reference for nesting
  depth: integer("depth").default(0).notNull(), // 0-4, max 5 levels (0 to 4)
  color: varchar("color", { length: 7 }), // hex color for folder icon
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Junction table for documents in folders (many-to-many)
export const documentFolderItems = pgTable("document_folder_items", {
  id: serial("id").primaryKey(),
  folderId: integer("folder_id").notNull().references(() => documentFolders.id, { onDelete: "cascade" }),
  docId: integer("doc_id").notNull().references(() => regulatoryDocuments.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").defaultNow(),
});

// RegTech Relations
export const regulatoryDocumentsRelations = relations(regulatoryDocuments, ({ one, many }) => ({
  uploader: one(users, {
    fields: [regulatoryDocuments.uploadedBy],
    references: [users.id],
  }),
  replaces: one(regulatoryDocuments, {
    fields: [regulatoryDocuments.replacesDocId],
    references: [regulatoryDocuments.id],
  }),
  chunks: many(documentChunks),
  obligations: many(obligations),
  changesets: many(changesets),
  alerts: many(alerts),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(regulatoryDocuments, {
    fields: [documentChunks.docId],
    references: [regulatoryDocuments.id],
  }),
}));

export const obligationsRelations = relations(obligations, ({ one }) => ({
  document: one(regulatoryDocuments, {
    fields: [obligations.docId],
    references: [regulatoryDocuments.id],
  }),
}));

export const changesetsRelations = relations(changesets, ({ one }) => ({
  newDocument: one(regulatoryDocuments, {
    fields: [changesets.docIdNew],
    references: [regulatoryDocuments.id],
    relationName: "newVersion",
  }),
  oldDocument: one(regulatoryDocuments, {
    fields: [changesets.docIdOld],
    references: [regulatoryDocuments.id],
    relationName: "oldVersion",
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
  document: one(regulatoryDocuments, {
    fields: [alerts.docId],
    references: [regulatoryDocuments.id],
  }),
  changeset: one(changesets, {
    fields: [alerts.changesetId],
    references: [changesets.id],
  }),
}));

// RegTech Zod Schemas
export const insertRegulatoryDocumentSchema = createInsertSchema(regulatoryDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentChunkSchema = createInsertSchema(documentChunks).omit({
  id: true,
  createdAt: true,
});

export const insertObligationSchema = createInsertSchema(obligations).omit({
  id: true,
  createdAt: true,
});

export const insertChangesetSchema = createInsertSchema(changesets).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  sentAt: true,
});

// Web Alert Sets - user-configured regulatory news monitoring
export const webAlertSets = pgTable("web_alert_sets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  region: varchar("region").notNull(), // India, APAC, Europe, Americas, Middle East, Global
  jurisdictions: varchar("jurisdictions").array().notNull(), // auto-populated based on region
  keywords: varchar("keywords").array(), // user-defined or defaults
  cadence: varchar("cadence").notNull().default("weekly"), // daily, weekly, monthly
  isActive: boolean("is_active").default(true),
  lastScannedAt: timestamp("last_scanned_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Web Alerts - results from web scanning
export const webAlerts = pgTable("web_alerts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  alertSetId: integer("alert_set_id").references(() => webAlertSets.id),
  title: text("title").notNull(),
  summary: text("summary"),
  sourceUrl: text("source_url"),
  sourceName: varchar("source_name"), // regulator name or news source
  jurisdiction: varchar("jurisdiction"),
  regulator: varchar("regulator"),
  keywords: varchar("keywords").array(), // matched keywords
  impactScore: decimal("impact_score", { precision: 3, scale: 2 }),
  publishedAt: timestamp("published_at"),
  status: varchar("status").default("unread"), // unread, read, dismissed, bookmarked
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// Web Alert Sets Relations
export const webAlertSetsRelations = relations(webAlertSets, ({ one, many }) => ({
  user: one(users, {
    fields: [webAlertSets.userId],
    references: [users.id],
  }),
  alerts: many(webAlerts),
}));

export const webAlertsRelations = relations(webAlerts, ({ one }) => ({
  user: one(users, {
    fields: [webAlerts.userId],
    references: [users.id],
  }),
  alertSet: one(webAlertSets, {
    fields: [webAlerts.alertSetId],
    references: [webAlertSets.id],
  }),
}));

// Web Alert Schemas
export const insertWebAlertSetSchema = createInsertSchema(webAlertSets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebAlertSchema = createInsertSchema(webAlerts).omit({
  id: true,
  createdAt: true,
});

// Web Alert Types
export type WebAlertSet = typeof webAlertSets.$inferSelect;
export type InsertWebAlertSet = z.infer<typeof insertWebAlertSetSchema>;
export type WebAlert = typeof webAlerts.$inferSelect;
export type InsertWebAlert = z.infer<typeof insertWebAlertSchema>;

// RegTech Session Management
export const regtechSessions = pgTable("regtech_sessions", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").references(() => regtechUsers.id).notNull(),
  name: varchar("name").notNull(),
  status: varchar("status").default("active").notNull(), // active, ended
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const regtechSessionActivities = pgTable("regtech_session_activities", {
  id: varchar("id").primaryKey().notNull(),
  sessionId: varchar("session_id").references(() => regtechSessions.id).notNull(),
  activityType: varchar("activity_type").notNull(), // query, document_diff, console_analysis, document_upload
  data: jsonb("data"), // stores activity-specific data (question, answer, sources, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const regtechSessionsRelations = relations(regtechSessions, ({ one, many }) => ({
  user: one(regtechUsers, {
    fields: [regtechSessions.userId],
    references: [regtechUsers.id],
  }),
  activities: many(regtechSessionActivities),
}));

export const regtechSessionActivitiesRelations = relations(regtechSessionActivities, ({ one }) => ({
  session: one(regtechSessions, {
    fields: [regtechSessionActivities.sessionId],
    references: [regtechSessions.id],
  }),
}));

export const insertRegtechSessionSchema = createInsertSchema(regtechSessions).omit({
  createdAt: true,
});

export const insertRegtechSessionActivitySchema = createInsertSchema(regtechSessionActivities).omit({
  createdAt: true,
});

export type RegtechSession = typeof regtechSessions.$inferSelect;
export type InsertRegtechSession = z.infer<typeof insertRegtechSessionSchema>;
export type RegtechSessionActivity = typeof regtechSessionActivities.$inferSelect;
export type InsertRegtechSessionActivity = z.infer<typeof insertRegtechSessionActivitySchema>;

// RegTech Types
export type RegulatoryDocument = typeof regulatoryDocuments.$inferSelect;
export type InsertRegulatoryDocument = z.infer<typeof insertRegulatoryDocumentSchema>;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type InsertDocumentChunk = z.infer<typeof insertDocumentChunkSchema>;
export type Obligation = typeof obligations.$inferSelect;
export type InsertObligation = z.infer<typeof insertObligationSchema>;
export type Changeset = typeof changesets.$inferSelect;
export type InsertChangeset = z.infer<typeof insertChangesetSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

// RegTech Organizations & Users Relations
export const regtechOrganizationsRelations = relations(regtechOrganizations, ({ many }) => ({
  users: many(regtechUsers),
}));

export const regtechUsersRelations = relations(regtechUsers, ({ one }) => ({
  organization: one(regtechOrganizations, {
    fields: [regtechUsers.organizationId],
    references: [regtechOrganizations.id],
  }),
}));

export const alertConfigurationsRelations = relations(alertConfigurations, ({ one }) => ({
  user: one(users, {
    fields: [alertConfigurations.userId],
    references: [users.id],
  }),
}));

// RegTech Organizations & Users Schemas
export const insertRegtechOrganizationSchema = createInsertSchema(regtechOrganizations).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertRegtechUserSchema = createInsertSchema(regtechUsers).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAlertConfigurationSchema = createInsertSchema(alertConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// RegTech Organizations & Users Types
export type RegtechOrganization = typeof regtechOrganizations.$inferSelect;
export type InsertRegtechOrganization = z.infer<typeof insertRegtechOrganizationSchema>;
export type RegtechUser = typeof regtechUsers.$inferSelect;
export type InsertRegtechUser = z.infer<typeof insertRegtechUserSchema>;
export type AlertConfiguration = typeof alertConfigurations.$inferSelect;
export type InsertAlertConfiguration = z.infer<typeof insertAlertConfigurationSchema>;

// Document Folders Relations
export const documentFoldersRelations = relations(documentFolders, ({ one, many }) => ({
  user: one(users, {
    fields: [documentFolders.userId],
    references: [users.id],
  }),
  parent: one(documentFolders, {
    fields: [documentFolders.parentId],
    references: [documentFolders.id],
    relationName: "folderHierarchy",
  }),
  children: many(documentFolders, {
    relationName: "folderHierarchy",
  }),
  items: many(documentFolderItems),
}));

export const documentFolderItemsRelations = relations(documentFolderItems, ({ one }) => ({
  folder: one(documentFolders, {
    fields: [documentFolderItems.folderId],
    references: [documentFolders.id],
  }),
  document: one(regulatoryDocuments, {
    fields: [documentFolderItems.docId],
    references: [regulatoryDocuments.id],
  }),
}));

// Document Folders Schemas
export const insertDocumentFolderSchema = createInsertSchema(documentFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentFolderItemSchema = createInsertSchema(documentFolderItems).omit({
  id: true,
  addedAt: true,
});

// Document Folders Types
export type DocumentFolder = typeof documentFolders.$inferSelect;
export type InsertDocumentFolder = z.infer<typeof insertDocumentFolderSchema>;
export type DocumentFolderItem = typeof documentFolderItems.$inferSelect;
export type InsertDocumentFolderItem = z.infer<typeof insertDocumentFolderItemSchema>;

// ============================================================================
// Regulatory Intelligence System - Phase 0 Foundation
// ============================================================================

// Regulations - canonical regulation entity (distinct from documents)
export const regulations = pgTable("regulations", {
  id: text("id").primaryKey(), // "reg_..."
  organizationId: varchar("organization_id").references(() => regtechOrganizations.id),
  jurisdiction: text("jurisdiction").notNull(), // UK, IN, SG, AU, etc.
  regulator: text("regulator").notNull(), // FCA, RBI, MAS, ASIC, etc.
  language: text("language").notNull(), // en, hi, zh, ja, etc.
  title: text("title").notNull(),
  sourceUrl: text("source_url"),
  sourceType: text("source_type").notNull().default("upload"), // url | upload
  effectiveDate: text("effective_date"), // YYYY-MM-DD
  versionLabel: text("version_label").notNull(),
  sourceHash: text("source_hash"), // SHA256 of source document
  processingStatus: text("processing_status").notNull().default("pending"), // pending | processing | segmented | extracted | done | failed
  segmentationStatus: text("segmentation_status").default("pending"), // pending | normal | fallback | failed
  segmentationConfidence: text("segmentation_confidence").default("unknown"), // high | medium | low | unknown
  segmentationRulePackVersion: text("segmentation_rule_pack_version"),
  needsManualReview: boolean("needs_manual_review").default(false),
  regulatoryDocId: integer("regulatory_doc_id").references(() => regulatoryDocuments.id), // link to existing document
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("regulations_jurisdiction_idx").on(t.jurisdiction),
  index("regulations_language_idx").on(t.language),
  index("regulations_status_idx").on(t.processingStatus),
]);

// Regulation Versions - tracks version history and changes
export const regulationVersions = pgTable("regulation_versions", {
  id: text("id").primaryKey(), // "rv_..."
  regulationId: text("regulation_id").references(() => regulations.id).notNull(),
  versionNumber: integer("version_number").notNull(),
  versionLabel: text("version_label").notNull(),
  previousVersionId: text("previous_version_id"), // link to previous version
  changeType: text("change_type").notNull().default("initial"), // initial | amendment | update | consolidation
  changeSummary: text("change_summary"),
  effectiveDate: text("effective_date"),
  sourceHash: text("source_hash"),
  addedSections: integer("added_sections").default(0),
  removedSections: integer("removed_sections").default(0),
  modifiedSections: integer("modified_sections").default(0),
  totalObligations: integer("total_obligations").default(0),
  snapshotJson: jsonb("snapshot_json"), // optional full snapshot of legal units at this version
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("regulation_versions_regulation_idx").on(t.regulationId),
  index("regulation_versions_version_idx").on(t.versionNumber),
]);

// OCR Artifacts - stores raw OCR output with page-level detail
export const ocrArtifacts = pgTable("ocr_artifacts", {
  id: text("id").primaryKey(), // "ocr_..."
  regulationId: text("regulation_id").references(() => regulations.id).notNull(),
  documentId: integer("document_id").references(() => regulatoryDocuments.id),
  provider: text("provider").notNull(), // mistral_ocr | pdf_parse | openai_vision
  languageDetected: text("language_detected"),
  fullText: text("full_text").notNull(),
  pagesJson: jsonb("pages_json").notNull(), // [{page, text, bboxes?}]
  totalPages: integer("total_pages"),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("ocr_artifacts_regulation_idx").on(t.regulationId),
]);

// Legal Units - segmented structural elements (Parts, Chapters, Sections, Articles, Clauses)
export const legalUnits = pgTable("legal_units", {
  id: text("id").primaryKey(), // "lu_..."
  regulationId: text("regulation_id").references(() => regulations.id).notNull(),
  language: text("language").notNull(),
  unitType: text("unit_type").notNull(), // part | chapter | title | book | section | article | clause | paragraph | proviso
  unitKey: text("unit_key").notNull(), // "Section 15" or "Part III" - original format preserved
  parentUnitKey: text("parent_unit_key"), // null for top-level, links to parent
  parentUnitId: text("parent_unit_id"), // FK to parent legalUnit
  rawText: text("raw_text").notNull(),
  anchorsJson: jsonb("anchors_json").notNull(), // [{page, textStart, textEnd, bbox?}]
  textHash: text("text_hash").notNull(), // SHA256 of rawText for change detection
  ordinal: integer("ordinal"), // order within parent
  depth: integer("depth").default(0), // hierarchy depth (0 = top level)
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("legal_units_regulation_idx").on(t.regulationId),
  index("legal_units_unit_key_idx").on(t.unitKey),
  index("legal_units_type_idx").on(t.unitType),
]);

// Enhanced Obligations - extracted from legal units with full citations
export const regulatoryObligations = pgTable("regulatory_obligations", {
  id: text("id").primaryKey(), // "obl_..."
  regulationId: text("regulation_id").references(() => regulations.id).notNull(),
  legalUnitId: text("legal_unit_id").references(() => legalUnits.id).notNull(),
  legalUnitKey: text("legal_unit_key").notNull(),
  language: text("language").notNull(),
  
  // Obligation identification
  obligationKey: text("obligation_key").notNull(), // stable key within unit
  obligationType: text("obligation_type").notNull(), // mandatory_obligation | conditional_obligation | prohibition | reporting_requirement | recordkeeping_requirement | monitoring_requirement | due_diligence_requirement | risk_assessment_requirement | appointment_requirement | penalty_clause
  modality: text("modality").notNull(), // must | shall | should | may | must_not | prohibited | not_permitted | conditional
  
  // Subject and action
  subjectText: text("subject_text").notNull(), // who is obligated
  regulatedEntityTypesJson: jsonb("regulated_entity_types_json").notNull().default([]), // ["bank", "vasp", "psp"]
  actionText: text("action_text").notNull(), // what they must do
  objectText: text("object_text"), // what is acted upon
  conditionText: text("condition_text"), // verbatim conditions
  
  // Time constraints
  deadlineText: text("deadline_text").default(""),
  deadlineDays: integer("deadline_days"),
  frequencyText: text("frequency_text").default(""),
  
  // Complex fields as JSON
  thresholdsJson: jsonb("thresholds_json").notNull().default([]), // [{thresholdText, amount?, currency?}]
  exceptionsJson: jsonb("exceptions_json").notNull().default([]), // exceptions verbatim
  penaltiesJson: jsonb("penalties_json").notNull().default([]), // penalty references
  citationsJson: jsonb("citations_json").notNull(), // [{unitKey, quote, textStart, textEnd, page}]
  
  // Confidence and review
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull().default("0.00"),
  reviewStatus: text("review_status").notNull().default("unreviewed"), // unreviewed | approved | needs_edit
  reviewNotes: text("review_notes"),
  reviewedByUserId: text("reviewed_by_user_id"),
  reviewedAt: timestamp("reviewed_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("reg_obligations_regulation_idx").on(t.regulationId),
  index("reg_obligations_type_idx").on(t.obligationType),
  index("reg_obligations_review_idx").on(t.reviewStatus),
  index("reg_obligations_legal_unit_idx").on(t.legalUnitId),
]);

// Compliance Controls - internal control types
export const complianceControls = pgTable("compliance_controls", {
  id: text("id").primaryKey(), // "ctl_..."
  organizationId: varchar("organization_id").references(() => regtechOrganizations.id),
  controlType: text("control_type").notNull(), // kyc | monitoring | reporting | record_retention | governance | training | screening
  name: text("name").notNull(),
  description: text("description").notNull(),
  owner: text("owner"), // role or person responsible
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("compliance_controls_type_idx").on(t.controlType),
  index("compliance_controls_org_idx").on(t.organizationId),
]);

// Compliance Evidence - documents proving control implementation
export const complianceEvidence = pgTable("compliance_evidence", {
  id: text("id").primaryKey(), // "ev_..."
  organizationId: varchar("organization_id").references(() => regtechOrganizations.id),
  evidenceType: text("evidence_type").notNull(), // policy | sop | report | system_log | training_record | audit_report
  name: text("name").notNull(),
  description: text("description"),
  documentId: integer("document_id").references(() => regulatoryDocuments.id), // link to uploaded doc
  externalUrl: text("external_url"), // or external reference
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("compliance_evidence_type_idx").on(t.evidenceType),
  index("compliance_evidence_org_idx").on(t.organizationId),
]);

// Obligation Mappings - links obligations to controls and evidence
export const obligationMappings = pgTable("obligation_mappings", {
  id: text("id").primaryKey(), // "map_..."
  obligationId: text("obligation_id").references(() => regulatoryObligations.id).notNull(),
  controlId: text("control_id").references(() => complianceControls.id),
  evidenceId: text("evidence_id").references(() => complianceEvidence.id),
  status: text("status").notNull(), // mapped | partially_mapped | missing
  humanVerified: boolean("human_verified").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("obligation_mappings_obligation_idx").on(t.obligationId),
  index("obligation_mappings_status_idx").on(t.status),
]);

// AI Audit Log - full traceability for all AI operations
export const aiAuditLog = pgTable("ai_audit_log", {
  id: text("id").primaryKey(), // "ai_..."
  eventType: text("event_type").notNull(), // extract_obligations | classify_obligation | suggest_mapping | compare_versions | segment_document
  model: text("model").notNull(), // gpt-4o | gpt-4o-mini | mistral-ocr
  modelVersion: text("model_version"),
  promptTemplateHash: text("prompt_template_hash").notNull(),
  inputHash: text("input_hash").notNull(),
  outputHash: text("output_hash").notNull(),
  inputJson: jsonb("input_json").notNull(),
  outputJson: jsonb("output_json").notNull(),
  regulationId: text("regulation_id").references(() => regulations.id),
  legalUnitId: text("legal_unit_id").references(() => legalUnits.id),
  obligationId: text("obligation_id").references(() => regulatoryObligations.id),
  processingTimeMs: integer("processing_time_ms"),
  tokensUsed: integer("tokens_used"),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("ai_audit_log_regulation_idx").on(t.regulationId),
  index("ai_audit_log_event_type_idx").on(t.eventType),
  index("ai_audit_log_created_idx").on(t.createdAt),
]);

// Segmentation Rule Packs - versioned rule configurations
export const segmentationRulePacks = pgTable("segmentation_rule_packs", {
  id: text("id").primaryKey(), // "rp_v1.0.0"
  version: text("version").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  jurisdictions: text("jurisdictions").array().notNull(), // ["UK", "IN", "SG", "AU"]
  rulesJson: jsonb("rules_json").notNull(), // full rule definitions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// Regulatory Intelligence Relations
// ============================================================================

export const regulationsRelations = relations(regulations, ({ one, many }) => ({
  organization: one(regtechOrganizations, {
    fields: [regulations.organizationId],
    references: [regtechOrganizations.id],
  }),
  regulatoryDoc: one(regulatoryDocuments, {
    fields: [regulations.regulatoryDocId],
    references: [regulatoryDocuments.id],
  }),
  ocrArtifacts: many(ocrArtifacts),
  legalUnits: many(legalUnits),
  obligations: many(regulatoryObligations),
  auditLogs: many(aiAuditLog),
}));

export const ocrArtifactsRelations = relations(ocrArtifacts, ({ one }) => ({
  regulation: one(regulations, {
    fields: [ocrArtifacts.regulationId],
    references: [regulations.id],
  }),
  document: one(regulatoryDocuments, {
    fields: [ocrArtifacts.documentId],
    references: [regulatoryDocuments.id],
  }),
}));

export const legalUnitsRelations = relations(legalUnits, ({ one, many }) => ({
  regulation: one(regulations, {
    fields: [legalUnits.regulationId],
    references: [regulations.id],
  }),
  parent: one(legalUnits, {
    fields: [legalUnits.parentUnitId],
    references: [legalUnits.id],
    relationName: "unitHierarchy",
  }),
  children: many(legalUnits, {
    relationName: "unitHierarchy",
  }),
  obligations: many(regulatoryObligations),
}));

export const regulatoryObligationsRelations = relations(regulatoryObligations, ({ one, many }) => ({
  regulation: one(regulations, {
    fields: [regulatoryObligations.regulationId],
    references: [regulations.id],
  }),
  legalUnit: one(legalUnits, {
    fields: [regulatoryObligations.legalUnitId],
    references: [legalUnits.id],
  }),
  mappings: many(obligationMappings),
}));

export const complianceControlsRelations = relations(complianceControls, ({ one, many }) => ({
  organization: one(regtechOrganizations, {
    fields: [complianceControls.organizationId],
    references: [regtechOrganizations.id],
  }),
  mappings: many(obligationMappings),
}));

export const complianceEvidenceRelations = relations(complianceEvidence, ({ one, many }) => ({
  organization: one(regtechOrganizations, {
    fields: [complianceEvidence.organizationId],
    references: [regtechOrganizations.id],
  }),
  document: one(regulatoryDocuments, {
    fields: [complianceEvidence.documentId],
    references: [regulatoryDocuments.id],
  }),
  mappings: many(obligationMappings),
}));

export const obligationMappingsRelations = relations(obligationMappings, ({ one }) => ({
  obligation: one(regulatoryObligations, {
    fields: [obligationMappings.obligationId],
    references: [regulatoryObligations.id],
  }),
  control: one(complianceControls, {
    fields: [obligationMappings.controlId],
    references: [complianceControls.id],
  }),
  evidence: one(complianceEvidence, {
    fields: [obligationMappings.evidenceId],
    references: [complianceEvidence.id],
  }),
}));

export const aiAuditLogRelations = relations(aiAuditLog, ({ one }) => ({
  regulation: one(regulations, {
    fields: [aiAuditLog.regulationId],
    references: [regulations.id],
  }),
  legalUnit: one(legalUnits, {
    fields: [aiAuditLog.legalUnitId],
    references: [legalUnits.id],
  }),
  obligation: one(regulatoryObligations, {
    fields: [aiAuditLog.obligationId],
    references: [regulatoryObligations.id],
  }),
}));

// ============================================================================
// Regulatory Intelligence Schemas
// ============================================================================

export const insertRegulationSchema = createInsertSchema(regulations).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertRegulationVersionSchema = createInsertSchema(regulationVersions).omit({
  createdAt: true,
});

export const insertOcrArtifactSchema = createInsertSchema(ocrArtifacts).omit({
  createdAt: true,
});

export const insertLegalUnitSchema = createInsertSchema(legalUnits).omit({
  createdAt: true,
});

export const insertRegulatoryObligationSchema = createInsertSchema(regulatoryObligations).omit({
  createdAt: true,
});

export const insertComplianceControlSchema = createInsertSchema(complianceControls).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertComplianceEvidenceSchema = createInsertSchema(complianceEvidence).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertObligationMappingSchema = createInsertSchema(obligationMappings).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAiAuditLogSchema = createInsertSchema(aiAuditLog).omit({
  createdAt: true,
});

export const insertSegmentationRulePackSchema = createInsertSchema(segmentationRulePacks).omit({
  createdAt: true,
});

// ============================================================================
// Regulatory Intelligence Types
// ============================================================================

export type Regulation = typeof regulations.$inferSelect;
export type InsertRegulation = z.infer<typeof insertRegulationSchema>;
export type RegulationVersion = typeof regulationVersions.$inferSelect;
export type InsertRegulationVersion = z.infer<typeof insertRegulationVersionSchema>;
export type OcrArtifact = typeof ocrArtifacts.$inferSelect;
export type InsertOcrArtifact = z.infer<typeof insertOcrArtifactSchema>;
export type LegalUnit = typeof legalUnits.$inferSelect;
export type InsertLegalUnit = z.infer<typeof insertLegalUnitSchema>;
export type RegulatoryObligation = typeof regulatoryObligations.$inferSelect;
export type InsertRegulatoryObligation = z.infer<typeof insertRegulatoryObligationSchema>;
export type ComplianceControl = typeof complianceControls.$inferSelect;
export type InsertComplianceControl = z.infer<typeof insertComplianceControlSchema>;
export type ComplianceEvidence = typeof complianceEvidence.$inferSelect;
export type InsertComplianceEvidence = z.infer<typeof insertComplianceEvidenceSchema>;
export type ObligationMapping = typeof obligationMappings.$inferSelect;
export type InsertObligationMapping = z.infer<typeof insertObligationMappingSchema>;
export type AiAuditLog = typeof aiAuditLog.$inferSelect;
export type InsertAiAuditLog = z.infer<typeof insertAiAuditLogSchema>;
export type SegmentationRulePack = typeof segmentationRulePacks.$inferSelect;
export type InsertSegmentationRulePack = z.infer<typeof insertSegmentationRulePackSchema>;
