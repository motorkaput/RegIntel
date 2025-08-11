import { BaseProvider, OAuthToken, ExternalProject, ExternalIssue } from '../provider';

export class AsanaProvider extends BaseProvider {
  name = 'Asana';
  
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  
  constructor() {
    super();
    
    // Required environment variables:
    // ASANA_CLIENT_ID, ASANA_CLIENT_SECRET
    this.clientId = process.env.ASANA_CLIENT_ID || '';
    this.clientSecret = process.env.ASANA_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.APP_URL || 'http://localhost:5000'}/api/integrations/asana/callback`;
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('Asana integration not configured - missing ASANA_CLIENT_ID or ASANA_CLIENT_SECRET');
    }
  }
  
  authorizeUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'default',
      state
    });
    
    return `https://app.asana.com/-/oauth_authorize?${params.toString()}`;
  }
  
  async exchangeCode(code: string): Promise<OAuthToken> {
    const response = await fetch('https://app.asana.com/-/oauth_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to exchange code: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }
  
  async getProjects(token: OAuthToken): Promise<ExternalProject[]> {
    const response = await this.apiRequest(
      token,
      'https://app.asana.com/api/1.0/projects?opt_fields=gid,name,notes'
    );
    
    const data = await response.json();
    
    return data.data.map((project: any) => ({
      id: project.gid,
      key: project.gid,
      name: project.name,
      description: project.notes
    }));
  }
  
  async listIssues(token: OAuthToken, projectKey: string, since?: Date): Promise<ExternalIssue[]> {
    let url = `https://app.asana.com/api/1.0/tasks?project=${projectKey}&opt_fields=gid,name,notes,completed,assignee,assignee.name,assignee.email,tags,tags.name,created_at,modified_at,due_on,permalink_url`;
    
    if (since) {
      url += `&modified_since=${since.toISOString()}`;
    }
    
    const response = await this.apiRequest(token, url);
    const data = await response.json();
    
    return data.data.map((task: any) => this.mapAsanaTask(task));
  }
  
  async getIssue(token: OAuthToken, issueId: string): Promise<ExternalIssue> {
    const response = await this.apiRequest(
      token,
      `https://app.asana.com/api/1.0/tasks/${issueId}?opt_fields=gid,name,notes,completed,assignee,assignee.name,assignee.email,tags,tags.name,created_at,modified_at,due_on,permalink_url`
    );
    
    const data = await response.json();
    return this.mapAsanaTask(data.data);
  }
  
  private async apiRequest(token: OAuthToken, url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Accept': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Asana API error: ${response.status} ${response.statusText}`);
    }
    
    return response;
  }
  
  private mapAsanaTask(task: any): ExternalIssue {
    return {
      id: task.gid,
      key: task.gid,
      title: task.name,
      description: task.notes,
      status: task.completed ? 'Complete' : 'Incomplete',
      assignee: task.assignee ? {
        id: task.assignee.gid,
        email: task.assignee.email || `${task.assignee.name}@asana.local`,
        display_name: task.assignee.name
      } : undefined,
      labels: task.tags?.map((tag: any) => tag.name).filter(Boolean) || [],
      created_at: new Date(task.created_at),
      updated_at: new Date(task.modified_at),
      due_date: task.due_on ? new Date(task.due_on) : undefined,
      external_url: task.permalink_url
    };
  }
  
  protected mapStatus(externalStatus: string): string {
    const asanaStatusMap: Record<string, string> = {
      'complete': 'done',
      'incomplete': 'todo'
    };
    
    return asanaStatusMap[externalStatus.toLowerCase()] || 'todo';
  }
}