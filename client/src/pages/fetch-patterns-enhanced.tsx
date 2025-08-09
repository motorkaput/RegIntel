import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import WordCloud from "@/components/WordCloud";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  BarChart3, 
  Brain, 
  MessageSquare,
  Download,
  User,
  LogOut,
  HelpCircle,
  FileDown
} from "lucide-react";
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
    <div className="flex flex-col items-center justify-center p-8 rounded-lg border" style={{
      background: 'linear-gradient(135deg, #E5EAF5 0%, #D3B0F4 100%)',
      borderColor: '#A45BB3'
    }}>
      {/* Animated brain icon */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse" style={{
          background: 'linear-gradient(135deg, #A45BB3 0%, #A0D2E8 100%)'
        }}>
          <Brain className="w-8 h-8 text-white" />
        </div>
        {/* Floating dots animation */}
        <div className="absolute -top-2 -right-2 flex space-x-1">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentDot === index ? 'scale-125 opacity-100' : 'scale-75 opacity-50'
              }`}
              style={{ backgroundColor: '#A45BB3' }}
            />
          ))}
        </div>
      </div>

      {/* Progress information */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#49405F' }}>
          Analyzing Your Documents
        </h3>
        <p className="text-sm mb-4" style={{ color: '#49405F' }}>
          Our AI is processing your files and extracting insights...
        </p>
        <div className="text-xs" style={{ color: '#A45BB3' }}>
          {completedCount} of {totalCount} documents analyzed
        </div>
      </div>

      {/* Custom progress bar */}
      <div className="w-full max-w-md">
        <div className="w-full rounded-full h-3 mb-2" style={{ backgroundColor: '#E5EAF5' }}>
          <div 
            className="h-3 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${progressPercentage}%`,
              background: 'linear-gradient(90deg, #A45BB3 0%, #A0D2E8 100%)'
            }}
          />
        </div>
        <div className="text-center text-xs" style={{ color: '#A45BB3' }}>
          {Math.round(progressPercentage)}% complete
        </div>
      </div>

      {/* Animated processing steps */}
      <div className="mt-6 flex items-center space-x-4 text-xs" style={{ color: '#49405F' }}>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#A45BB3' }} />
          <span>Extracting text</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ 
            backgroundColor: '#A0D2E8',
            animationDelay: '200ms' 
          }} />
          <span>Analyzing sentiment</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ 
            backgroundColor: '#D3B0F4',
            animationDelay: '400ms' 
          }} />
          <span>Generating insights</span>
        </div>
      </div>
    </div>
  );
}

export default function FetchPatternsEnhanced() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [files, setFiles] = useState<File[]>([]);
  const [question, setQuestion] = useState("");
  const [contextQuery, setContextQuery] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<DocumentAnalysis | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Check enhanced authentication
  useEffect(() => {
    const enhancedAuth = sessionStorage.getItem("enhancedAuth");
    if (!enhancedAuth) {
      setLocation("/enhanced-login");
    }
  }, [setLocation]);

  // Get current user from sessionStorage (enhanced version)
  const currentUser = { 
    id: "enhanced_user_1", 
    username: "EnhancedUser", 
    displayName: "Enhanced User" 
  };

  // Fetch analyses
  const { data: analyses = [], isLoading: analysesLoading } = useQuery<DocumentAnalysis[]>({
    queryKey: ["/api/document-analyses", currentUser.id],
    enabled: !!currentUser.id,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('userId', currentUser.id);
      
      const res = await apiRequest('/api/upload', 'POST', formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-analyses"] });
      setFiles([]);
      toast({
        title: "Upload successful",
        description: "Your documents are being analyzed...",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Question mutation
  const questionMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest('/api/question', 'POST', {
        question,
        documents: analyses.filter(a => a.status === 'completed')
      });
      return res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Question failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Context analysis mutation
  const contextMutation = useMutation({
    mutationFn: async (context: string) => {
      const res = await apiRequest('/api/context-analysis', 'POST', {
        context,
        documents: analyses.filter(a => a.status === 'completed')
      });
      return res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Context analysis failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(files);
  };

  const handleAskQuestion = () => {
    if (!question.trim()) {
      toast({
        title: "Empty question",
        description: "Please enter a question.",
        variant: "destructive",
      });
      return;
    }

    questionMutation.mutate(question);
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

    contextMutation.mutate(contextQuery);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("enhancedAuth");
    setLocation("/enhanced-login");
  };

  const generatePDFReport = async () => {
    if (!analyses || analyses.length === 0) {
      toast({
        title: "No data available",
        description: "Please analyze some documents first.",
        variant: "destructive",
      });
      return;
    }

    const completedAnalyses = analyses.filter((doc: DocumentAnalysis) => doc.status === 'completed');
    
    if (completedAnalyses.length === 0) {
      toast({
        title: "No completed analyses",
        description: "Please wait for document analysis to complete.",
        variant: "destructive",
      });
      return;
    }

    const pdf = new jsPDF();
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(160, 210, 232); // #A0D2E8 - Light blue from color scheme
    pdf.text('Fetch Patterns Enhanced - Analysis Report', 20, yPosition);
    yPosition += 20;

    pdf.setFontSize(12);
    pdf.setTextColor(73, 64, 95); // #49405F - Dark purple from color scheme
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
    pdf.text(`Total Documents Analyzed: ${completedAnalyses.length}`, 20, yPosition + 10);
    yPosition += 30;

    // Document analyses
    completedAnalyses.forEach((analysis: DocumentAnalysis, index: number) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(164, 91, 179); // #A45BB3 - Medium purple from color scheme
      pdf.text(`${index + 1}. ${analysis.originalName}`, 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      pdf.setTextColor(73, 64, 95);

      if (analysis.classification) {
        pdf.text(`Classification: ${analysis.classification}`, 25, yPosition);
        yPosition += 10;
      }

      if (analysis.sentiment) {
        pdf.text(`Sentiment: ${analysis.sentiment.label} (${(analysis.sentiment.score * 100).toFixed(1)}%)`, 25, yPosition);
        yPosition += 10;
      }

      if (analysis.summary) {
        const summaryLines = pdf.splitTextToSize(analysis.summary, 160);
        pdf.text('Summary:', 25, yPosition);
        yPosition += 10;
        pdf.text(summaryLines, 25, yPosition);
        yPosition += summaryLines.length * 5 + 10;
      }

      if (analysis.keywords && analysis.keywords.length > 0) {
        pdf.text(`Keywords: ${analysis.keywords.slice(0, 10).join(', ')}`, 25, yPosition);
        yPosition += 10;
      }

      if (analysis.riskFlags && analysis.riskFlags.length > 0) {
        pdf.setTextColor(220, 38, 127); // Warning color
        pdf.text(`Risk Flags: ${analysis.riskFlags.join(', ')}`, 25, yPosition);
        pdf.setTextColor(73, 64, 95);
        yPosition += 10;
      }

      yPosition += 10;
    });

    // Summary statistics
    if (yPosition > 200) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(16);
    pdf.setTextColor(164, 91, 179); // #A45BB3 - Medium purple from color scheme
    pdf.text('Summary Statistics', 20, yPosition);
    yPosition += 20;

    pdf.setFontSize(10);
    pdf.setTextColor(73, 64, 95); // #49405F - Dark purple from color scheme

    const sentimentCounts = completedAnalyses.reduce((acc: any, analysis: DocumentAnalysis) => {
      if (analysis.sentiment) {
        acc[analysis.sentiment.label] = (acc[analysis.sentiment.label] || 0) + 1;
      }
      return acc;
    }, {});

    Object.entries(sentimentCounts).forEach(([sentiment, count]) => {
      pdf.text(`${sentiment}: ${count} documents`, 25, yPosition);
      yPosition += 10;
    });

    // Save the PDF
    pdf.save(`fetch-patterns-report-${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "PDF report generated",
      description: "Your analysis report has been downloaded.",
    });
  };

  const completedAnalyses = analyses.filter((doc: DocumentAnalysis) => doc.status === 'completed');
  const processingAnalyses = analyses.filter((doc: DocumentAnalysis) => doc.status === 'processing');
  const totalAnalyses = analyses.length;

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #A0D2E8 0%, #E5EAF5 25%, #D3B0F4 50%, #A45BB3 75%, #49405F 100%)'
    }}>
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <img src={fetchPatternsIcon} alt="Fetch Patterns" className="w-12 h-12" />
            <div>
              <h1 className="text-3xl font-bold text-white">Fetch Patterns Enhanced</h1>
              <p className="text-white/80">Advanced Document Analysis & Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowGuide(true)}
              className="text-white hover:text-white border-2"
              style={{ 
                backgroundColor: 'rgba(164, 91, 179, 0.2)',
                borderColor: '#E5EAF5',
                backdropFilter: 'blur(8px)'
              }}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              User Guide
            </Button>
            
            {completedAnalyses.length > 0 && (
              <Button
                onClick={generatePDFReport}
                className="text-white hover:text-white border-2"
                variant="outline"
                style={{ 
                  backgroundColor: 'rgba(160, 210, 232, 0.2)',
                  borderColor: '#D3B0F4',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download PDF Report
              </Button>
            )}
            
            <div className="flex items-center space-x-2 text-white">
              <User className="w-4 h-4" />
              <span>{currentUser.displayName || currentUser.username}</span>
            </div>
            
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-white hover:text-white border-2"
              style={{ 
                backgroundColor: 'rgba(73, 64, 95, 0.3)',
                borderColor: '#A0D2E8',
                backdropFilter: 'blur(8px)'
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* User Guide Modal */}
        {showGuide && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold" style={{ color: '#49405F' }}>Fetch Patterns Enhanced User Guide</h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowGuide(false)}
                  style={{ color: '#A45BB3' }}
                  className="hover:opacity-70"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-6" style={{ color: '#49405F' }}>
                <section>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#A45BB3' }}>Getting Started</h3>
                  <p className="mb-2">Fetch Patterns Enhanced is your AI-powered document analysis tool. Here's how to use it:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Upload your documents using the file selector</li>
                    <li>Wait for AI analysis to complete</li>
                    <li>Review insights, sentiment, and classifications</li>
                    <li>Ask questions about your documents</li>
                    <li>Download comprehensive PDF reports</li>
                  </ol>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#A45BB3' }}>Supported File Types</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>PDF documents (.pdf)</li>
                    <li>Word documents (.docx)</li>
                    <li>Excel spreadsheets (.xlsx)</li>
                    <li>PowerPoint presentations (.pptx)</li>
                    <li>Images with text (.jpg, .png)</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#A45BB3' }}>Analysis Features</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Sentiment Analysis:</strong> Understand emotional tone</li>
                    <li><strong>Classification:</strong> Automatic document categorization</li>
                    <li><strong>Keywords:</strong> Key terms and phrases extraction</li>
                    <li><strong>Risk Flags:</strong> Potential concerns identification</li>
                    <li><strong>Word Clouds:</strong> Visual term frequency representation</li>
                    <li><strong>Q&A:</strong> Ask questions about document content</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#A45BB3' }}>Tips for Best Results</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Upload clear, high-quality documents</li>
                    <li>Use specific questions for better answers</li>
                    <li>Review risk flags carefully</li>
                    <li>Export PDF reports for documentation</li>
                    <li>Use context analysis for trend identification</li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-sm border-2" style={{
              backgroundColor: 'rgba(229, 234, 245, 0.7)',
              borderColor: '#D3B0F4'
            }}>
              <CardHeader>
                <CardTitle className="flex items-center" style={{ color: '#49405F' }}>
                  <Upload className="w-5 h-5 mr-2" />
                  Document Upload & Analysis
                </CardTitle>
                <CardDescription style={{ color: '#A45BB3' }}>
                  Upload your documents for AI-powered analysis and insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.xlsx,.pptx,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="border-2 focus:border-2"
                    style={{ 
                      borderColor: '#A0D2E8',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)'
                    }}
                  />
                  {files.length > 0 && (
                    <div className="mt-2 text-sm" style={{ color: '#A45BB3' }}>
                      Selected: {files.map(f => f.name).join(", ")}
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={handleUpload}
                  disabled={files.length === 0 || uploadMutation.isPending}
                  className="w-full text-white hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #A45BB3 0%, #A0D2E8 100%)'
                  }}
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload & Analyze"}
                </Button>
              </CardContent>
            </Card>

            {/* Processing Animation */}
            {processingAnalyses.length > 0 && (
              <div className="mt-6">
                <AnalysisProcessingAnimation 
                  completedCount={completedAnalyses.length}
                  totalCount={totalAnalyses}
                />
              </div>
            )}

            {/* Document Results */}
            {completedAnalyses.length > 0 && (
              <Card className="backdrop-blur-sm border-2 mt-6" style={{
                backgroundColor: 'rgba(229, 234, 245, 0.7)',
                borderColor: '#D3B0F4'
              }}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between" style={{ color: '#49405F' }}>
                    <span className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Analysis Results ({completedAnalyses.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {completedAnalyses.map((doc: DocumentAnalysis) => (
                      <div
                        key={doc.id}
                        className="p-4 border-2 rounded-lg transition-colors cursor-pointer hover:opacity-80"
                        style={{
                          borderColor: '#A0D2E8',
                          backgroundColor: 'rgba(255, 255, 255, 0.6)'
                        }}
                        onClick={() => setSelectedAnalysis(selectedAnalysis?.id === doc.id ? null : doc)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium" style={{ color: '#49405F' }}>{doc.originalName}</h3>
                            <p className="text-sm" style={{ color: '#A45BB3' }}>
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {doc.sentiment && (
                              <Badge 
                                variant={doc.sentiment.label === 'positive' ? 'default' : 
                                       doc.sentiment.label === 'negative' ? 'destructive' : 'secondary'}
                                className="text-white"
                                style={{
                                  background: doc.sentiment.label === 'positive' ? '#A0D2E8' :
                                            doc.sentiment.label === 'negative' ? '#A45BB3' : '#D3B0F4'
                                }}
                              >
                                {doc.sentiment.label}
                              </Badge>
                            )}
                            {doc.classification && (
                              <Badge variant="outline" className="border-2" style={{
                                borderColor: '#A45BB3',
                                color: '#49405F'
                              }}>
                                {doc.classification}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {selectedAnalysis?.id === doc.id && (
                          <div className="mt-4 space-y-4 border-t pt-4" style={{ borderColor: '#D3B0F4' }}>
                            {doc.summary && (
                              <div>
                                <h4 className="font-medium mb-2" style={{ color: '#49405F' }}>Summary</h4>
                                <p className="text-sm" style={{ color: '#49405F' }}>{doc.summary}</p>
                              </div>
                            )}

                            {doc.keywords && doc.keywords.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2" style={{ color: '#49405F' }}>Keywords</h4>
                                <div className="flex flex-wrap gap-1">
                                  {doc.keywords.slice(0, 10).map((keyword, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs" style={{
                                      backgroundColor: '#E5EAF5',
                                      color: '#A45BB3'
                                    }}>
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {doc.insights && doc.insights.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2" style={{ color: '#49405F' }}>Key Insights</h4>
                                <ul className="text-sm space-y-1" style={{ color: '#49405F' }}>
                                  {doc.insights.slice(0, 3).map((insight, index) => (
                                    <li key={index} className="flex items-start">
                                      <span className="mr-2" style={{ color: '#A45BB3' }}>•</span>
                                      {insight}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {doc.riskFlags && doc.riskFlags.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2" style={{ color: '#A45BB3' }}>Risk Flags</h4>
                                <div className="flex flex-wrap gap-1">
                                  {doc.riskFlags.map((flag, index) => (
                                    <Badge key={index} variant="destructive" className="text-xs text-white" style={{
                                      backgroundColor: '#A45BB3'
                                    }}>
                                      {flag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {doc.wordCloud && doc.wordCloud.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2" style={{ color: '#49405F' }}>Word Cloud</h4>
                                <div className="p-4 rounded-lg" style={{
                                  background: 'linear-gradient(135deg, #E5EAF5 0%, #A0D2E8 100%)'
                                }}>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Q&A Section */}
            <Card className="backdrop-blur-sm border-2" style={{
              backgroundColor: 'rgba(229, 234, 245, 0.7)',
              borderColor: '#A0D2E8'
            }}>
              <CardHeader>
                <CardTitle className="flex items-center" style={{ color: '#49405F' }}>
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Document Q&A
                </CardTitle>
                <CardDescription style={{ color: '#A45BB3' }}>
                  Ask questions about your uploaded documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="What would you like to know about your documents?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="border-2 focus:border-2"
                  style={{ 
                    borderColor: '#D3B0F4',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)'
                  }}
                />
                <Button 
                  onClick={handleAskQuestion}
                  disabled={!question.trim() || questionMutation.isPending}
                  className="w-full text-white hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #A45BB3 0%, #A0D2E8 100%)'
                  }}
                >
                  {questionMutation.isPending ? "Thinking..." : "Ask Question"}
                </Button>

                {questionMutation.data && (
                  <div className="mt-4 p-4 rounded-lg border-2" style={{
                    background: 'linear-gradient(135deg, #E5EAF5 0%, #A0D2E8 100%)',
                    borderColor: '#D3B0F4'
                  }}>
                    <h4 className="font-medium mb-2" style={{ color: '#49405F' }}>Answer</h4>
                    <p className="text-sm mb-2" style={{ color: '#49405F' }}>{questionMutation.data.answer}</p>
                    {questionMutation.data.confidence && (
                      <div className="text-xs" style={{ color: '#A45BB3' }}>
                        Confidence: {(questionMutation.data.confidence * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Context Analysis */}
            <Card className="backdrop-blur-sm border-2" style={{
              backgroundColor: 'rgba(229, 234, 245, 0.7)',
              borderColor: '#A0D2E8'
            }}>
              <CardHeader>
                <CardTitle className="flex items-center" style={{ color: '#49405F' }}>
                  <Brain className="w-5 h-5 mr-2" />
                  Context Analysis
                </CardTitle>
                <CardDescription style={{ color: '#A45BB3' }}>
                  Analyze specific topics across all documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Enter a topic or context to analyze"
                  value={contextQuery}
                  onChange={(e) => setContextQuery(e.target.value)}
                  className="border-2 focus:border-2"
                  style={{ 
                    borderColor: '#D3B0F4',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)'
                  }}
                />
                <Button 
                  onClick={handleContextAnalysis}
                  disabled={!contextQuery.trim() || contextMutation.isPending}
                  className="w-full text-white hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #A45BB3 0%, #A0D2E8 100%)'
                  }}
                >
                  {contextMutation.isPending ? "Analyzing..." : "Analyze Context"}
                </Button>

                {contextMutation.data && (
                  <div className="mt-4 p-4 rounded-lg border-2" style={{
                    background: 'linear-gradient(135deg, #E5EAF5 0%, #A0D2E8 100%)',
                    borderColor: '#D3B0F4'
                  }}>
                    <h4 className="font-medium mb-2" style={{ color: '#49405F' }}>Context Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div style={{ color: '#49405F' }}>
                        <strong>Mentions:</strong> {contextMutation.data.mentions}
                      </div>
                      {contextMutation.data.summary && (
                        <div style={{ color: '#49405F' }}>
                          <strong>Summary:</strong> {contextMutation.data.summary}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analytics Overview */}
            {completedAnalyses.length > 0 && (
              <Card className="backdrop-blur-sm border-2" style={{
                backgroundColor: 'rgba(229, 234, 245, 0.7)',
                borderColor: '#A0D2E8'
              }}>
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: '#49405F' }}>
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Analytics Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between" style={{ color: '#49405F' }}>
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
                        <div key={sentiment} className="flex justify-between" style={{ color: '#A45BB3' }}>
                          <span className="capitalize">{sentiment}:</span>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}