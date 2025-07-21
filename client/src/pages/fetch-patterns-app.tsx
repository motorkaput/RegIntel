import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  BarChart3, 
  Brain, 
  Target, 
  TrendingUp,
  Download,
  Eye,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface DocumentAnalysis {
  id: string;
  filename: string;
  uploadDate: string;
  status: 'processing' | 'completed' | 'error';
  classification?: string;
  sentiment?: {
    label: string;
    score: number;
    reasoning: string;
  };
  keywords?: string[];
  insights?: string[];
  riskFlags?: string[];
  summary?: string;
  wordCloud?: Array<{ text: string; value: number; }>;
}

export default function FetchPatternsApp() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [activeTab, setActiveTab] = useState("upload");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access Fetch Patterns.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user's document analyses
  const { data: analyses = [], refetch } = useQuery<DocumentAnalysis[]>({
    queryKey: ["/api/fetch-patterns/analyses"],
    enabled: isAuthenticated,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      const response = await fetch('/api/fetch-patterns/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: "Your documents are being analyzed. Check the Dashboard for results.",
      });
      setSelectedFiles(null);
      setActiveTab("dashboard");
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = () => {
    if (selectedFiles && selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue mx-auto"></div>
          <p className="text-secondary">Loading Fetch Patterns...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-surface-white">
      {/* Header */}
      <div className="border-b border-border-light">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-primary">Fetch Patterns</h1>
              <p className="text-secondary mt-1">AI-powered document analysis and insights</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-accent-blue/10 text-accent-blue border-accent-blue/20">
                {analyses.length} Documents Analyzed
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Documents
                </CardTitle>
                <CardDescription>
                  Upload documents for AI analysis. Supported formats: PDF, DOCX, PPTX, TXT, and images.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="files">Select Files</Label>
                  <Input
                    id="files"
                    type="file"
                    multiple
                    accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg"
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="cursor-pointer"
                  />
                  {selectedFiles && (
                    <p className="text-sm text-secondary">
                      {selectedFiles.length} file(s) selected
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleFileUpload}
                  disabled={!selectedFiles || selectedFiles.length === 0 || uploadMutation.isPending}
                  className="w-full"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Uploading & Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Analyze
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6">
              {analyses.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-12 h-12 text-secondary/50 mb-4" />
                    <h3 className="text-lg font-medium text-primary mb-2">No Documents Yet</h3>
                    <p className="text-secondary mb-4">Upload your first document to start analyzing patterns and insights.</p>
                    <Button onClick={() => setActiveTab("upload")} variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                analyses.map((analysis: DocumentAnalysis) => (
                  <Card key={analysis.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          {analysis.filename}
                        </CardTitle>
                        <Badge 
                          variant={analysis.status === 'completed' ? 'default' : analysis.status === 'processing' ? 'secondary' : 'destructive'}
                        >
                          {analysis.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {analysis.status === 'processing' && <Clock className="w-3 h-3 mr-1 animate-spin" />}
                          {analysis.status === 'error' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {analysis.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Uploaded {new Date(analysis.uploadDate).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    {analysis.status === 'completed' && (
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {analysis.classification && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-primary">Classification</h4>
                              <Badge variant="outline">{analysis.classification}</Badge>
                            </div>
                          )}
                          {analysis.sentiment && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-primary">Sentiment</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant={analysis.sentiment.label === 'positive' ? 'default' : analysis.sentiment.label === 'negative' ? 'destructive' : 'secondary'}>
                                  {analysis.sentiment.label}
                                </Badge>
                                <span className="text-sm text-secondary">
                                  {(analysis.sentiment.score * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )}
                          {analysis.keywords && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-primary">Key Topics</h4>
                              <div className="flex flex-wrap gap-1">
                                {analysis.keywords.slice(0, 3).map((keyword, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                                {analysis.keywords.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{analysis.keywords.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        {analysis.summary && (
                          <div className="mt-4 p-4 bg-surface-light rounded-lg">
                            <h4 className="font-medium text-primary mb-2">Summary</h4>
                            <p className="text-secondary text-sm">{analysis.summary}</p>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Insights
                </CardTitle>
                <CardDescription>
                  Advanced insights and patterns detected across your documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-secondary/50 mx-auto mb-4" />
                  <p className="text-secondary">Insights will appear here after document analysis</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Analysis Reports
                </CardTitle>
                <CardDescription>
                  Export and download comprehensive analysis reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-secondary/50 mx-auto mb-4" />
                  <p className="text-secondary">Reports will be available after document analysis</p>
                  <Button variant="outline" className="mt-4" disabled>
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}