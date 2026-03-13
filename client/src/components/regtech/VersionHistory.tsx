import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  History, 
  Loader2, 
  Plus, 
  GitCompare,
  Calendar,
  FileText,
  ChevronRight
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RegulationVersion {
  id: string;
  regulationId: string;
  versionNumber: number;
  versionLabel: string;
  previousVersionId: string | null;
  changeType: string;
  changeSummary: string | null;
  effectiveDate: string | null;
  addedSections: number;
  removedSections: number;
  modifiedSections: number;
  totalObligations: number;
  createdAt: string;
}

interface VersionCompareResult {
  version1: { id: string; label: string; number: number };
  version2: { id: string; label: string; number: number };
  changes: {
    added: { unitKey: string; unitType: string }[];
    removed: { unitKey: string; unitType: string }[];
    modified: { unitKey: string; unitType: string }[];
  };
  summary: {
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
  };
}

interface VersionHistoryProps {
  regulationId: string;
  regulationTitle: string;
}

const CHANGE_TYPE_COLORS: Record<string, string> = {
  initial: "bg-blue-100 text-blue-800",
  amendment: "bg-orange-100 text-orange-800",
  update: "bg-green-100 text-green-800",
  consolidation: "bg-purple-100 text-purple-800"
};

export function VersionHistory({ regulationId, regulationTitle }: VersionHistoryProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [compareV1, setCompareV1] = useState<string>("");
  const [compareV2, setCompareV2] = useState<string>("");
  const [newVersion, setNewVersion] = useState({
    versionLabel: "",
    changeType: "update",
    changeSummary: "",
    effectiveDate: ""
  });

  const { data: versions = [], isLoading } = useQuery<RegulationVersion[]>({
    queryKey: [`/api/regtech/regulations/${regulationId}/versions`],
    enabled: !!regulationId
  });

  const { data: compareResult, isLoading: comparing } = useQuery<VersionCompareResult>({
    queryKey: [`/api/regtech/regulations/${regulationId}/versions/compare`, compareV1, compareV2],
    enabled: !!compareV1 && !!compareV2 && showCompareDialog,
    queryFn: async () => {
      const res = await fetch(
        `/api/regtech/regulations/${regulationId}/versions/compare?v1=${compareV1}&v2=${compareV2}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Compare failed');
      return res.json();
    }
  });

  const createVersionMutation = useMutation({
    mutationFn: async (data: typeof newVersion) => {
      return apiRequest(`/api/regtech/regulations/${regulationId}/versions`, 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/regtech/regulations/${regulationId}/versions`] });
      setShowCreateDialog(false);
      setNewVersion({ versionLabel: "", changeType: "update", changeSummary: "", effectiveDate: "" });
    }
  });

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-500" />
          Version History
        </CardTitle>
        <div className="flex gap-2">
          {versions.length >= 2 && (
            <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <GitCompare className="h-4 w-4 mr-1" />
                  Compare
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Compare Versions</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Version 1</label>
                      <Select value={compareV1} onValueChange={setCompareV1}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          {versions.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              v{v.versionNumber} - {v.versionLabel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Version 2</label>
                      <Select value={compareV2} onValueChange={setCompareV2}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          {versions.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              v{v.versionNumber} - {v.versionLabel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {comparing && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}

                  {compareResult && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-4 text-sm">
                        <Badge variant="outline">{compareResult.version1.label}</Badge>
                        <ChevronRight className="h-4 w-4" />
                        <Badge variant="outline">{compareResult.version2.label}</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{compareResult.summary.addedCount}</p>
                          <p className="text-sm text-gray-600">Sections Added</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-red-600">{compareResult.summary.removedCount}</p>
                          <p className="text-sm text-gray-600">Sections Removed</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-yellow-600">{compareResult.summary.modifiedCount}</p>
                          <p className="text-sm text-gray-600">Sections Modified</p>
                        </div>
                      </div>

                      {compareResult.changes.added.length > 0 && (
                        <div>
                          <h4 className="font-medium text-green-600 mb-2">Added Sections</h4>
                          <div className="flex flex-wrap gap-1">
                            {compareResult.changes.added.slice(0, 10).map((s, i) => (
                              <Badge key={i} variant="outline" className="bg-green-50">{s.unitKey}</Badge>
                            ))}
                            {compareResult.changes.added.length > 10 && (
                              <Badge variant="outline">+{compareResult.changes.added.length - 10} more</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {compareResult.changes.removed.length > 0 && (
                        <div>
                          <h4 className="font-medium text-red-600 mb-2">Removed Sections</h4>
                          <div className="flex flex-wrap gap-1">
                            {compareResult.changes.removed.slice(0, 10).map((s, i) => (
                              <Badge key={i} variant="outline" className="bg-red-50">{s.unitKey}</Badge>
                            ))}
                            {compareResult.changes.removed.length > 10 && (
                              <Badge variant="outline">+{compareResult.changes.removed.length - 10} more</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {compareResult.changes.modified.length > 0 && (
                        <div>
                          <h4 className="font-medium text-yellow-600 mb-2">Modified Sections</h4>
                          <div className="flex flex-wrap gap-1">
                            {compareResult.changes.modified.slice(0, 10).map((s, i) => (
                              <Badge key={i} variant="outline" className="bg-yellow-50">{s.unitKey}</Badge>
                            ))}
                            {compareResult.changes.modified.length > 10 && (
                              <Badge variant="outline">+{compareResult.changes.modified.length - 10} more</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Snapshot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Version Snapshot</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Version Label</label>
                  <Input
                    placeholder="e.g., 2024.1, Amendment 3"
                    value={newVersion.versionLabel}
                    onChange={e => setNewVersion(v => ({ ...v, versionLabel: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Change Type</label>
                  <Select value={newVersion.changeType} onValueChange={v => setNewVersion(nv => ({ ...nv, changeType: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial">Initial Version</SelectItem>
                      <SelectItem value="amendment">Amendment</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="consolidation">Consolidation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Effective Date</label>
                  <Input
                    type="date"
                    value={newVersion.effectiveDate}
                    onChange={e => setNewVersion(v => ({ ...v, effectiveDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Change Summary</label>
                  <Textarea
                    placeholder="Describe what changed in this version..."
                    value={newVersion.changeSummary}
                    onChange={e => setNewVersion(v => ({ ...v, changeSummary: e.target.value }))}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={() => createVersionMutation.mutate(newVersion)}
                  disabled={createVersionMutation.isPending || !newVersion.versionLabel}
                  className="w-full"
                >
                  {createVersionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Snapshot
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No version snapshots yet.</p>
            <p className="text-sm">Create a snapshot to start tracking changes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((v, idx) => (
              <div key={v.id} className="flex items-start gap-4 p-3 rounded-lg border bg-gray-50 dark:bg-gray-800/50">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">v{v.versionNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{v.versionLabel}</span>
                    <Badge className={CHANGE_TYPE_COLORS[v.changeType] || "bg-gray-100"}>
                      {v.changeType}
                    </Badge>
                  </div>
                  {v.changeSummary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{v.changeSummary}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(v.createdAt)}
                    </span>
                    {v.effectiveDate && (
                      <span>Effective: {v.effectiveDate}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {v.totalObligations} obligations
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
