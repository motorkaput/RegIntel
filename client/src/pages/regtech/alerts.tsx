import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, BellOff, CheckCircle, Plus, Settings, Trash2, Edit, X, AlertTriangle, Info, FileText, TrendingUp, Globe, RefreshCw, ExternalLink, Clock, Loader2, Search, Rss } from "lucide-react";
import RegTechLayout from "./layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const cleanSummaryText = (text: string | null | undefined): string => {
  if (!text) return '';
  
  const aiPreambles = [
    /^Certainly!?\s*/i,
    /^Here is a?\s*(detailed)?\s*(comparison|summary|analysis).*?:\s*(-{3,})?\s*/i,
    /^Sure!?\s*/i,
    /^Of course!?\s*/i,
    /^\s*#{1,3}\s*\d*\.?\s*/,
    /^\*\*Added Sections\/Requirements.*?\*\*/i,
    /^\(NEW$/i,
  ];
  
  let cleaned = text;
  for (const pattern of aiPreambles) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  cleaned = cleaned.replace(/^[\s\-#*]+/, '').trim();
  
  return cleaned;
};

const getImpactInfo = (score: number | string | null) => {
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  if (!numScore || numScore <= 0.3) {
    return {
      level: 'Low',
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'Routine update with minimal operational changes required.',
      icon: Info,
    };
  } else if (numScore <= 0.6) {
    return {
      level: 'Medium',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Notable changes that may require policy review or process updates.',
      icon: AlertTriangle,
    };
  } else {
    return {
      level: 'High',
      color: 'bg-red-100 text-red-800 border-red-200',
      description: 'Significant regulatory change requiring immediate attention and potential compliance action.',
      icon: TrendingUp,
    };
  }
};

const getDocImpactInfo = (score: number | string | null) => {
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  if (!numScore || numScore <= 3) {
    return {
      level: 'Low',
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'Routine update with minimal operational changes required.',
      icon: Info,
    };
  } else if (numScore <= 6) {
    return {
      level: 'Medium',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Notable changes that may require policy review or process updates.',
      icon: AlertTriangle,
    };
  } else {
    return {
      level: 'High',
      color: 'bg-red-100 text-red-800 border-red-200',
      description: 'Significant regulatory change requiring immediate attention and potential compliance action.',
      icon: TrendingUp,
    };
  }
};

const REGIONS = [
  "India",
  "Singapore", 
  "Hong Kong",
  "UAE",
  "Malaysia",
  "Thailand",
  "Indonesia",
  "Philippines",
  "Bangladesh",
  "Sri Lanka",
  "Nepal",
  "Pakistan",
  "Australia",
  "UK",
  "EU",
  "US",
  "Global",
] as const;

const REGION_JURISDICTIONS: Record<string, string[]> = {
  "India": ["India"],
  "Singapore": ["Singapore"],
  "Hong Kong": ["Hong Kong"],
  "UAE": ["UAE", "DIFC", "ADGM"],
  "Malaysia": ["Malaysia"],
  "Thailand": ["Thailand"],
  "Indonesia": ["Indonesia"],
  "Philippines": ["Philippines"],
  "Bangladesh": ["Bangladesh"],
  "Sri Lanka": ["Sri Lanka"],
  "Nepal": ["Nepal"],
  "Pakistan": ["Pakistan"],
  "Australia": ["Australia"],
  "UK": ["United Kingdom"],
  "EU": ["European Union", "Germany", "France", "Italy", "Spain", "Netherlands", "Belgium", "Luxembourg"],
  "US": ["United States"],
  "Global": ["FATF", "BIS", "FSB", "IOSCO", "BCBS", "Wolfsberg Group"],
};

const DEFAULT_KEYWORDS = [
  "AML", "Anti-Money Laundering", "KYC", "Sanctions", "FATF", "Compliance",
  "Fines", "Penalties", "Enforcement", "Guidance", "Circular", "Press Release",
  "Regulatory Update", "Transaction Monitoring", "Risk Assessment",
];

const CADENCE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const JURISDICTIONS = [
  { value: "US", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "EU", label: "European Union" },
  { value: "SG", label: "Singapore" },
  { value: "HK", label: "Hong Kong" },
  { value: "IN", label: "India" },
  { value: "AU", label: "Australia" },
  { value: "CA", label: "Canada" },
  { value: "GLOBAL", label: "Global" },
];

const REGULATORS = [
  { value: "FinCEN", label: "FinCEN" },
  { value: "FCA", label: "FCA" },
  { value: "EBA", label: "EBA" },
  { value: "MAS", label: "MAS" },
  { value: "HKMA", label: "HKMA" },
  { value: "FIU-IND", label: "FIU-IND" },
  { value: "AUSTRAC", label: "AUSTRAC" },
  { value: "FINTRAC", label: "FINTRAC" },
  { value: "FATF", label: "FATF" },
];

const FREQUENCIES = [
  { value: "immediate", label: "Immediate" },
  { value: "daily", label: "Daily Digest" },
  { value: "weekly", label: "Weekly Summary" },
];

type AlertConfig = {
  id: number;
  name: string;
  alertType: string;
  keywords?: string[];
  phrases?: string[];
  urls?: string[];
  regulators?: string[];
  jurisdictions?: string[];
  frequency: string;
  isActive: boolean;
};

type WebAlertSet = {
  id: number;
  userId: string;
  name: string;
  region: string;
  jurisdictions: string[];
  keywords: string[] | null;
  cadence: string;
  isActive: boolean;
  lastScannedAt: string | null;
  createdAt: string;
};

type WebAlert = {
  id: number;
  userId: string;
  alertSetId: number | null;
  title: string;
  summary: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  jurisdiction: string | null;
  regulator: string | null;
  keywords: string[] | null;
  impactScore: string | null;
  publishedAt: string | null;
  status: string;
  createdAt: string;
  readAt: string | null;
};

export default function AlertsPage() {
  const { toast } = useToast();
  const [webFilter, setWebFilter] = useState<'all' | 'unread'>('unread');
  const [activeTab, setActiveTab] = useState('web-alerts');
  const [isCreateAlertSetOpen, setIsCreateAlertSetOpen] = useState(false);
  const [editingAlertSet, setEditingAlertSet] = useState<WebAlertSet | null>(null);
  const [deleteAlertSetId, setDeleteAlertSetId] = useState<number | null>(null);
  const [scanningSetId, setScanningSetId] = useState<number | null>(null);
  const [newAlertSet, setNewAlertSet] = useState({
    name: "",
    regions: [] as string[],
    jurisdictions: [] as string[],
    keywords: "",
    cadence: "weekly",
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AlertConfig | null>(null);
  const [deleteConfigId, setDeleteConfigId] = useState<number | null>(null);
  const [newConfig, setNewConfig] = useState({
    name: "",
    alertType: "keyword",
    keywords: "",
    phrases: "",
    urls: "",
    regulators: [] as string[],
    jurisdictions: [] as string[],
    frequency: "immediate",
    isActive: true,
  });

  const { data: webAlertsData, isLoading: loadingWebAlerts } = useQuery<WebAlert[]>({
    queryKey: ['/api/regtech/web-alerts'],
  });

  const { data: webAlertSetsData, isLoading: loadingAlertSets } = useQuery<WebAlertSet[]>({
    queryKey: ['/api/regtech/web-alert-sets'],
  });

  const webAlerts = webAlertsData || [];
  const webAlertSets = webAlertSetsData || [];

  const createAlertSetMutation = useMutation({
    mutationFn: async (alertSet: typeof newAlertSet) => {
      const payload = {
        name: alertSet.name,
        region: alertSet.regions.join(', '), // Store multiple regions as comma-separated
        jurisdictions: alertSet.jurisdictions,
        keywords: alertSet.keywords ? alertSet.keywords.split(',').map(k => k.trim()).filter(Boolean) : null,
        cadence: alertSet.cadence,
      };
      const response = await apiRequest('/api/regtech/web-alert-sets', 'POST', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/web-alert-sets'] });
      setIsCreateAlertSetOpen(false);
      resetNewAlertSet();
      toast({ title: "Success", description: "Alert set created" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create alert set", variant: "destructive" });
    },
  });

  const updateAlertSetMutation = useMutation({
    mutationFn: async ({ id, alertSet }: { id: number; alertSet: typeof newAlertSet }) => {
      const payload = {
        name: alertSet.name,
        region: alertSet.regions.join(', '), // Store multiple regions as comma-separated
        jurisdictions: alertSet.jurisdictions,
        keywords: alertSet.keywords ? alertSet.keywords.split(',').map(k => k.trim()).filter(Boolean) : null,
        cadence: alertSet.cadence,
      };
      const response = await apiRequest(`/api/regtech/web-alert-sets/${id}`, 'PATCH', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/web-alert-sets'] });
      setEditingAlertSet(null);
      resetNewAlertSet();
      toast({ title: "Success", description: "Alert set updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update alert set", variant: "destructive" });
    },
  });

  const deleteAlertSetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/regtech/web-alert-sets/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/web-alert-sets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/web-alerts'] });
      setDeleteAlertSetId(null);
      toast({ title: "Success", description: "Alert set deleted" });
    },
  });

  const scanAlertSetMutation = useMutation({
    mutationFn: async (id: number) => {
      setScanningSetId(id);
      const response = await apiRequest(`/api/regtech/web-alert-sets/${id}/scan`, 'POST');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/web-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/web-alert-sets'] });
      setScanningSetId(null);
      toast({ 
        title: "Scan Complete", 
        description: data.message || `Found ${data.alertsCount || 0} new alerts`,
      });
    },
    onError: (error: any) => {
      setScanningSetId(null);
      toast({ title: "Scan Failed", description: error.message || "Failed to scan for alerts", variant: "destructive" });
    },
  });

  const markWebAlertReadMutation = useMutation({
    mutationFn: async (alertId: number) => {
      await apiRequest(`/api/regtech/web-alerts/${alertId}/read`, 'PATCH');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/web-alerts'] });
    },
  });

  const createConfigMutation = useMutation({
    mutationFn: async (config: typeof newConfig) => {
      const payload = {
        name: config.name,
        alertType: config.alertType,
        keywords: config.keywords ? config.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
        phrases: config.phrases ? config.phrases.split('\n').map(p => p.trim()).filter(Boolean) : [],
        urls: config.urls ? config.urls.split('\n').map(u => u.trim()).filter(Boolean) : [],
        regulators: config.regulators,
        jurisdictions: config.jurisdictions,
        frequency: config.frequency,
        isActive: config.isActive,
      };
      const response = await apiRequest('/api/regtech/alert-configurations', 'POST', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/alert-configurations'] });
      setIsCreateDialogOpen(false);
      resetNewConfig();
      toast({ title: "Success", description: "Alert configuration created" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create configuration", variant: "destructive" });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, config }: { id: number; config: typeof newConfig }) => {
      const payload = {
        name: config.name,
        alertType: config.alertType,
        keywords: config.keywords ? config.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
        phrases: config.phrases ? config.phrases.split('\n').map(p => p.trim()).filter(Boolean) : [],
        urls: config.urls ? config.urls.split('\n').map(u => u.trim()).filter(Boolean) : [],
        regulators: config.regulators,
        jurisdictions: config.jurisdictions,
        frequency: config.frequency,
        isActive: config.isActive,
      };
      const response = await apiRequest(`/api/regtech/alert-configurations/${id}`, 'PATCH', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/alert-configurations'] });
      setEditingConfig(null);
      resetNewConfig();
      toast({ title: "Success", description: "Configuration updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update configuration", variant: "destructive" });
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/regtech/alert-configurations/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/alert-configurations'] });
      setDeleteConfigId(null);
      toast({ title: "Success", description: "Configuration deleted" });
    },
  });

  const resetNewAlertSet = () => {
    setNewAlertSet({
      name: "",
      regions: [],
      jurisdictions: [],
      keywords: "",
      cadence: "weekly",
    });
  };

  const resetNewConfig = () => {
    setNewConfig({
      name: "",
      alertType: "keyword",
      keywords: "",
      phrases: "",
      urls: "",
      regulators: [],
      jurisdictions: [],
      frequency: "immediate",
      isActive: true,
    });
  };

  const handleRegionToggle = (region: string) => {
    setNewAlertSet(prev => {
      const isSelected = prev.regions.includes(region);
      const newRegions = isSelected 
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region];
      
      // Aggregate all jurisdictions from selected regions
      const newJurisdictions = newRegions.reduce((acc, r) => {
        const regionJurisdictions = REGION_JURISDICTIONS[r] || [];
        return [...acc, ...regionJurisdictions.filter(j => !acc.includes(j))];
      }, [] as string[]);
      
      return {
        ...prev,
        regions: newRegions,
        jurisdictions: newJurisdictions,
      };
    });
  };

  const handleAlertSetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAlertSet) {
      updateAlertSetMutation.mutate({ id: editingAlertSet.id, alertSet: newAlertSet });
    } else {
      createAlertSetMutation.mutate(newAlertSet);
    }
  };

  const startEditAlertSet = (alertSet: WebAlertSet) => {
    setEditingAlertSet(alertSet);
    // Convert comma-separated regions back to array
    const regionsArray = alertSet.region ? alertSet.region.split(',').map(r => r.trim()).filter(Boolean) : [];
    setNewAlertSet({
      name: alertSet.name,
      regions: regionsArray,
      jurisdictions: alertSet.jurisdictions,
      keywords: alertSet.keywords?.join(', ') || '',
      cadence: alertSet.cadence,
    });
    setIsCreateAlertSetOpen(true);
  };

  const startEditConfig = (config: AlertConfig) => {
    setEditingConfig(config);
    setNewConfig({
      name: config.name,
      alertType: config.alertType,
      keywords: config.keywords?.join(', ') || '',
      phrases: config.phrases?.join('\n') || '',
      urls: config.urls?.join('\n') || '',
      regulators: config.regulators || [],
      jurisdictions: config.jurisdictions || [],
      frequency: config.frequency,
      isActive: config.isActive,
    });
    setIsCreateDialogOpen(true);
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingConfig) {
      updateConfigMutation.mutate({ id: editingConfig.id, config: newConfig });
    } else {
      createConfigMutation.mutate(newConfig);
    }
  };

  const handleJurisdictionToggle = (value: string) => {
    setNewConfig(prev => ({
      ...prev,
      jurisdictions: prev.jurisdictions.includes(value)
        ? prev.jurisdictions.filter(j => j !== value)
        : [...prev.jurisdictions, value]
    }));
  };

  const handleRegulatorToggle = (value: string) => {
    setNewConfig(prev => ({
      ...prev,
      regulators: prev.regulators.includes(value)
        ? prev.regulators.filter(r => r !== value)
        : [...prev.regulators, value]
    }));
  };

  const filteredWebAlerts = webAlerts.filter(alert => {
    if (webFilter === 'unread') return alert.status === 'unread';
    return true;
  });

  const webUnreadCount = webAlerts.filter(a => a.status === 'unread').length;
  const totalUnreadCount = webUnreadCount;

  return (
    <RegTechLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900" data-testid="text-page-title">Alerts Dashboard</h1>
              <p className="text-slate-600 mt-1 text-sm">
                Proactive notifications for regulatory changes
              </p>
            </div>
            {totalUnreadCount > 0 && (
              <div className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-sm font-medium" data-testid="badge-unread-count">
                {totalUnreadCount} Unread
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100">
              <TabsTrigger value="web-alerts" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Globe className="h-4 w-4" />
                Web Alerts
                {webUnreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{webUnreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Web Alerts Tab */}
          <TabsContent value="web-alerts" className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant={webFilter === 'unread' ? 'default' : 'outline'}
                  onClick={() => setWebFilter('unread')}
                  className="rounded-xl"
                >
                  <BellOff className="mr-2 h-4 w-4" />
                  Unread ({webUnreadCount})
                </Button>
                <Button
                  variant={webFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setWebFilter('all')}
                  className="rounded-xl"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  All ({webAlerts.length})
                </Button>
              </div>
              <Button onClick={() => setIsCreateAlertSetOpen(true)} className="rounded-xl bg-slate-900 hover:bg-slate-800">
                <Plus className="h-4 w-4 mr-2" />
                New Alert Set
              </Button>
            </div>

            {webAlertSets.length > 0 && (
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Rss className="h-4 w-4" />
                    Your Alert Sets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {webAlertSets.map((alertSet) => (
                      <div key={alertSet.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-slate-900">{alertSet.name}</div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditAlertSet(alertSet)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => setDeleteAlertSetId(alertSet.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-slate-600 mb-2">
                          <Badge variant="outline" className="mr-1">{alertSet.region}</Badge>
                          <Badge variant="outline">{alertSet.cadence}</Badge>
                        </div>
                        <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alertSet.lastScannedAt 
                            ? `Last scanned: ${new Date(alertSet.lastScannedAt).toLocaleDateString()}`
                            : 'Never scanned'}
                        </div>
                        <Button
                          size="sm"
                          className="w-full rounded-lg"
                          onClick={() => scanAlertSetMutation.mutate(alertSet.id)}
                          disabled={scanningSetId === alertSet.id}
                        >
                          {scanningSetId === alertSet.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Scanning...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-2" />
                              Scan Now
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {loadingWebAlerts ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-900 mx-auto"></div>
                <p className="text-slate-500 mt-4 text-sm">Loading alerts...</p>
              </div>
            ) : filteredWebAlerts.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="py-12 text-center">
                  <Globe className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">
                    {webFilter === 'unread' ? 'No unread web alerts' : 'No web alerts yet'}
                  </p>
                  <p className="text-slate-500 text-sm mb-4">
                    Create an alert set and scan for regulatory updates from official websites
                  </p>
                  {webAlertSets.length === 0 && (
                    <Button onClick={() => setIsCreateAlertSetOpen(true)} className="rounded-xl">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Alert Set
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredWebAlerts.map((alert) => {
                  const impactInfo = getImpactInfo(alert.impactScore);
                  const ImpactIcon = impactInfo.icon;

                  return (
                    <Card
                      key={alert.id}
                      className={`rounded-2xl ${alert.status === 'unread' ? 'border-l-4 border-l-blue-600' : ''}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                              {alert.status === 'unread' && <Badge className="bg-blue-600">New</Badge>}
                              {alert.sourceName && <Badge variant="outline">{alert.sourceName}</Badge>}
                              {alert.jurisdiction && <Badge variant="secondary">{alert.jurisdiction}</Badge>}
                            </div>
                            <CardTitle className="text-lg break-words mb-2">{alert.title}</CardTitle>
                          </div>
                          {alert.status === 'unread' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markWebAlertReadMutation.mutate(alert.id)}
                              className="shrink-0"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className={`rounded-xl p-4 border ${impactInfo.color}`}>
                          <div className="flex items-start gap-3">
                            <ImpactIcon className="h-5 w-5 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-medium mb-1">
                                Impact Level: {impactInfo.level}
                              </div>
                              <p className="text-sm opacity-90">{impactInfo.description}</p>
                            </div>
                          </div>
                        </div>

                        {alert.summary && (
                          <div className="bg-white rounded-xl p-4 border border-slate-200">
                            <h4 className="font-medium text-sm text-slate-700 mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Summary
                            </h4>
                            <p className="text-slate-600 text-sm leading-relaxed">
                              {cleanSummaryText(alert.summary)}
                            </p>
                          </div>
                        )}

                        {alert.keywords && alert.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {alert.keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{keyword}</Badge>
                            ))}
                          </div>
                        )}

                        {alert.sourceUrl && (
                          <Button variant="outline" size="sm" className="rounded-lg" asChild>
                            <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Source
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rss className="h-5 w-5" />
                  Web Alert Sets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-slate-600 text-sm">
                    {webAlertSets.length} alert set{webAlertSets.length !== 1 ? 's' : ''} configured
                  </p>
                  <Button onClick={() => setIsCreateAlertSetOpen(true)} className="rounded-xl bg-slate-900 hover:bg-slate-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Alert Set
                  </Button>
                </div>

                {loadingAlertSets ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-900 mx-auto"></div>
                  </div>
                ) : webAlertSets.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Globe className="h-10 w-10 mx-auto mb-2 text-slate-400" />
                    <p>No alert sets configured yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {webAlertSets.map((alertSet) => (
                      <div key={alertSet.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900">{alertSet.name}</div>
                          <div className="text-sm text-slate-600 mt-1">
                            Region: {alertSet.region} | Cadence: {alertSet.cadence}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {alertSet.jurisdictions?.join(', ')}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => startEditAlertSet(alertSet)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteAlertSetId(alertSet.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Web Alert Set Dialog */}
      <Dialog open={isCreateAlertSetOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingAlertSet(null);
          resetNewAlertSet();
        }
        setIsCreateAlertSetOpen(open);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAlertSet ? 'Edit Alert Set' : 'Create Alert Set'}</DialogTitle>
            <DialogDescription>
              Configure a set of regulatory sources to monitor for updates
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAlertSetSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newAlertSet.name}
                onChange={(e) => setNewAlertSet(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., APAC AML Monitoring"
                required
              />
            </div>

            <div>
              <Label>Regions / Geographies</Label>
              <p className="text-xs text-slate-500 mb-2">Select one or more regions to monitor</p>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                {REGIONS.map((region) => (
                  <div key={region} className="flex items-center space-x-2">
                    <Checkbox
                      id={`region-${region}`}
                      checked={newAlertSet.regions.includes(region)}
                      onCheckedChange={() => handleRegionToggle(region)}
                    />
                    <label 
                      htmlFor={`region-${region}`} 
                      className="text-sm cursor-pointer"
                    >
                      {region}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {newAlertSet.jurisdictions.length > 0 && (
              <div>
                <Label>Jurisdictions (auto-populated from selected regions)</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {newAlertSet.jurisdictions.map((j) => (
                    <Badge key={j} variant="secondary">{j}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Keywords (optional)</Label>
              <Input
                value={newAlertSet.keywords}
                onChange={(e) => setNewAlertSet(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="AML, KYC, Sanctions (comma-separated)"
              />
              <p className="text-xs text-slate-500 mt-1">
                Leave empty to use default keywords: {DEFAULT_KEYWORDS.slice(0, 5).join(', ')}...
              </p>
            </div>

            <div>
              <Label>Scan Frequency</Label>
              <Select value={newAlertSet.cadence} onValueChange={(v) => setNewAlertSet(prev => ({ ...prev, cadence: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CADENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateAlertSetOpen(false);
                setEditingAlertSet(null);
                resetNewAlertSet();
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAlertSetMutation.isPending || updateAlertSetMutation.isPending || newAlertSet.regions.length === 0}>
                {editingAlertSet ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Set Confirmation */}
      <AlertDialog open={!!deleteAlertSetId} onOpenChange={() => setDeleteAlertSetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alert Set?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the alert set and all its associated alerts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAlertSetId && deleteAlertSetMutation.mutate(deleteAlertSetId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Document Config Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingConfig(null);
          resetNewConfig();
        }
        setIsCreateDialogOpen(open);
      }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConfig ? 'Edit Alert Rule' : 'Create Alert Rule'}</DialogTitle>
            <DialogDescription>
              Configure when you want to receive document-based alerts
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfigSubmit} className="space-y-4">
            <div>
              <Label>Rule Name</Label>
              <Input
                value={newConfig.name}
                onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., AML Updates"
                required
              />
            </div>

            <div>
              <Label>Alert Type</Label>
              <Select value={newConfig.alertType} onValueChange={(v) => setNewConfig(prev => ({ ...prev, alertType: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyword">Keyword Match</SelectItem>
                  <SelectItem value="phrase">Phrase Match</SelectItem>
                  <SelectItem value="url">URL Match</SelectItem>
                  <SelectItem value="regulator">Regulator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newConfig.alertType === 'keyword' && (
              <div>
                <Label>Keywords (comma-separated)</Label>
                <Input
                  value={newConfig.keywords}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="AML, KYC, sanctions"
                />
              </div>
            )}

            <div>
              <Label>Jurisdictions</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {JURISDICTIONS.map((j) => (
                  <div key={j.value} className="flex items-center gap-1">
                    <Checkbox
                      checked={newConfig.jurisdictions.includes(j.value)}
                      onCheckedChange={() => handleJurisdictionToggle(j.value)}
                    />
                    <span className="text-sm">{j.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Regulators</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {REGULATORS.map((r) => (
                  <div key={r.value} className="flex items-center gap-1">
                    <Checkbox
                      checked={newConfig.regulators.includes(r.value)}
                      onCheckedChange={() => handleRegulatorToggle(r.value)}
                    />
                    <span className="text-sm">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Frequency</Label>
              <Select value={newConfig.frequency} onValueChange={(v) => setNewConfig(prev => ({ ...prev, frequency: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={newConfig.isActive}
                onCheckedChange={(checked) => setNewConfig(prev => ({ ...prev, isActive: !!checked }))}
              />
              <Label>Active</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingConfig(null);
                resetNewConfig();
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createConfigMutation.isPending || updateConfigMutation.isPending}>
                {editingConfig ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Config Confirmation */}
      <AlertDialog open={!!deleteConfigId} onOpenChange={() => setDeleteConfigId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alert Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfigId && deleteConfigMutation.mutate(deleteConfigId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RegTechLayout>
  );
}
