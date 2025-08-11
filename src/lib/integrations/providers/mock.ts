import { BaseProvider, OAuthToken, ExternalProject, ExternalIssue } from '../provider';
import { promises as fs } from 'fs';
import path from 'path';

export class MockProvider extends BaseProvider {
  name = 'Mock';
  
  constructor() {
    super();
  }
  
  authorizeUrl(state: string): string {
    return `/api/integrations/mock/callback?code=mock_auth_code&state=${state}`;
  }
  
  async exchangeCode(code: string): Promise<OAuthToken> {
    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      scope: 'read write'
    };
  }
  
  async getProjects(token: OAuthToken): Promise<ExternalProject[]> {
    const sampleData = await this.loadSampleData('projects.json');
    return sampleData.projects || [];
  }
  
  async listIssues(token: OAuthToken, projectKey: string, since?: Date): Promise<ExternalIssue[]> {
    const sampleData = await this.loadSampleData('issues.json');
    let issues = sampleData.issues || [];
    
    // Filter by project
    issues = issues.filter((issue: any) => issue.project_key === projectKey);
    
    // Filter by date if provided
    if (since) {
      issues = issues.filter((issue: any) => new Date(issue.updated_at) >= since);
    }
    
    return issues.map((issue: any) => this.mapMockIssue(issue));
  }
  
  async getIssue(token: OAuthToken, issueId: string): Promise<ExternalIssue> {
    const sampleData = await this.loadSampleData('issues.json');
    const issues = sampleData.issues || [];
    
    const issue = issues.find((i: any) => i.id === issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }
    
    return this.mapMockIssue(issue);
  }
  
  private async loadSampleData(filename: string): Promise<any> {
    try {
      const samplePath = path.join(process.cwd(), 'docs', 'samples', 'mock', filename);
      const content = await fs.readFile(samplePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Could not load sample data ${filename}:`, error);
      return this.getDefaultSampleData(filename);
    }
  }
  
  private getDefaultSampleData(filename: string): any {
    if (filename === 'projects.json') {
      return {
        projects: [
          {
            id: 'PROJ1',
            key: 'PROJ1',
            name: 'Sample Project',
            description: 'A sample project for testing'
          },
          {
            id: 'PROJ2',
            key: 'PROJ2',
            name: 'Demo Board',
            description: 'Demo project with sample tasks'
          }
        ]
      };
    }
    
    if (filename === 'issues.json') {
      return {
        issues: [
          {
            id: 'TASK-1',
            key: 'TASK-1',
            project_key: 'PROJ1',
            title: 'Implement user authentication',
            description: 'Add login and registration functionality',
            status: 'In Progress',
            priority: 'High',
            assignee: {
              id: 'user1',
              email: 'john@example.com',
              display_name: 'John Doe'
            },
            labels: ['backend', 'security'],
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-20T14:30:00Z',
            due_date: '2024-01-25T23:59:59Z'
          },
          {
            id: 'TASK-2',
            key: 'TASK-2',
            project_key: 'PROJ1',
            title: 'Design dashboard UI',
            description: 'Create wireframes and mockups for the main dashboard',
            status: 'To Do',
            priority: 'Medium',
            assignee: {
              id: 'user2',
              email: 'jane@example.com',
              display_name: 'Jane Smith'
            },
            labels: ['frontend', 'design'],
            created_at: '2024-01-16T09:00:00Z',
            updated_at: '2024-01-18T11:15:00Z',
            due_date: '2024-01-30T23:59:59Z'
          },
          {
            id: 'TASK-3',
            key: 'TASK-3',
            project_key: 'PROJ2',
            title: 'Setup CI/CD pipeline',
            description: 'Configure automated testing and deployment',
            status: 'Done',
            priority: 'High',
            assignee: {
              id: 'user3',
              email: 'alex@example.com',
              display_name: 'Alex Johnson'
            },
            labels: ['devops', 'automation'],
            created_at: '2024-01-10T08:00:00Z',
            updated_at: '2024-01-22T16:45:00Z',
            due_date: null
          }
        ]
      };
    }
    
    return {};
  }
  
  private mapMockIssue(issue: any): ExternalIssue {
    return {
      id: issue.id,
      key: issue.key,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      assignee: issue.assignee,
      labels: issue.labels || [],
      created_at: new Date(issue.created_at),
      updated_at: new Date(issue.updated_at),
      due_date: issue.due_date ? new Date(issue.due_date) : undefined,
      external_url: `https://mock.example.com/issues/${issue.key}`
    };
  }
}