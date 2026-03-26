import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Send, Loader2, FileText, Building2, Trash2, User, Bot } from "lucide-react";
import RegTechLayout from "./layout";
import { apiRequest } from "@/lib/queryClient";
import { ShareResults, getFormattedDateTimeForDisplay, DocxContentSection, FormattedAnswer } from "@/components/regtech/ShareResults";
import { DocumentSelector } from "@/components/regtech/DocumentSelector";
import { useSession } from "@/contexts/SessionContext";

interface SessionEntry {
  id: string;
  question: string;
  answer: string;
  sources: any[];
  obligations: any[];
  timestamp: Date;
}

export default function QueryPage() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    jurisdiction: 'all',
    regulator: 'all',
  });
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [includeOrganization, setIncludeOrganization] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>([]);
  const [pendingQuery, setPendingQuery] = useState('');
  const sessionEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docIdParam = params.get('docId');
    if (docIdParam) {
      setSelectedDocIds([parseInt(docIdParam)]);
    }
  }, []);

  useEffect(() => {
    if (sessionHistory.length > 0) {
      sessionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessionHistory]);

  const { data } = useQuery<{ documents: any[] }>({
    queryKey: ['/api/regtech/documents'],
  });

  const { data: userData } = useQuery<{ user: any }>({
    queryKey: ['/api/auth/me'],
  });
  
  const documents = data?.documents || [];
  const hasOrganization = userData?.user?.organizationId;
  const { addActivity, hasActiveSession } = useSession();

  // Get unique jurisdictions from documents
  const uniqueJurisdictions = Array.from(new Set(documents.map(doc => doc.jurisdiction).filter(Boolean))).sort();
  
  // Get unique regulators, filtered by selected jurisdiction if one is selected
  const uniqueRegulators = Array.from(new Set(
    documents
      .filter(doc => filters.jurisdiction === 'all' || doc.jurisdiction === filters.jurisdiction)
      .map(doc => doc.regulator)
      .filter(Boolean)
  )).sort();

  // Clear document selections when filters change
  useEffect(() => {
    setSelectedDocIds([]);
  }, [filters.jurisdiction, filters.regulator]);

  const queryMutation = useMutation({
    mutationFn: async (data: { query: string; jurisdiction?: string; regulator?: string; docIds?: number[]; includeOrganization?: boolean }) => {
      const response = await apiRequest('/api/regtech/query', 'POST', data);
      return response.json();
    },
    onSuccess: async (data, variables) => {
      const newEntry: SessionEntry = {
        id: Date.now().toString(),
        question: variables.query,
        answer: data.answer,
        sources: data.sources || [],
        obligations: data.obligations || [],
        timestamp: new Date(),
      };
      setSessionHistory(prev => [...prev, newEntry]);
      setQuery('');
      setPendingQuery('');
      
      if (hasActiveSession) {
        try {
          await addActivity('query', {
            question: variables.query,
            answer: data.answer,
            sources: data.sources || [],
            obligations: data.obligations || [],
          });
        } catch (e) {
          console.warn('Failed to log session activity:', e);
        }
      }
    },
    onError: () => {
      setPendingQuery('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setPendingQuery(query);
    queryMutation.mutate({
      query,
      jurisdiction: filters.jurisdiction && filters.jurisdiction !== 'all' ? filters.jurisdiction : undefined,
      regulator: filters.regulator && filters.regulator !== 'all' ? filters.regulator : undefined,
      docIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
      includeOrganization: selectedDocIds.length === 0 && hasOrganization ? includeOrganization : undefined,
    });
  };

  const clearSession = () => {
    setSessionHistory([]);
  };

  const generateDocxContent = (): DocxContentSection[] => {
    if (!sessionHistory || sessionHistory.length === 0) {
      return [];
    }
    
    const sections: DocxContentSection[] = [];
    
    sections.push({ type: 'heading', text: 'Query Session Report' });
    sections.push({ type: 'metadata', text: `${sessionHistory.length} question${sessionHistory.length !== 1 ? 's' : ''} in this session` });
    sections.push({ type: 'divider' });

    sessionHistory.forEach((entry, entryIdx) => {
      sections.push({ type: 'subheading', text: `Question ${entryIdx + 1}` });
      sections.push({ type: 'paragraph', text: entry.question });
      
      sections.push({ type: 'subheading', text: 'Answer' });
      sections.push({ type: 'paragraph', text: entry.answer });

      if (entry.sources && entry.sources.length > 0) {
        sections.push({ type: 'subheading', text: 'Sources' });
        const sourceItems = entry.sources.map((source: any) => {
          let text = `${source.originalFilename || source.title} (${source.regulator})`;
          if (source.sectionRef) text += ` - Section: ${source.sectionRef}`;
          if (source.text) text += ` - "${source.text.substring(0, 100)}..."`;
          return text;
        });
        sections.push({ type: 'list', items: sourceItems });
      }

      const validObligations = entry.obligations?.filter((o: any) => o.requirement || o.area) || [];
      if (validObligations.length > 0) {
        sections.push({ type: 'subheading', text: 'Related Obligations' });
        const oblItems = validObligations.map((obl: any) => {
          let text = `[${obl.area || 'General'}] ${obl.requirement || 'See document for details'}`;
          if (obl.deadline) text += ` (Deadline: ${obl.deadline})`;
          return text;
        });
        sections.push({ type: 'list', items: oblItems });
      }

      if (entryIdx < sessionHistory.length - 1) {
        sections.push({ type: 'divider' });
      }
    });

    return sections;
  };

  return (
    <RegTechLayout>
      <div className="space-y-6 page-enter">
        {/* Page Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900" data-testid="text-page-title">Query AI Assistant</h1>
              <p className="text-slate-600 mt-1 text-sm">
                Ask questions about regulatory requirements and get answers with citations
              </p>
            </div>
            {sessionHistory.length > 0 && (
              <div className="flex items-center gap-2">
                <ShareResults
                  filename={`query-session-${Date.now()}`}
                  generateDocxContent={generateDocxContent}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSession}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear Session
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Session History */}
        {sessionHistory.length > 0 && (
          <div className="space-y-4">
            {sessionHistory.map((entry, idx) => (
              <div key={entry.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Question */}
                <div className="bg-slate-50 p-4 border-b border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Question {idx + 1}</p>
                      <p className="text-slate-900">{entry.question}</p>
                    </div>
                  </div>
                </div>
                
                {/* Answer */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">AI Response</p>
                      <div className="prose prose-sm max-w-none text-slate-700" data-testid={`text-answer-${idx}`}>
                        <FormattedAnswer text={entry.answer} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 italic">RegIntel can make mistakes. Please verify all important information before taking decisions.</p>

                      {entry.sources && entry.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Sources</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {entry.sources.map((source: any, srcIdx: number) => (
                              <div
                                key={srcIdx}
                                className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="h-3 w-3 text-slate-400" />
                                  <span className="font-medium text-slate-900 text-xs">{source.originalFilename || source.title}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] mb-1">
                                  {source.regulator}
                                </Badge>
                                <p className="text-xs text-slate-600 line-clamp-2">{source.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {entry.obligations && entry.obligations.filter((o: any) => o.requirement || o.area).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Related Obligations</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {entry.obligations.filter((o: any) => o.requirement || o.area).map((obl: any, oblIdx: number) => (
                              <div key={oblIdx} className="bg-orange-50 rounded-lg p-3 border border-orange-100" data-testid={`obligation-${idx}-${oblIdx}`}>
                                <div className="flex items-start justify-between mb-1">
                                  <Badge className="bg-orange-600 text-[10px]">{obl.area || 'General'}</Badge>
                                  {obl.deadline && (
                                    <span className="text-[10px] text-slate-500">{obl.deadline}</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-700">{obl.requirement || 'See document for details'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={sessionEndRef} />
          </div>
        )}

        {/* Query Form - Full width section */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">
                {sessionHistory.length > 0 ? 'Ask a Follow-up Question' : 'Ask a Question'}
              </h2>
              <p className="text-sm text-slate-500">AI-powered search with citations from your regulatory documents</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="e.g., What are the customer due diligence requirements for high-risk customers?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              className="rounded-xl border-slate-200"
              data-testid="input-query"
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                value={filters.jurisdiction}
                onValueChange={(value) => setFilters({ ...filters, jurisdiction: value, regulator: 'all' })}
              >
                <SelectTrigger data-testid="select-jurisdiction">
                  <SelectValue placeholder="All Jurisdictions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jurisdictions</SelectItem>
                  {uniqueJurisdictions.map(jurisdiction => (
                    <SelectItem key={jurisdiction} value={jurisdiction}>{jurisdiction}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.regulator}
                onValueChange={(value) => setFilters({ ...filters, regulator: value })}
              >
                <SelectTrigger data-testid="select-regulator">
                  <SelectValue placeholder="All Regulators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regulators</SelectItem>
                  {uniqueRegulators.map(regulator => (
                    <SelectItem key={regulator} value={regulator}>{regulator}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DocumentSelector
                mode="multi"
                selectedIds={selectedDocIds}
                onSelectionChange={setSelectedDocIds}
                placeholder="All Documents"
                className="min-w-[200px]"
                filterJurisdiction={filters.jurisdiction}
                filterRegulator={filters.regulator}
              />

              <Button
                type="submit"
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
                disabled={queryMutation.isPending || !query.trim()}
                data-testid="button-submit"
              >
                {queryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Ask Question
                  </>
                )}
              </Button>
            </div>

            {selectedDocIds.length === 0 && hasOrganization && (
              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeOrganization"
                    checked={includeOrganization}
                    onCheckedChange={(checked) => setIncludeOrganization(checked === true)}
                    data-testid="checkbox-include-organization"
                  />
                  <label
                    htmlFor="includeOrganization"
                    className="text-sm text-slate-600 cursor-pointer flex items-center gap-1"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Include organization documents
                  </label>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Empty state */}
        {sessionHistory.length === 0 && !queryMutation.isPending && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Ask your first question</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Upload regulatory documents to the Library, then ask questions here to get AI-powered answers with citations.
            </p>
          </div>
        )}

        {/* Loading state */}
        {queryMutation.isPending && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">Your Question</p>
                <p className="text-slate-900">{pendingQuery}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing documents...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </RegTechLayout>
  );
}
