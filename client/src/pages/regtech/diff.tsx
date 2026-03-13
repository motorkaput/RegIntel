import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitCompare, Loader2 } from "lucide-react";
import RegTechLayout from "./layout";
import { apiRequest } from "@/lib/queryClient";
import { ShareResults, getFormattedDateTimeForDisplay, DocxContentSection } from "@/components/regtech/ShareResults";
import { WordDiff, WordDiffSummary } from "@/components/regtech/WordDiff";
import { DocumentSelector } from "@/components/regtech/DocumentSelector";
import { useSession } from "@/contexts/SessionContext";

export default function DiffPage() {
  const [oldDocIds, setOldDocIds] = useState<number[]>([]);
  const [newDocIds, setNewDocIds] = useState<number[]>([]);
  const [result, setResult] = useState<any>(null);
  const { addActivity, hasActiveSession } = useSession();

  const { data } = useQuery<{ documents: any[] }>({
    queryKey: ['/api/regtech/documents'],
  });

  const activeDocuments = data?.documents?.filter(doc => doc.status === 'active') || [];
  
  const getDocumentDisplayName = (doc: any) => {
    const filename = doc.originalFilename || '';
    const title = doc.title || '';
    
    // Always prefer showing the original filename for clarity
    if (filename) {
      return filename;
    }
    
    return title.length > 60 ? `${title.substring(0, 57)}...` : title;
  };

  // Helper to format section data for export (handles both string and object formats)
  const formatSectionForExport = (section: any): string => {
    if (typeof section === 'string') return section;
    let text = section.section || '';
    if (section.page) text += ` (Page ${section.page})`;
    if (section.description) text += ` - ${section.description}`;
    if (section.oldText && section.newText) {
      text += `\n  Before: ${section.oldText}\n  After: ${section.newText}`;
    }
    return text;
  };
  
  const formatSectionForList = (section: any): string => {
    if (typeof section === 'string') return section;
    let text = section.section || '';
    if (section.page) text += ` (Page ${section.page})`;
    if (section.description) text += `: ${section.description}`;
    return text;
  };

  const oldDocId = oldDocIds[0];
  const newDocId = newDocIds[0];

  const diffMutation = useMutation({
    mutationFn: async (data: { docIdOld: string; docIdNew: string }) => {
      const response = await apiRequest('/api/regtech/diff', 'POST', data);
      return response.json();
    },
    onSuccess: async (data) => {
      setResult(data);
      
      if (hasActiveSession) {
        try {
          await addActivity('document_diff', {
            oldDocument: data.oldDocument?.originalFilename || data.oldDocument?.title,
            newDocument: data.newDocument?.originalFilename || data.newDocument?.title,
            diffSummary: data.diffSummary,
            sectionsAdded: (data.changeset?.sectionsAdded || []).map(formatSectionForList),
            sectionsRemoved: (data.changeset?.sectionsRemoved || []).map(formatSectionForList),
            sectionsAmended: (data.changeset?.sectionsAmended || []).map(formatSectionForExport),
            keyChanges: data.keyChanges || [],
            complianceImpact: data.complianceImpact,
            impactScore: data.changeset?.impactScore,
          });
        } catch (e) {
          console.warn('Failed to log session activity:', e);
        }
      }
    },
  });

  const handleCompare = () => {
    if (!oldDocId || !newDocId) return;
    setResult(null);
    diffMutation.mutate({ docIdOld: oldDocId.toString(), docIdNew: newDocId.toString() });
  };

  const generateDocxContent = (): DocxContentSection[] => {
    if (!result) {
      return [];
    }
    
    const sections: DocxContentSection[] = [];
    
    sections.push({ type: 'heading', text: 'Document Comparison Report' });
    sections.push({ type: 'divider' });

    sections.push({ type: 'subheading', text: 'Old Version' });
    sections.push({ type: 'paragraph', text: result.oldDocument?.originalFilename || result.oldDocument?.title || 'Unknown' });

    sections.push({ type: 'subheading', text: 'New Version' });
    sections.push({ type: 'paragraph', text: result.newDocument?.originalFilename || result.newDocument?.title || 'Unknown' });

    sections.push({ type: 'subheading', text: 'Summary' });
    sections.push({ type: 'paragraph', text: result.diffSummary || 'No summary available' });
    
    if (result.keyChanges?.length > 0) {
      sections.push({ type: 'subheading', text: 'Key Changes' });
      sections.push({ type: 'list', items: result.keyChanges, color: 'default' });
    }
    
    if (result.complianceImpact) {
      sections.push({ type: 'subheading', text: 'Compliance Impact' });
      sections.push({ type: 'paragraph', text: result.complianceImpact });
    }

    if (result.changeset?.sectionsAdded?.length > 0) {
      sections.push({ type: 'subheading', text: 'Sections Added' });
      sections.push({ type: 'list', items: result.changeset.sectionsAdded.map(formatSectionForList), color: 'green' });
    }

    if (result.changeset?.sectionsRemoved?.length > 0) {
      sections.push({ type: 'subheading', text: 'Sections Removed' });
      sections.push({ type: 'list', items: result.changeset.sectionsRemoved.map(formatSectionForList), color: 'red' });
    }

    if (result.changeset?.sectionsAmended?.length > 0) {
      sections.push({ type: 'subheading', text: 'Sections Amended' });
      sections.push({ type: 'list', items: result.changeset.sectionsAmended.map(formatSectionForExport), color: 'yellow' });
    }

    return sections;
  };

  return (
    <RegTechLayout>
      <div className="space-y-6 page-enter">
        {/* Page Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h1 className="text-2xl font-semibold text-slate-900" data-testid="text-page-title">Document Comparison</h1>
          <p className="text-slate-600 mt-1 text-sm">
            Compare two versions of regulatory documents to identify changes
          </p>
        </div>

        {/* Comparison Form - Bento style */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-cyan-100 flex items-center justify-center">
              <GitCompare className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Select Documents to Compare</h2>
              <p className="text-sm text-slate-500">Choose an older and newer version</p>
            </div>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Old Version</label>
                <DocumentSelector
                  mode="single"
                  selectedIds={oldDocIds}
                  onSelectionChange={setOldDocIds}
                  placeholder="Select old version"
                  excludeIds={newDocIds}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">New Version</label>
                <DocumentSelector
                  mode="single"
                  selectedIds={newDocIds}
                  onSelectionChange={setNewDocIds}
                  placeholder="Select new version"
                  excludeIds={oldDocIds}
                />
              </div>
            </div>

            <Button
              className="w-full"
              disabled={!oldDocId || !newDocId || diffMutation.isPending}
              onClick={handleCompare}
              data-testid="button-compare"
            >
              {diffMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <GitCompare className="mr-2 h-4 w-4" />
                  Compare Documents
                </>
              )}
            </Button>
          </div>

        {result && (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>Comparison Summary</CardTitle>
                    <Badge variant="outline">
                      Changeset ID: {result.changeset?.id}
                    </Badge>
                  </div>
                  <ShareResults
                    filename={`document-diff-${Date.now()}`}
                    generateDocxContent={generateDocxContent}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Old Version</h4>
                      <p className="text-sm text-muted-foreground">{result.oldDocument?.originalFilename || result.oldDocument?.title}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">New Version</h4>
                      <p className="text-sm text-muted-foreground">{result.newDocument?.originalFilename || result.newDocument?.title}</p>
                    </div>
                  </div>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="text-diff-summary">
                  {result.diffSummary?.split('\n').map((line: string, i: number) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                
                {/* Key Changes */}
                {result.keyChanges && result.keyChanges.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-sm mb-2 text-blue-700 dark:text-blue-400">Key Changes</h4>
                    <ul className="space-y-2">
                      {result.keyChanges.map((change: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-blue-600 font-bold mt-0.5">•</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Compliance Impact */}
                {result.complianceImpact && (
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold text-sm mb-2 text-amber-700 dark:text-amber-400">Compliance Impact</h4>
                    <p className="text-sm">{result.complianceImpact}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Changeset Details */}
            {result.changeset && (
              <Card>
                <CardHeader>
                  <CardTitle>Change Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {result.changeset.sectionsAdded?.length > 0 && (
                      <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                        <h4 className="font-semibold text-sm mb-2 text-green-700 dark:text-green-400">
                          Sections Added
                        </h4>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                          {result.changeset.sectionsAdded.length}
                        </p>
                      </div>
                    )}
                    
                    {result.changeset.sectionsRemoved?.length > 0 && (
                      <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                        <h4 className="font-semibold text-sm mb-2 text-red-700 dark:text-red-400">
                          Sections Removed
                        </h4>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                          {result.changeset.sectionsRemoved.length}
                        </p>
                      </div>
                    )}
                    
                    {result.changeset.sectionsAmended?.length > 0 && (
                      <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                        <h4 className="font-semibold text-sm mb-2 text-yellow-700 dark:text-yellow-400">
                          Sections Amended
                        </h4>
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                          {result.changeset.sectionsAmended.length}
                        </p>
                      </div>
                    )}
                  </div>

                  {result.changeset.impactScore && (
                    <div className="mb-6 p-4 border rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Impact Score</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${result.changeset.impactScore * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{result.changeset.impactScore}/10</span>
                      </div>
                    </div>
                  )}

                  {/* Detailed Changes Lists */}
                  <div className="space-y-4">
                    {result.changeset.sectionsAdded?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-3 text-green-700 dark:text-green-400">
                          Sections Added
                        </h4>
                        <ul className="space-y-3">
                          {result.changeset.sectionsAdded.map((section: any, idx: number) => (
                            <li
                              key={idx}
                              className="p-3 border-l-4 border-green-500 bg-green-50 dark:bg-green-950 rounded text-sm"
                              data-testid={`section-added-${idx}`}
                            >
                              <div className="font-medium">{typeof section === 'string' ? section : section.section}</div>
                              {section.description && (
                                <p className="text-muted-foreground mt-1 text-xs">{section.description}</p>
                              )}
                              {section.page && (
                                <span className="text-xs text-green-600 dark:text-green-400">Page {section.page}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.changeset.sectionsRemoved?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-3 text-red-700 dark:text-red-400">
                          Sections Removed
                        </h4>
                        <ul className="space-y-3">
                          {result.changeset.sectionsRemoved.map((section: any, idx: number) => (
                            <li
                              key={idx}
                              className="p-3 border-l-4 border-red-500 bg-red-50 dark:bg-red-950 rounded text-sm"
                              data-testid={`section-removed-${idx}`}
                            >
                              <div className="font-medium">{typeof section === 'string' ? section : section.section}</div>
                              {section.description && (
                                <p className="text-muted-foreground mt-1 text-xs">{section.description}</p>
                              )}
                              {section.page && (
                                <span className="text-xs text-red-600 dark:text-red-400">Page {section.page}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.changeset.sectionsAmended?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-3 text-yellow-700 dark:text-yellow-400">
                          Sections Amended
                        </h4>
                        <ul className="space-y-3">
                          {result.changeset.sectionsAmended.map((section: any, idx: number) => (
                            <li
                              key={idx}
                              className="p-3 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 rounded text-sm"
                              data-testid={`section-amended-${idx}`}
                            >
                              <div className="font-medium">{typeof section === 'string' ? section : section.section}</div>
                              {section.description && (
                                <p className="text-muted-foreground mt-1 text-xs">{section.description}</p>
                              )}
                              {section.oldText && section.newText && (
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Word-level changes:</span>
                                    <WordDiffSummary oldText={section.oldText} newText={section.newText} />
                                  </div>
                                  <div className="p-3 bg-white dark:bg-gray-800 rounded border border-yellow-200 dark:border-yellow-700">
                                    <WordDiff oldText={section.oldText} newText={section.newText} />
                                  </div>
                                </div>
                              )}
                              {section.page && (
                                <span className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 block">Page {section.page}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeDocuments.length < 2 && (
          <Card>
            <CardContent className="py-12 text-center">
              <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground" data-testid="text-insufficient-documents">
                You need at least 2 active documents to perform comparisons
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </RegTechLayout>
  );
}
