import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/integrations';
import { upsertWorkItem } from '@/lib/jobs/syncIssues';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const providerName = params.provider;
    const provider = getProvider(providerName);
    
    // Get request body and headers
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature') || 
                     request.headers.get('x-trello-webhook') ||
                     request.headers.get('x-hook-signature') || '';

    // Find integration for this provider to get webhook secret
    const integration = await prisma.toolIntegration.findFirst({
      where: {
        provider_name: providerName,
        is_active: true,
        config: {
          path: ['webhook_enabled'],
          equals: true
        }
      }
    });

    if (!integration) {
      return NextResponse.json({ error: 'No active integration found' }, { status: 404 });
    }

    // Verify webhook signature if provider supports it
    if (provider.verifyWebhookSignature) {
      const webhookSecret = integration.config?.webhook_secret;
      if (webhookSecret && !provider.verifyWebhookSignature(body, signature, webhookSecret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    
    // Process webhook based on provider type
    let workItemData;
    
    switch (providerName) {
      case 'jira':
        workItemData = processJiraWebhook(payload);
        break;
      case 'trello':
        workItemData = processTrelloWebhook(payload);
        break;
      case 'asana':
        workItemData = processAsanaWebhook(payload);
        break;
      case 'mock':
        workItemData = processMockWebhook(payload);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    if (!workItemData) {
      // Not an issue-related webhook, ignore
      return NextResponse.json({ message: 'Webhook received but not processed' });
    }

    // Create context for the integration owner
    const context = {
      tenantId: integration.tenant_id,
      userId: integration.created_by_user_id,
      role: 'admin'
    };

    // Upsert work item
    await upsertWorkItem(workItemData, context);

    return NextResponse.json({ message: 'Webhook processed successfully' });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

function processJiraWebhook(payload: any): any {
  // Handle Jira issue events
  if (payload.webhookEvent?.startsWith('jira:issue_')) {
    const issue = payload.issue;
    
    return {
      external_system: 'jira',
      external_id: issue.id,
      external_key: issue.key,
      title: issue.fields.summary,
      description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
      status: issue.fields.status.name,
      priority: issue.fields.priority?.name,
      assignee_email: issue.fields.assignee?.emailAddress,
      labels: issue.fields.labels || [],
      created_at: new Date(issue.fields.created),
      updated_at: new Date(issue.fields.updated),
      due_date: issue.fields.duedate ? new Date(issue.fields.duedate) : undefined,
      external_url: `${payload.issue.self}`
    };
  }
  
  return null;
}

function processTrelloWebhook(payload: any): any {
  // Handle Trello card events
  if (payload.action?.type === 'updateCard' || payload.action?.type === 'createCard') {
    const card = payload.action.data.card;
    
    return {
      external_system: 'trello',
      external_id: card.id,
      external_key: card.id,
      title: card.name,
      description: card.desc || '',
      status: payload.action.data.list?.name || 'Unknown',
      priority: 'medium', // Trello doesn't have built-in priority
      assignee_email: null, // Would need additional API call to get member details
      labels: [],
      created_at: new Date(),
      updated_at: new Date(),
      due_date: card.due ? new Date(card.due) : undefined,
      external_url: `https://trello.com/c/${card.id}`
    };
  }
  
  return null;
}

function processAsanaWebhook(payload: any): any {
  // Handle Asana task events
  if (payload.events) {
    for (const event of payload.events) {
      if (event.resource?.resource_type === 'task') {
        return {
          external_system: 'asana',
          external_id: event.resource.gid,
          external_key: event.resource.gid,
          title: event.resource.name || 'Untitled Task',
          description: event.resource.notes || '',
          status: event.resource.completed ? 'Complete' : 'Incomplete',
          priority: 'medium',
          assignee_email: null, // Would need additional API call
          labels: [],
          created_at: new Date(event.resource.created_at),
          updated_at: new Date(event.resource.modified_at),
          due_date: event.resource.due_on ? new Date(event.resource.due_on) : undefined,
          external_url: event.resource.permalink_url
        };
      }
    }
  }
  
  return null;
}

function processMockWebhook(payload: any): any {
  // Handle mock webhook for testing
  if (payload.issue) {
    return {
      external_system: 'mock',
      external_id: payload.issue.id,
      external_key: payload.issue.key,
      title: payload.issue.title,
      description: payload.issue.description || '',
      status: payload.issue.status,
      priority: payload.issue.priority || 'medium',
      assignee_email: payload.issue.assignee?.email,
      labels: payload.issue.labels || [],
      created_at: new Date(payload.issue.created_at || Date.now()),
      updated_at: new Date(payload.issue.updated_at || Date.now()),
      due_date: payload.issue.due_date ? new Date(payload.issue.due_date) : undefined,
      external_url: payload.issue.external_url
    };
  }
  
  return null;
}