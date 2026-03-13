import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ClipboardCheck, 
  Loader2, 
  FileText,
  ChevronDown,
  ChevronRight,
  Building2,
  Globe,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  Info,
  Link as LinkIcon,
  Percent,
  Sparkles,
  Search,
  Clock,
  FileCheck,
  Newspaper
} from "lucide-react";
import RegTechLayout from "./layout";
import { DocumentSelector } from "@/components/regtech/DocumentSelector";
import { apiRequest } from "@/lib/queryClient";
import { ShareResults, DocxContentSection, getFormattedDateTimeForDisplay } from "@/components/regtech/ShareResults";

interface RoleAction {
  role: string;
  roleLabel: string;
  actions: string[];
  priority: "high" | "medium" | "low";
}

interface ObligationInsight {
  id: string;
  category: string;
  requirement: string;
  applicableTo: string;
  conditionalFraming: string;
  roleActions: RoleAction[];
  deadline?: string;
  formatRequired?: string;
  penalty?: string;
  transparency: {
    explainable: string;
    traceable: {
      documentRef: string;
      section?: string;
      deductionPath: string;
    };
    verifiable: {
      confidence: number;
      factors: string[];
    };
  };
}

interface RegulatoryUpdate {
  title: string;
  source: string;
  date: string;
  summary: string;
  relevance: string;
  url?: string;
}

interface ObligationAnalysisResult {
  jurisdiction: string;
  jurisdictionDetails: string;
  entityContext: string;
  documentsSummary: string;
  insights: ObligationInsight[];
  regulatoryUpdates: RegulatoryUpdate[];
  overallConfidence: number;
  generatedAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  KYC: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  AML: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  Sanctions: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
  Reporting: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  RecordKeeping: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
  Training: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  Governance: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200",
  RiskAssessment: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200",
  Default: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "border-l-4 border-l-red-500",
  medium: "border-l-4 border-l-yellow-500",
  low: "border-l-4 border-l-green-500"
};

export default function ObligationsAnalysisPage() {
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [analysisResult, setAnalysisResult] = useState<ObligationAnalysisResult | null>(null);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  const { data: documentsData } = useQuery<{ documents: any[] }>({
    queryKey: ['/api/regtech/documents'],
  });

  const documents = documentsData?.documents || [];
  const selectedDocs = documents.filter(d => selectedDocIds.includes(d.id));

  const analysisMutation = useMutation({
    mutationFn: async (docIds: number[]): Promise<ObligationAnalysisResult> => {
      const response = await apiRequest('/api/regtech/obligations/analyze', 'POST', { documentIds: docIds });
      const data = await response.json();
      return data as ObligationAnalysisResult;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      if (data.insights.length > 0) {
        setExpandedInsights(new Set([data.insights[0].id]));
      }
    }
  });

  const handleAnalyze = () => {
    if (selectedDocIds.length === 0) return;
    analysisMutation.mutate(selectedDocIds);
  };

  const toggleInsight = (id: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedInsights(newExpanded);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-green-600";
    if (confidence >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <RegTechLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-amber-600" />
            Obligation Analysis
          </h1>
          <p className="text-slate-600 mt-1">
            Analyze regulatory documents to understand your compliance obligations
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Select Documents to Analyze
            </CardTitle>
            <CardDescription>
              Choose one or more regulatory documents from your library
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DocumentSelector
              mode="multi"
              selectedIds={selectedDocIds}
              onSelectionChange={setSelectedDocIds}
              placeholder="Search and select regulatory documents..."
              filterStatus="active"
            />

            {selectedDocs.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="font-medium truncate max-w-[200px]">{doc.originalFilename || doc.title}</span>
                    <Badge variant="outline" className="text-xs">{doc.jurisdiction}</Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-slate-500">
                {selectedDocIds.length === 0 
                  ? "Select at least one document to analyze"
                  : `${selectedDocIds.length} document${selectedDocIds.length !== 1 ? 's' : ''} selected`}
              </p>
              <Button
                onClick={handleAnalyze}
                disabled={selectedDocIds.length === 0 || analysisMutation.isPending}
                className="gap-2"
              >
                {analysisMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    What are my obligations?
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {analysisMutation.isPending && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-amber-600 mb-4" />
              <h3 className="text-lg font-semibold text-amber-900">Analyzing Documents</h3>
              <p className="text-amber-700 mt-2">
                RegIntel AI Engine is reviewing your documents and generating compliance insights...
              </p>
              <div className="flex justify-center gap-4 mt-4 text-sm text-amber-600">
                <span className="flex items-center gap-1">
                  <FileCheck className="h-4 w-4" /> Extracting obligations
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4" /> Generating insights
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> Mapping to roles
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {analysisResult && !analysisMutation.isPending && (
          <>
            <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <CardContent className="py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-emerald-600 uppercase">Jurisdiction</p>
                      <p className="font-semibold text-slate-900">{analysisResult.jurisdiction}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{analysisResult.jurisdictionDetails}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-emerald-600 uppercase">Entity Context</p>
                      <p className="font-semibold text-slate-900 line-clamp-2">{analysisResult.entityContext}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-emerald-600 uppercase">Documents Analyzed</p>
                      <p className="font-semibold text-slate-900">{selectedDocs.length}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{analysisResult.insights.length} obligations found</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Percent className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-emerald-600 uppercase">Overall Confidence</p>
                      <p className={`font-semibold text-lg ${getConfidenceColor(analysisResult.overallConfidence)}`}>
                        {analysisResult.overallConfidence}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="obligations" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="obligations" className="gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    Obligations ({analysisResult.insights.length})
                  </TabsTrigger>
                  <TabsTrigger value="updates" className="gap-2">
                    <Newspaper className="h-4 w-4" />
                    Regulatory Updates ({analysisResult.regulatoryUpdates.length})
                  </TabsTrigger>
                </TabsList>

                <ShareResults
                  filename={`Obligations_Analysis_${new Date().toISOString().split('T')[0]}`}
                  generateDocxContent={() => {
                    const sections: DocxContentSection[] = [
                      { type: 'heading', text: 'Obligation Analysis Report' },
                      { type: 'metadata', text: `Generated: ${getFormattedDateTimeForDisplay()}` },
                      { type: 'metadata', text: `Jurisdiction: ${analysisResult.jurisdiction}` },
                      { type: 'metadata', text: `Entity Context: ${analysisResult.entityContext}` },
                      { type: 'metadata', text: `Documents Summary: ${analysisResult.documentsSummary}` },
                      { type: 'metadata', text: `Overall Confidence: ${analysisResult.overallConfidence}%` },
                      { type: 'divider' },
                      { type: 'heading', text: 'Compliance Obligations' }
                    ];
                    analysisResult.insights.forEach((ins, idx) => {
                      sections.push({ type: 'subheading', text: `${idx + 1}. [${ins.category}] ${ins.requirement}` });
                      sections.push({ type: 'paragraph', text: `Applicable To: ${ins.applicableTo}` });
                      sections.push({ type: 'paragraph', text: `Conditional Framing: ${ins.conditionalFraming}` });
                      if (ins.deadline) sections.push({ type: 'paragraph', text: `Deadline: ${ins.deadline}` });
                      if (ins.formatRequired) sections.push({ type: 'paragraph', text: `Format Required: ${ins.formatRequired}` });
                      if (ins.penalty) sections.push({ type: 'paragraph', text: `Penalty: ${ins.penalty}` });
                      sections.push({ type: 'paragraph', text: `--- Transparency ---` });
                      sections.push({ type: 'paragraph', text: `Explainable (C-Level Summary): ${ins.transparency.explainable}` });
                      sections.push({ type: 'paragraph', text: `Traceable - Source: ${ins.transparency.traceable.documentRef}` });
                      if (ins.transparency.traceable.section) {
                        sections.push({ type: 'paragraph', text: `Traceable - Section: ${ins.transparency.traceable.section}` });
                      }
                      sections.push({ type: 'paragraph', text: `Traceable - Deduction Path: ${ins.transparency.traceable.deductionPath}` });
                      sections.push({ type: 'paragraph', text: `Verifiable - Confidence: ${ins.transparency.verifiable.confidence}%` });
                      sections.push({ type: 'list', items: ins.transparency.verifiable.factors.map(f => `Factor: ${f}`) });
                      sections.push({ type: 'paragraph', text: `--- Role-Based Actions ---` });
                      ins.roleActions.forEach(ra => {
                        sections.push({ type: 'paragraph', text: `${ra.roleLabel} (Priority: ${ra.priority.toUpperCase()})` });
                        sections.push({ type: 'list', items: ra.actions });
                      });
                      sections.push({ type: 'divider' });
                    });
                    if (analysisResult.regulatoryUpdates.length > 0) {
                      sections.push({ type: 'heading', text: 'Regulatory Updates (Web Search Results)' });
                      sections.push({ type: 'paragraph', text: 'Note: These updates are retrieved via web search. Always verify with official regulatory sources before taking compliance action.' });
                      analysisResult.regulatoryUpdates.forEach((upd, idx) => {
                        sections.push({ type: 'subheading', text: `${idx + 1}. ${upd.title}` });
                        sections.push({ type: 'metadata', text: `Source: ${upd.source} | Date: ${upd.date}` });
                        sections.push({ type: 'paragraph', text: upd.summary });
                        sections.push({ type: 'paragraph', text: `Relevance: ${upd.relevance}` });
                        if (upd.url) sections.push({ type: 'paragraph', text: `Source URL: ${upd.url}` });
                        sections.push({ type: 'divider' });
                      });
                    }
                    return sections;
                  }}
                />
              </div>

              <TabsContent value="obligations" className="space-y-4">
                {analysisResult.insights.map((insight) => (
                  <Card key={insight.id} className={`overflow-hidden ${PRIORITY_STYLES[insight.roleActions[0]?.priority || 'medium']}`}>
                    <Collapsible open={expandedInsights.has(insight.id)} onOpenChange={() => toggleInsight(insight.id)}>
                      <CollapsibleTrigger className="w-full">
                        <div className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 text-left">
                              {expandedInsights.has(insight.id) ? (
                                <ChevronDown className="h-5 w-5 mt-0.5 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-5 w-5 mt-0.5 text-slate-400" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge className={CATEGORY_COLORS[insight.category] || CATEGORY_COLORS.Default}>
                                    {insight.category}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {insight.applicableTo}
                                  </Badge>
                                  <span className={`text-xs font-medium ${getConfidenceColor(insight.transparency.verifiable.confidence)}`}>
                                    {insight.transparency.verifiable.confidence}% confidence
                                  </span>
                                </div>
                                <p className="text-slate-900 font-medium">{insight.requirement}</p>
                                <p className="text-sm text-slate-600 mt-1 italic">{insight.conditionalFraming}</p>
                              </div>
                            </div>
                            {insight.deadline && (
                              <div className="flex items-center gap-1 text-sm text-orange-600 whitespace-nowrap ml-4">
                                <Clock className="h-4 w-4" />
                                {insight.deadline}
                              </div>
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="border-t bg-slate-50 p-4 space-y-6">
                          {insight.roleActions.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Role-Based Actions
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {insight.roleActions.map((ra, idx) => (
                                  <div key={idx} className="bg-white rounded-lg border p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-sm text-slate-900">{ra.roleLabel}</span>
                                      <Badge variant={ra.priority === 'high' ? 'destructive' : ra.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                                        {ra.priority} priority
                                      </Badge>
                                    </div>
                                    <ul className="space-y-1">
                                      {ra.actions.map((action, aIdx) => (
                                        <li key={aIdx} className="text-sm text-slate-600 flex items-start gap-2">
                                          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500 flex-shrink-0" />
                                          {action}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(insight.formatRequired || insight.penalty) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {insight.formatRequired && (
                                <div className="bg-white rounded-lg border p-3">
                                  <h5 className="text-xs font-medium text-slate-500 uppercase mb-1">Required Format</h5>
                                  <p className="text-sm text-slate-700">{insight.formatRequired}</p>
                                </div>
                              )}
                              {insight.penalty && (
                                <div className="bg-red-50 rounded-lg border border-red-200 p-3">
                                  <h5 className="text-xs font-medium text-red-600 uppercase mb-1 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Penalty for Non-Compliance
                                  </h5>
                                  <p className="text-sm text-red-700">{insight.penalty}</p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="bg-slate-100 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              RegIntel Intelligence Transparency
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-white rounded-lg p-3 border">
                                <h5 className="text-xs font-medium text-blue-600 uppercase mb-2 flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Explainable
                                </h5>
                                <p className="text-sm text-slate-700">{insight.transparency.explainable}</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 border">
                                <h5 className="text-xs font-medium text-purple-600 uppercase mb-2 flex items-center gap-1">
                                  <LinkIcon className="h-3 w-3" />
                                  Traceable
                                </h5>
                                <p className="text-xs text-slate-600 mb-1">
                                  <strong>Source:</strong> {insight.transparency.traceable.documentRef}
                                </p>
                                {insight.transparency.traceable.section && (
                                  <p className="text-xs text-slate-600 mb-1">
                                    <strong>Section:</strong> {insight.transparency.traceable.section}
                                  </p>
                                )}
                                <p className="text-xs text-slate-600">
                                  <strong>Deduction:</strong> {insight.transparency.traceable.deductionPath}
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-3 border">
                                <h5 className="text-xs font-medium text-emerald-600 uppercase mb-2 flex items-center gap-1">
                                  <Percent className="h-3 w-3" />
                                  Verifiable
                                </h5>
                                <p className={`text-lg font-bold ${getConfidenceColor(insight.transparency.verifiable.confidence)}`}>
                                  {insight.transparency.verifiable.confidence}%
                                </p>
                                <ul className="mt-1 space-y-0.5">
                                  {insight.transparency.verifiable.factors.map((f, idx) => (
                                    <li key={idx} className="text-xs text-slate-600">• {f}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="updates" className="space-y-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <Info className="h-4 w-4 flex-shrink-0" />
                      <p>
                        These regulatory updates are retrieved via web search. Click "View Source" to access the original source. 
                        Always verify information with official regulatory sources before taking compliance action.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                {analysisResult.regulatoryUpdates.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Newspaper className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                      <p className="text-slate-600">No recent regulatory updates found for this jurisdiction.</p>
                    </CardContent>
                  </Card>
                ) : (
                  analysisResult.regulatoryUpdates.map((update, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900">{update.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Globe className="h-3.5 w-3.5" />
                                {update.source}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {update.date}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 mt-2">{update.summary}</p>
                            <p className="text-xs text-emerald-600 mt-2 font-medium">
                              Relevance: {update.relevance}
                            </p>
                          </div>
                          {update.url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={update.url} target="_blank" rel="noopener noreferrer" className="gap-1">
                                <LinkIcon className="h-3.5 w-3.5" />
                                View Source
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        {!analysisResult && !analysisMutation.isPending && selectedDocIds.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">Start Your Obligation Analysis</h3>
              <p className="text-slate-600 mt-2 max-w-md mx-auto">
                Select regulatory documents from your library to discover your organization's compliance obligations, 
                with role-based actions and deadline tracking.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </RegTechLayout>
  );
}
