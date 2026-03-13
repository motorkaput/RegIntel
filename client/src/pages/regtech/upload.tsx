import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import RegTechLayout from "./layout";

interface FileUploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'active' | 'failed';
  documentId?: number;
  error?: string;
  extractedMetadata?: {
    title?: string;
    jurisdiction?: string;
    regulator?: string;
    instrumentType?: string;
    publishedAt?: string;
    effectiveAt?: string;
    summary?: string;
  };
}

export default function UploadPage() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [fileStatuses, setFileStatuses] = useState<FileUploadStatus[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      setFileStatuses(selectedFiles.map(file => ({
        file,
        status: 'pending',
      })));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    
    const fileWord = files.length === 1 ? 'document' : 'documents';
    toast({
      title: `Uploading ${fileWord}`,
      description: `Processing ${files.length} ${fileWord}...`,
    });
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      setFileStatuses(prev => prev.map((fs, idx) => 
        idx === i ? { ...fs, status: 'uploading' } : fs
      ));
      
      try {
        const data = new FormData();
        data.append('file', file);
        
        const response = await fetch('/api/regtech/upload', {
          method: 'POST',
          body: data,
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const result = await response.json();
        
        setFileStatuses(prev => prev.map((fs, idx) => 
          idx === i ? { ...fs, status: 'processing', documentId: result.documentId } : fs
        ));
        
        pollStatusForFile(result.documentId, i);
        successCount++;
        
      } catch (error) {
        setFileStatuses(prev => prev.map((fs, idx) => 
          idx === i ? { 
            ...fs, 
            status: 'failed',
            error: error instanceof Error ? error.message : "Upload failed"
          } : fs
        ));
        failCount++;
      }
    }
    
    setUploading(false);
    
    if (successCount > 0 && failCount === 0) {
      const successWord = successCount === 1 ? 'document' : 'documents';
      toast({
        title: "Upload complete",
        description: `${successCount} ${successWord} queued for processing`,
      });
    } else if (successCount > 0 && failCount > 0) {
      const successWord = successCount === 1 ? 'document' : 'documents';
      const failWord = failCount === 1 ? 'document' : 'documents';
      toast({
        title: "Upload partially complete",
        description: `${successCount} ${successWord} succeeded, ${failCount} ${failWord} failed`,
        variant: "destructive",
      });
    } else {
      const description = failCount === 1 
        ? "The upload failed. Please try again." 
        : `All ${failCount} uploads failed. Please try again.`;
      toast({
        title: "Upload failed",
        description,
        variant: "destructive",
      });
    }
  };

  const pollStatusForFile = async (docId: number, fileIndex: number) => {
    const maxAttempts = 60;
    let attempts = 0;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/regtech/document/${docId}/status`);
        const data = await response.json();
        
        if (data.status === 'active') {
          const docResponse = await fetch(`/api/regtech/document/${docId}`);
          const docData = await docResponse.json();
          const doc = docData.document;
          
          setFileStatuses(prev => prev.map((fs, idx) => 
            idx === fileIndex ? { 
              ...fs, 
              status: 'active',
              extractedMetadata: {
                title: doc.title,
                jurisdiction: doc.jurisdiction,
                regulator: doc.regulator,
                instrumentType: doc.instrumentType,
                publishedAt: doc.publishedAt,
                effectiveAt: doc.effectiveAt,
                summary: doc.metadata?.summary || undefined,
              }
            } : fs
          ));
          return true;
        } else if (data.status === 'failed') {
          setFileStatuses(prev => prev.map((fs, idx) => 
            idx === fileIndex ? { 
              ...fs, 
              status: 'failed',
              error: data.error || "Processing failed"
            } : fs
          ));
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Status check error:', error);
        return false;
      }
    };
    
    while (attempts < maxAttempts) {
      const done = await checkStatus();
      if (done) break;
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  return (
    <RegTechLayout>
      <div className="space-y-6">
        {/* Page Header - Bento style */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h1 className="text-2xl font-semibold text-slate-900" data-testid="text-page-title">
            Upload Documents
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Upload regulatory documents for AI-powered metadata extraction
          </p>
        </div>

        {/* Upload Card - Bento style */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Select Files</h2>
              <p className="text-sm text-slate-500">PDF, DOCX, or HTML documents</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div 
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-slate-300 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file')?.click()}
            >
              <FileUp className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-1">Drag and drop files here, or click to browse</p>
              <p className="text-xs text-slate-400">PDF, DOCX, HTML supported</p>
              <Input
                id="file"
                type="file"
                accept=".pdf,.docx,.html"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                data-testid="input-file"
                className="hidden"
              />
            </div>
            
            {files.length > 0 && (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-sm text-emerald-700 font-medium" data-testid="text-filename">
                  {files.length} {files.length === 1 ? 'file' : 'files'} selected
                </p>
              </div>
            )}

            {fileStatuses.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-700">Upload Progress</h3>
                {fileStatuses.map((fileStatus, index) => (
                  <div key={index} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-900 truncate max-w-[250px]" title={fileStatus.file.name}>
                        {fileStatus.file.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {fileStatus.status === 'pending' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-600">Pending</span>
                        )}
                        {fileStatus.status === 'uploading' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Uploading
                          </span>
                        )}
                        {fileStatus.status === 'processing' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Processing
                          </span>
                        )}
                        {fileStatus.status === 'active' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Complete
                          </span>
                        )}
                        {fileStatus.status === 'failed' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Failed
                          </span>
                        )}
                      </div>
                    </div>
                      
                      {fileStatus.error && (
                        <p className="text-xs text-red-600 mt-1">{fileStatus.error}</p>
                      )}
                      
                      {fileStatus.extractedMetadata && fileStatus.status === 'active' && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-xs font-semibold text-green-700">AI Extracted Information:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {fileStatus.extractedMetadata.title && (
                              <div>
                                <span className="font-medium text-muted-foreground">Title:</span>
                                <p className="text-foreground">{fileStatus.extractedMetadata.title}</p>
                              </div>
                            )}
                            {fileStatus.extractedMetadata.jurisdiction && (
                              <div>
                                <span className="font-medium text-muted-foreground">Jurisdiction:</span>
                                <p className="text-foreground">{fileStatus.extractedMetadata.jurisdiction}</p>
                              </div>
                            )}
                            {fileStatus.extractedMetadata.regulator && (
                              <div>
                                <span className="font-medium text-muted-foreground">Regulator:</span>
                                <p className="text-foreground">{fileStatus.extractedMetadata.regulator}</p>
                              </div>
                            )}
                            {fileStatus.extractedMetadata.instrumentType && (
                              <div>
                                <span className="font-medium text-muted-foreground">Type:</span>
                                <p className="text-foreground">{fileStatus.extractedMetadata.instrumentType}</p>
                              </div>
                            )}
                            {fileStatus.extractedMetadata.publishedAt && (
                              <div>
                                <span className="font-medium text-muted-foreground">Published:</span>
                                <p className="text-foreground">{new Date(fileStatus.extractedMetadata.publishedAt).toLocaleDateString()}</p>
                              </div>
                            )}
                            {fileStatus.extractedMetadata.effectiveAt && (
                              <div>
                                <span className="font-medium text-muted-foreground">Effective:</span>
                                <p className="text-foreground">{new Date(fileStatus.extractedMetadata.effectiveAt).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>
                          {fileStatus.extractedMetadata.summary && (
                            <div className="mt-2">
                              <span className="font-medium text-muted-foreground text-xs">Summary:</span>
                              <p className="text-xs text-foreground mt-1">{fileStatus.extractedMetadata.summary}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            <Button
              type="submit"
              disabled={uploading}
              data-testid="button-upload"
              className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 h-12"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading {files.length} {files.length === 1 ? 'file' : 'files'}...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload {files.length > 0 ? `${files.length} ${files.length === 1 ? 'Document' : 'Documents'}` : 'Documents'}
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </RegTechLayout>
  );
}
