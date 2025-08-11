'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Shield,
  AlertCircle 
} from 'lucide-react';

interface Integration {
  id: string;
  provider_name: string;
  display_name: string;
  is_active: boolean;
  connected_at: string | null;
  last_sync_at: string | null;
  sync_status: 'pending' | 'running' | 'completed' | 'failed';
  sync_error: string | null;
  config: {
    projects: string[];
    sync_frequency: number;
    webhook_enabled: boolean;
  };
}

interface ExternalProject {
  id: string;
  key: string;
  name: string;
  description?: string;
}

const PROVIDER_INFO = {
  jira: {
    name: 'Jira',
    description: 'Atlassian Jira for issue tracking and project management',
    icon: '🔷',
    color: 'bg-blue-100 text-blue-800'
  },
  trello: {
    name: 'Trello',
    description: 'Trello boards for visual project management',
    icon: '📋',
    color: 'bg-green-100 text-green-800'
  },
  asana: {
    name: 'Asana',
    description: 'Asana for team collaboration and task management',
    icon: '🎯',
    color: 'bg-purple-100 text-purple-800'
  },
  mock: {
    name: 'Mock Provider',
    description: 'Demo provider for testing integrations',
    icon: '🧪',
    color: 'bg-gray-100 text-gray-800'
  }
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [projects, setProjects] = useState<Record<string, ExternalProject[]>>({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectProvider = async (provider: string) => {
    setConnecting(provider);
    
    try {
      const response = await fetch(`/api/integrations/${provider}/authorize`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (provider === 'mock') {
          // For mock provider, handle directly
          window.location.href = data.authorize_url;
        } else {
          // For real providers, open in new window
          window.open(data.authorize_url, 'oauth', 'width=600,height=700');
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initiate connection');
      }
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setConnecting(null);
    }
  };

  const disconnectProvider = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchIntegrations();
        toast({
          title: 'Disconnected',
          description: 'Integration has been disconnected.',
        });
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast({
        title: 'Disconnection Failed',
        description: 'Failed to disconnect the integration.',
        variant: 'destructive',
      });
    }
  };

  const syncIntegration = async (integrationId: string) => {
    setSyncing(integrationId);
    
    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchIntegrations();
        toast({
          title: 'Sync Started',
          description: 'Integration sync has been initiated.',
        });
      }
    } catch (error) {
      console.error('Failed to sync:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to start integration sync.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(null);
    }
  };

  const updateIntegrationConfig = async (integrationId: string, config: any) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      
      if (response.ok) {
        await fetchIntegrations();
        toast({
          title: 'Settings Updated',
          description: 'Integration settings have been saved.',
        });
      }
    } catch (error) {
      console.error('Failed to update config:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update integration settings.',
        variant: 'destructive',
      });
    }
  };

  const fetchProjects = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(prev => ({ ...prev, [integrationId]: data.projects }));
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-2">
          Connect external tools to sync issues and tasks automatically
        </p>
      </div>

      {/* Available Providers */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Available Integrations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(PROVIDER_INFO).map(([provider, info]) => {
              const integration = integrations.find(i => i.provider_name === provider);
              const isConnected = integration?.is_active;
              
              return (
                <Card key={provider} className={`cursor-pointer hover:shadow-md transition-shadow ${
                  isConnected ? 'ring-2 ring-green-200' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl">{info.icon}</div>
                      {isConnected && (
                        <Badge className="bg-green-100 text-green-800">
                          Connected
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="font-medium text-gray-900 mb-1">{info.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{info.description}</p>
                    
                    <div className="flex items-center space-x-2">
                      {isConnected ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => disconnectProvider(integration.id)}
                            data-testid={`button-disconnect-${provider}`}
                          >
                            Disconnect
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => syncIntegration(integration.id)}
                            disabled={syncing === integration.id}
                            data-testid={`button-sync-${provider}`}
                          >
                            {syncing === integration.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              'Sync'
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => connectProvider(provider)}
                          disabled={connecting === provider}
                          data-testid={`button-connect-${provider}`}
                        >
                          {connecting === provider ? 'Connecting...' : 'Connect'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Connected Integrations */}
      {integrations.filter(i => i.is_active).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Connected Integrations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {integrations.filter(i => i.is_active).map((integration) => {
                const providerInfo = PROVIDER_INFO[integration.provider_name as keyof typeof PROVIDER_INFO];
                
                return (
                  <div key={integration.id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{providerInfo?.icon}</div>
                        <div>
                          <h3 className="font-medium text-gray-900">{integration.display_name}</h3>
                          <p className="text-sm text-gray-600">
                            Connected {formatDate(integration.connected_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(integration.sync_status)}
                        <span className="text-sm text-gray-600 capitalize">
                          {integration.sync_status}
                        </span>
                      </div>
                    </div>

                    {integration.sync_error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-800">
                            Sync Error: {integration.sync_error}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Sync Frequency</label>
                        <Select
                          value={integration.config.sync_frequency.toString()}
                          onValueChange={(value) => 
                            updateIntegrationConfig(integration.id, {
                              ...integration.config,
                              sync_frequency: parseInt(value)
                            })
                          }
                        >
                          <SelectTrigger data-testid={`select-frequency-${integration.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">Every 5 minutes</SelectItem>
                            <SelectItem value="15">Every 15 minutes</SelectItem>
                            <SelectItem value="30">Every 30 minutes</SelectItem>
                            <SelectItem value="60">Every hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Webhook Sync</label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={integration.config.webhook_enabled}
                            onCheckedChange={(enabled) =>
                              updateIntegrationConfig(integration.id, {
                                ...integration.config,
                                webhook_enabled: enabled
                              })
                            }
                            data-testid={`switch-webhook-${integration.id}`}
                          />
                          <span className="text-sm text-gray-600">
                            {integration.config.webhook_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Last Sync</label>
                        <p className="text-sm text-gray-600">
                          {formatDate(integration.last_sync_at)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Synced Projects ({integration.config.projects.length})
                      </label>
                      {integration.config.projects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {integration.config.projects.map((projectKey) => (
                            <Badge key={projectKey} variant="outline">
                              {projectKey}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No projects configured. Configure projects to start syncing issues.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {integrations.filter(i => i.is_active).length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No integrations connected
            </h3>
            <p className="text-gray-600 mb-6">
              Connect your favorite tools to automatically sync issues and tasks.
            </p>
            <Button onClick={() => connectProvider('mock')} data-testid="button-connect-first">
              Connect Your First Integration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}