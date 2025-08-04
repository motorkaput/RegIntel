import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Clock, CheckCircle, XCircle, BarChart3, Brain, FileSearch } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import LoadingSkeleton from "@/components/ui/loading-skeleton";
import LoadingButton from "@/components/ui/loading-button";
import LoadingOverlay from "@/components/ui/loading-overlay";

interface Document {
  id: number;
  originalName: string;
  status: 'processing' | 'completed' | 'failed';
  score: number;
  sentiment: string;
  analysis: any;
  extractedText: string;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentAnalyzer() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest('POST', '/api/documents/upload', formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded successfully and is being processed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setSelectedDocument(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadMutation.mutate(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadMutation.mutate(files[0]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-500';
      case 'negative':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (isLoading || documentsLoading) {
    return <LoadingSpinner variant="branded" text="Loading document analyzer..." />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Document <span className="text-neon-green">Analyzer</span>
            </h1>
            <p className="text-xl text-gray-300">
              Upload documents for AI-powered analysis, extraction, and insights generation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-1">
              <Card className="bg-dark-gray border-neon-green/20 mb-6">
                <CardHeader>
                  <CardTitle className="text-neon-green flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Document
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive ? 'border-neon-green bg-neon-green/5' : 'border-gray-600'
                    }`}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={() => setDragActive(true)}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                  >
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-4">
                      Drag and drop a file here, or click to select
                    </p>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="file-upload">
                      <LoadingButton
                        as="div"
                        className="bg-neon-green text-black hover:bg-neon-cyan cursor-pointer"
                        isLoading={uploadMutation.isPending}
                        loadingText="Uploading..."
                      >
                        Select File
                      </LoadingButton>
                    </label>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG
                  </p>
                </CardContent>
              </Card>

              {/* Document List */}
              <Card className="bg-dark-gray border-neon-green/20">
                <CardHeader>
                  <CardTitle className="text-neon-green">Recent Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documents?.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">
                        No documents uploaded yet
                      </p>
                    ) : (
                      documents?.map((doc) => (
                        <div
                          key={doc.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedDocument?.id === doc.id
                              ? 'border-neon-green bg-neon-green/5'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm truncate">
                              {doc.originalName}
                            </span>
                            {getStatusIcon(doc.status)}
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {doc.status}
                            </Badge>
                            {doc.score && (
                              <span className="text-xs text-neon-green">
                                Score: {doc.score}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Results */}
            <div className="lg:col-span-2">
              {selectedDocument ? (
                <Card className="bg-dark-gray border-neon-green/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-neon-green flex items-center">
                        <FileSearch className="w-5 h-5 mr-2" />
                        Analysis Results
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(selectedDocument.id)}
                        disabled={deleteMutation.isPending}
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">{selectedDocument.originalName}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-neon-green">
                            {selectedDocument.score || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-400">Quality Score</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getSentimentColor(selectedDocument.sentiment)}`}>
                            {selectedDocument.sentiment || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-400">Sentiment</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-neon-green">
                            {selectedDocument.status === 'completed' ? '100%' : '...'}
                          </div>
                          <div className="text-sm text-gray-400">Processed</div>
                        </div>
                      </div>
                      {selectedDocument.status === 'processing' && (
                        <Progress value={60} className="mb-4" />
                      )}
                    </div>

                    <Tabs defaultValue="insights" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="insights">Insights</TabsTrigger>
                        <TabsTrigger value="text">Extracted Text</TabsTrigger>
                        <TabsTrigger value="analysis">Analysis</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="insights" className="space-y-4">
                        {selectedDocument.analysis ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Card className="bg-darker-gray border-gray-600">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm">Document Stats</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Word Count:</span>
                                      <span>{selectedDocument.analysis.wordCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Sentences:</span>
                                      <span>{selectedDocument.analysis.sentenceCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Readability:</span>
                                      <span>{Math.round(selectedDocument.analysis.readabilityScore)}%</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card className="bg-darker-gray border-gray-600">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm">Key Topics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedDocument.analysis.keyTopics?.map((topic: string, index: number) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {topic}
                                      </Badge>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            <Card className="bg-darker-gray border-gray-600">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Summary</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-gray-300">{selectedDocument.analysis.summary}</p>
                              </CardContent>
                            </Card>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400">Analysis not available</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="text" className="space-y-4">
                        <Card className="bg-darker-gray border-gray-600">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Extracted Text</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="max-h-96 overflow-y-auto">
                              <pre className="text-gray-300 text-sm whitespace-pre-wrap">
                                {selectedDocument.extractedText || 'No text extracted yet'}
                              </pre>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="analysis" className="space-y-4">
                        <Card className="bg-darker-gray border-gray-600">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Raw Analysis Data</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="max-h-96 overflow-y-auto">
                              <pre className="text-gray-300 text-sm">
                                {selectedDocument.analysis ? 
                                  JSON.stringify(selectedDocument.analysis, null, 2) : 
                                  'No analysis data available'
                                }
                              </pre>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-dark-gray border-neon-green/20">
                  <CardContent className="py-16">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Select a Document</h3>
                      <p className="text-gray-400">
                        Choose a document from the list to view its analysis results
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
