import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import WordCloud from "@/components/WordCloud";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, Brain, BarChart3, Upload, Download } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import fetchPatternsIcon from "@assets/FetchPatterns_Icon_1752663550310_1753148786989.png";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import html2canvas from 'html2canvas';
import { useLocation } from "wouter";
import jsPDF from 'jspdf';

interface DocumentAnalysis {
  id: string;
  filename: string;
  originalName: string;
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
  wordCount?: number;
  emotionalTone?: string[];
  keyPhrases?: string[];
  extractedText?: string;
}

interface ContextAnalysis {
  context: string;
  mentions: number;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  emotionalTone: string[];
  keyPhrases: string[];
  summary: string;
}

interface AnalysisProcessingProps {
  completedCount: number;
  totalCount: number;
}

function AnalysisProcessingAnimation({ completedCount, totalCount }: AnalysisProcessingProps) {
  const [currentDot, setCurrentDot] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDot(prev => (prev + 1) % 3);
    }, 600);
    
    return () => clearInterval(interval);
  }, []);

  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-border-light bg-surface-light">
      {/* Fetch Dog Animation */}
      <div className="mb-6">
        <div className="w-24 h-24 bg-accent-blue rounded-full flex items-center justify-center">
          <div className="text-white text-2xl">🐕</div>
        </div>
        <div className="mt-2 text-center">
          <div className="flex justify-center items-center space-x-1">
            <span className="text-sm text-secondary">Fetching patterns</span>
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`text-accent-blue transition-opacity duration-300 ${
                  currentDot === index ? 'opacity-100' : 'opacity-30'
                }`}
              >
                .
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-secondary mb-2">
          <span>Processing documents</span>
          <span>{completedCount}/{totalCount}</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
    </div>
  );
}

export default function FetchPatternsEnhanced() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [question, setQuestion] = useState("");
  const [contextQuery, setContextQuery] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<DocumentAnalysis | null>(null);
  const [questionHistory, setQuestionHistory] = useState<Array<{question: string; answer: any}>>([]);
  const [contextHistory, setContextHistory] = useState<Array<{query: string; result: ContextAnalysis}>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Function to handle logout
  const handleLogout = () => {
    // Clear all data and redirect to enhanced login
    setUploadedFiles([]);
    setQuestionHistory([]);
    setContextHistory([]);
    setSelectedAnalysis(null);
    setQuestion("");
    setContextQuery("");
    setLocation('/enhanced-login');
  };

  // Get analyses specific to enhanced user
  const { data: completedAnalyses = [] } = useQuery<DocumentAnalysis[]>({
    queryKey: ["/api/document-analyses/enhanced_user_1"],
    refetchInterval: 2000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await apiRequest("POST", "/api/upload", formData);
      return response;
    },
    onSuccess: () => {
      setUploadedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["/api/document-analyses/enhanced_user_1"] });
      toast({
        title: "Upload successful",
        description: "Your documents are being processed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload documents",
        variant: "destructive",
      });
    },
  });

  const questionMutation = useMutation({
    mutationFn: async (questionData: { question: string; documents: DocumentAnalysis[] }) => {
      const response = await apiRequest("POST", "/api/question", questionData);
      return response;
    },
    onSuccess: (data, variables) => {
      setQuestionHistory(prev => [...prev, { question: variables.question, answer: data }]);
      setQuestion("");
    },
    onError: (error: any) => {
      toast({
        title: "Question failed",
        description: error.message || "Failed to process question",
        variant: "destructive",
      });
    },
  });

  const contextMutation = useMutation({
    mutationFn: async (contextData: { context: string; documents: DocumentAnalysis[] }) => {
      const response = await apiRequest("POST", "/api/context-analysis", contextData);
      return response;
    },
    onSuccess: (data: ContextAnalysis, variables) => {
      setContextHistory(prev => [...prev, { query: variables.context, result: data }]);
      setContextQuery("");
    },
    onError: (error: any) => {
      toast({
        title: "Context analysis failed",
        description: error.message || "Failed to analyze context",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadedFiles(files);
    uploadMutation.mutate(files);
  };

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    questionMutation.mutate({ question, documents: completedAnalyses });
  };

  const handleContextAnalysis = () => {
    if (!contextQuery.trim()) return;
    contextMutation.mutate({ context: contextQuery, documents: completedAnalyses });
  };

  // Enhanced PDF generation function
  const generatePDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add text with wrapping
    const addText = (text: string, size: number = 12, isBold: boolean = false) => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const lines = pdf.splitTextToSize(text, contentWidth);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += size * 0.6;
      });
      yPosition += 5;
    };

    // Title
    addText('Fetch Patterns Enhanced - Analysis Report', 18, true);
    addText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
    addText('', 12); // spacing

    // Document Summary
    addText('Document Analysis Summary', 16, true);
    addText(`Total Documents Analyzed: ${completedAnalyses.length}`, 12);
    
    // Sentiment breakdown
    if (completedAnalyses.length > 0) {
      const sentimentCounts = completedAnalyses.reduce((acc: any, doc) => {
        if (doc.sentiment) {
          acc[doc.sentiment.label] = (acc[doc.sentiment.label] || 0) + 1;
        }
        return acc;
      }, {});

      addText('Sentiment Distribution:', 14, true);
      Object.entries(sentimentCounts).forEach(([sentiment, count]) => {
        addText(`${sentiment}: ${count}`, 12);
      });
    }

    addText('', 12); // spacing

    // Individual document analyses
    addText('Individual Document Analyses', 16, true);
    completedAnalyses.forEach((doc, index) => {
      addText(`${index + 1}. ${doc.originalName}`, 14, true);
      addText(`Upload Date: ${new Date(doc.uploadDate).toLocaleDateString()}`, 10);
      
      if (doc.classification) {
        addText(`Classification: ${doc.classification}`, 12);
      }
      
      if (doc.sentiment) {
        addText(`Sentiment: ${doc.sentiment.label} (${(doc.sentiment.score * 100).toFixed(1)}%)`, 12);
        addText(`Reasoning: ${doc.sentiment.reasoning}`, 11);
      }
      
      if (doc.summary) {
        addText('Summary:', 12, true);
        addText(doc.summary, 11);
      }
      
      if (doc.keywords && doc.keywords.length > 0) {
        addText(`Keywords: ${doc.keywords.slice(0, 10).join(', ')}`, 11);
      }
      
      if (doc.insights && doc.insights.length > 0) {
        addText('Key Insights:', 12, true);
        doc.insights.slice(0, 3).forEach(insight => {
          addText(`• ${insight}`, 11);
        });
      }
      
      if (doc.riskFlags && doc.riskFlags.length > 0) {
        addText(`Risk Flags: ${doc.riskFlags.join(', ')}`, 11);
      }
      
      if (doc.wordCount) {
        addText(`Word Count: ${doc.wordCount}`, 11);
      }
      
      addText('', 12); // spacing between documents
    });

    // Q&A History
    if (questionHistory.length > 0) {
      addText('Question & Answer History', 16, true);
      questionHistory.forEach((qa, index) => {
        addText(`Q${index + 1}: ${qa.question}`, 12, true);
        addText(`Answer: ${qa.answer.answer}`, 11);
        if (qa.answer.confidence) {
          addText(`Confidence: ${(qa.answer.confidence * 100).toFixed(1)}%`, 10);
        }
        addText('', 10); // spacing
      });
    }

    // Context Analysis History
    if (contextHistory.length > 0) {
      addText('Context Analysis History', 16, true);
      contextHistory.forEach((context, index) => {
        addText(`Context ${index + 1}: ${context.query}`, 12, true);
        addText(`Mentions: ${context.result.mentions}`, 11);
        addText(`Summary: ${context.result.summary}`, 11);
        addText('', 10); // spacing
      });
    }

    // Save the PDF
    pdf.save(`fetch-patterns-enhanced-report-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF Report Generated",
      description: "Your comprehensive analysis report has been downloaded.",
    });
  };

  const processingCount = completedAnalyses.filter(doc => doc.status === 'processing').length;
  const completedCount = completedAnalyses.filter(doc => doc.status === 'completed').length;

  return (
    <div className="min-h-screen bg-surface-white">
      {/* Dark Street Header */}
      <Navbar />
      
      {/* Sticky Fetch Patterns Header */}
      <div className="fixed top-12 left-0 right-0 z-40 bg-surface-white border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-3">
              <img 
                src={fetchPatternsIcon} 
                alt="Fetch Patterns" 
                className="h-6 w-auto"
              />
              <span className="text-lg font-medium text-primary">
                Fetch Patterns Enhanced
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                className="text-accent-blue border-accent-blue hover:bg-accent-blue-light"
              >
                User Guide
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={generatePDF}
                disabled={completedAnalyses.length === 0}
                className="text-accent-blue border-accent-blue hover:bg-accent-blue-light"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF Report
              </Button>
              <span className="text-sm text-secondary">EnhancedUser</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* File Upload */}
          <Card className="mb-8 border-border-light bg-surface-white">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Upload className="w-5 h-5 mr-2" />
                Document Upload
              </CardTitle>
              <CardDescription className="text-secondary">
                Upload documents for AI-powered analysis and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border-medium rounded-lg p-8 text-center bg-surface-light">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.pptx,.ppt,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  data-testid="input-file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 mx-auto text-accent-blue" />
                    <div>
                      <p className="text-lg font-medium text-primary">
                        Click to upload documents
                      </p>
                      <p className="text-sm text-secondary">
                        Supports PDF, DOCX, XLSX, PPTX, images, and more
                      </p>
                    </div>
                  </div>
                </label>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-primary mb-2">Uploaded Files:</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-surface-light rounded border border-border-light">
                        <span className="text-sm text-secondary">{file.name}</span>
                        <span className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing Animation */}
          {processingCount > 0 && (
            <div className="mb-8">
              <AnalysisProcessingAnimation 
                completedCount={completedCount} 
                totalCount={completedCount + processingCount} 
              />
            </div>
          )}

          {/* Document Results */}
          {completedAnalyses.length > 0 && (
            <Card className="mb-8 border-border-light bg-surface-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-primary">
                  <span className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Analysis Results ({completedAnalyses.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedAnalyses.map((doc: DocumentAnalysis) => (
                    <div
                      key={doc.id}
                      className="p-4 border border-border-light rounded-lg transition-colors cursor-pointer hover:bg-surface-light"
                      onClick={() => setSelectedAnalysis(selectedAnalysis?.id === doc.id ? null : doc)}
                      data-testid={`card-analysis-${doc.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-primary">{doc.originalName}</h3>
                          <p className="text-sm text-secondary">
                            {new Date(doc.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {doc.classification && (
                            <Badge variant="secondary" className="bg-surface-medium text-secondary">
                              {doc.classification}
                            </Badge>
                          )}
                          {doc.sentiment && (
                            <Badge 
                              className="text-white"
                              style={{
                                background: doc.sentiment.label === 'positive' ? 'hsl(220, 91%, 54%)' :
                                          doc.sentiment.label === 'negative' ? 'hsl(0, 84%, 60%)' : 'hsl(0, 0%, 65%)'
                              }}
                            >
                              {doc.sentiment.label}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {selectedAnalysis?.id === doc.id && (
                        <div className="mt-4 space-y-4 border-t pt-4 border-border-light">
                          {doc.summary && (
                            <div>
                              <h4 className="font-medium mb-2 text-primary">Summary</h4>
                              <p className="text-sm text-secondary">{doc.summary}</p>
                            </div>
                          )}

                          {doc.keywords && doc.keywords.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 text-primary">Keywords</h4>
                              <div className="flex flex-wrap gap-1">
                                {doc.keywords.slice(0, 10).map((keyword, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs bg-accent-blue-light text-accent-blue">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {doc.insights && doc.insights.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 text-primary">Key Insights</h4>
                              <ul className="text-sm space-y-1 text-secondary">
                                {doc.insights.slice(0, 3).map((insight, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="mr-2 text-accent-blue">•</span>
                                    {insight}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {doc.riskFlags && doc.riskFlags.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 text-primary">Risk Flags</h4>
                              <div className="flex flex-wrap gap-1">
                                {doc.riskFlags.map((flag, index) => (
                                  <Badge key={index} variant="destructive" className="text-xs">
                                    {flag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {doc.wordCloud && doc.wordCloud.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 text-primary">Word Cloud</h4>
                              <div className="p-4 rounded-lg bg-surface-light border border-border-light">
                                <WordCloud words={doc.wordCloud} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Q&A */}
          <Card className="mb-8 border-border-light bg-surface-white">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <MessageSquare className="w-5 h-5 mr-2" />
                Document Q&A
              </CardTitle>
              <CardDescription className="text-secondary">
                Ask questions about your uploaded documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="What would you like to know about your documents?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="border-border-medium focus:border-accent-blue"
                data-testid="input-question"
              />
              <Button 
                onClick={handleAskQuestion}
                disabled={!question.trim() || questionMutation.isPending}
                className="w-full bg-accent-blue hover:bg-accent-blue-dark text-white"
                data-testid="button-ask-question"
              >
                {questionMutation.isPending ? "Thinking..." : "Ask Question"}
              </Button>

              {questionHistory.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-primary">Recent Questions</h4>
                  {questionHistory.slice(-3).map((qa, index) => (
                    <div key={index} className="p-4 rounded-lg bg-surface-light border border-border-light">
                      <h5 className="font-medium mb-2 text-primary">Q: {qa.question}</h5>
                      <p className="text-sm mb-2 text-secondary">{qa.answer.answer}</p>
                      {qa.answer.confidence && (
                        <div className="text-xs text-muted">
                          Confidence: {(qa.answer.confidence * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Context Analysis */}
          <Card className="mb-8 border-border-light bg-surface-white">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Brain className="w-5 h-5 mr-2" />
                Context Analysis
              </CardTitle>
              <CardDescription className="text-secondary">
                Analyze specific topics across all documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter a topic or context to analyze"
                value={contextQuery}
                onChange={(e) => setContextQuery(e.target.value)}
                className="border-border-medium focus:border-accent-blue"
                data-testid="input-context"
              />
              <Button 
                onClick={handleContextAnalysis}
                disabled={!contextQuery.trim() || contextMutation.isPending}
                className="w-full bg-accent-blue hover:bg-accent-blue-dark text-white"
                data-testid="button-analyze-context"
              >
                {contextMutation.isPending ? "Analyzing..." : "Analyze Context"}
              </Button>

              {contextHistory.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-primary">Recent Context Analyses</h4>
                  {contextHistory.slice(-3).map((context, index) => (
                    <div key={index} className="p-4 rounded-lg bg-surface-light border border-border-light">
                      <h5 className="font-medium mb-2 text-primary">Context: {context.query}</h5>
                      <div className="space-y-2 text-sm">
                        <div className="text-secondary">
                          <strong>Mentions:</strong> {context.result.mentions}
                        </div>
                        {context.result.summary && (
                          <div className="text-secondary">
                            <strong>Summary:</strong> {context.result.summary}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics Overview */}
          {completedAnalyses.length > 0 && (
            <Card className="mb-8 border-border-light bg-surface-white">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Analytics Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between text-primary">
                    <span>Total Documents:</span>
                    <span className="font-medium">{completedAnalyses.length}</span>
                  </div>
                  
                  {(() => {
                    const sentimentCounts = completedAnalyses.reduce((acc: any, doc: DocumentAnalysis) => {
                      if (doc.sentiment) {
                        acc[doc.sentiment.label] = (acc[doc.sentiment.label] || 0) + 1;
                      }
                      return acc;
                    }, {});

                    return Object.entries(sentimentCounts).map(([sentiment, count]) => (
                      <div key={sentiment} className="flex justify-between text-secondary">
                        <span className="capitalize">{sentiment}:</span>
                        <span className="font-medium">{count as number}</span>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Word Graph Section */}
          {completedAnalyses.length > 0 && (
            <Card className="mb-8 border-border-light bg-surface-white">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <FileText className="w-5 h-5 mr-2" />
                  Word Graph Analysis
                </CardTitle>
                <CardDescription className="text-secondary">
                  Visual representation of word frequency and relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedAnalyses.slice(0, 4).map((doc: DocumentAnalysis) => (
                    <div key={doc.id} className="p-4 rounded-lg border border-border-light bg-surface-light">
                      <h4 className="font-medium mb-3 text-primary truncate">{doc.originalName}</h4>
                      {doc.wordCloud && doc.wordCloud.length > 0 ? (
                        <div className="h-48 rounded-lg overflow-hidden bg-surface-white border border-border-light">
                          <WordCloud words={doc.wordCloud} />
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center rounded-lg bg-surface-medium">
                          <p className="text-muted text-sm">No word data available</p>
                        </div>
                      )}
                      {doc.wordCount && (
                        <div className="mt-2 text-xs text-secondary">
                          Word Count: {doc.wordCount}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Dark Street Footer */}
      <Footer />
    </div>
  );
}