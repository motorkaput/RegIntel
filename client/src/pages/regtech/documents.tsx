import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageLoadingSkeleton, EmptyState, ErrorState } from "@/components/ui/loading-skeleton";
import { FileText, Calendar as CalendarIcon, ExternalLink, MessageSquare, Download, Trash2, FileUp, Filter, X, ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle, Folder, Pencil, Check } from "lucide-react";
import { format } from "date-fns";
import RegTechLayout from "./layout";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import FolderPanel, { AddToFolderButton } from "@/components/regtech/FolderPanel";

interface FileUploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'active' | 'failed' | 'needs_metadata';
  documentId?: number;
  error?: string;
  manualJurisdiction?: string;
  manualRegulator?: string;
}

const JURISDICTIONS = [
  { value: "all", label: "All Jurisdictions" },
  { value: "US", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "EU", label: "European Union" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "SG", label: "Singapore" },
  { value: "HK", label: "Hong Kong" },
  { value: "IN", label: "India" },
  { value: "AU", label: "Australia" },
  { value: "CA", label: "Canada" },
  { value: "JP", label: "Japan" },
  { value: "NP", label: "Nepal" },
  { value: "MU", label: "Mauritius" },
  { value: "GLOBAL", label: "Global" },
];

const REGULATORS = [
  { value: "all", label: "All Regulators" },
  { value: "FinCEN", label: "FinCEN" },
  { value: "FCA", label: "FCA" },
  { value: "EBA", label: "EBA" },
  { value: "CBUAE", label: "Central Bank of UAE" },
  { value: "UAE-FIU", label: "UAE FIU" },
  { value: "MAS", label: "MAS" },
  { value: "HKMA", label: "HKMA" },
  { value: "FIU-IND", label: "FIU-IND" },
  { value: "FIU-MU", label: "FIU Mauritius" },
  { value: "JAFIC", label: "JAFIC (Japan)" },
  { value: "FIU-Nepal", label: "FIU Nepal" },
  { value: "AUSTRAC", label: "AUSTRAC" },
  { value: "FINTRAC", label: "FINTRAC" },
  { value: "FATF", label: "FATF" },
];

const JURISDICTION_REGULATOR_MAP: Record<string, string> = {
  "US": "FinCEN",
  "UK": "FCA",
  "EU": "EBA",
  "AE": "CBUAE",
  "SG": "MAS",
  "HK": "HKMA",
  "IN": "FIU-IND",
  "JP": "JAFIC",
  "NP": "FIU-Nepal",
  "MU": "FIU-MU",
  "AU": "AUSTRAC",
  "CA": "FINTRAC",
  "GLOBAL": "FATF",
};

const INSTRUMENT_TYPES = [
  { value: "all", label: "All Types" },
  { value: "Regulation", label: "Regulation" },
  { value: "Guidance", label: "Guidance/Guideline" },
  { value: "Directive", label: "Directive" },
  { value: "Notice", label: "Notice" },
  { value: "Circular", label: "Circular" },
  { value: "Amendment", label: "Amendment" },
  { value: "Consultation", label: "Consultation" },
];


const CLASSIFICATIONS = [
  { value: "all", label: "All Classifications" },
  { value: "regulatory", label: "Regulatory" },
  { value: "legal", label: "Legal" },
  { value: "guidance", label: "Guidance" },
  { value: "policy", label: "Policy" },
  { value: "other", label: "Other" },
];

const CLASSIFICATION_COLORS: Record<string, string> = {
  regulatory: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  legal: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  guidance: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  policy: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function DocumentsPage() {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [jurisdictionFilter, setJurisdictionFilter] = useState("all");
  const [regulatorFilter, setRegulatorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [fromDateOpen, setFromDateOpen] = useState(false);
  const [toDateOpen, setToDateOpen] = useState(false);
  const [classificationFilter, setClassificationFilter] = useState("all");
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [showFolderPanel, setShowFolderPanel] = useState(true);
  
  const [files, setFiles] = useState<File[]>([]);
  const [fileStatuses, setFileStatuses] = useState<FileUploadStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [editingFilename, setEditingFilename] = useState("");
  const [savingFilename, setSavingFilename] = useState(false);
  
  const [editingDescDocId, setEditingDescDocId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILES = 10; // Maximum files per upload batch

  const { data, isLoading, isError, refetch } = useQuery<{ documents: any[] }>({
    queryKey: ['/api/regtech/documents'],
  });

  const { data: folderDocuments } = useQuery<any[]>({
    queryKey: ['/api/regtech/folders', selectedFolderId, 'documents'],
    queryFn: async () => {
      if (!selectedFolderId) return null;
      const res = await fetch(`/api/regtech/folders/${selectedFolderId}/documents`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: selectedFolderId !== null,
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const oversizedFiles: string[] = [];
      
      selectedFiles.forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
          oversizedFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        } else {
          validFiles.push(file);
        }
      });
      
      if (oversizedFiles.length > 0) {
        toast({
          title: "Some files exceed 10MB limit",
          description: `Removed: ${oversizedFiles.join(', ')}`,
          variant: "destructive"
        });
      }
      
      if (validFiles.length > MAX_FILES) {
        const excessCount = validFiles.length - MAX_FILES;
        toast({
          title: `Too many files selected`,
          description: `Maximum ${MAX_FILES} files allowed per upload. Please remove ${excessCount} file${excessCount > 1 ? 's' : ''} before uploading.`,
          variant: "destructive"
        });
      }
      
      setFiles(validFiles);
      setFileStatuses(validFiles.map(file => ({ file, status: 'pending' as const })));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast({ title: "No files selected", description: "Please select at least one file", variant: "destructive" });
      return;
    }
    
    setUploading(true);
    toast({ title: `Uploading ${files.length} document(s)`, description: "Processing..." });
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setFileStatuses(prev => prev.map((fs, idx) => idx === i ? { ...fs, status: 'uploading' as const } : fs));
      
      try {
        const data = new FormData();
        data.append('file', file);
        
        // Create AbortController with 5-minute timeout for large file uploads
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutes
        
        let response: Response;
        try {
          response = await fetch('/api/regtech/upload', { 
            method: 'POST', 
            body: data, 
            credentials: 'include',
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeoutId);
        }
        const result = await response.json();
        
        if (!response.ok) {
          const errorMsg = result.message || 'Upload failed';
          if (result.isNotCompliance) {
            setFileStatuses(prev => prev.map((fs, idx) => idx === i ? { 
              ...fs, 
              status: 'failed' as const, 
              error: 'Not a regulatory document - please remove'
            } : fs));
            toast({
              title: "Non-regulatory document",
              description: "This document doesn't appear to be compliance or regulatory related. Please remove it from your selection.",
              variant: "destructive"
            });
            continue;
          }
          if (errorMsg.includes('Could not determine jurisdiction')) {
            setFileStatuses(prev => prev.map((fs, idx) => idx === i ? { 
              ...fs, 
              status: 'needs_metadata' as const, 
              error: 'Please select jurisdiction and regulator',
              manualJurisdiction: '',
              manualRegulator: ''
            } : fs));
            continue;
          }
          setFileStatuses(prev => prev.map((fs, idx) => idx === i ? { ...fs, status: 'failed' as const, error: errorMsg } : fs));
          continue;
        }
        
        if (!result.documentId) {
          setFileStatuses(prev => prev.map((fs, idx) => idx === i ? { ...fs, status: 'failed' as const, error: 'No document ID returned' } : fs));
          continue;
        }
        
        if (result.status === 'active') {
          setFileStatuses(prev => prev.map((fs, idx) => idx === i ? { ...fs, status: 'active' as const, documentId: result.documentId } : fs));
          // Auto-add to selected folder if one is selected
          if (selectedFolderId && result.documentId) {
            try {
              await fetch(`/api/regtech/folders/${selectedFolderId}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ docId: result.documentId }),
              });
              queryClient.invalidateQueries({ queryKey: ['/api/regtech/folders', selectedFolderId, 'documents'] });
            } catch (folderError) {
              console.error('Failed to add document to folder:', folderError);
            }
          }
        } else {
          setFileStatuses(prev => prev.map((fs, idx) => idx === i ? { ...fs, status: 'processing' as const, documentId: result.documentId } : fs));
          pollStatus(result.documentId, i, selectedFolderId);
        }
      } catch (error) {
        let errorMsg = 'Upload failed - network error';
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMsg = 'Upload timed out (5 min limit)';
          } else {
            errorMsg = error.message;
          }
        }
        console.error('Upload error:', error);
        setFileStatuses(prev => prev.map((fs, idx) => idx === i ? { ...fs, status: 'failed' as const, error: errorMsg } : fs));
      }
    }
    
    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ['/api/regtech/documents'] });
    
    // Auto-clear ONLY when ALL files are in terminal state (active/failed) - no needs_metadata
    setTimeout(() => {
      setFileStatuses(prev => {
        const allTerminal = prev.every(fs => fs.status === 'active' || fs.status === 'failed');
        const hasNeedsMetadata = prev.some(fs => fs.status === 'needs_metadata');
        // Only auto-clear if all are terminal and none need metadata input
        if (allTerminal && !hasNeedsMetadata && prev.length > 0) {
          setFiles([]);
          return [];
        }
        return prev;
      });
    }, 5000);
  };
  
  const pollStatus = async (docId: number, fileIndex: number, folderId?: number | null) => {
    for (let i = 0; i < 60; i++) {
      try {
        const response = await fetch(`/api/regtech/document/${docId}/status`);
        const data = await response.json();
        if (data.status === 'active') {
          setFileStatuses(prev => prev.map((fs, idx) => idx === fileIndex ? { ...fs, status: 'active' as const } : fs));
          queryClient.invalidateQueries({ queryKey: ['/api/regtech/documents'] });
          
          // Auto-add to selected folder if one is selected
          if (folderId) {
            try {
              await fetch(`/api/regtech/folders/${folderId}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ docId }),
              });
              queryClient.invalidateQueries({ queryKey: ['/api/regtech/folders', folderId, 'documents'] });
            } catch (folderError) {
              console.error('Failed to add document to folder:', folderError);
            }
          }
          
          // Auto-clear file statuses after ALL processing complete
          setTimeout(() => {
            setFileStatuses(prev => {
              const allTerminal = prev.every(fs => fs.status === 'active' || fs.status === 'failed');
              const hasNeedsMetadata = prev.some(fs => fs.status === 'needs_metadata');
              if (allTerminal && !hasNeedsMetadata && prev.length > 0) {
                setFiles([]);
                return [];
              }
              return prev;
            });
          }, 3000);
          
          return;
        } else if (data.status === 'failed') {
          setFileStatuses(prev => prev.map((fs, idx) => idx === fileIndex ? { ...fs, status: 'failed' as const, error: 'Processing failed' } : fs));
          return;
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    // If we exhausted all retries, mark as failed
    setFileStatuses(prev => prev.map((fs, idx) => idx === fileIndex ? { ...fs, status: 'failed' as const, error: 'Processing timed out' } : fs));
  };

  const retryWithMetadata = async (fileIndex: number) => {
    const fileStatus = fileStatuses[fileIndex];
    if (!fileStatus.manualJurisdiction || !fileStatus.manualRegulator) {
      toast({ title: "Missing information", description: "Please select both jurisdiction and regulator", variant: "destructive" });
      return;
    }
    
    setFileStatuses(prev => prev.map((fs, idx) => idx === fileIndex ? { ...fs, status: 'uploading' as const } : fs));
    
    try {
      const data = new FormData();
      data.append('file', fileStatus.file);
      data.append('jurisdiction', fileStatus.manualJurisdiction);
      data.append('regulator', fileStatus.manualRegulator);
      
      const response = await fetch('/api/regtech/upload', { method: 'POST', body: data, credentials: 'include' });
      const result = await response.json();
      
      if (!response.ok) {
        setFileStatuses(prev => prev.map((fs, idx) => idx === fileIndex ? { ...fs, status: 'failed' as const, error: result.message || 'Upload failed' } : fs));
        return;
      }
      
      if (result.status === 'active') {
        setFileStatuses(prev => prev.map((fs, idx) => idx === fileIndex ? { ...fs, status: 'active' as const, documentId: result.documentId } : fs));
      } else {
        setFileStatuses(prev => prev.map((fs, idx) => idx === fileIndex ? { ...fs, status: 'processing' as const, documentId: result.documentId } : fs));
        pollStatus(result.documentId, fileIndex);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/documents'] });
    } catch (error) {
      setFileStatuses(prev => prev.map((fs, idx) => idx === fileIndex ? { ...fs, status: 'failed' as const, error: 'Upload failed' } : fs));
    }
  };

  const updateFileMetadata = (fileIndex: number, field: 'manualJurisdiction' | 'manualRegulator', value: string) => {
    setFileStatuses(prev => prev.map((fs, idx) => {
      if (idx !== fileIndex) return fs;
      const updates: Partial<FileUploadStatus> = { [field]: value };
      if (field === 'manualJurisdiction' && JURISDICTION_REGULATOR_MAP[value]) {
        updates.manualRegulator = JURISDICTION_REGULATOR_MAP[value];
      }
      return { ...fs, ...updates };
    }));
  };

  const allDocuments = useMemo(() => {
    const docs = data?.documents || [];
    if (selectedFolderId !== null && folderDocuments) {
      const folderDocIds = new Set(folderDocuments.map((d: any) => d.id));
      return docs.filter((d: any) => folderDocIds.has(d.id));
    }
    return docs;
  }, [data?.documents, selectedFolderId, folderDocuments]);

  const documents = useMemo(() => {
    return allDocuments.filter(doc => {
      if (jurisdictionFilter !== "all" && doc.jurisdiction !== jurisdictionFilter) return false;
      if (regulatorFilter !== "all" && doc.regulator !== regulatorFilter) return false;
      if (typeFilter !== "all" && doc.instrumentType !== typeFilter) return false;
      if (classificationFilter !== "all" && doc.classification !== classificationFilter) return false;
      
      if (doc.publishedAt) {
        const pubDate = new Date(doc.publishedAt);
        if (fromDate && pubDate < fromDate) return false;
        if (toDate) {
          const endOfDay = new Date(toDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (pubDate > endOfDay) return false;
        }
      } else if (fromDate || toDate) {
        return false;
      }
      return true;
    });
  }, [allDocuments, jurisdictionFilter, regulatorFilter, typeFilter, fromDate, toDate, classificationFilter]);

  const hasActiveFilters = jurisdictionFilter !== "all" || regulatorFilter !== "all" || typeFilter !== "all" || fromDate !== undefined || toDate !== undefined || classificationFilter !== "all";

  const clearFilters = () => {
    setJurisdictionFilter("all");
    setRegulatorFilter("all");
    setTypeFilter("all");
    setFromDate(undefined);
    setToDate(undefined);
    setClassificationFilter("all");
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      await apiRequest(`/api/regtech/document/${id}`, 'DELETE');

      toast({
        title: "Document deleted",
        description: "The document has been removed from the library",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/regtech/documents'] });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const startEditing = (doc: any) => {
    // Cancel any existing description edit sessions first
    if (editingDescDocId) cancelEditingDescription();
    setEditingDocId(doc.id);
    setEditingFilename(doc.originalFilename || doc.title || '');
  };

  const cancelEditing = () => {
    setEditingDocId(null);
    setEditingFilename('');
  };

  const saveFilename = async () => {
    if (!editingDocId || !editingFilename.trim()) return;
    
    setSavingFilename(true);
    try {
      await apiRequest(`/api/regtech/document/${editingDocId}`, 'PATCH', {
        originalFilename: editingFilename.trim()
      });

      toast({
        title: "Filename updated",
        description: "The document filename has been saved",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/regtech/documents'] });
      setEditingDocId(null);
      setEditingFilename('');
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update filename",
        variant: "destructive",
      });
    } finally {
      setSavingFilename(false);
    }
  };

  const startEditingDescription = (doc: any) => {
    // Cancel any existing edit sessions first
    if (editingDocId) cancelEditing();
    setEditingDescDocId(doc.id);
    setEditingDescription(doc.metadata?.summary || '');
  };

  const cancelEditingDescription = () => {
    setEditingDescDocId(null);
    setEditingDescription('');
  };

  const saveDescription = async () => {
    if (!editingDescDocId) return;
    
    setSavingDescription(true);
    try {
      await apiRequest(`/api/regtech/document/${editingDescDocId}`, 'PATCH', {
        summary: editingDescription.trim()
      });

      toast({
        title: "Description updated",
        description: "The document description has been saved",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/regtech/documents'] });
      setEditingDescDocId(null);
      setEditingDescription('');
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update description",
        variant: "destructive",
      });
    } finally {
      setSavingDescription(false);
    }
  };

  return (
    <RegTechLayout>
      <div className="page-enter space-y-6">
        {/* Page Header - Bento style */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowFolderPanel(!showFolderPanel)}
                title={showFolderPanel ? "Hide folders" : "Show folders"}
              >
                <Folder className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900" data-testid="text-page-title">
                  {selectedFolderId ? 'Folder Contents' : 'Document Library'}
                </h1>
                <p className="text-slate-600 mt-1 text-sm">
                  {documents.length} document{documents.length !== 1 ? 's' : ''}{hasActiveFilters || selectedFolderId ? ` (filtered)` : ' in your library'}
                </p>
              </div>
            </div>
          </div>

          {/* Folder Panel - Collapsible section above documents */}
          {showFolderPanel && (
            <div className="mb-4 pb-4 border-b border-slate-100">
              <FolderPanel 
                selectedFolderId={selectedFolderId} 
                onFolderSelect={setSelectedFolderId}
              />
            </div>
          )}

          {/* Upload Documents */}
          <div className="mb-4 pb-4 border-b border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2">Upload Documents</label>
            <form onSubmit={handleUpload} className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors relative ${
                  uploading || fileStatuses.some(fs => fs.status === 'uploading' || fs.status === 'processing')
                    ? 'border-slate-300 bg-slate-50 cursor-not-allowed opacity-60'
                    : 'border-slate-200 hover:border-slate-300 cursor-pointer'
                }`}
                onClick={() => {
                  if (!uploading && !fileStatuses.some(fs => fs.status === 'uploading' || fs.status === 'processing')) {
                    document.getElementById('file-upload')?.click();
                  }
                }}
              >
                {(uploading || fileStatuses.some(fs => fs.status === 'uploading' || fs.status === 'processing')) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 rounded-xl z-10">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm font-medium">Upload in progress...</span>
                    </div>
                  </div>
                )}
                <FileUp className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Click to select files or drag and drop</p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOCX, HTML supported (max 10 files, 10MB per file)</p>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.docx,.html"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading || fileStatuses.some(fs => fs.status === 'uploading' || fs.status === 'processing')}
                  className="hidden"
                />
              </div>
              
              {files.length > 0 && fileStatuses.every(fs => fs.status === 'pending') && (
                <div className={`rounded-xl p-3 border ${files.length > MAX_FILES ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm font-medium text-slate-700">{files.length} file(s) selected</span>
                      {files.length > MAX_FILES && (
                        <p className="text-xs text-red-600 mt-1">
                          Too many files. Please remove {files.length - MAX_FILES} file{files.length - MAX_FILES > 1 ? 's' : ''} to upload.
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => { setFiles([]); setFileStatuses([]); }}>
                        Clear All
                      </Button>
                      <Button type="submit" disabled={uploading || files.length > MAX_FILES} size="sm" className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                        {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading...</> : 'Upload Now'}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-2 text-sm border border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-xs text-slate-400 flex-shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                          onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, i) => i !== idx)); setFileStatuses(fileStatuses.filter((_, i) => i !== idx)); }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                
                {fileStatuses.length > 0 && fileStatuses.some(fs => fs.status !== 'pending') && (
                  <div className="space-y-2">
                    {/* Header with dismiss button */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Upload Status</span>
                      {fileStatuses.every(fs => fs.status === 'active' || fs.status === 'failed' || fs.status === 'needs_metadata') && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-slate-500 hover:text-slate-700"
                          onClick={() => {
                            setFiles([]);
                            setFileStatuses([]);
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Dismiss All
                        </Button>
                      )}
                    </div>
                    {fileStatuses.map((fs, idx) => (
                      <div key={idx} className={`bg-slate-50 rounded-lg p-2 text-sm ${fs.status === 'needs_metadata' ? 'border border-amber-200 bg-amber-50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <span className="truncate max-w-[200px]">{fs.file.name}</span>
                          {fs.status === 'uploading' && <span className="text-blue-600 flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1" />Uploading</span>}
                          {fs.status === 'processing' && <span className="text-amber-600 flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1" />Processing</span>}
                          {fs.status === 'active' && <span className="text-emerald-600 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" />Done</span>}
                          {fs.status === 'failed' && (
                            <div className="flex items-center gap-2">
                              <span className="text-red-600 flex items-center" title={fs.error}><XCircle className="h-3 w-3 mr-1" />{fs.error || 'Failed'}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                                onClick={() => {
                                  setFiles(files.filter((_, i) => i !== idx));
                                  setFileStatuses(fileStatuses.filter((_, i) => i !== idx));
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {fs.status === 'needs_metadata' && <span className="text-amber-600 text-xs">Needs info</span>}
                        </div>
                        {fs.status === 'needs_metadata' && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-amber-700">Could not auto-detect. Please select:</p>
                            <div className="flex flex-wrap gap-2">
                              <Select value={fs.manualJurisdiction || ''} onValueChange={(v) => updateFileMetadata(idx, 'manualJurisdiction', v)}>
                                <SelectTrigger className="w-[130px] h-8 text-xs">
                                  <SelectValue placeholder="Jurisdiction" />
                                </SelectTrigger>
                                <SelectContent>
                                  {JURISDICTIONS.filter(j => j.value !== 'all').map(j => (
                                    <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select value={fs.manualRegulator || ''} onValueChange={(v) => updateFileMetadata(idx, 'manualRegulator', v)}>
                                <SelectTrigger className="w-[120px] h-8 text-xs">
                                  <SelectValue placeholder="Regulator" />
                                </SelectTrigger>
                                <SelectContent>
                                  {REGULATORS.filter(r => r.value !== 'all').map(r => (
                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                type="button" 
                                size="sm" 
                                className="h-8 text-xs"
                                onClick={() => retryWithMetadata(idx)}
                                disabled={!fs.manualJurisdiction || !fs.manualRegulator}
                              >
                                Retry Upload
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>

          {/* Filter Documents */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Filter className="h-4 w-4" />
              <span>Filter by</span>
            </label>
            <Combobox
              options={JURISDICTIONS}
              value={jurisdictionFilter}
              onValueChange={(val) => setJurisdictionFilter(val || "all")}
              placeholder="All Jurisdictions"
              searchPlaceholder="Search jurisdiction..."
              emptyText="No jurisdiction found."
              triggerClassName="w-auto min-w-[140px] rounded-lg border-slate-200"
            />
            <Combobox
              options={REGULATORS}
              value={regulatorFilter}
              onValueChange={(val) => setRegulatorFilter(val || "all")}
              placeholder="All Regulators"
              searchPlaceholder="Search regulator..."
              emptyText="No regulator found."
              triggerClassName="w-auto min-w-[120px] rounded-lg border-slate-200"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-auto min-w-[100px] rounded-lg border-slate-200">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {INSTRUMENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover open={fromDateOpen} onOpenChange={setFromDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-auto min-w-[120px] rounded-lg border-slate-200 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "MMM d, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={(date) => {
                    setFromDate(date);
                    setFromDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover open={toDateOpen} onOpenChange={setToDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-auto min-w-[120px] rounded-lg border-slate-200 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "MMM d, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={(date) => {
                    setToDate(date);
                    setToDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Select value={classificationFilter} onValueChange={setClassificationFilter}>
              <SelectTrigger className="w-auto min-w-[120px] rounded-lg border-slate-200">
                <SelectValue placeholder="Classification" />
              </SelectTrigger>
              <SelectContent>
                {CLASSIFICATIONS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

          {isLoading ? (
          <div data-testid="loading-spinner">
            <PageLoadingSkeleton />
          </div>
        ) : isError ? (
          <ErrorState
            title="Failed to load documents"
            description="We couldn't retrieve your document library. Please check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Upload your first regulatory document to get started with analysis, querying, and compliance tracking."
            action={
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="text-no-documents"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Upload a Document
              </Button>
            }
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[35%]">Document</TableHead>
                      <TableHead className="w-[8%]">Regulator</TableHead>
                      <TableHead className="w-[8%]">Region</TableHead>
                      <TableHead className="w-[15%]">Type</TableHead>
                      <TableHead className="w-[10%]">Published</TableHead>
                      <TableHead className="w-[8%]">Status</TableHead>
                      <TableHead className="w-[16%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id} className="transition-colors hover:bg-slate-50" data-testid={`row-document-${doc.id}`}>
                        <TableCell>
                          <div>
                            {editingDocId === doc.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingFilename}
                                  onChange={(e) => setEditingFilename(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveFilename();
                                    if (e.key === 'Escape') cancelEditing();
                                  }}
                                  className="h-8 text-sm"
                                  autoFocus
                                  disabled={savingFilename}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={saveFilename}
                                  disabled={savingFilename || !editingFilename.trim()}
                                  className="h-8 w-8 p-0"
                                >
                                  {savingFilename ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4 text-green-600" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEditing}
                                  disabled={savingFilename}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4 text-slate-400" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group">
                                <div className="flex-1">
                                  <div className="font-medium mb-1" data-testid={`text-title-${doc.id}`}>
                                    {doc.originalFilename || doc.title}
                                  </div>
                                  {doc.title && doc.originalFilename && doc.title !== doc.originalFilename && (
                                    <div className="text-sm text-muted-foreground line-clamp-2 mb-1">
                                      {doc.title}
                                    </div>
                                  )}
                                  {editingDescDocId === doc.id ? (
                                    <div className="flex items-center gap-2 mt-1">
                                      <Input
                                        value={editingDescription}
                                        onChange={(e) => setEditingDescription(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveDescription();
                                          if (e.key === 'Escape') cancelEditingDescription();
                                        }}
                                        className="h-7 text-xs"
                                        placeholder="Enter description..."
                                        autoFocus
                                        disabled={savingDescription}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={saveDescription}
                                        disabled={savingDescription}
                                        className="h-6 w-6 p-0"
                                      >
                                        {savingDescription ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Check className="h-3 w-3 text-green-600" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={cancelEditingDescription}
                                        disabled={savingDescription}
                                        className="h-6 w-6 p-0"
                                      >
                                        <X className="h-3 w-3 text-slate-400" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 group/desc">
                                      <div className="text-xs text-slate-400 line-clamp-2 flex-1">
                                        {doc.metadata?.summary || <span className="italic">No description</span>}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => startEditingDescription(doc)}
                                        className="h-5 w-5 p-0 opacity-0 group-hover/desc:opacity-100 transition-opacity flex-shrink-0"
                                        title="Edit description"
                                        disabled={editingDocId !== null || editingDescDocId !== null}
                                      >
                                        <Pencil className="h-2.5 w-2.5 text-slate-400" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditing(doc)}
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Edit filename"
                                  disabled={editingDocId !== null || editingDescDocId !== null}
                                >
                                  <Pencil className="h-3 w-3 text-slate-400" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge data-testid={`badge-regulator-${doc.id}`}>{doc.regulator}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-jurisdiction-${doc.id}`}>
                            {doc.jurisdiction}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {doc.instrumentType && (
                              <Badge variant="secondary" data-testid={`badge-type-${doc.id}`}>
                                {doc.instrumentType}
                              </Badge>
                            )}
                            {doc.classification && (
                              <Badge 
                                className={CLASSIFICATION_COLORS[doc.classification] || CLASSIFICATION_COLORS.other}
                                data-testid={`badge-classification-${doc.id}`}
                              >
                                {doc.classification.charAt(0).toUpperCase() + doc.classification.slice(1)}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.publishedAt && (
                            <div className="flex items-center gap-1 text-sm">
                              <CalendarIcon className="h-3 w-3" />
                              {new Date(doc.publishedAt).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              doc.status === 'active' ? 'default' : 
                              doc.status === 'processing' ? 'secondary' : 
                              'destructive'
                            }
                            data-testid={`badge-status-${doc.id}`}
                          >
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <AddToFolderButton docId={doc.id} docName={doc.originalFilename || doc.title} />
                            <Link href={`/regtech/query?docId=${doc.id}`}>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-query-${doc.id}`}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </Link>
                            {doc.url && (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`button-external-${doc.id}`}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                            {doc.filePath && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  window.open(`/api/regtech/document/${doc.id}/download`, '_blank');
                                }}
                                data-testid={`button-download-${doc.id}`}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(doc.id)}
                              disabled={deletingId === doc.id}
                              data-testid={`button-delete-${doc.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
          </div>
        )}
        </div>
    </RegTechLayout>
  );
}
