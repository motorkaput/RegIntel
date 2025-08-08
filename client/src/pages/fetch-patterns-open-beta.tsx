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
import cloud from 'd3-cloud';
import jsPDF from 'jspdf';

// Animated fetch companion component
const FetchCompanion = ({ isProcessing }: { isProcessing: boolean }) => {
  const [position, setPosition] = useState(0);
  
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setPosition(prev => (prev + 3) % 100);
      }, 80);
      return () => clearInterval(interval);
    } else {
      setPosition(0);
    }
  }, [isProcessing]);

  return (
    <div className="flex items-center space-x-2 mb-4 relative overflow-hidden">
      <div 
        className={`text-2xl transition-all duration-300 ${isProcessing ? 'animate-none' : ''}`}
        style={{ 
          transform: isProcessing ? `translateX(${position * 3}px)` : 'translateX(0px)'
        }}
      >
        🦮
      </div>
      <span className="text-sm ml-8" style={{ color: colors.text }}>
        {isProcessing ? 'Fetching insights from your documents...' : 'Your AI fetch companion is ready to analyze documents'}
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
  const [wordCloudGenerated, setWordCloudGenerated] = useState(false);
  const wordCloudRef = useRef<SVGSVGElement>(null);
  
  // Pastel colors theme
  const colors = {
    primary: '#8B5FBF', // Soft purple
    secondary: '#FF8A80', // Soft coral
    accent: '#81C784', // Soft green
    background: '#f1f5f9', // Light grey background
    surface: '#FFFFFF',
    text: '#000000', // Black text for better readability
    muted: '#4A4A4A'
  };

  // Get user from localStorage
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('fetchPatternsUser');
    console.log('Initial user data from localStorage:', userData);
    return userData ? JSON.parse(userData) : null;
  });

  // Listen for localStorage changes (when user logs in from another tab or refreshes)
  useEffect(() => {
    const handleStorageChange = () => {
      const userData = localStorage.getItem('fetchPatternsUser');
      console.log('Storage change detected, user data:', userData);
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
      console.log('No user found, redirecting to login');
      setLocation('/fetch-patterns-open-login');
    } else {
      console.log('User is logged in:', user);
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
      // Check both user object and localStorage for user data
      const currentUser = user || JSON.parse(localStorage.getItem('fetchPatternsUser') || 'null');
      
      if (!currentUser?.id) {
        console.error('No user found:', { user, localStorage: localStorage.getItem('fetchPatternsUser') });
        throw new Error('User not authenticated. Please refresh and try again.');
      }
      
      console.log('Upload attempt with user:', currentUser);
      
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('userId', currentUser.id);
      
      const response = await fetch('/api/fetch-patterns-open/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Upload error:', error);
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

  // Word Cloud generation function
  const generateWordCloud = () => {
    if (completedAnalyses.length === 0) {
      toast({
        title: "No documents available",
        description: "Upload and process some documents first to generate a word cloud.",
        variant: "destructive",
      });
      return;
    }

    // Extract all words from document analyses
    const allWords: string[] = [];
    completedAnalyses.forEach(analysis => {
      if (analysis.keyPhrases) {
        allWords.push(...analysis.keyPhrases);
      }
      if (analysis.extractedText) {
        const words = analysis.extractedText
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter((word: string) => word.length > 3 && !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'they', 'have', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'would', 'there', 'could', 'other', 'more', 'very', 'what', 'know', 'just', 'first', 'into', 'over', 'think', 'also', 'your', 'work', 'life', 'only'].includes(word));
        allWords.push(...words);
      }
    });

    // Count word frequencies
    const wordCounts: { [key: string]: number } = {};
    allWords.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Convert to array and sort by frequency
    const wordsArray = Object.entries(wordCounts)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Top 50 words

    // Create word cloud
    const svg = d3.select(wordCloudRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const width = 600;
    const height = 400;
    
    svg.attr("width", width).attr("height", height);

    const layout = cloud()
      .size([width, height])
      .words(wordsArray as any)
      .padding(5)
      .rotate(() => ~~(Math.random() * 2) * 90)
      .font("Impact")
      .fontSize((d: any) => Math.max(12, Math.min(40, d.count * 8)))
      .on("end", (words: any) => {
        svg.append("g")
          .attr("transform", `translate(${width/2},${height/2})`)
          .selectAll("text")
          .data(words)
          .enter().append("text")
          .style("font-size", (d: any) => `${d.size}px`)
          .style("font-family", "Impact")
          .style("fill", (d: any, i: number) => d3.schemeCategory10[i % 10])
          .attr("text-anchor", "middle")
          .attr("transform", (d: any) => `translate(${d.x},${d.y})rotate(${d.rotate})`)
          .text((d: any) => d.text || '');
      });

    layout.start();
    setWordCloudGenerated(true);

    toast({
      title: "Word Cloud Generated",
      description: "Your document word cloud has been created successfully.",
    });
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
      {/* Dark Street Tech Header */}
      <header className="bg-gray-900 text-white py-3 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-white">Dark Street Tech</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-300">Fetch Patterns Open Beta</span>
            </div>
            <div className="text-sm text-gray-400">
              Advanced AI Document Analysis
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: colors.primary }}>
              Fetch Patterns Open Beta
            </h1>
            <p className="text-lg mt-2 text-black">
              Welcome back, <span className="font-medium">{user?.displayName || user?.email || 'User'}</span>!
            </p>
            {/* Temporary debug - remove after fixing */}
            {!user?.displayName && (
              <div className="text-xs text-red-600 mt-1">
                Debug: Missing displayName. Please sign out and log in again.
              </div>
            )}
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

        <FetchCompanion isProcessing={processingAnalyses.length > 0} />

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-purple-200">
            <TabsTrigger value="upload" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              Upload
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              Documents ({analyses.length})
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              Q&A
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card className="border border-purple-200">
              <CardHeader>
                <CardTitle style={{ color: colors.primary }}>Upload Documents</CardTitle>
                <CardDescription className="text-black">
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
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleContextAnalysis}
                      disabled={contextMutation.isPending || !contextQuery.trim() || completedAnalyses.length === 0}
                      style={{ backgroundColor: colors.primary }}
                    >
                      {contextMutation.isPending ? 'Analyzing...' : 'Analyze Context'}
                    </Button>
                    <Button
                      onClick={generateWordCloud}
                      disabled={completedAnalyses.length === 0}
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      Generate Word Cloud
                    </Button>
                  </div>
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

                {/* Word Cloud Display */}
                {wordCloudGenerated && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-800">Word Cloud Visualization</CardTitle>
                      <CardDescription>
                        Visual representation of the most frequent words from your documents.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center">
                        <svg
                          ref={wordCloudRef}
                          className="border border-green-300 rounded-lg bg-white"
                        />
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
      
      {/* Dark Street Tech Footer */}
      <footer className="bg-gray-900 text-white py-6 border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Dark Street Tech</h3>
              <p className="text-gray-400 text-sm">Advanced AI-Powered Document Analysis Solutions</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">© 2025 Dark Street Tech. All rights reserved.</p>
              <p className="text-gray-500 text-xs mt-1">Fetch Patterns Open Beta v1.0</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}