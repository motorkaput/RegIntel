import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Globe, FileText, Download, ArrowRight, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/loading-skeleton";
import RegTechLayout from "./layout";
import { ShareResults, getFormattedDateTimeForDisplay, DocxContentSection } from "@/components/regtech/ShareResults";
import { useSession } from "@/contexts/SessionContext";

export default function ConsolePage() {
  const [url, setUrl] = useState('');
  const [analyses, setAnalyses] = useState<any[]>([]);
  const { addActivity, hasActiveSession } = useSession();

  const analyzeMutation = useMutation({
    mutationFn: async (urlToAnalyze: string) => {
      const response = await fetch('/api/regtech/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToAnalyze }),
        credentials: 'include',
      });
      
      let data;
      try {
        data = await response.json();
      } catch {
        if (!response.ok) {
          throw new Error(`Server error (${response.status}). Please try again.`);
        }
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to analyze URL (${response.status})`);
      }
      return data;
    },
    onSuccess: async (data) => {
      // Add new analysis to beginning of list (most recent first)
      setAnalyses(prev => [{ ...data, id: Date.now() }, ...prev]);
      setUrl('');
      
      if (hasActiveSession) {
        try {
          await addActivity('console_analysis', {
            url: data.url,
            title: data.title,
            summary: data.summary,
            keyPoints: data.keyPoints,
            regulatoryImpact: data.regulatoryImpact,
          });
        } catch (e) {
          console.warn('Failed to log session activity:', e);
        }
      }
    },
  });

  const handleAnalyze = () => {
    if (!url.trim()) return;
    analyzeMutation.mutate(url);
  };

  // Get the most recent analysis for export functions (backwards compatibility)
  const analysis = analyses.length > 0 ? analyses[0] : null;

  const generateDocxContent = (): DocxContentSection[] => {
    if (!analysis) {
      return [];
    }
    
    const sections: DocxContentSection[] = [];
    
    sections.push({ type: 'heading', text: 'Regulatory Website Analysis' });
    sections.push({ type: 'metadata', text: `URL: ${analysis.url}` });
    sections.push({ type: 'divider' });

    if (analysis.title) {
      sections.push({ type: 'subheading', text: 'Page Title' });
      sections.push({ type: 'paragraph', text: analysis.title });
    }

    if (analysis.summary) {
      sections.push({ type: 'subheading', text: 'Summary' });
      sections.push({ type: 'paragraph', text: analysis.summary });
    }

    if (analysis.keyPoints && analysis.keyPoints.length > 0) {
      sections.push({ type: 'subheading', text: 'Key Points' });
      sections.push({ type: 'list', items: analysis.keyPoints });
    }

    if (analysis.regulatoryImpact) {
      sections.push({ type: 'subheading', text: 'Regulatory Impact' });
      sections.push({ type: 'paragraph', text: analysis.regulatoryImpact });
    }

    return sections;
  };

  return (
    <RegTechLayout>
      <div className="space-y-6 page-enter">
        {/* Page Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h1 className="text-2xl font-semibold text-slate-900" data-testid="text-page-title">Regulatory Console</h1>
          <p className="text-slate-600 mt-1 text-sm">
            Analyze regulatory content from FIU/FATF/AML regulator websites
          </p>
        </div>

        {/* URL Analysis Form - Full width section */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Globe className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Analyze Regulatory Web Page</h2>
              <p className="text-sm text-slate-500">Paste a URL to extract and analyze content. AI reads regulatory pages and extracts key insights.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Input
              placeholder="https://www.fatf-gafi.org/example-page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              data-testid="input-url"
              className="flex-1 bg-slate-50 border-slate-200 rounded-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAnalyze();
                }
              }}
            />
            <Button
              disabled={!url.trim() || analyzeMutation.isPending}
              onClick={handleAnalyze}
              data-testid="button-analyze"
              className="rounded-xl bg-slate-900 hover:bg-slate-800 px-6"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing
                </>
              ) : (
                'Analyze'
              )}
            </Button>
          </div>
        </div>

        {/* Analysis Results - Full width */}
        <div className="space-y-4">
          {analyzeMutation.isError && (
            <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
              <p className="text-sm text-red-700" data-testid="text-error">
                {(analyzeMutation.error as any)?.message || 'Failed to analyze URL. Please check the URL and try again.'}
              </p>
            </div>
          )}

          {/* Empty state when no analyses */}
          {analyses.length === 0 && !analyzeMutation.isPending && !analyzeMutation.isError && (
            <EmptyState
              icon={Globe}
              title="No analyses yet"
              description="Paste a regulatory website URL above to analyze its content. The AI will extract key insights, identify regulatory impact, and summarize the page."
            />
          )}

          {/* Display all accumulated analyses */}
          {analyses.map((item, analysisIndex) => (
            <div key={item.id} className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-slate-900">
                    {analysisIndex === 0 ? 'Latest Analysis' : `Analysis ${analyses.length - analysisIndex}`}
                  </h2>
                  <p className="text-xs text-slate-500 break-all mt-1">{item.url}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {analysisIndex === 0 && (
                    <ShareResults
                      filename={`regulatory-analysis-${Date.now()}`}
                      generateDocxContent={generateDocxContent}
                    />
                  )}
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="rounded-lg" data-testid={`button-visit-source-${analysisIndex}`}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Source
                      </Button>
                    </a>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                {item.isPdf && (
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900">{item.title}</h3>
                        <p className="text-sm text-blue-700 mt-1">{item.summary}</p>
                        <div className="mt-4 bg-white rounded-lg p-4 border border-blue-100">
                          <h4 className="font-medium text-sm text-slate-700 mb-2">How to analyze this PDF:</h4>
                          <div className="space-y-2 text-sm text-slate-600">
                            {item.keyPoints?.split('\n').map((step: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2">
                                <ArrowRight className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <Button className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </Button>
                          </a>
                          <a href="/regtech/documents">
                            <Button variant="outline" className="rounded-lg">
                              Go to Library
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </a>
                        </div>
                        <p className="text-xs text-blue-600 mt-3">{item.impact}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!item.isPdf && item.relevanceWarning && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 text-lg">⚠</span>
                      <div>
                        <h3 className="font-medium text-sm text-amber-800">Content Relevance Notice</h3>
                        <p className="text-sm text-amber-700 mt-1">{item.relevanceWarning}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!item.isPdf && item.title && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-medium text-xs text-slate-500 uppercase tracking-wide mb-1">Page Title</h3>
                    <p className="text-sm text-slate-900">{item.title}</p>
                  </div>
                )}

                {!item.isPdf && item.summary && (
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <h3 className="font-medium text-xs text-emerald-700 uppercase tracking-wide mb-2">AI Summary</h3>
                    <div className="text-sm text-slate-700 space-y-2">
                      {item.summary.split('\n').map((line: string, i: number) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {!item.isPdf && item.keyPoints && item.keyPoints.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <h3 className="font-medium text-xs text-blue-700 uppercase tracking-wide mb-3">Key Points</h3>
                    <ul className="space-y-2">
                      {item.keyPoints.map((point: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="h-5 w-5 rounded-full bg-blue-200 flex items-center justify-center text-xs text-blue-700 flex-shrink-0">{idx + 1}</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!item.isPdf && item.regulatoryImpact && (
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <h3 className="font-medium text-xs text-orange-700 uppercase tracking-wide mb-2">Regulatory Impact</h3>
                    <p className="text-sm text-slate-700">{item.regulatoryImpact}</p>
                  </div>
                )}

                {(item.summary || item.keyPoints?.length > 0) && (
                  <p className="text-[10px] text-slate-400 italic">RegIntel can make mistakes. Please verify all important information before taking decisions.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </RegTechLayout>
  );
}
