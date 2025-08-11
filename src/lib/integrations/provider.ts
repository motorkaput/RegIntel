export interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_at?: Date;
  scope?: string;
}

export interface ExternalProject {
  id: string;
  key: string;
  name: string;
  description?: string;
}

export interface ExternalIssue {
  id: string;
  key: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignee?: {
    id: string;
    email: string;
    display_name: string;
  };
  labels: string[];
  created_at: Date;
  updated_at: Date;
  due_date?: Date;
  external_url?: string;
}

export interface WorkItemInput {
  external_system: string;
  external_id: string;
  external_key: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignee_email?: string;
  labels: string[];
  created_at: Date;
  updated_at: Date;
  due_date?: Date;
  external_url?: string;
}

export interface IssueProvider {
  name: string;
  
  /**
   * Generate OAuth authorization URL
   */
  authorizeUrl(state: string): string;
  
  /**
   * Exchange authorization code for access token
   */
  exchangeCode(code: string): Promise<OAuthToken>;
  
  /**
   * Get list of accessible projects
   */
  getProjects(token: OAuthToken): Promise<ExternalProject[]>;
  
  /**
   * List issues from a project
   */
  listIssues(token: OAuthToken, projectKey: string, since?: Date): Promise<ExternalIssue[]>;
  
  /**
   * Get single issue details
   */
  getIssue(token: OAuthToken, issueId: string): Promise<ExternalIssue>;
  
  /**
   * Convert external issue to WorkItem format
   */
  toWorkItem(issue: ExternalIssue): WorkItemInput;
  
  /**
   * Verify webhook signature (optional)
   */
  verifyWebhookSignature?(payload: string, signature: string, secret: string): boolean;
}

export abstract class BaseProvider implements IssueProvider {
  abstract name: string;
  
  abstract authorizeUrl(state: string): string;
  abstract exchangeCode(code: string): Promise<OAuthToken>;
  abstract getProjects(token: OAuthToken): Promise<ExternalProject[]>;
  abstract listIssues(token: OAuthToken, projectKey: string, since?: Date): Promise<ExternalIssue[]>;
  abstract getIssue(token: OAuthToken, issueId: string): Promise<ExternalIssue>;
  
  toWorkItem(issue: ExternalIssue): WorkItemInput {
    return {
      external_system: this.name.toLowerCase(),
      external_id: issue.id,
      external_key: issue.key,
      title: issue.title,
      description: issue.description,
      status: this.mapStatus(issue.status),
      priority: issue.priority,
      assignee_email: issue.assignee?.email,
      labels: issue.labels,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      due_date: issue.due_date,
      external_url: issue.external_url
    };
  }
  
  protected mapStatus(externalStatus: string): string {
    // Default status mapping - override in specific providers
    const statusMap: Record<string, string> = {
      'open': 'todo',
      'in progress': 'in_progress',
      'done': 'done',
      'closed': 'done',
      'resolved': 'done'
    };
    
    return statusMap[externalStatus.toLowerCase()] || 'todo';
  }
}