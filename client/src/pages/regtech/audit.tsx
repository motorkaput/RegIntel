import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Clock,
  Cpu,
  FileText,
  ChevronDown,
  ChevronRight,
  Zap,
  Info
} from "lucide-react";
import RegTechLayout from "./layout";

interface DocumentWithObligations {
  id: number;
  title: string;
  jurisdiction: string;
  regulator: string;
  status: string;
  obligationCount: number;
}

interface AuditLog {
  id: string;
  eventType: string;
  model: string;
  modelVersion: string | null;
  promptTemplateHash: string;
  inputHash: string;
  outputHash: string;
  inputJson: any;
  outputJson: any;
  regulationId: string | null;
  legalUnitId: string | null;
  obligationId: string | null;
  processingTimeMs: number | null;
  tokensUsed: number | null;
  success: boolean;
  createdAt: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  extract_obligations: "Obligation Extraction",
  classify_obligation: "Obligation Classification",
  suggest_mapping: "Mapping Suggestion",
  compare_versions: "Version Comparison",
  segment_document: "Document Segmentation",
  document_ocr: "Document OCR",
  metadata_extraction: "Metadata Extraction"
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  extract_obligations: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  classify_obligation: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  suggest_mapping: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  compare_versions: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  segment_document: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  document_ocr: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  metadata_extraction: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
};

const AI_ENGINE_LABEL = "RegIntel AI Engine";

export default function AuditTrailPage() {
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [filterEventType, setFilterEventType] = useState<string>("all");

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

  const { data: auditLogs = [], isLoading: loadingLogs } = useQuery<AuditLog[]>({
    queryKey: ['/api/regtech/audit-logs', selectedDocument],
    enabled: !!selectedDocument,
    queryFn: async () => {
      const response = await fetch(`/api/regtech/documents/${selectedDocument}/audit`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  const filteredLogs = auditLogs.filter(log => {
    if (filterEventType !== "all" && log.eventType !== filterEventType) return false;
    return true;
  });

  const stats = {
    totalCalls: auditLogs.length,
    successRate: auditLogs.length > 0 
      ? Math.round((auditLogs.filter(l => l.success).length / auditLogs.length) * 100) 
      : 0,
    avgProcessingTime: auditLogs.length > 0
      ? Math.round(auditLogs.reduce((sum, l) => sum + (l.processingTimeMs || 0), 0) / auditLogs.length)
      : 0,
    totalTokens: auditLogs.reduce((sum, l) => sum + (l.tokensUsed || 0), 0)
  };

  const formatTime = (ms: number | null) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const selectedDoc = documents.find(d => d.id.toString() === selectedDocument);

  return (
    <RegTechLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Activity className="h-7 w-7 text-indigo-500" />
              AI Audit Trail
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track all AI decisions and processing for compliance auditing
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Document</CardTitle>
            <CardDescription>
              Choose a processed document to view its AI processing audit trail
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDocuments ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <div className="text-gray-500">
                No processed documents found. Upload regulatory documents first.
              </div>
            ) : (
              <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                <SelectTrigger className="w-full max-w-lg">
                  <SelectValue placeholder="Choose a document to view audit logs" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map(doc => (
                    <SelectItem key={doc.id} value={doc.id.toString()}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="truncate max-w-xs">{doc.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {doc.jurisdiction}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {selectedDocument && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total AI Calls</p>
                      <p className="text-2xl font-bold">{stats.totalCalls}</p>
                    </div>
                    <Cpu className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Success Rate</p>
                      <p className="text-2xl font-bold">{stats.successRate}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Avg Processing</p>
                      <p className="text-2xl font-bold">{formatTime(stats.avgProcessingTime)}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Tokens Used</p>
                      <p className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</p>
                    </div>
                    <Zap className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Audit Logs for {selectedDoc?.title}</CardTitle>
                <Select value={filterEventType} onValueChange={setFilterEventType}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Event Types</SelectItem>
                    {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Info className="h-12 w-12 mx-auto text-blue-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      No detailed audit logs available for this document yet.
                    </p>
                    <p className="text-sm text-gray-500">
                      AI processing logs are recorded when documents go through the advanced analysis pipeline.
                      The obligations you see were extracted during initial upload processing.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLogs.map(log => (
                      <div key={log.id} className="border rounded-lg overflow-hidden">
                        <div 
                          className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center justify-between"
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        >
                          <div className="flex items-center gap-3">
                            {expandedLog === log.id ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                            <Badge className={EVENT_TYPE_COLORS[log.eventType] || "bg-gray-100"}>
                              {EVENT_TYPE_LABELS[log.eventType] || log.eventType}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Cpu className="h-4 w-4 text-indigo-500" />
                              <span className="text-sm font-medium">{AI_ENGINE_LABEL}</span>
                            </div>
                            <span className="text-sm text-gray-500">{formatDate(log.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {log.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm text-gray-500">{formatTime(log.processingTimeMs)}</span>
                            {log.tokensUsed && (
                              <span className="text-xs text-gray-400">{log.tokensUsed} tokens</span>
                            )}
                          </div>
                        </div>

                        {expandedLog === log.id && (
                          <div className="border-t bg-gray-50 dark:bg-gray-800/30 p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-500">Input Hash:</span>
                                <p className="font-mono text-xs mt-1 truncate">{log.inputHash}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">Output Hash:</span>
                                <p className="font-mono text-xs mt-1 truncate">{log.outputHash}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">Prompt Template:</span>
                                <p className="font-mono text-xs mt-1 truncate">{log.promptTemplateHash}</p>
                              </div>
                              {log.modelVersion && (
                                <div>
                                  <span className="font-medium text-gray-500">Model Version:</span>
                                  <p className="font-mono text-xs mt-1">{log.modelVersion}</p>
                                </div>
                              )}
                            </div>

                            {log.inputJson && (
                              <div className="mt-4">
                                <span className="font-medium text-gray-500 text-sm">Input:</span>
                                <pre className="mt-1 p-2 bg-gray-900 text-gray-100 rounded text-xs overflow-auto max-h-40">
                                  {JSON.stringify(log.inputJson, null, 2)}
                                </pre>
                              </div>
                            )}

                            {log.outputJson && (
                              <div className="mt-4">
                                <span className="font-medium text-gray-500 text-sm">Output:</span>
                                <pre className="mt-1 p-2 bg-gray-900 text-gray-100 rounded text-xs overflow-auto max-h-40">
                                  {JSON.stringify(log.outputJson, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedDocument && documents.length > 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Select a document above to view its AI processing audit trail
              </p>
              <p className="text-sm text-gray-500">
                {documents.length} document{documents.length !== 1 ? 's' : ''} available
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </RegTechLayout>
  );
}
