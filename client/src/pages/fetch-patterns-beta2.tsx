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
  LogOut
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import fetchPatternsIcon from "@assets/FetchPatterns_Icon_1752663550310_1753148786989.png";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import html2canvas from 'html2canvas';
import { useLocation } from "wouter";

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

export default function FetchPatternsBeta2() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Check beta2 authentication
  useEffect(() => {
    const beta2Auth = sessionStorage.getItem("beta2Auth");
    if (!beta2Auth) {
      setLocation("/beta2-login");
    }
  }, [setLocation]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [question, setQuestion] = useState("");
  const [contextInput, setContextInput] = useState("");
  const [qaHistory, setQaHistory] = useState<Array<{question: string, answer: string, confidence: number}>>([]);
  const [contextHistory, setContextHistory] = useState<Array<ContextAnalysis>>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // Fetch document analyses for Beta2
  const { data: analyses, isLoading: analysesLoading } = useQuery({
    queryKey: ["/api/fetch-patterns/analyses"],
    refetchInterval: 2000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch("/api/fetch-patterns/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      setSelectedFiles([]);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ["/api/fetch-patterns/analyses"] });
      toast({
        title: "Upload Successful",
        description: "Files uploaded and processing started.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const questionMutation = useMutation({
    mutationFn: async (question: string) => {
      const documentsForAnalysis = selectedDocuments.length > 0 
        ? analyses?.filter((doc: DocumentAnalysis) => selectedDocuments.includes(doc.id))
        : analyses;
      
      const response = await apiRequest("POST", "/api/fetch-patterns/question", {
        question,
        documents: documentsForAnalysis
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setQaHistory(prev => [...prev, {
        question,
        answer: data.answer,
        confidence: data.confidence
      }]);
      setQuestion("");
    },
    onError: (error: Error) => {
      toast({
        title: "Question Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const contextMutation = useMutation({
    mutationFn: async (context: string) => {
      const documentsForAnalysis = selectedDocuments.length > 0 
        ? analyses?.filter((doc: DocumentAnalysis) => selectedDocuments.includes(doc.id))
        : analyses;
      
      const response = await apiRequest("POST", "/api/fetch-patterns/context-analysis", {
        context,
        documents: documentsForAnalysis
      });
      return await response.json();
    },
    onSuccess: (data: ContextAnalysis) => {
      setContextHistory(prev => [...prev, data]);
      setContextInput("");
    },
    onError: (error: Error) => {
      toast({
        title: "Context Analysis Failed",
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
        description: "Please select files to upload.",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate(selectedFiles);
  };

  const handleQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    questionMutation.mutate(question);
  };

  const handleContextAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contextInput.trim()) return;
    contextMutation.mutate(contextInput);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("beta2Auth");
    setLocation("/");
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const selectAllDocuments = () => {
    if (!analyses || !Array.isArray(analyses)) return;
    const allIds = analyses.map((doc: DocumentAnalysis) => doc.id);
    setSelectedDocuments(allIds);
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  const exportToPDF = async () => {
    const content = document.getElementById('analysis-content');
    if (!content) return;

    try {
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('fetch-patterns-beta2-analysis.pdf');
      
      toast({
        title: "PDF Export Successful",
        description: "Analysis exported as PDF successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const completedAnalyses = Array.isArray(analyses) ? analyses.filter((doc: DocumentAnalysis) => doc.status === 'completed') : [];
  const processingCount = Array.isArray(analyses) ? analyses.filter((doc: DocumentAnalysis) => doc.status === 'processing').length : 0;

  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      
      {/* Sticky Fetch Patterns Header */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-3">
              <img 
                src={fetchPatternsIcon} 
                alt="Fetch Patterns" 
                className="h-6 w-6"
              />
              <h1 className="text-sm font-semibold text-gray-900">
                Fetch Patterns Beta2
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={exportToPDF}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8"
              >
                <Download className="h-4 w-4 mr-1" />
                PDF Report
              </Button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>BetaUser2</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="analysis-content">
        
        {/* Document Upload Section */}
        <Card className="mb-8 bg-white border border-gray-200 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-gray-900">Document Upload</CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Upload documents for AI-powered analysis and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-blue-600" />
                    <p className="mb-2 text-sm text-gray-700">
                      <span className="font-semibold">Click to upload documents</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports PDF, DOCX, XLSX, PPTX, images, and more
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.pptx,.jpg,.jpeg,.png,.gif"
                  />
                </label>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Uploaded Files:</h4>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              )}
              
              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Upload Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
              
              <Button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || uploadMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload Files"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Document Selection and Analysis */}
        {completedAnalyses.length > 0 && (
          <Card className="mb-8 bg-white border border-gray-200 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-gray-900">Document Selection</CardTitle>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllDocuments}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <CardDescription className="text-gray-600">
                Select documents for Q&A and context analysis ({selectedDocuments.length} selected)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {completedAnalyses.map((doc: DocumentAnalysis) => (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedDocuments.includes(doc.id)
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleDocumentSelection(doc.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{doc.originalName}</span>
                      <Badge variant="secondary" className="bg-gray-200 text-gray-700 border-gray-300">
                        {doc.classification}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Q&A Section */}
        <Card className="mb-8 bg-white border border-gray-200 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-gray-900">Document Q&A</CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Ask questions about your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleQuestion} className="space-y-4">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about your documents..."
                className="bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              />
              <Button
                type="submit"
                disabled={!question.trim() || questionMutation.isPending || completedAnalyses.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {questionMutation.isPending ? "Processing..." : "Ask Question"}
              </Button>
            </form>
            
            {qaHistory.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="font-medium text-gray-900">Q&A History:</h4>
                {qaHistory.map((qa, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-md">
                    <div className="mb-2">
                      <span className="font-medium text-blue-600">Q: </span>
                      <span className="text-gray-700">{qa.question}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-medium text-green-600">A: </span>
                      <span className="text-gray-700">{qa.answer}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Confidence: {(qa.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Context Analysis Section */}
        <Card className="mb-8 bg-white border border-gray-200 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-gray-900">Context Analysis</CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Analyze specific contexts across your documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContextAnalysis} className="space-y-4">
              <Input
                value={contextInput}
                onChange={(e) => setContextInput(e.target.value)}
                placeholder="Enter context to analyze (e.g., 'risk management', 'financial performance')..."
                className="bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              />
              <Button
                type="submit"
                disabled={!contextInput.trim() || contextMutation.isPending || completedAnalyses.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {contextMutation.isPending ? "Analyzing..." : "Analyze Context"}
              </Button>
            </form>
            
            {contextHistory.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="font-medium text-gray-900">Context Analysis History:</h4>
                {contextHistory.map((analysis, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-md">
                    <h5 className="font-medium text-blue-600 mb-2">Context: {analysis.context}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Mentions: {analysis.mentions}</p>
                        <p className="text-sm font-medium text-gray-700 mb-1">Sentiment Breakdown:</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Positive: {analysis.sentimentBreakdown.positive}%</div>
                          <div>Negative: {analysis.sentimentBreakdown.negative}%</div>
                          <div>Neutral: {analysis.sentimentBreakdown.neutral}%</div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Emotional Tone:</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {analysis.emotionalTone.map((tone, i) => (
                            <Badge key={i} variant="secondary" className="bg-gray-200 text-gray-700 border-gray-300">
                              {tone}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Key Phrases:</p>
                        <div className="flex flex-wrap gap-1">
                          {analysis.keyPhrases.map((phrase, i) => (
                            <Badge key={i} variant="outline" className="border-gray-300 text-gray-700">
                              {phrase}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Summary:</p>
                      <p className="text-sm text-gray-600">{analysis.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Analysis Results */}
        {completedAnalyses.length > 0 && (
          <Card className="mb-8 bg-white border border-gray-200 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-gray-900">Analysis Results</CardTitle>
              </div>
              <CardDescription className="text-gray-600">
                Completed document analyses and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {completedAnalyses.map((doc: DocumentAnalysis) => (
                  <div key={doc.id} className="p-4 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">{doc.originalName}</h4>
                      <Badge variant="secondary" className="bg-gray-200 text-gray-700 border-gray-300">
                        {doc.classification}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {doc.sentiment && (
                          <div>
                            <h5 className="font-medium text-[#569cd6] mb-2">Sentiment Analysis</h5>
                            <div className="p-3 bg-[#2d2d30] rounded-md">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#cccccc]">Overall Sentiment:</span>
                                <Badge variant="outline" className="border-[#3e3e42] text-[#cccccc]">
                                  {doc.sentiment.label}
                                </Badge>
                              </div>
                              <div className="text-xs text-[#9cdcfe]">
                                Score: {(doc.sentiment.score * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs text-[#9cdcfe] mt-2">
                                {doc.sentiment.reasoning}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {doc.keywords && doc.keywords.length > 0 && (
                          <div>
                            <h5 className="font-medium text-[#569cd6] mb-2">Keywords</h5>
                            <div className="flex flex-wrap gap-1">
                              {doc.keywords.map((keyword, index) => (
                                <Badge key={index} variant="outline" className="border-[#3e3e42] text-[#cccccc]">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {doc.riskFlags && doc.riskFlags.length > 0 && (
                          <div>
                            <h5 className="font-medium text-[#569cd6] mb-2">Risk Flags</h5>
                            <div className="space-y-1">
                              {doc.riskFlags.map((risk, index) => (
                                <div key={index} className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
                                  {risk}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        {doc.wordCloud && doc.wordCloud.length > 0 && (
                          <div>
                            <h5 className="font-medium text-[#569cd6] mb-2">Word Cloud</h5>
                            <div className="bg-[#2d2d30] p-4 rounded-md">
                              <WordCloud words={doc.wordCloud} />
                            </div>
                          </div>
                        )}
                        
                        {doc.insights && doc.insights.length > 0 && (
                          <div>
                            <h5 className="font-medium text-[#569cd6] mb-2">Key Insights</h5>
                            <div className="space-y-2">
                              {doc.insights.map((insight, index) => (
                                <div key={index} className="text-sm text-[#cccccc] bg-[#2d2d30] p-2 rounded">
                                  {insight}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {doc.summary && (
                      <div className="mt-4">
                        <h5 className="font-medium text-[#569cd6] mb-2">Summary</h5>
                        <p className="text-sm text-[#cccccc] bg-[#2d2d30] p-3 rounded-md">
                          {doc.summary}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        {processingCount > 0 && (
          <Card className="mb-8 bg-[#2d2d30] border-[#3e3e42]">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#569cd6]"></div>
                <span className="text-[#cccccc]">
                  Processing {processingCount} document{processingCount !== 1 ? 's' : ''}...
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Documents State */}
        {!analysesLoading && (!analyses || analyses.length === 0) && (
          <Card className="mb-8 bg-[#2d2d30] border-[#3e3e42]">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-[#569cd6] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#cccccc] mb-2">No Documents Yet</h3>
                <p className="text-[#9cdcfe] mb-4">
                  Upload your first document to get started with AI-powered analysis.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      </main>
      
      <Footer />
    </div>
  );
}