import { JiraProvider } from './providers/jira';
import { TrelloProvider } from './providers/trello';
import { AsanaProvider } from './providers/asana';
import { MockProvider } from './providers/mock';
import type { IssueProvider } from './provider';

export const PROVIDERS: Record<string, () => IssueProvider> = {
  jira: () => new JiraProvider(),
  trello: () => new TrelloProvider(),
  asana: () => new AsanaProvider(),
  mock: () => new MockProvider(),
};

export function getProvider(name: string): IssueProvider {
  const providerFactory = PROVIDERS[name.toLowerCase()];
  if (!providerFactory) {
    throw new Error(`Unknown provider: ${name}`);
  }
  return providerFactory();
}

export function getAvailableProviders(): string[] {
  return Object.keys(PROVIDERS);
}

export * from './provider';
export * from './providers/jira';
export * from './providers/trello';
export * from './providers/asana';
export * from './providers/mock';