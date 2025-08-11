import { BaseProvider, OAuthToken, ExternalProject, ExternalIssue } from '../provider';

export class JiraProvider extends BaseProvider {
  name = 'Jira';
  
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseUrl: string;
  
  constructor() {
    super();
    
    // Required environment variables:
    // JIRA_CLIENT_ID, JIRA_CLIENT_SECRET, JIRA_BASE_URL
    this.clientId = process.env.JIRA_CLIENT_ID || '';
    this.clientSecret = process.env.JIRA_CLIENT_SECRET || '';
    this.baseUrl = process.env.JIRA_BASE_URL || 'https://api.atlassian.com';
    this.redirectUri = `${process.env.APP_URL || 'http://localhost:5000'}/api/integrations/jira/callback`;
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('Jira integration not configured - missing JIRA_CLIENT_ID or JIRA_CLIENT_SECRET');
    }
  }
  
  authorizeUrl(state: string): string {
    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: this.clientId,
      scope: 'read:jira-work read:jira-user offline_access',
      redirect_uri: this.redirectUri,
      state,
      response_type: 'code',
      prompt: 'consent'
    });
    
    return `https://auth.atlassian.com/authorize?${params.toString()}`;
  }
  
  async exchangeCode(code: string): Promise<OAuthToken> {
    const response = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to exchange code: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000),
      scope: data.scope
    };
  }
  
  async getProjects(token: OAuthToken): Promise<ExternalProject[]> {
    // First get accessible resources (cloud instances)
    const resourcesResponse = await this.apiRequest(token, 'https://api.atlassian.com/oauth/token/accessible-resources');
    const resources = await resourcesResponse.json();
    
    if (!resources.length) {
      return [];
    }
    
    // Use first accessible resource
    const cloudId = resources[0].id;
    
    const response = await this.apiRequest(
      token,
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project`
    );
    
    const projects = await response.json();
    
    return projects.map((project: any) => ({
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description
    }));
  }
  
  async listIssues(token: OAuthToken, projectKey: string, since?: Date): Promise<ExternalIssue[]> {
    const resources = await this.getAccessibleResources(token);
    if (!resources.length) return [];
    
    const cloudId = resources[0].id;
    
    let jql = `project = ${projectKey}`;
    if (since) {
      const sinceStr = since.toISOString().split('T')[0];
      jql += ` AND updated >= '${sinceStr}'`;
    }
    
    const params = new URLSearchParams({
      jql,
      fields: 'id,key,summary,description,status,priority,assignee,labels,created,updated,duedate',
      maxResults: '100'
    });
    
    const response = await this.apiRequest(
      token,
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?${params.toString()}`
    );
    
    const data = await response.json();
    
    return data.issues.map((issue: any) => this.mapJiraIssue(issue));
  }
  
  async getIssue(token: OAuthToken, issueId: string): Promise<ExternalIssue> {
    const resources = await this.getAccessibleResources(token);
    if (!resources.length) {
      throw new Error('No accessible Jira instances found');
    }
    
    const cloudId = resources[0].id;
    
    const response = await this.apiRequest(
      token,
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueId}`
    );
    
    const issue = await response.json();
    return this.mapJiraIssue(issue);
  }
  
  private async getAccessibleResources(token: OAuthToken): Promise<any[]> {
    const response = await this.apiRequest(token, 'https://api.atlassian.com/oauth/token/accessible-resources');
    return await response.json();
  }
  
  private async apiRequest(token: OAuthToken, url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
    }
    
    return response;
  }
  
  private mapJiraIssue(issue: any): ExternalIssue {
    return {
      id: issue.id,
      key: issue.key,
      title: issue.fields.summary,
      description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
      status: issue.fields.status.name,
      priority: issue.fields.priority?.name,
      assignee: issue.fields.assignee ? {
        id: issue.fields.assignee.accountId,
        email: issue.fields.assignee.emailAddress,
        display_name: issue.fields.assignee.displayName
      } : undefined,
      labels: issue.fields.labels || [],
      created_at: new Date(issue.fields.created),
      updated_at: new Date(issue.fields.updated),
      due_date: issue.fields.duedate ? new Date(issue.fields.duedate) : undefined,
      external_url: `${issue.self}`
    };
  }
  
  protected mapStatus(externalStatus: string): string {
    const jiraStatusMap: Record<string, string> = {
      'to do': 'todo',
      'in progress': 'in_progress', 
      'done': 'done',
      'closed': 'done',
      'resolved': 'done',
      'reopened': 'todo'
    };
    
    return jiraStatusMap[externalStatus.toLowerCase()] || 'todo';
  }
}