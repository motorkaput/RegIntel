import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
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

export default function FetchPatternsApp() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // For cumulative uploads
  const [uploadProgress, setUploadProgress] = useState(0);
  const [question, setQuestion] = useState("");
  const [contextQuery, setContextQuery] = useState("");
  const [wordCount, setWordCount] = useState(50);
  const [questionHistory, setQuestionHistory] = useState<{question: string, data: any}[]>([]);
  const [contextHistory, setContextHistory] = useState<{query: string, data: any}[]>([]);
  const [sessionAnalyses, setSessionAnalyses] = useState<DocumentAnalysis[]>([]);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // Use session-based analyses instead of cumulative
  const analyses = sessionAnalyses;

  // Question answering mutation
  const questionMutation = useMutation({
    mutationFn: async (question: string) => {
      // Use session analyses for question answering
      const documents = sessionAnalyses
        .filter(a => a.status === 'completed' && a.extractedText)
        .map(a => ({ text: a.extractedText!, filename: a.originalName }));
      
      if (documents.length === 0) {
        return {
          answer: "No documents available to answer questions. Please upload some documents first.",
          confidence: 0.0,
          sources: []
        };
      }
      
      const response = await apiRequest("POST", "/api/fetch-patterns/question", { question, documents });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Add to history instead of replacing
      setQuestionHistory(prev => [{ question: variables, data }, ...prev]);
      setQuestion(""); // Clear input after successful submission
    },
  });

  // Context analysis mutation
  const contextMutation = useMutation({
    mutationFn: async (context: string) => {
      // Use session analyses for context analysis
      const documents = sessionAnalyses
        .filter(a => a.status === 'completed' && a.extractedText)
        .map(a => ({ text: a.extractedText!, filename: a.originalName }));
      
      if (documents.length === 0) {
        return {
          context,
          mentions: 0,
          sentimentBreakdown: { positive: 0, negative: 0, neutral: 100 },
          emotionalTone: ['neutral'],
          keyPhrases: [],
          summary: "No documents available for context analysis."
        };
      }
      
      const response = await apiRequest("POST", "/api/fetch-patterns/context-analysis", { context, documents });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Add to history instead of replacing
      setContextHistory(prev => [{ query: variables, data }, ...prev]);
      setContextQuery(""); // Clear input after successful submission
    },
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
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: "Your documents are being processed.",
      });
      setSelectedFiles(null);
      setPendingFiles([]); // Clear pending files after successful upload
      setUploadProgress(0);
      
      // Scroll to top of app immediately
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
      
      // Add new analyses to session state
      if (data.analyses) {
        setSessionAnalyses(prev => [...prev, ...data.analyses]);
        
        // Start polling for completion
        if (pollInterval) clearInterval(pollInterval);
        const interval = setInterval(async () => {
          try {
            const updatedAnalyses = await Promise.all(
              data.analyses.map(async (analysis: any) => {
                const response = await fetch(`/api/fetch-patterns/analysis/${analysis.id}`);
                if (response.ok) {
                  return await response.json();
                }
                return analysis;
              })
            );
            
            setSessionAnalyses(prev => {
              const newAnalyses = [...prev];
              updatedAnalyses.forEach(updated => {
                const index = newAnalyses.findIndex(a => a.id === updated.id);
                if (index !== -1) {
                  newAnalyses[index] = updated;
                }
              });
              return newAnalyses;
            });
            
            // Stop polling if all analyses are completed or have errors
            const allDone = updatedAnalyses.every(a => a.status === 'completed' || a.status === 'error');
            if (allDone) {
              clearInterval(interval);
              setPollInterval(null);
            }
          } catch (error) {
            console.error('Error polling for analysis updates:', error);
          }
        }, 2000); // Poll every 2 seconds
        
        setPollInterval(interval);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed", 
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Add new files to existing pending files for cumulative upload
      const newFiles = Array.from(files);
      const combinedFiles = [...pendingFiles, ...newFiles];
      
      // Remove duplicates based on file name and size
      const uniqueFiles = combinedFiles.filter((file, index, self) => 
        index === self.findIndex(f => f.name === file.name && f.size === file.size)
      );
      
      if (uniqueFiles.length > 20) {
        toast({
          title: "Too many files",
          description: "Please select a maximum of 20 files per session.",
          variant: "destructive",
        });
        return;
      }
      
      setPendingFiles(uniqueFiles);
      
      // Convert back to FileList-like structure for upload
      const dt = new DataTransfer();
      uniqueFiles.forEach(file => dt.items.add(file));
      setSelectedFiles(dt.files);
    }
  };

  const handleUpload = () => {
    if (selectedFiles) {
      setUploadProgress(10);
      uploadMutation.mutate(selectedFiles);
    }
  };

  const handleAskQuestion = () => {
    if (question.trim()) {
      questionMutation.mutate(question);
    }
  };

  const handleContextAnalysis = () => {
    if (contextQuery.trim()) {
      contextMutation.mutate(contextQuery);
    }
  };

  // Calculate statistics
  const completedAnalyses = analyses.filter(a => a.status === 'completed');
  const uniqueKeywords = Array.from(new Set(completedAnalyses.flatMap(a => a.keywords || []))).length;
  const highConfidence = completedAnalyses.filter(a => 
    a.sentiment && a.sentiment.score > 0.8
  ).length;
  const highRisk = completedAnalyses.filter(a => 
    a.sentiment && a.sentiment.label === 'negative'
  ).length;

  // Generate word cloud data
  // Professional word cloud data generation following the react-wordcloud algorithm
  const wordCounts = {} as Record<string, number>;
  
  completedAnalyses.forEach(analysis => {
    // Extract content from summary and other text fields
    const content = [
      analysis.summary || '',
      (analysis.insights || []).join(' '),
      (analysis.keyPhrases || []).join(' ')
    ].join(' ');

    // Extract all words from content (not just keywords)
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word =>
        word.length > 3 && // Only words longer than 3 characters
        !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other', 'more', 'very', 'what', 'know', 'just', 'first', 'into', 'over', 'think', 'also', 'your', 'work', 'life', 'only', 'can', 'still', 'should', 'after', 'being', 'now', 'made', 'before', 'here', 'through', 'when', 'where', 'much', 'some', 'these', 'many', 'then', 'them', 'well', 'were', 'document', 'analysis', 'provides', 'using', 'within', 'based', 'include', 'approach'].includes(word) // Filter common words + context words
      );

    // Count word frequencies
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Also include keywords with higher weight (3x)
    if (analysis.keywords) {
      analysis.keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        if (keywordLower.length > 3 && !['document', 'analysis'].includes(keywordLower)) {
          wordCounts[keywordLower] = (wordCounts[keywordLower] || 0) + 3; // Give keywords 3x weight
        }
      });
    }
  });

  // Convert to the expected format
  const wordCloudData = wordCounts;

  // Sort by frequency and take top N words, capitalize first letter
  const topWords = Object.entries(wordCloudData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, wordCount)
    .map(([text, value]) => [
      text.charAt(0).toUpperCase() + text.slice(1), // Capitalize first letter
      value
    ] as [string, number]);

  // Export functions
  const exportCSV = (data: any, filename: string) => {
    const csv = typeof data === 'string' ? data : JSON.stringify(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportPNG = (elementId: string, filename: string) => {
    // Simple screenshot functionality - in production use html2canvas
    toast({
      title: "Export Feature",
      description: "PNG export would be implemented with html2canvas in production",
    });
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      
      <main className="pt-24 pb-6">
        {/* FetchPatterns specific header */}
        <div className="bg-gray-50 border-b border-gray-200 py-6">
          <div className="max-w-6xl mx-auto px-6 flex items-center gap-4">
            <img src={fetchPatternsIcon} alt="FetchPatterns" className="h-16 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FetchPatterns</h1>
              <p className="text-gray-600 text-sm">AI-Powered Document Analysis & Visualization</p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Session Controls */}
        {sessionAnalyses.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  <strong>Session Active:</strong> {sessionAnalyses.length} documents analyzed. 
                  <span className="text-blue-600 ml-2">
                    To start fresh, refresh the page (previous analysis will be lost - save CSVs/PNGs first).
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Refresh Session
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900">
              Upload Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      {selectedFiles ? (
                        <span className="font-semibold">Choose files {selectedFiles.length} files</span>
                      ) : (
                        <span><span className="font-semibold">Choose files</span></span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">Select multiple files (PDF, DOCX, PPTX, XLSX, TXT, Images)</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.docx,.pptx,.xlsx,.txt,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {uploadProgress > 0 && (
                <Progress value={uploadProgress} className="w-full" />
              )}

              <Button 
                onClick={handleUpload}
                disabled={!selectedFiles || uploadMutation.isPending}
                className="w-full bg-gray-700 hover:bg-gray-800 text-white"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload & Analyze"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white text-center p-6">
            <div className="text-4xl font-bold text-gray-700 mb-2">{completedAnalyses.length}</div>
            <div className="text-sm text-gray-500">Documents Processed</div>
          </Card>
          <Card className="bg-white text-center p-6">
            <div className="text-4xl font-bold text-gray-700 mb-2">{uniqueKeywords}</div>
            <div className="text-sm text-gray-500">Unique Keywords</div>
          </Card>
          <Card className="bg-white text-center p-6">
            <div className="text-4xl font-bold text-gray-700 mb-2">{highConfidence}</div>
            <div className="text-sm text-gray-500">High Confidence</div>
            <div className="text-xs text-gray-400">Sentiment confidence &gt; 80%</div>
          </Card>
          <Card className="bg-white text-center p-6">
            <div className="text-4xl font-bold text-gray-700 mb-2">{highRisk}</div>
            <div className="text-sm text-gray-500">High Risk Documents</div>
            <div className="text-xs text-gray-400">Negative sentiment documents</div>
          </Card>
        </div>

        {/* Ask Questions Section */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900">
              Ask Questions About Your Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type in a question about the documents uploaded"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
              />
              <Button 
                onClick={handleAskQuestion}
                disabled={!question.trim() || questionMutation.isPending}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Ask Question
              </Button>
            </div>

            {questionHistory.length > 0 && (
              <div className="space-y-4">
                {questionHistory.map((item, index) => (
                  <Card key={index} className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-700 mb-2">
                        <strong>Question:</strong> {item.question}
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        <strong>Answer:</strong>
                      </div>
                      <div className="text-gray-900 mb-2">{item.data.answer}</div>
                      <div className="text-sm text-gray-600">
                        <strong>Confidence:</strong> {(item.data.confidence * 100).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Summaries */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900">
              Document Summaries
            </CardTitle>
            <CardDescription className="text-gray-600">
              AI-generated summaries and insights from your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedAnalyses.map((analysis) => (
                <Card key={analysis.id} className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 mb-2">{analysis.originalName}</h3>
                      
                      {/* Classification and keywords only */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {analysis.classification && (
                          <Badge 
                            variant="outline" 
                            className="bg-blue-50 text-blue-700 border-blue-300 text-xs px-2 py-1"
                          >
                            {analysis.classification}
                          </Badge>
                        )}
                        {analysis.keywords && analysis.keywords.slice(0, 3).map((keyword, idx) => (
                          <Badge 
                            key={idx}
                            variant="outline" 
                            className="bg-purple-50 text-purple-700 border-purple-300 text-xs px-2 py-1"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {analysis.summary && (
                      <p className="text-gray-700 text-sm mb-3 leading-relaxed">{analysis.summary}</p>
                    )}
                    
                    {analysis.wordCount && (
                      <div className="text-xs text-gray-500">
                        <strong>Word Count:</strong> {analysis.wordCount} words
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Context-Based Sentiment Analysis */}
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">
                Context-Based Sentiment Analysis
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (contextHistory.length === 0) {
                    toast({
                      title: "No data to export",
                      description: "Perform a context analysis first.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // Export ALL contexts from the session
                  const csvRows = ['Context,Positive %,Negative %,Neutral %,Total Mentions,Emotional Tone,Key Phrases,Context Summary'];
                  contextHistory.slice().reverse().forEach(item => {
                    csvRows.push(`"${item.query}","${item.data.sentimentBreakdown.positive}","${item.data.sentimentBreakdown.negative}","${item.data.sentimentBreakdown.neutral}","${item.data.mentions}","${item.data.emotionalTone.join('; ')}","${item.data.keyPhrases.join('; ')}","${item.data.summary}"`);
                  });
                  const csvContent = csvRows.join('\n');
                  exportCSV(csvContent, `Fetch_Patterns_Context_Analysis_${new Date().toISOString().slice(0,10)}.csv`);
                }}
                className="text-gray-600 border-gray-300"
              >
                CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Input
                value={contextQuery}
                onChange={(e) => setContextQuery(e.target.value)}
                placeholder="Enter a context to analyze (e.g., 'customer satisfaction', 'product quality', 'financial performance')"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleContextAnalysis()}
              />
              <Button 
                onClick={handleContextAnalysis}
                disabled={!contextQuery.trim() || contextMutation.isPending}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Analyze Context
              </Button>
            </div>

            {contextHistory.length > 0 && (
              <div className="space-y-6">
                {contextHistory.map((item, index) => (
                  <div key={index}>
                    {index > 0 && <hr className="border-gray-200 my-6" />}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold text-gray-900">
                          {item.query}
                        </div>
                        <Badge variant="outline" className="text-gray-600 border-gray-300">
                          {item.data.mentions} mentions
                        </Badge>
                      </div>
                      
                      {/* Sentiment bars */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="w-20 text-sm font-medium text-gray-700">Positive</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                            <div 
                              className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${item.data.sentimentBreakdown.positive}%` }}
                            >
                              <span className="text-white text-sm font-medium">
                                {item.data.sentimentBreakdown.positive}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-20 text-sm font-medium text-gray-700">Negative</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                            <div 
                              className="bg-purple-500 h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${item.data.sentimentBreakdown.negative}%` }}
                            >
                              <span className="text-white text-sm font-medium">
                                {item.data.sentimentBreakdown.negative}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-20 text-sm font-medium text-gray-700">Neutral</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                            <div 
                              className="bg-gray-500 h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${item.data.sentimentBreakdown.neutral}%` }}
                            >
                              <span className="text-white text-sm font-medium">
                                {item.data.sentimentBreakdown.neutral}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Details in blue box */}
                      <Card className="bg-blue-50 border-blue-200 border-l-4 border-l-blue-500">
                        <CardContent className="p-4 space-y-4">
                          {item.data.emotionalTone && (
                            <div>
                              <div className="text-gray-900 font-semibold mb-2">Emotional Tone:</div>
                              <div className="flex gap-2">
                                {item.data.emotionalTone.map((tone: string, toneIndex: number) => (
                                  <Badge key={toneIndex} className="bg-blue-100 text-blue-800 border-blue-200">
                                    {tone}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.data.keyPhrases && (
                            <div>
                              <div className="text-gray-900 font-semibold mb-2">Key Phrases:</div>
                              <div className="flex flex-wrap gap-2">
                                {item.data.keyPhrases.map((phrase: string, phraseIndex: number) => (
                                  <Badge key={phraseIndex} className="bg-pink-100 text-pink-800 border-pink-200">
                                    "{phrase}"
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.data.summary && (
                            <div>
                              <div className="text-gray-900 font-semibold mb-2">Context Summary:</div>
                              <div className="text-gray-700 text-sm leading-relaxed bg-white p-3 rounded border border-blue-200">
                                {item.data.summary}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Word Cloud */}
        <Card className="bg-white" id="word-cloud">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">
                Word Cloud
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Words:</span>
                  <Input
                    type="number"
                    value={wordCount}
                    onChange={(e) => setWordCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 50)))}
                    className="w-20 h-8"
                    min="1"
                    max="100"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportPNG('word-cloud', `Fetch_Patterns_WordCloud_${new Date().toISOString().slice(0,10)}.png`)}
                    className="text-gray-600 border-gray-300"
                  >
                    PNG
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportCSV(
                      `Word,Frequency\n${topWords.map(([word, count]) => `"${word}","${count}"`).join('\n')}`,
                      `Fetch_Patterns_WordCloud_${new Date().toISOString().slice(0,10)}.csv`
                    )}
                    className="text-gray-600 border-gray-300"
                  >
                    CSV
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              className="bg-white p-8 rounded-lg min-h-[500px] relative overflow-hidden"
              style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '300' }}
              onLoad={() => sessionStorage.removeItem('tempWordPositions')} // Clear on load
            >
              {(() => {
                // Clear previous positions for fresh calculation
                sessionStorage.removeItem('tempWordPositions');
                return topWords.length > 0;
              })() ? (
                <div className="relative w-full h-[450px]">
                  {topWords.map(([word, count], index) => {
                    // Deterministic positioning algorithm based on react-wordcloud principles
                    // Font size range: 12-60px based on frequency (matching the guide)
                    const minFontSize = 12;
                    const maxFontSize = 60;
                    const maxCount = Math.max(...topWords.map(([, count]) => count));
                    const fontSizeRange = maxFontSize - minFontSize;
                    const normalizedFreq = count / maxCount;
                    
                    // Calculate font size using the same range as react-wordcloud
                    let fontSize = Math.round(minFontSize + (fontSizeRange * normalizedFreq));
                    
                    // Deterministic spiral positioning with proper padding
                    let x, y;
                    const centerX = 50;
                    const centerY = 50;
                    
                    if (index === 0) {
                      // Place first (most frequent) word at center
                      x = centerX;
                      y = centerY;
                    } else {
                      // Calculate deterministic position using index-based spiral
                      const angle = index * 2.4; // Deterministic angle increment
                      const radius = Math.sqrt(index) * 8; // Spiral grows with square root
                      
                      // Convert polar to cartesian coordinates
                      const spiralX = centerX + Math.cos(angle) * radius;
                      const spiralY = centerY + Math.sin(angle) * radius;
                      
                      // Ensure words stay within bounds with proper margins
                      const margin = 8; // 8% margin from edges
                      x = Math.max(margin, Math.min(100 - margin, spiralX));
                      y = Math.max(margin, Math.min(100 - margin, spiralY));
                      
                      // If spiral position goes out of bounds, use grid fallback
                      if (spiralX < margin || spiralX > 100 - margin || spiralY < margin || spiralY > 100 - margin) {
                        const gridCols = Math.ceil(Math.sqrt(topWords.length));
                        const gridRow = Math.floor(index / gridCols);
                        const gridCol = index % gridCols;
                        const cellWidth = (100 - 2 * margin) / gridCols;
                        const cellHeight = (100 - 2 * margin) / Math.ceil(topWords.length / gridCols);
                        
                        x = margin + gridCol * cellWidth + cellWidth / 2;
                        y = margin + gridRow * cellHeight + cellHeight / 2;
                      }
                    }
                    
                    // Professional color palette
                    const colors = [
                      '#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626',
                      '#0891b2', '#65a30d', '#ea580c', '#4338ca', '#be123c',
                      '#0d9488', '#9333ea', '#0369a1', '#db2777', '#6366f1'
                    ];
                    
                    const color = colors[index % colors.length];
                    
                    return (
                      <span
                        key={word}
                        className="absolute hover:opacity-80 cursor-pointer transition-opacity duration-200 select-none transform -translate-x-1/2 -translate-y-1/2"
                        style={{ 
                          left: `${x}%`,
                          top: `${y}%`,
                          fontSize: `${fontSize}px`,
                          color: color,
                          fontFamily: 'Roboto, sans-serif', // Matching the guide
                          fontWeight: 500, // Consistent weight as per guide
                          textShadow: 'none',
                          zIndex: Math.max(1, Math.round(normalizedFreq * 10)),
                          lineHeight: 1,
                          padding: '2px' // Minimal padding as requested
                        }}
                        title={`${word}: ${count} occurrences`}
                      >
                        {word}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-400 text-center h-[450px] flex flex-col items-center justify-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p>Upload and process documents to see word cloud visualization</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        </div>
      </main>
      <Footer />
    </div>
  );
}