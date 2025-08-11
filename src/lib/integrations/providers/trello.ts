import { BaseProvider, OAuthToken, ExternalProject, ExternalIssue } from '../provider';

export class TrelloProvider extends BaseProvider {
  name = 'Trello';
  
  private apiKey: string;
  private apiSecret: string;
  private redirectUri: string;
  
  constructor() {
    super();
    
    // Required environment variables:
    // TRELLO_API_KEY, TRELLO_API_SECRET
    this.apiKey = process.env.TRELLO_API_KEY || '';
    this.apiSecret = process.env.TRELLO_API_SECRET || '';
    this.redirectUri = `${process.env.APP_URL || 'http://localhost:5000'}/api/integrations/trello/callback`;
    
    if (!this.apiKey || !this.apiSecret) {
      console.warn('Trello integration not configured - missing TRELLO_API_KEY or TRELLO_API_SECRET');
    }
  }
  
  authorizeUrl(state: string): string {
    const params = new URLSearchParams({
      key: this.apiKey,
      name: 'PerMeaTe Enterprise',
      scope: 'read',
      response_type: 'token',
      return_url: this.redirectUri,
      state
    });
    
    return `https://trello.com/1/authorize?${params.toString()}`;
  }
  
  async exchangeCode(code: string): Promise<OAuthToken> {
    // Trello uses token-based auth rather than OAuth2 code flow
    // The "code" here is actually the token from the redirect
    return {
      access_token: code,
      // Trello tokens don't expire by default
    };
  }
  
  async getProjects(token: OAuthToken): Promise<ExternalProject[]> {
    const response = await this.apiRequest(
      token,
      'https://api.trello.com/1/members/me/boards?fields=id,name,desc'
    );
    
    const boards = await response.json();
    
    return boards.map((board: any) => ({
      id: board.id,
      key: board.id,
      name: board.name,
      description: board.desc
    }));
  }
  
  async listIssues(token: OAuthToken, projectKey: string, since?: Date): Promise<ExternalIssue[]> {
    let url = `https://api.trello.com/1/boards/${projectKey}/cards?fields=id,name,desc,labels,due,dateLastActivity`;
    
    if (since) {
      url += `&since=${since.toISOString()}`;
    }
    
    const response = await this.apiRequest(token, url);
    const cards = await response.json();
    
    // Get board lists to determine status
    const listsResponse = await this.apiRequest(
      token,
      `https://api.trello.com/1/boards/${projectKey}/lists?fields=id,name`
    );
    const lists = await listsResponse.json();
    const listMap = new Map(lists.map((list: any) => [list.id, list.name]));
    
    // Get members for assignee info
    const membersResponse = await this.apiRequest(
      token,
      `https://api.trello.com/1/boards/${projectKey}/members?fields=id,username,fullName,email`
    );
    const members = await membersResponse.json();
    const memberMap = new Map(members.map((member: any) => [member.id, member]));
    
    return cards.map((card: any) => this.mapTrelloCard(card, listMap, memberMap));
  }
  
  async getIssue(token: OAuthToken, issueId: string): Promise<ExternalIssue> {
    const response = await this.apiRequest(
      token,
      `https://api.trello.com/1/cards/${issueId}?fields=id,name,desc,labels,due,dateLastActivity,idList,idMembers`
    );
    
    const card = await response.json();
    
    // Get list info for status
    const listResponse = await this.apiRequest(
      token,
      `https://api.trello.com/1/lists/${card.idList}?fields=name`
    );
    const list = await listResponse.json();
    
    // Get member info if assigned
    let assignee;
    if (card.idMembers?.length > 0) {
      const memberResponse = await this.apiRequest(
        token,
        `https://api.trello.com/1/members/${card.idMembers[0]}?fields=id,username,fullName,email`
      );
      const member = await memberResponse.json();
      assignee = {
        id: member.id,
        email: member.email || `${member.username}@trello.local`,
        display_name: member.fullName || member.username
      };
    }
    
    return {
      id: card.id,
      key: card.id,
      title: card.name,
      description: card.desc,
      status: list.name,
      assignee,
      labels: card.labels?.map((label: any) => label.name).filter(Boolean) || [],
      created_at: new Date(card.dateLastActivity), // Trello doesn't provide creation date
      updated_at: new Date(card.dateLastActivity),
      due_date: card.due ? new Date(card.due) : undefined,
      external_url: `https://trello.com/c/${card.id}`
    };
  }
  
  private async apiRequest(token: OAuthToken, url: string, options: RequestInit = {}): Promise<Response> {
    const urlObj = new URL(url);
    urlObj.searchParams.set('key', this.apiKey);
    urlObj.searchParams.set('token', token.access_token);
    
    const response = await fetch(urlObj.toString(), {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Trello API error: ${response.status} ${response.statusText}`);
    }
    
    return response;
  }
  
  private mapTrelloCard(card: any, listMap: Map<string, string>, memberMap: Map<string, any>): ExternalIssue {
    const assignee = card.idMembers?.length > 0 ? memberMap.get(card.idMembers[0]) : null;
    
    return {
      id: card.id,
      key: card.id,
      title: card.name,
      description: card.desc,
      status: listMap.get(card.idList) || 'Unknown',
      assignee: assignee ? {
        id: assignee.id,
        email: assignee.email || `${assignee.username}@trello.local`,
        display_name: assignee.fullName || assignee.username
      } : undefined,
      labels: card.labels?.map((label: any) => label.name).filter(Boolean) || [],
      created_at: new Date(card.dateLastActivity),
      updated_at: new Date(card.dateLastActivity),
      due_date: card.due ? new Date(card.due) : undefined,
      external_url: `https://trello.com/c/${card.id}`
    };
  }
  
  protected mapStatus(externalStatus: string): string {
    const trelloStatusMap: Record<string, string> = {
      'to do': 'todo',
      'doing': 'in_progress',
      'done': 'done',
      'backlog': 'todo',
      'in progress': 'in_progress'
    };
    
    return trelloStatusMap[externalStatus.toLowerCase()] || 'todo';
  }
}