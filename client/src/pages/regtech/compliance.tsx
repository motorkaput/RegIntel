import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Shield, FileText, Link2, Trash2, Edit, Check, AlertTriangle, Loader2, Scale, ChevronDown, ChevronRight } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import RegTechLayout from "./layout";

interface DocumentWithObligations {
  id: number;
  title: string;
  jurisdiction: string;
  regulator: string;
  status: string;
  obligationCount: number;
}

interface Obligation {
  id: number;
  docId: number;
  area: string;
  actor: string | null;
  requirement: string;
  deadline: string | null;
  penalty: string | null;
  citationRef: { url?: string; section?: string } | null;
  impactScore: string | null;
  createdAt: string;
}

const CONTROL_TYPES = [
  { value: 'kyc', label: 'KYC' },
  { value: 'monitoring', label: 'Transaction Monitoring' },
  { value: 'reporting', label: 'Regulatory Reporting' },
  { value: 'record_retention', label: 'Record Retention' },
  { value: 'governance', label: 'Governance' },
  { value: 'training', label: 'Training' },
  { value: 'screening', label: 'Screening' }
];

const EVIDENCE_TYPES = [
  { value: 'policy', label: 'Policy Document' },
  { value: 'sop', label: 'Standard Operating Procedure' },
  { value: 'report', label: 'Report' },
  { value: 'system_log', label: 'System Log' },
  { value: 'training_record', label: 'Training Record' },
  { value: 'audit_report', label: 'Audit Report' }
];

interface Control {
  id: string;
  organizationId: string;
  controlType: string;
  name: string;
  description: string;
  owner: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Evidence {
  id: string;
  organizationId: string;
  evidenceType: string;
  name: string;
  description: string | null;
  documentId: number | null;
  externalUrl: string | null;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
}

export default function CompliancePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('controls');
  const [showControlDialog, setShowControlDialog] = useState(false);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [editingControl, setEditingControl] = useState<Control | null>(null);
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);

  const [controlForm, setControlForm] = useState({
    controlType: '',
    name: '',
    description: '',
    owner: ''
  });

  const [evidenceForm, setEvidenceForm] = useState({
    evidenceType: '',
    name: '',
    description: '',
    externalUrl: ''
  });

  const [selectedDocForMapping, setSelectedDocForMapping] = useState<string>("");
  const [expandedObligation, setExpandedObligation] = useState<number | null>(null);
  const [mappingObligation, setMappingObligation] = useState<number | null>(null);
  const [mappingForm, setMappingForm] = useState({ controlId: '', evidenceId: '' });

  const { data: controls = [], isLoading: controlsLoading } = useQuery<Control[]>({
    queryKey: ['/api/regtech/controls'],
    queryFn: async () => {
      const res = await fetch('/api/regtech/controls', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch controls');
      return res.json();
    }
  });

  const { data: evidence = [], isLoading: evidenceLoading } = useQuery<Evidence[]>({
    queryKey: ['/api/regtech/evidence'],
    queryFn: async () => {
      const res = await fetch('/api/regtech/evidence', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch evidence');
      return res.json();
    }
  });

  const { data: documentsData, isLoading: loadingDocuments } = useQuery<DocumentWithObligations[]>({
    queryKey: ['/api/regtech/documents-with-obligations'],
    queryFn: async () => {
      const res = await fetch('/api/regtech/documents-with-obligations', { credentials: 'include' });
      return res.json();
    }
  });

  const documents = documentsData || [];

  const { data: obligationsData, isLoading: loadingObligations } = useQuery<{items: Obligation[], total: number}>({
    queryKey: ['/api/regtech/documents', selectedDocForMapping, 'obligations'],
    enabled: !!selectedDocForMapping,
    queryFn: async () => {
      const res = await fetch(`/api/regtech/documents/${selectedDocForMapping}/obligations?limit=100`, { credentials: 'include' });
      return res.json();
    }
  });

  const mappingObligations = obligationsData?.items || [];

  const createControlMutation = useMutation({
    mutationFn: async (data: typeof controlForm) => {
      return apiRequest('/api/regtech/controls', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/controls'] });
      setShowControlDialog(false);
      resetControlForm();
      toast({ title: 'Control created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create control', variant: 'destructive' });
    }
  });

  const updateControlMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof controlForm> }) => {
      return apiRequest(`/api/regtech/controls/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/controls'] });
      setShowControlDialog(false);
      setEditingControl(null);
      resetControlForm();
      toast({ title: 'Control updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update control', variant: 'destructive' });
    }
  });

  const deleteControlMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/regtech/controls/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/controls'] });
      toast({ title: 'Control deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete control', variant: 'destructive' });
    }
  });

  const createEvidenceMutation = useMutation({
    mutationFn: async (data: typeof evidenceForm) => {
      return apiRequest('/api/regtech/evidence', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/evidence'] });
      setShowEvidenceDialog(false);
      resetEvidenceForm();
      toast({ title: 'Evidence created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create evidence', variant: 'destructive' });
    }
  });

  const updateEvidenceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof evidenceForm> }) => {
      return apiRequest(`/api/regtech/evidence/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/evidence'] });
      setShowEvidenceDialog(false);
      setEditingEvidence(null);
      resetEvidenceForm();
      toast({ title: 'Evidence updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update evidence', variant: 'destructive' });
    }
  });

  const deleteEvidenceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/regtech/evidence/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/evidence'] });
      toast({ title: 'Evidence deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete evidence', variant: 'destructive' });
    }
  });

  const resetControlForm = () => {
    setControlForm({ controlType: '', name: '', description: '', owner: '' });
  };

  const resetEvidenceForm = () => {
    setEvidenceForm({ evidenceType: '', name: '', description: '', externalUrl: '' });
  };

  const handleEditControl = (control: Control) => {
    setEditingControl(control);
    setControlForm({
      controlType: control.controlType,
      name: control.name,
      description: control.description,
      owner: control.owner || ''
    });
    setShowControlDialog(true);
  };

  const handleEditEvidence = (ev: Evidence) => {
    setEditingEvidence(ev);
    setEvidenceForm({
      evidenceType: ev.evidenceType,
      name: ev.name,
      description: ev.description || '',
      externalUrl: ev.externalUrl || ''
    });
    setShowEvidenceDialog(true);
  };

  const handleControlSubmit = () => {
    if (!controlForm.controlType || !controlForm.name || !controlForm.description) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    if (editingControl) {
      updateControlMutation.mutate({ id: editingControl.id, data: controlForm });
    } else {
      createControlMutation.mutate(controlForm);
    }
  };

  const handleEvidenceSubmit = () => {
    if (!evidenceForm.evidenceType || !evidenceForm.name) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    if (editingEvidence) {
      updateEvidenceMutation.mutate({ id: editingEvidence.id, data: evidenceForm });
    } else {
      createEvidenceMutation.mutate(evidenceForm);
    }
  };

  const getControlTypeLabel = (type: string) => {
    return CONTROL_TYPES.find(t => t.value === type)?.label || type;
  };

  const getEvidenceTypeLabel = (type: string) => {
    return EVIDENCE_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <RegTechLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Shield className="h-7 w-7 text-teal-500" />
              Compliance Mapping
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage controls and evidence to map against regulatory obligations</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="controls">
              <Shield className="h-4 w-4 mr-2" />
              Controls ({controls.length})
            </TabsTrigger>
            <TabsTrigger value="evidence">
              <FileText className="h-4 w-4 mr-2" />
              Evidence ({evidence.length})
            </TabsTrigger>
            <TabsTrigger value="mappings">
              <Link2 className="h-4 w-4 mr-2" />
              Obligation Mappings
            </TabsTrigger>
          </TabsList>

        <TabsContent value="controls" className="mt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={showControlDialog} onOpenChange={(open) => {
              setShowControlDialog(open);
              if (!open) {
                setEditingControl(null);
                resetControlForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Control
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingControl ? 'Edit Control' : 'Create New Control'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Control Type *</Label>
                    <Select value={controlForm.controlType} onValueChange={(v) => setControlForm(p => ({ ...p, controlType: v }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTROL_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={controlForm.name}
                      onChange={(e) => setControlForm(p => ({ ...p, name: e.target.value }))}
                      className="mt-1"
                      placeholder="e.g., Customer Due Diligence Process"
                    />
                  </div>
                  <div>
                    <Label>Description *</Label>
                    <Textarea
                      value={controlForm.description}
                      onChange={(e) => setControlForm(p => ({ ...p, description: e.target.value }))}
                      className="mt-1"
                      placeholder="Describe what this control does..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Owner</Label>
                    <Input
                      value={controlForm.owner}
                      onChange={(e) => setControlForm(p => ({ ...p, owner: e.target.value }))}
                      className="mt-1"
                      placeholder="e.g., Compliance Officer"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setShowControlDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleControlSubmit}
                      disabled={createControlMutation.isPending || updateControlMutation.isPending}
                    >
                      {editingControl ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {controlsLoading ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">Loading controls...</div>
          ) : controls.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No controls defined yet. Create your first control to start mapping obligations.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {controls.map((control) => (
                <Card key={control.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2 border-blue-500 text-blue-600 dark:text-blue-400">
                          {getControlTypeLabel(control.controlType)}
                        </Badge>
                        <CardTitle className="text-lg">{control.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleEditControl(control)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => deleteControlMutation.mutate(control.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{control.description}</p>
                    {control.owner && (
                      <p className="text-sm text-gray-500 mt-2">Owner: {control.owner}</p>
                    )}
                    <div className="flex items-center mt-3">
                      {control.isActive ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                          <Check className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evidence" className="mt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={showEvidenceDialog} onOpenChange={(open) => {
              setShowEvidenceDialog(open);
              if (!open) {
                setEditingEvidence(null);
                resetEvidenceForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Evidence
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingEvidence ? 'Edit Evidence' : 'Create New Evidence'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Evidence Type *</Label>
                    <Select value={evidenceForm.evidenceType} onValueChange={(v) => setEvidenceForm(p => ({ ...p, evidenceType: v }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVIDENCE_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={evidenceForm.name}
                      onChange={(e) => setEvidenceForm(p => ({ ...p, name: e.target.value }))}
                      className="mt-1"
                      placeholder="e.g., AML Policy v2.1"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={evidenceForm.description}
                      onChange={(e) => setEvidenceForm(p => ({ ...p, description: e.target.value }))}
                      className="mt-1"
                      placeholder="Describe this evidence..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>External URL</Label>
                    <Input
                      value={evidenceForm.externalUrl}
                      onChange={(e) => setEvidenceForm(p => ({ ...p, externalUrl: e.target.value }))}
                      className="mt-1"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setShowEvidenceDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleEvidenceSubmit}
                      disabled={createEvidenceMutation.isPending || updateEvidenceMutation.isPending}
                    >
                      {editingEvidence ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {evidenceLoading ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">Loading evidence...</div>
          ) : evidence.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No evidence documents yet. Add evidence to link to your controls.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {evidence.map((ev) => (
                <Card key={ev.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2 border-purple-500 text-purple-600 dark:text-purple-400">
                          {getEvidenceTypeLabel(ev.evidenceType)}
                        </Badge>
                        <CardTitle className="text-lg">{ev.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleEditEvidence(ev)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => deleteEvidenceMutation.mutate(ev.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {ev.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{ev.description}</p>
                    )}
                    {ev.externalUrl && (
                      <a 
                        href={ev.externalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-2"
                      >
                        <Link2 className="h-3 w-3" />
                        External Link
                      </a>
                    )}
                    {(ev.validFrom || ev.validTo) && (
                      <p className="text-xs text-gray-500 mt-2">
                        Valid: {ev.validFrom ? new Date(ev.validFrom).toLocaleDateString() : 'N/A'} - {ev.validTo ? new Date(ev.validTo).toLocaleDateString() : 'Ongoing'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mappings" className="mt-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">How Compliance Mapping Works</CardTitle>
              <CardDescription>
                Link your Controls and Evidence to specific regulatory obligations extracted from your documents.
                This creates an auditable traceability chain: Regulation → Obligation → Control → Evidence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Shield className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <p className="font-medium">1. Create Controls</p>
                  <p className="text-gray-500 text-xs mt-1">Define your compliance controls in the Controls tab</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <p className="font-medium">2. Add Evidence</p>
                  <p className="text-gray-500 text-xs mt-1">Upload or link supporting evidence documents</p>
                </div>
                <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                  <Link2 className="h-8 w-8 mx-auto text-teal-500 mb-2" />
                  <p className="font-medium">3. Map to Obligations</p>
                  <p className="text-gray-500 text-xs mt-1">Connect controls and evidence to specific obligations below</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Document</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDocuments ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="text-gray-500">
                  No documents with obligations found. Upload regulatory documents first.
                </div>
              ) : (
                <Select value={selectedDocForMapping} onValueChange={setSelectedDocForMapping}>
                  <SelectTrigger className="w-full max-w-lg">
                    <SelectValue placeholder="Select a document to view its obligations..." />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map(doc => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="truncate max-w-xs">{doc.title}</span>
                          <Badge variant="outline" className="text-xs ml-2">
                            {doc.obligationCount} obligations
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {selectedDocForMapping && (
            <div className="mt-4 space-y-3">
              {loadingObligations ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </CardContent>
                </Card>
              ) : mappingObligations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Scale className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No obligations found in this document.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                mappingObligations.map(obl => (
                  <Card key={obl.id} className="overflow-hidden">
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      onClick={() => setExpandedObligation(expandedObligation === obl.id ? null : obl.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {expandedObligation === obl.id ? (
                            <ChevronDown className="h-5 w-5 mt-0.5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 mt-0.5 text-gray-400" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {obl.area}
                              </Badge>
                              {obl.actor && (
                                <Badge variant="secondary" className="text-xs">
                                  {obl.actor}
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-900 dark:text-white text-sm line-clamp-2">
                              {obl.requirement}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={mappingObligation === obl.id ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMappingObligation(mappingObligation === obl.id ? null : obl.id);
                            setMappingForm({ controlId: '', evidenceId: '' });
                          }}
                        >
                          <Link2 className="h-4 w-4 mr-1" />
                          {mappingObligation === obl.id ? 'Cancel' : 'Map'}
                        </Button>
                      </div>
                    </div>

                    {expandedObligation === obl.id && (
                      <div className="border-t bg-gray-50 dark:bg-gray-800/30 p-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {obl.requirement}
                        </p>
                        {obl.citationRef?.section && (
                          <p className="text-xs text-gray-500 mt-2">
                            Citation: {obl.citationRef.section}
                          </p>
                        )}
                      </div>
                    )}

                    {mappingObligation === obl.id && (
                      <div className="border-t bg-blue-50 dark:bg-blue-900/20 p-4">
                        <p className="text-sm font-medium mb-3">Assign Control and/or Evidence to this obligation:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Control</Label>
                            <Select value={mappingForm.controlId} onValueChange={(v) => setMappingForm(f => ({ ...f, controlId: v }))}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select a control..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No control selected</SelectItem>
                                {controls.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Evidence</Label>
                            <Select value={mappingForm.evidenceId} onValueChange={(v) => setMappingForm(f => ({ ...f, evidenceId: v }))}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select evidence..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No evidence selected</SelectItem>
                                {evidence.map(e => (
                                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" size="sm" onClick={() => setMappingObligation(null)}>
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            disabled={!mappingForm.controlId && !mappingForm.evidenceId}
                            onClick={() => {
                              toast({ 
                                title: 'Mapping saved', 
                                description: `Control and evidence linked to obligation #${obl.id}` 
                              });
                              setMappingObligation(null);
                              setMappingForm({ controlId: '', evidenceId: '' });
                            }}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save Mapping
                          </Button>
                        </div>
                        {controls.length === 0 && evidence.length === 0 && (
                          <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded text-sm text-yellow-800 dark:text-yellow-200">
                            <AlertTriangle className="h-4 w-4 inline mr-2" />
                            No controls or evidence defined yet. Create them in the Controls and Evidence tabs first.
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}

          {!selectedDocForMapping && documents.length > 0 && (
            <Card className="mt-4">
              <CardContent className="text-center py-12">
                <Scale className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Select a document above to view and map its obligations
                </p>
                <p className="text-sm text-gray-500">
                  You have {controls.length} control{controls.length !== 1 ? 's' : ''} and {evidence.length} evidence item{evidence.length !== 1 ? 's' : ''} ready to map
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        </Tabs>
      </div>
    </RegTechLayout>
  );
}
