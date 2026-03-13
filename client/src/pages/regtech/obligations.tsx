import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Loader2, 
  Search, 
  ChevronDown,
  ChevronRight,
  Scale,
  Building2,
  Filter,
  AlertTriangle,
  Clock,
  ExternalLink
} from "lucide-react";
import RegTechLayout from "./layout";
import { ShareResults, DocxContentSection, getFormattedDateTimeForDisplay } from "@/components/regtech/ShareResults";

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

const AREA_LABELS: Record<string, string> = {
  KYC: "Know Your Customer",
  Sanctions: "Sanctions Screening",
  Reporting: "Reporting Requirements",
  RecordKeeping: "Record Keeping",
  Training: "Training & Awareness",
  Others: "Other Requirements"
};

const AREA_COLORS: Record<string, string> = {
  KYC: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Sanctions: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Reporting: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  RecordKeeping: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Training: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Others: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
};

const ACTOR_LABELS: Record<string, string> = {
  Bank: "Banks",
  NBFC: "NBFCs",
  VASP: "Virtual Asset Service Providers",
  PSP: "Payment Service Providers",
  EMI: "E-Money Institutions",
  Brokerage: "Brokerages",
  Fintech: "Fintech Companies",
  All: "All Entities"
};

export default function ObligationExplorerPage() {
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [expandedObligation, setExpandedObligation] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    area: "all",
    actor: "all",
    search: ""
  });

  const { data: documentsData, isLoading: loadingDocuments } = useQuery<DocumentWithObligations[]>({
    queryKey: ['/api/regtech/documents-with-obligations'],
    queryFn: async () => {
      const response = await fetch('/api/regtech/documents-with-obligations', {
        credentials: 'include'
      });
      return response.json();
    }
  });

  const documents = documentsData || [];

  const { data: obligationsData, isLoading: loadingObligations } = useQuery<{items: Obligation[], total: number, document: any}>({
    queryKey: ['/api/regtech/documents', selectedDocument, 'obligations', filters.area, filters.actor],
    enabled: !!selectedDocument,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.area !== 'all') params.append('area', filters.area);
      if (filters.actor !== 'all') params.append('actor', filters.actor);
      params.append('limit', '100');
      
      const response = await fetch(`/api/regtech/documents/${selectedDocument}/obligations?${params}`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  const obligations = obligationsData?.items || [];
  const totalObligations = obligationsData?.total || 0;
  const selectedDocInfo = obligationsData?.document;

  const selectedDoc = documents.find(d => d.id.toString() === selectedDocument);

  const filteredObligations = obligations.filter(obl => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return obl.requirement.toLowerCase().includes(searchLower);
    }
    return true;
  });

  return (
    <RegTechLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Scale className="h-6 w-6" />
              Obligation Explorer
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Browse regulatory obligations extracted from your uploaded documents
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Document</CardTitle>
            <CardDescription>
              Choose a processed document to view its extracted obligations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
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
                <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                  <SelectTrigger className="w-full max-w-lg">
                    <SelectValue placeholder="Select a document..." />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map(doc => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="truncate max-w-xs">{doc.title}</span>
                          <Badge variant="outline" className="text-xs ml-2">
                            {doc.jurisdiction}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {doc.obligationCount} obligations
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedDoc && (
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {selectedDoc.regulator}
                </span>
                <Badge variant="default">
                  {selectedDoc.status}
                </Badge>
                <span>{totalObligations} obligations extracted</span>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedDocument && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search obligations..."
                      value={filters.search}
                      onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                      className="w-64"
                    />
                  </div>
                  
                  <Select value={filters.area} onValueChange={v => setFilters(f => ({ ...f, area: v }))}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Obligation Area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {Object.entries(AREA_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.actor} onValueChange={v => setFilters(f => ({ ...f, actor: v }))}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Entity Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Entities</SelectItem>
                      {Object.entries(ACTOR_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="ml-auto">
                    <ShareResults
                      filename={`Obligations_${selectedDoc?.title?.replace(/\s+/g, '_').substring(0, 30) || 'Export'}`}
                      generateDocxContent={() => {
                        const sections: DocxContentSection[] = [
                          { type: 'heading', text: `Obligations Report: ${selectedDoc?.title || 'Unknown'}` },
                          { type: 'metadata', text: `Generated: ${getFormattedDateTimeForDisplay()}` },
                          { type: 'metadata', text: `Total Obligations: ${filteredObligations.length}` },
                          { type: 'divider' }
                        ];
                        filteredObligations.forEach((obl, idx) => {
                          sections.push({ type: 'subheading', text: `${idx + 1}. ${AREA_LABELS[obl.area] || obl.area}` });
                          sections.push({ type: 'paragraph', text: `Entity: ${ACTOR_LABELS[obl.actor || 'All'] || obl.actor || 'All'}` });
                          sections.push({ type: 'paragraph', text: `Requirement: ${obl.requirement}` });
                          if (obl.deadline) sections.push({ type: 'paragraph', text: `Deadline: ${new Date(obl.deadline).toLocaleDateString()}` });
                          if (obl.penalty) sections.push({ type: 'paragraph', text: `Penalty: ${obl.penalty}` });
                          if (obl.citationRef?.section) sections.push({ type: 'paragraph', text: `Citation: ${obl.citationRef.section}` });
                          sections.push({ type: 'divider' });
                        });
                        return sections;
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {loadingObligations ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </CardContent>
                </Card>
              ) : filteredObligations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Scale className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {obligations.length === 0 
                        ? "No obligations have been extracted from this document yet."
                        : "No obligations match your filters."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredObligations.map(obl => (
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
                              <Badge className={AREA_COLORS[obl.area] || AREA_COLORS.Others}>
                                {AREA_LABELS[obl.area] || obl.area}
                              </Badge>
                              {obl.actor && (
                                <Badge variant="outline">
                                  {ACTOR_LABELS[obl.actor] || obl.actor}
                                </Badge>
                              )}
                              {obl.citationRef?.section && (
                                <span className="text-xs text-gray-500">
                                  {obl.citationRef.section}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-900 dark:text-white">
                              {obl.requirement}
                            </p>
                          </div>
                        </div>
                        {obl.deadline && (
                          <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
                            <Clock className="h-4 w-4" />
                            {new Date(obl.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {expandedObligation === obl.id && (
                      <div className="border-t bg-gray-50 dark:bg-gray-800/30 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {obl.deadline && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase">Deadline</span>
                              <p className="flex items-center gap-1 mt-1">
                                <Clock className="h-4 w-4" />
                                {new Date(obl.deadline).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          
                          {obl.penalty && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase">Penalty</span>
                              <p className="flex items-center gap-1 mt-1 text-red-600 dark:text-red-400">
                                <AlertTriangle className="h-4 w-4" />
                                {obl.penalty}
                              </p>
                            </div>
                          )}

                          {obl.citationRef?.section && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase">Citation Reference</span>
                              <p className="mt-1 flex items-center gap-1">
                                <ExternalLink className="h-4 w-4" />
                                {obl.citationRef.section}
                              </p>
                            </div>
                          )}

                          {obl.impactScore && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase">Impact Score</span>
                              <p className="mt-1">{obl.impactScore}/10</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                          Extracted on {new Date(obl.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </>
        )}

        {!selectedDocument && documents.length > 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Select a document above to view its extracted obligations
              </p>
              <p className="text-sm text-gray-500">
                {documents.length} document{documents.length !== 1 ? 's' : ''} available with {documents.reduce((sum, d) => sum + Number(d.obligationCount), 0)} total obligations
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </RegTechLayout>
  );
}
