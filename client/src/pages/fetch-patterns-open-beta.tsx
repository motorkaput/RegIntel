import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Upload, MessageSquare, Download, LogOut, HelpCircle, Sparkles } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import * as d3 from 'd3';
import jsPDF from 'jspdf';

// Animated fetch dog component
const FetchDog = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-2 mb-4">
      <div className={`text-2xl transition-transform duration-500 ${isAnimating ? 'animate-bounce' : ''}`}>
        🐕
      </div>
      <span className="text-sm text-muted-foreground">
        Your AI fetch companion is ready to analyze documents
      </span>
    </div>
  );
};

// Tooltip component for technical terms
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help border-b border-dotted border-gray-400"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 p-2 text-xs bg-gray-800 text-white rounded shadow-lg -top-8 left-0 min-w-max max-w-xs">
          {content}
        </div>
      )}
    </div>
  );
};

export default function FetchPatternsOpenBeta() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [question, setQuestion] = useState('');
  const [contextQuery, setContextQuery] = useState('');
  
  // Pastel colors theme
  const colors = {
    primary: '#8B5FBF', // Soft purple
    secondary: '#FF8A80', // Soft coral
    accent: '#81C784', // Soft green
    background: '#f1f5f9', // Light grey background
    surface: '#FFFFFF',
    text: '#4A4A4A',
    muted: '#A1A1A1'
  };

  // Get user from localStorage
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('fetchPatternsUser');
    return userData ? JSON.parse(userData) : null;
  });

  // Listen for localStorage changes (when user logs in from another tab or refreshes)
  useEffect(() => {
    const handleStorageChange = () => {
      const userData = localStorage.getItem('fetchPatternsUser');
      setUser(userData ? JSON.parse(userData) : null);
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Check localStorage on component mount
    handleStorageChange();
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      setLocation('/fetch-patterns-open-login');
    }
  }, [user, setLocation]);

  // Fetch user's document analyses
  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ['/api/fetch-patterns-open/analyses', user?.id],
    enabled: !!user?.id,
    refetchInterval: 3000, // Poll every 3 seconds for updates
    queryFn: async () => {
      const response = await apiRequest(`/api/fetch-patterns-open/analyses?userId=${user.id}`, 'GET');
      return response as unknown as any[];
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('userId', user.id);
      
      const response = await fetch('/api/fetch-patterns-open/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload successful!",
        description: "Your documents are being processed. Results will appear shortly.",
      });
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      queryClient.invalidateQueries({ queryKey: ['/api/fetch-patterns-open/analyses'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Question answering mutation
  const askMutation = useMutation({
    mutationFn: async (questionText: string) => {
      return await apiRequest('/api/fetch-patterns-open/ask', 'POST', {
        question: questionText,
        userId: user.id,
      }) as any;
    },
    onError: (error: Error) => {
      toast({
        title: "Question failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Context analysis mutation
  const contextMutation = useMutation({
    mutationFn: async (context: string) => {
      return await apiRequest('/api/fetch-patterns-open/analyze-context', 'POST', {
        context,
        userId: user.id,
      }) as any;
    },
    onError: (error: Error) => {
      toast({
        title: "Context analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload first.",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate(selectedFiles);
  };

  const handleAskQuestion = () => {
    if (!question.trim()) {
      toast({
        title: "Empty question",
        description: "Please enter a question first.",
        variant: "destructive",
      });
      return;
    }
    
    askMutation.mutate(question.trim());
  };

  const handleContextAnalysis = () => {
    if (!contextQuery.trim()) {
      toast({
        title: "Empty context",
        description: "Please enter a context to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    contextMutation.mutate(contextQuery.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem('fetchPatternsUser');
    setUser(null);
    setLocation('/fetch-patterns-open-login');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Header
    doc.setFontSize(18);
    doc.setTextColor(139, 95, 191); // Primary color
    doc.text('Fetch Patterns - Document Analysis Report', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setTextColor(74, 74, 74);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
    doc.text(`User: ${user.displayName}`, pageWidth - margin - 60, yPosition);
    yPosition += 20;

    // Summary
    const completedAnalyses = analyses.filter(a => a.status === 'completed');
    doc.setFontSize(14);
    doc.setTextColor(139, 95, 191);
    doc.text('Summary', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(74, 74, 74);
    doc.text(`Total Documents Analyzed: ${completedAnalyses.length}`, margin, yPosition);
    yPosition += 8;

    // Document details
    completedAnalyses.slice(0, 10).forEach((analysis, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(12);
      doc.setTextColor(139, 95, 191);
      doc.text(`${index + 1}. ${analysis.originalName}`, margin, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setTextColor(74, 74, 74);
      
      if (analysis.classification) {
        doc.text(`Classification: ${analysis.classification}`, margin + 5, yPosition);
        yPosition += 6;
      }

      if (analysis.sentiment) {
        doc.text(`Sentiment: ${analysis.sentiment.label} (${(analysis.sentiment.score * 100).toFixed(1)}%)`, margin + 5, yPosition);
        yPosition += 6;
      }

      if (analysis.summary) {
        const summaryLines = doc.splitTextToSize(analysis.summary, pageWidth - margin * 2 - 10);
        doc.text('Summary:', margin + 5, yPosition);
        yPosition += 6;
        doc.text(summaryLines, margin + 10, yPosition);
        yPosition += summaryLines.length * 4 + 5;
      }

      yPosition += 5;
    });

    doc.save(`fetch-patterns-report-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF Downloaded",
      description: "Your analysis report has been downloaded successfully.",
    });
  };

  if (!user) {
    return null; // Will redirect
  }

  const completedAnalyses = analyses.filter(a => a.status === 'completed');
  const processingAnalyses = analyses.filter(a => a.status === 'processing');

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: colors.primary }}>
              Fetch Patterns Open Beta
            </h1>
            <p className="text-lg mt-2" style={{ color: colors.text }}>
              Welcome back, <span className="font-medium">{user.displayName}</span>!
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setLocation('/fetch-patterns-guide')}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              User Guide
            </Button>
            <Button
              onClick={downloadPDF}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
              disabled={completedAnalyses.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <FetchDog />

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-purple-200">
            <TabsTrigger value="upload" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <FileText className="w-4 h-4 mr-2" />
              Documents ({analyses.length})
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <MessageSquare className="w-4 h-4 mr-2" />
              Q&A
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card className="border border-purple-200">
              <CardHeader>
                <CardTitle style={{ color: colors.primary }}>Upload Documents</CardTitle>
                <CardDescription>
                  Upload your documents for AI-powered analysis. Supports PDF, DOCX, XLSX, images, and PPTX files.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.pptx"
                    onChange={handleFileSelect}
                    className="border-purple-200 focus:border-purple-400"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFiles.map(f => f.name).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending || selectedFiles.length === 0}
                  className="w-full"
                  style={{ backgroundColor: colors.primary }}
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload & Analyze'}
                </Button>

                {processingAnalyses.length > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertDescription>
                      {processingAnalyses.length} document(s) are currently being processed...
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card className="border border-purple-200">
              <CardHeader>
                <CardTitle style={{ color: colors.primary }}>Document Analysis Results</CardTitle>
                <CardDescription>
                  View the AI analysis results for your uploaded documents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {isLoading ? (
                    <div className="text-center py-8">Loading documents...</div>
                  ) : analyses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No documents uploaded yet. Start by uploading some files!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analyses.map((analysis) => (
                        <Card key={analysis.id} className="border border-gray-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{analysis.originalName}</CardTitle>
                              <Badge
                                variant={analysis.status === 'completed' ? 'default' : 
                                        analysis.status === 'processing' ? 'secondary' : 'destructive'}
                                style={{
                                  backgroundColor: analysis.status === 'completed' ? colors.accent : 
                                                 analysis.status === 'processing' ? colors.secondary : '#ef4444'
                                }}
                              >
                                {analysis.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {analysis.status === 'completed' && (
                              <div className="space-y-3">
                                {analysis.classification && (
                                  <div>
                                    <span className="font-medium">
                                      <Tooltip content="AI classification of document type based on content analysis">
                                        Classification:
                                      </Tooltip>
                                    </span> {analysis.classification}
                                  </div>
                                )}
                                
                                {analysis.sentiment && (
                                  <div>
                                    <span className="font-medium">
                                      <Tooltip content="Emotional tone detected in the document content">
                                        Sentiment:
                                      </Tooltip>
                                    </span> {analysis.sentiment.label} ({(analysis.sentiment.score * 100).toFixed(1)}%)
                                  </div>
                                )}

                                {analysis.summary && (
                                  <div>
                                    <span className="font-medium">
                                      <Tooltip content="AI-generated summary of key points and main themes">
                                        Summary:
                                      </Tooltip>
                                    </span>
                                    <p className="mt-1 text-sm text-muted-foreground">{analysis.summary}</p>
                                  </div>
                                )}

                                {analysis.keywords && analysis.keywords.length > 0 && (
                                  <div>
                                    <span className="font-medium">
                                      <Tooltip content="Important terms and concepts extracted from the document">
                                        Keywords:
                                      </Tooltip>
                                    </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {analysis.keywords.slice(0, 8).map((keyword: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {keyword}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {analysis.status === 'processing' && (
                              <div className="space-y-2">
                                <Progress value={33} className="w-full" />
                                <p className="text-sm text-muted-foreground">
                                  AI is analyzing your document...
                                </p>
                              </div>
                            )}

                            {analysis.status === 'error' && (
                              <Alert className="border-red-200 bg-red-50">
                                <AlertDescription className="text-red-700">
                                  Error: {analysis.processingError || 'Failed to process document'}
                                </AlertDescription>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Q&A Tab */}
          <TabsContent value="chat">
            <Card className="border border-purple-200">
              <CardHeader>
                <CardTitle style={{ color: colors.primary }}>Ask Questions</CardTitle>
                <CardDescription>
                  Ask questions about your uploaded documents and get AI-powered answers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Ask a question about your documents..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="border-purple-200 focus:border-purple-400"
                    rows={3}
                  />
                  <Button
                    onClick={handleAskQuestion}
                    disabled={askMutation.isPending || !question.trim() || completedAnalyses.length === 0}
                    style={{ backgroundColor: colors.primary }}
                  >
                    {askMutation.isPending ? 'Asking...' : 'Ask Question'}
                  </Button>
                </div>

                {askMutation.data && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-green-800">Answer:</span>
                          <p className="mt-1">{askMutation.data.answer}</p>
                        </div>
                        
                        {askMutation.data.confidence && (
                          <div>
                            <span className="font-medium text-green-800">
                              <Tooltip content="AI confidence level in the provided answer">
                                Confidence:
                              </Tooltip>
                            </span> {(askMutation.data.confidence * 100).toFixed(1)}%
                          </div>
                        )}

                        {askMutation.data.sources && askMutation.data.sources.length > 0 && (
                          <div>
                            <span className="font-medium text-green-800">Sources:</span>
                            <ul className="mt-1 list-disc list-inside text-sm">
                              {askMutation.data.sources.map((source: string, idx: number) => (
                                <li key={idx}>{source}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {completedAnalyses.length === 0 && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription>
                      Upload and process some documents first to start asking questions.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <Card className="border border-purple-200">
              <CardHeader>
                <CardTitle style={{ color: colors.primary }}>Document Insights</CardTitle>
                <CardDescription>
                  Get contextual analysis and insights from your document collection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Enter a topic or context to analyze..."
                    value={contextQuery}
                    onChange={(e) => setContextQuery(e.target.value)}
                    className="border-purple-200 focus:border-purple-400"
                  />
                  <Button
                    onClick={handleContextAnalysis}
                    disabled={contextMutation.isPending || !contextQuery.trim() || completedAnalyses.length === 0}
                    style={{ backgroundColor: colors.primary }}
                  >
                    {contextMutation.isPending ? 'Analyzing...' : 'Analyze Context'}
                  </Button>
                </div>

                {contextMutation.data && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-blue-800">
                            <Tooltip content="Number of document mentions found for this context">
                              Mentions:
                            </Tooltip>
                          </span> {contextMutation.data.mentions}
                        </div>

                        {contextMutation.data.sentimentBreakdown && (
                          <div>
                            <span className="font-medium text-blue-800">
                              <Tooltip content="Overall sentiment distribution across mentions">
                                Sentiment Breakdown:
                              </Tooltip>
                            </span>
                            <div className="flex space-x-4 mt-1 text-sm">
                              <span className="text-green-600">
                                Positive: {contextMutation.data.sentimentBreakdown.positive}%
                              </span>
                              <span className="text-gray-600">
                                Neutral: {contextMutation.data.sentimentBreakdown.neutral}%
                              </span>
                              <span className="text-red-600">
                                Negative: {contextMutation.data.sentimentBreakdown.negative}%
                              </span>
                            </div>
                          </div>
                        )}

                        {contextMutation.data.summary && (
                          <div>
                            <span className="font-medium text-blue-800">Analysis Summary:</span>
                            <p className="mt-1">{contextMutation.data.summary}</p>
                          </div>
                        )}

                        {contextMutation.data.keyPhrases && contextMutation.data.keyPhrases.length > 0 && (
                          <div>
                            <span className="font-medium text-blue-800">Key Phrases:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {contextMutation.data.keyPhrases.slice(0, 10).map((phrase: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {phrase}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {completedAnalyses.length === 0 && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription>
                      Upload and process some documents first to start getting insights.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}