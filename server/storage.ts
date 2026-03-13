import {
  users,
  organizations,
  subscriptionPlans,
  subscriptions,
  documents,
  performanceMetrics,
  documentAnalyses,
  sessionArchives,
  regulatoryDocuments,
  documentChunks,
  obligations,
  changesets,
  alerts,
  userProfiles,
  alertConfigurations,
  regtechUsers,
  webAlertSets,
  webAlerts,
  documentFolders,
  documentFolderItems,
  type User,
  type RegtechUser,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
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
  type SessionArchive,
  type InsertSessionArchive,
  type RegulatoryDocument,
  type InsertRegulatoryDocument,
  type DocumentChunk,
  type InsertDocumentChunk,
  type Obligation,
  type InsertObligation,
  type Changeset,
  type InsertChangeset,
  type Alert,
  type InsertAlert,
  type UserProfile,
  type InsertUserProfile,
  type AlertConfiguration,
  type InsertAlertConfiguration,
  type WebAlertSet,
  type InsertWebAlertSet,
  type WebAlert,
  type InsertWebAlert,
  type DocumentFolder,
  type InsertDocumentFolder,
  type DocumentFolderItem,
  type InsertDocumentFolderItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, or, ilike, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Organization operations
  getOrganization(id: string): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization>;
  deleteOrganization(id: string): Promise<void>;

  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateUserAdmin(id: string, hashedPassword: string): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
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
  getOpenBetaUserByEmail(email: string): Promise<User | undefined>;
  createOpenBetaUser(user: UpsertUser): Promise<User>;

  // Session Archive operations
  createSessionArchive(archive: InsertSessionArchive): Promise<SessionArchive>;
  getSessionArchives(userId: string): Promise<SessionArchive[]>;
  getSessionArchive(id: string): Promise<SessionArchive | undefined>;
  deleteSessionArchive(id: string): Promise<void>;

  // RegTech - Regulatory Document operations
  createRegulatoryDocument(doc: InsertRegulatoryDocument): Promise<RegulatoryDocument>;
  getRegulatoryDocuments(filters?: {
    jurisdiction?: string;
    regulator?: string;
    status?: string;
    limit?: number;
    uploadedBy?: string;
  }): Promise<RegulatoryDocument[]>;
  getRegulatoryDocument(id: number): Promise<RegulatoryDocument | undefined>;
  updateRegulatoryDocument(id: number, updates: Partial<RegulatoryDocument>): Promise<RegulatoryDocument>;
  deleteRegulatoryDocument(id: number): Promise<void>;
  getRegulatoryDocumentByHash(hash: string, uploadedBy?: string): Promise<RegulatoryDocument | undefined>;
  searchRegulatoryDocuments(query: string, filters?: {
    jurisdiction?: string;
    regulator?: string;
    userId?: string;
    docIds?: number[];
    userIds?: string[];
  }): Promise<RegulatoryDocument[]>;

  // RegTech - Document Chunk operations
  createDocumentChunks(chunks: InsertDocumentChunk[]): Promise<void>;
  getDocumentChunks(docId: number): Promise<DocumentChunk[]>;
  searchSimilarChunks(embedding: number[], limit?: number, filters?: {
    jurisdiction?: string;
    regulator?: string;
    userId?: string;
    docIds?: number[];
    userIds?: string[];
  }): Promise<Array<DocumentChunk & { similarity: number }>>;
  deleteDocumentChunks(docId: number): Promise<void>;

  // RegTech - Obligation operations
  createObligation(obligation: InsertObligation): Promise<Obligation>;
  createObligations(obligations: InsertObligation[]): Promise<void>;
  getDocumentObligations(docId: number): Promise<Obligation[]>;
  getObligationsByDocId(docId: number): Promise<Obligation[]>;
  getObligationsByArea(area: string): Promise<Obligation[]>;
  updateObligation(id: number, updates: Partial<Obligation>): Promise<Obligation>;
  deleteObligation(id: number): Promise<void>;

  // RegTech - Changeset operations
  createChangeset(changeset: InsertChangeset): Promise<Changeset>;
  getDocumentChangesets(docId: number): Promise<Changeset[]>;
  getChangeset(id: number): Promise<Changeset | undefined>;

  // RegTech - Alert operations
  createAlert(alert: InsertAlert): Promise<Alert>;
  getUserAlerts(userId: string, status?: string): Promise<Alert[]>;
  getAlert(id: number): Promise<Alert | undefined>;
  updateAlert(id: number, updates: Partial<Alert>): Promise<Alert>;
  markAlertAsRead(id: number): Promise<Alert>;
  deleteAlert(id: number): Promise<void>;

  // RegTech - User Profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  getAllUserProfiles(): Promise<UserProfile[]>;
  getMatchingUserProfiles(filters: {
    jurisdiction?: string;
    regulator?: string;
  }): Promise<UserProfile[]>;
  upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;

  // Alert Configuration operations
  getUserAlertConfigurations(userId: string): Promise<AlertConfiguration[]>;
  createAlertConfiguration(config: InsertAlertConfiguration): Promise<AlertConfiguration>;
  updateAlertConfiguration(id: number, userId: string, updates: Partial<InsertAlertConfiguration>): Promise<AlertConfiguration | undefined>;
  deleteAlertConfiguration(id: number, userId: string): Promise<void>;

  // RegTech User operations
  getRegtechUser(userId: string): Promise<RegtechUser | undefined>;
  getRegtechOrganizationUsers(organizationId: string): Promise<RegtechUser[]>;

  // Web Alert Set operations
  createWebAlertSet(alertSet: InsertWebAlertSet): Promise<WebAlertSet>;
  getUserWebAlertSets(userId: string): Promise<WebAlertSet[]>;
  getWebAlertSet(id: number): Promise<WebAlertSet | undefined>;
  updateWebAlertSet(id: number, updates: Partial<WebAlertSet>): Promise<WebAlertSet>;
  updateWebAlertSetLastScanned(id: number): Promise<WebAlertSet>;
  deleteWebAlertSet(id: number): Promise<void>;

  // Web Alert operations
  createWebAlert(alert: InsertWebAlert): Promise<WebAlert>;
  createWebAlerts(alerts: InsertWebAlert[]): Promise<void>;
  getUserWebAlerts(userId: string, status?: string): Promise<WebAlert[]>;
  getWebAlertsByAlertSet(alertSetId: number): Promise<WebAlert[]>;
  getWebAlert(id: number): Promise<WebAlert | undefined>;
  updateWebAlert(id: number, updates: Partial<WebAlert>): Promise<WebAlert>;
  markWebAlertAsRead(id: number): Promise<WebAlert>;
  deleteWebAlert(id: number): Promise<void>;

  // Document Folder operations
  getUserFolders(userId: string): Promise<DocumentFolder[]>;
  getFolder(id: number): Promise<DocumentFolder | undefined>;
  createFolder(folder: InsertDocumentFolder): Promise<DocumentFolder>;
  updateFolder(id: number, updates: Partial<DocumentFolder>): Promise<DocumentFolder>;
  deleteFolder(id: number): Promise<void>;
  getFolderDocuments(folderId: number): Promise<RegulatoryDocument[]>;
  getFolderItem(folderId: number, docId: number): Promise<DocumentFolderItem | undefined>;
  addDocumentToFolder(folderId: number, docId: number): Promise<DocumentFolderItem>;
  removeDocumentFromFolder(folderId: number, docId: number): Promise<void>;
  getDocumentFolders(docId: number): Promise<DocumentFolder[]>;
}

export class DatabaseStorage implements IStorage {
  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [newOrg] = await db.insert(organizations).values(org).returning();
    return newOrg;
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
    const [updated] = await db
      .update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }

  async deleteOrganization(id: string): Promise<void> {
    await db.delete(organizations).where(eq(organizations.id, id));
  }

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

  async createUser(userData: UpsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(userData)
      .returning();
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserAdmin(id: string, hashedPassword: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ 
        password: hashedPassword, 
        isAdmin: true, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ 
        password: hashedPassword, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    // Delete all related records first to avoid foreign key constraint errors
    await db.delete(documentAnalyses).where(eq(documentAnalyses.userId, id));
    await db.delete(documents).where(eq(documents.userId, id));
    await db.delete(performanceMetrics).where(eq(performanceMetrics.userId, id));
    await db.delete(subscriptions).where(eq(subscriptions.userId, id));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
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

  // Open Beta User operations implementation
  async getOpenBetaUserByEmail(email: string): Promise<User | undefined> {
    return await this.getUserByEmail(email);
  }

  async createOpenBetaUser(userData: UpsertUser): Promise<User> {
    return await this.upsertUser(userData);
  }
  
  // Session Archive operations implementation
  async createSessionArchive(archive: InsertSessionArchive): Promise<SessionArchive> {
    const { nanoid } = await import('nanoid');
    const [created] = await db
      .insert(sessionArchives)
      .values({
        id: nanoid(),
        ...archive,
      })
      .returning();
    return created;
  }

  async getSessionArchives(userId: string): Promise<SessionArchive[]> {
    return await db
      .select()
      .from(sessionArchives)
      .where(eq(sessionArchives.userId, userId))
      .orderBy(desc(sessionArchives.createdAt));
  }

  async getSessionArchive(id: string): Promise<SessionArchive | undefined> {
    const [archive] = await db
      .select()
      .from(sessionArchives)
      .where(eq(sessionArchives.id, id));
    return archive;
  }

  async deleteSessionArchive(id: string): Promise<void> {
    await db.delete(sessionArchives).where(eq(sessionArchives.id, id));
  }

  // RegTech - Regulatory Document operations
  async createRegulatoryDocument(doc: InsertRegulatoryDocument): Promise<RegulatoryDocument> {
    const [created] = await db
      .insert(regulatoryDocuments)
      .values(doc)
      .returning();
    return created;
  }

  async getRegulatoryDocuments(filters?: {
    jurisdiction?: string;
    regulator?: string;
    status?: string;
    limit?: number;
    uploadedBy?: string;
  }): Promise<RegulatoryDocument[]> {
    const conditions = [];
    
    if (filters?.jurisdiction) {
      conditions.push(eq(regulatoryDocuments.jurisdiction, filters.jurisdiction));
    }
    if (filters?.regulator) {
      conditions.push(eq(regulatoryDocuments.regulator, filters.regulator));
    }
    if (filters?.status) {
      conditions.push(eq(regulatoryDocuments.status, filters.status));
    }
    if (filters?.uploadedBy) {
      conditions.push(eq(regulatoryDocuments.uploadedBy, filters.uploadedBy));
    }

    let query = db.select().from(regulatoryDocuments);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(regulatoryDocuments.publishedAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  async getRegulatoryDocument(id: number): Promise<RegulatoryDocument | undefined> {
    const [doc] = await db
      .select()
      .from(regulatoryDocuments)
      .where(eq(regulatoryDocuments.id, id));
    return doc;
  }

  async updateRegulatoryDocument(id: number, updates: Partial<RegulatoryDocument>): Promise<RegulatoryDocument> {
    const [updated] = await db
      .update(regulatoryDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(regulatoryDocuments.id, id))
      .returning();
    return updated;
  }

  async deleteRegulatoryDocument(id: number): Promise<void> {
    // First, get any changesets that reference this document
    const relatedChangesets = await db
      .select({ id: changesets.id })
      .from(changesets)
      .where(or(eq(changesets.docIdNew, id), eq(changesets.docIdOld, id)));
    
    // Delete alerts that reference these changesets
    for (const changeset of relatedChangesets) {
      await db.delete(alerts).where(eq(alerts.changesetId, changeset.id));
    }
    
    // Delete changesets that reference this document
    await db.delete(changesets).where(or(eq(changesets.docIdNew, id), eq(changesets.docIdOld, id)));
    
    // Delete alerts that directly reference this document
    await db.delete(alerts).where(eq(alerts.docId, id));
    
    // Delete document chunks and obligations
    await db.delete(documentChunks).where(eq(documentChunks.docId, id));
    await db.delete(obligations).where(eq(obligations.docId, id));
    
    // Finally delete the document
    await db.delete(regulatoryDocuments).where(eq(regulatoryDocuments.id, id));
  }

  async getRegulatoryDocumentByHash(hash: string, uploadedBy?: string): Promise<RegulatoryDocument | undefined> {
    const conditions = [eq(regulatoryDocuments.contentHash, hash)];
    if (uploadedBy) {
      conditions.push(eq(regulatoryDocuments.uploadedBy, uploadedBy));
    }
    const [doc] = await db
      .select()
      .from(regulatoryDocuments)
      .where(and(...conditions));
    return doc;
  }

  async searchRegulatoryDocuments(query: string, filters?: {
    jurisdiction?: string;
    regulator?: string;
    userId?: string;
    docIds?: number[];
    userIds?: string[];
  }): Promise<RegulatoryDocument[]> {
    const conditions = [
      or(
        ilike(regulatoryDocuments.title, `%${query}%`),
        ilike(regulatoryDocuments.extractedText, `%${query}%`)
      )
    ];

    if (filters?.docIds && filters.docIds.length > 0) {
      conditions.push(inArray(regulatoryDocuments.id, filters.docIds));
    }
    
    if (filters?.userId) {
      conditions.push(eq(regulatoryDocuments.uploadedBy, filters.userId));
    }
    
    if (filters?.userIds && filters.userIds.length > 0) {
      conditions.push(inArray(regulatoryDocuments.uploadedBy, filters.userIds));
    }

    if (filters?.jurisdiction) {
      conditions.push(eq(regulatoryDocuments.jurisdiction, filters.jurisdiction));
    }
    if (filters?.regulator) {
      conditions.push(eq(regulatoryDocuments.regulator, filters.regulator));
    }

    return await db
      .select()
      .from(regulatoryDocuments)
      .where(and(...conditions))
      .orderBy(desc(regulatoryDocuments.publishedAt))
      .limit(50);
  }

  // RegTech - Document Chunk operations
  async createDocumentChunks(chunks: InsertDocumentChunk[]): Promise<void> {
    if (chunks.length === 0) return;
    
    await db.transaction(async (tx) => {
      for (const chunk of chunks) {
        await tx.insert(documentChunks).values(chunk);
      }
    });
  }

  async getDocumentChunks(docId: number): Promise<DocumentChunk[]> {
    return await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.docId, docId))
      .orderBy(documentChunks.ordinal);
  }

  async searchSimilarChunks(
    embedding: number[], 
    limit: number = 10,
    filters?: {
      jurisdiction?: string;
      regulator?: string;
      userId?: string;
      docIds?: number[];
      userIds?: string[];
    }
  ): Promise<Array<DocumentChunk & { similarity: number }>> {
    const embeddingStr = `[${embedding.join(',')}]`;
    
    let query = db
      .select({
        id: documentChunks.id,
        docId: documentChunks.docId,
        ordinal: documentChunks.ordinal,
        text: documentChunks.text,
        tokens: documentChunks.tokens,
        embedding: documentChunks.embedding,
        sectionRef: documentChunks.sectionRef,
        metadata: documentChunks.metadata,
        createdAt: documentChunks.createdAt,
        similarity: sql<number>`1 - (${documentChunks.embedding} <=> ${embeddingStr}::vector)`,
      })
      .from(documentChunks);

    const needsJoin = filters?.jurisdiction || filters?.regulator || filters?.userId || filters?.userIds;
    
    if (needsJoin || filters?.docIds) {
      query = query.innerJoin(
        regulatoryDocuments,
        eq(documentChunks.docId, regulatoryDocuments.id)
      ) as any;

      const conditions = [];
      
      if (filters?.docIds && filters.docIds.length > 0) {
        conditions.push(inArray(documentChunks.docId, filters.docIds));
      }
      
      if (filters?.userId) {
        conditions.push(eq(regulatoryDocuments.uploadedBy, filters.userId));
      }
      
      if (filters?.userIds && filters.userIds.length > 0) {
        conditions.push(inArray(regulatoryDocuments.uploadedBy, filters.userIds));
      }
      
      if (filters?.jurisdiction) {
        conditions.push(eq(regulatoryDocuments.jurisdiction, filters.jurisdiction));
      }
      if (filters?.regulator) {
        conditions.push(eq(regulatoryDocuments.regulator, filters.regulator));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }

    query = query
      .orderBy(sql`${documentChunks.embedding} <=> ${embeddingStr}::vector`)
      .limit(limit) as any;

    return await query;
  }

  async deleteDocumentChunks(docId: number): Promise<void> {
    await db.delete(documentChunks).where(eq(documentChunks.docId, docId));
  }

  // RegTech - Obligation operations
  async createObligation(obligation: InsertObligation): Promise<Obligation> {
    const [created] = await db
      .insert(obligations)
      .values(obligation)
      .returning();
    return created;
  }

  async createObligations(obligationList: InsertObligation[]): Promise<void> {
    if (obligationList.length === 0) return;
    
    await db.transaction(async (tx) => {
      for (const obligation of obligationList) {
        await tx.insert(obligations).values(obligation);
      }
    });
  }

  async getDocumentObligations(docId: number): Promise<Obligation[]> {
    return await db
      .select()
      .from(obligations)
      .where(eq(obligations.docId, docId))
      .orderBy(desc(obligations.impactScore));
  }

  async getObligationsByDocId(docId: number): Promise<Obligation[]> {
    return this.getDocumentObligations(docId);
  }

  async getObligationsByArea(area: string): Promise<Obligation[]> {
    return await db
      .select()
      .from(obligations)
      .where(eq(obligations.area, area))
      .orderBy(desc(obligations.impactScore))
      .limit(100);
  }

  async updateObligation(id: number, updates: Partial<Obligation>): Promise<Obligation> {
    const [updated] = await db
      .update(obligations)
      .set(updates)
      .where(eq(obligations.id, id))
      .returning();
    return updated;
  }

  async deleteObligation(id: number): Promise<void> {
    await db.delete(obligations).where(eq(obligations.id, id));
  }

  // RegTech - Changeset operations
  async createChangeset(changeset: InsertChangeset): Promise<Changeset> {
    const [created] = await db
      .insert(changesets)
      .values(changeset)
      .returning();
    return created;
  }

  async getDocumentChangesets(docId: number): Promise<Changeset[]> {
    return await db
      .select()
      .from(changesets)
      .where(
        or(
          eq(changesets.docIdNew, docId),
          eq(changesets.docIdOld, docId)
        )
      )
      .orderBy(desc(changesets.createdAt));
  }

  async getChangeset(id: number): Promise<Changeset | undefined> {
    const [changeset] = await db
      .select()
      .from(changesets)
      .where(eq(changesets.id, id));
    return changeset;
  }

  // RegTech - Alert operations
  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [created] = await db
      .insert(alerts)
      .values(alert)
      .returning();
    return created;
  }

  async getUserAlerts(userId: string, status?: string): Promise<Alert[]> {
    const conditions = [eq(alerts.userId, userId)];
    
    if (status) {
      conditions.push(eq(alerts.status, status));
    }

    return await db
      .select()
      .from(alerts)
      .where(and(...conditions))
      .orderBy(desc(alerts.sentAt))
      .limit(100);
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    const [alert] = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, id));
    return alert;
  }

  async updateAlert(id: number, updates: Partial<Alert>): Promise<Alert> {
    const [updated] = await db
      .update(alerts)
      .set(updates)
      .where(eq(alerts.id, id))
      .returning();
    return updated;
  }

  async markAlertAsRead(id: number): Promise<Alert> {
    const [updated] = await db
      .update(alerts)
      .set({ 
        status: 'read',
        readAt: new Date()
      })
      .where(eq(alerts.id, id))
      .returning();
    return updated;
  }

  async deleteAlert(id: number): Promise<void> {
    await db.delete(alerts).where(eq(alerts.id, id));
  }

  // RegTech - User Profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async getAllUserProfiles(): Promise<UserProfile[]> {
    return await db
      .select()
      .from(userProfiles);
  }

  async getMatchingUserProfiles(filters: {
    jurisdiction?: string;
    regulator?: string;
  }): Promise<UserProfile[]> {
    const allProfiles = await this.getAllUserProfiles();
    
    return allProfiles.filter(profile => {
      if (filters.jurisdiction && profile.jurisdictions?.includes(filters.jurisdiction)) {
        return true;
      }
      if (filters.regulator && profile.regulators?.includes(filters.regulator)) {
        return true;
      }
      return false;
    });
  }

  async upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [upserted] = await db
      .insert(userProfiles)
      .values(profile)
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          ...profile,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const [updated] = await db
      .update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated;
  }

  // Alert Configuration operations
  async getUserAlertConfigurations(userId: string): Promise<AlertConfiguration[]> {
    return await db
      .select()
      .from(alertConfigurations)
      .where(eq(alertConfigurations.userId, userId))
      .orderBy(desc(alertConfigurations.createdAt));
  }

  async createAlertConfiguration(config: InsertAlertConfiguration): Promise<AlertConfiguration> {
    const [created] = await db
      .insert(alertConfigurations)
      .values(config)
      .returning();
    return created;
  }

  async updateAlertConfiguration(id: number, userId: string, updates: Partial<InsertAlertConfiguration>): Promise<AlertConfiguration | undefined> {
    const [updated] = await db
      .update(alertConfigurations)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(alertConfigurations.id, id), eq(alertConfigurations.userId, userId)))
      .returning();
    return updated;
  }

  async deleteAlertConfiguration(id: number, userId: string): Promise<void> {
    await db.delete(alertConfigurations).where(
      and(eq(alertConfigurations.id, id), eq(alertConfigurations.userId, userId))
    );
  }

  // RegTech User operations
  async getRegtechUser(userId: string): Promise<RegtechUser | undefined> {
    const [user] = await db
      .select()
      .from(regtechUsers)
      .where(eq(regtechUsers.id, userId));
    return user;
  }

  async getRegtechOrganizationUsers(organizationId: string): Promise<RegtechUser[]> {
    return await db
      .select()
      .from(regtechUsers)
      .where(eq(regtechUsers.organizationId, organizationId));
  }

  // Web Alert Set operations
  async createWebAlertSet(alertSet: InsertWebAlertSet): Promise<WebAlertSet> {
    const [created] = await db.insert(webAlertSets).values(alertSet).returning();
    return created;
  }

  async getUserWebAlertSets(userId: string): Promise<WebAlertSet[]> {
    return await db
      .select()
      .from(webAlertSets)
      .where(eq(webAlertSets.userId, userId))
      .orderBy(desc(webAlertSets.createdAt));
  }

  async getWebAlertSet(id: number): Promise<WebAlertSet | undefined> {
    const [alertSet] = await db.select().from(webAlertSets).where(eq(webAlertSets.id, id));
    return alertSet;
  }

  async updateWebAlertSet(id: number, updates: Partial<WebAlertSet>): Promise<WebAlertSet> {
    const allowedFields = ['name', 'region', 'jurisdictions', 'keywords', 'cadence', 'isActive'];
    const safeUpdates: Record<string, any> = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if ((updates as Record<string, any>)[field] !== undefined) {
        safeUpdates[field] = (updates as Record<string, any>)[field];
      }
    }
    const [updated] = await db
      .update(webAlertSets)
      .set(safeUpdates)
      .where(eq(webAlertSets.id, id))
      .returning();
    return updated;
  }

  async updateWebAlertSetLastScanned(id: number): Promise<WebAlertSet> {
    const [updated] = await db
      .update(webAlertSets)
      .set({ lastScannedAt: new Date(), updatedAt: new Date() })
      .where(eq(webAlertSets.id, id))
      .returning();
    return updated;
  }

  async deleteWebAlertSet(id: number): Promise<void> {
    await db.delete(webAlerts).where(eq(webAlerts.alertSetId, id));
    await db.delete(webAlertSets).where(eq(webAlertSets.id, id));
  }

  // Web Alert operations
  async createWebAlert(alert: InsertWebAlert): Promise<WebAlert> {
    const [created] = await db.insert(webAlerts).values(alert).returning();
    return created;
  }

  async createWebAlerts(alertsToCreate: InsertWebAlert[]): Promise<void> {
    if (alertsToCreate.length === 0) return;
    
    // Filter out duplicates - check if alerts with same sourceUrl already exist for this user
    const userId = alertsToCreate[0]?.userId;
    if (!userId) return;
    
    // Get existing alert URLs for this user
    const existingAlerts = await db
      .select({ sourceUrl: webAlerts.sourceUrl })
      .from(webAlerts)
      .where(eq(webAlerts.userId, userId));
    
    const existingUrls = new Set(existingAlerts.map(a => a.sourceUrl));
    
    // Filter out alerts that already exist
    const newAlerts = alertsToCreate.filter(alert => !existingUrls.has(alert.sourceUrl ?? null));
    
    if (newAlerts.length === 0) {
      console.log('All scanned alerts already exist, skipping insertion');
      return;
    }
    
    console.log(`Inserting ${newAlerts.length} new alerts (${alertsToCreate.length - newAlerts.length} duplicates skipped)`);
    await db.insert(webAlerts).values(newAlerts);
  }

  async getUserWebAlerts(userId: string, status?: string): Promise<WebAlert[]> {
    if (status) {
      return await db
        .select()
        .from(webAlerts)
        .where(and(eq(webAlerts.userId, userId), eq(webAlerts.status, status)))
        .orderBy(desc(webAlerts.createdAt));
    }
    return await db
      .select()
      .from(webAlerts)
      .where(eq(webAlerts.userId, userId))
      .orderBy(desc(webAlerts.createdAt));
  }

  async getWebAlertsByAlertSet(alertSetId: number): Promise<WebAlert[]> {
    return await db
      .select()
      .from(webAlerts)
      .where(eq(webAlerts.alertSetId, alertSetId))
      .orderBy(desc(webAlerts.createdAt));
  }

  async getWebAlert(id: number): Promise<WebAlert | undefined> {
    const [alert] = await db.select().from(webAlerts).where(eq(webAlerts.id, id));
    return alert;
  }

  async updateWebAlert(id: number, updates: Partial<WebAlert>): Promise<WebAlert> {
    const allowedFields = ['status'];
    const safeUpdates: Record<string, any> = {};
    for (const field of allowedFields) {
      if ((updates as Record<string, any>)[field] !== undefined) {
        safeUpdates[field] = (updates as Record<string, any>)[field];
      }
    }
    if (Object.keys(safeUpdates).length === 0) {
      const existing = await this.getWebAlert(id);
      if (!existing) throw new Error('Web alert not found');
      return existing;
    }
    const [updated] = await db
      .update(webAlerts)
      .set(safeUpdates)
      .where(eq(webAlerts.id, id))
      .returning();
    return updated;
  }

  async markWebAlertAsRead(id: number): Promise<WebAlert> {
    const [updated] = await db
      .update(webAlerts)
      .set({ status: "read", readAt: new Date() })
      .where(eq(webAlerts.id, id))
      .returning();
    return updated;
  }

  async deleteWebAlert(id: number): Promise<void> {
    await db.delete(webAlerts).where(eq(webAlerts.id, id));
  }

  // Document Folder operations
  async getUserFolders(userId: string): Promise<DocumentFolder[]> {
    return await db
      .select()
      .from(documentFolders)
      .where(eq(documentFolders.userId, userId))
      .orderBy(documentFolders.depth, documentFolders.name);
  }

  async getFolder(id: number): Promise<DocumentFolder | undefined> {
    const [folder] = await db.select().from(documentFolders).where(eq(documentFolders.id, id));
    return folder;
  }

  async createFolder(folder: InsertDocumentFolder): Promise<DocumentFolder> {
    const [newFolder] = await db.insert(documentFolders).values(folder).returning();
    return newFolder;
  }

  async updateFolder(id: number, updates: Partial<DocumentFolder>): Promise<DocumentFolder> {
    const [updated] = await db
      .update(documentFolders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documentFolders.id, id))
      .returning();
    return updated;
  }

  async deleteFolder(id: number): Promise<void> {
    await db.delete(documentFolders).where(eq(documentFolders.id, id));
  }

  async getFolderDocuments(folderId: number): Promise<RegulatoryDocument[]> {
    const items = await db
      .select({ docId: documentFolderItems.docId })
      .from(documentFolderItems)
      .where(eq(documentFolderItems.folderId, folderId));
    
    if (items.length === 0) return [];
    
    const docIds = items.map(item => item.docId);
    return await db
      .select()
      .from(regulatoryDocuments)
      .where(inArray(regulatoryDocuments.id, docIds))
      .orderBy(desc(regulatoryDocuments.createdAt));
  }

  async getFolderItem(folderId: number, docId: number): Promise<DocumentFolderItem | undefined> {
    const [item] = await db
      .select()
      .from(documentFolderItems)
      .where(and(
        eq(documentFolderItems.folderId, folderId),
        eq(documentFolderItems.docId, docId)
      ));
    return item;
  }

  async addDocumentToFolder(folderId: number, docId: number): Promise<DocumentFolderItem> {
    const [item] = await db
      .insert(documentFolderItems)
      .values({ folderId, docId })
      .returning();
    return item;
  }

  async removeDocumentFromFolder(folderId: number, docId: number): Promise<void> {
    await db
      .delete(documentFolderItems)
      .where(and(
        eq(documentFolderItems.folderId, folderId),
        eq(documentFolderItems.docId, docId)
      ));
  }

  async getDocumentFolders(docId: number): Promise<DocumentFolder[]> {
    const items = await db
      .select({ folderId: documentFolderItems.folderId })
      .from(documentFolderItems)
      .where(eq(documentFolderItems.docId, docId));
    
    if (items.length === 0) return [];
    
    const folderIds = items.map(item => item.folderId);
    return await db
      .select()
      .from(documentFolders)
      .where(inArray(documentFolders.id, folderIds))
      .orderBy(documentFolders.name);
  }
}

export const storage = new DatabaseStorage();
