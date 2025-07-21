import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  BarChart3, 
  Brain, 
  MessageSquare,
  Download,
  TrendingUp
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [question, setQuestion] = useState("");
  const [contextQuery, setContextQuery] = useState("");

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

  // Question answering mutation
  const questionMutation = useMutation({
    mutationFn: async (question: string) => {
      return await apiRequest(`/api/fetch-patterns/question`, {
        method: "POST",
        body: { question }
      });
    },
  });

  // Context analysis mutation
  const contextMutation = useMutation({
    mutationFn: async (context: string) => {
      return await apiRequest(`/api/fetch-patterns/context-analysis`, {
        method: "POST",
        body: { context }
      });
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
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: "Your documents are being processed.",
      });
      setSelectedFiles(null);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ["/api/fetch-patterns/analyses"] });
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
      setSelectedFiles(files);
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
  const uniqueKeywords = [...new Set(completedAnalyses.flatMap(a => a.keywords || []))].length;
  const highConfidence = completedAnalyses.filter(a => 
    a.sentiment && a.sentiment.score > 0.8
  ).length;
  const highRisk = completedAnalyses.filter(a => 
    a.sentiment && a.sentiment.label === 'negative'
  ).length;

  // Generate word cloud data
  const wordCloudData = completedAnalyses.reduce((acc, analysis) => {
    if (analysis.wordCloud) {
      analysis.wordCloud.forEach(word => {
        if (acc[word.text]) {
          acc[word.text] += word.value;
        } else {
          acc[word.text] = word.value;
        }
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const topWords = Object.entries(wordCloudData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 50);

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">FetchPatterns</h1>
          <p className="text-gray-300 text-center">AI-Powered Document Analysis & Visualization</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Upload Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400">
                      {selectedFiles ? (
                        <span className="font-semibold">{selectedFiles.length} files selected</span>
                      ) : (
                        <span><span className="font-semibold">Click to upload</span> or drag and drop</span>
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
              
              {selectedFiles && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-300">Selected files:</div>
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} className="text-sm text-gray-400 bg-gray-700 p-2 rounded">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ))}
                </div>
              )}

              {uploadProgress > 0 && (
                <Progress value={uploadProgress} className="w-full" />
              )}

              <Button 
                onClick={handleUpload}
                disabled={!selectedFiles || uploadMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload & Analyze"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-400">{completedAnalyses.length}</div>
              <div className="text-sm text-gray-400">Documents Processed</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400">{uniqueKeywords}</div>
              <div className="text-sm text-gray-400">Unique Keywords</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400">{highConfidence}</div>
              <div className="text-sm text-gray-400">High Confidence</div>
              <div className="text-xs text-gray-500">Sentiment confidence &gt; 80%</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-red-400">{highRisk}</div>
              <div className="text-sm text-gray-400">High Risk Documents</div>
              <div className="text-xs text-gray-500">Negative sentiment documents</div>
            </CardContent>
          </Card>
        </div>

        {/* Ask Questions Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Ask Questions About Your Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What is c:pesa's positioning strategy?"
                className="flex-1 bg-gray-700 border-gray-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
              />
              <Button 
                onClick={handleAskQuestion}
                disabled={!question.trim() || questionMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ask Question
              </Button>
            </div>

            {questionMutation.data && (
              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-300 mb-2">
                  <strong>Question:</strong> {questionMutation.variables}
                </div>
                <div className="text-sm text-gray-300 mb-2">
                  <strong>Answer:</strong>
                </div>
                <div className="text-white mb-2">{questionMutation.data.answer}</div>
                <div className="text-sm text-gray-400">
                  <strong>Confidence:</strong> {(questionMutation.data.confidence * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Summaries */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Summaries
            </CardTitle>
            <CardDescription className="text-gray-400">
              AI-generated summaries and insights from your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedAnalyses.map((analysis) => (
                <div key={analysis.id} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{analysis.originalName}</h3>
                    {analysis.classification && (
                      <Badge variant="secondary" className="bg-blue-600 text-white">
                        {analysis.classification}
                      </Badge>
                    )}
                  </div>
                  
                  {analysis.summary && (
                    <p className="text-gray-300 text-sm mb-3">{analysis.summary}</p>
                  )}
                  
                  {analysis.wordCount && (
                    <div className="text-xs text-gray-400">
                      Word Count: {analysis.wordCount} words
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Context-Based Sentiment Analysis */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Context-Based Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Input
                value={contextQuery}
                onChange={(e) => setContextQuery(e.target.value)}
                placeholder="Enter a context to analyze (e.g., 'customer satisfaction', 'product quality', 'financial performance')"
                className="flex-1 bg-gray-700 border-gray-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleContextAnalysis()}
              />
              <Button 
                onClick={handleContextAnalysis}
                disabled={!contextQuery.trim() || contextMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Analyze Context
              </Button>
              <Button variant="outline" className="border-gray-600 text-gray-300">
                CSV
              </Button>
            </div>

            {contextMutation.data && (
              <div className="space-y-4">
                <div className="text-lg font-semibold text-white flex items-center justify-between">
                  {contextMutation.variables}
                  <span className="text-sm text-gray-400">{contextMutation.data.mentions} mentions</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-600 p-3 rounded text-center">
                    <div className="text-white font-semibold">Positive</div>
                    <div className="text-2xl font-bold">{contextMutation.data.sentimentBreakdown.positive}%</div>
                  </div>
                  <div className="bg-red-600 p-3 rounded text-center">
                    <div className="text-white font-semibold">Negative</div>
                    <div className="text-2xl font-bold">{contextMutation.data.sentimentBreakdown.negative}%</div>
                  </div>
                  <div className="bg-gray-600 p-3 rounded text-center">
                    <div className="text-white font-semibold">Neutral</div>
                    <div className="text-2xl font-bold">{contextMutation.data.sentimentBreakdown.neutral}%</div>
                  </div>
                </div>

                {contextMutation.data.emotionalTone && (
                  <div>
                    <div className="text-white font-semibold mb-2">Emotional Tone:</div>
                    <div className="flex gap-2">
                      {contextMutation.data.emotionalTone.map((tone, index) => (
                        <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                          {tone}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {contextMutation.data.keyPhrases && (
                  <div>
                    <div className="text-white font-semibold mb-2">Key Phrases:</div>
                    <div className="flex flex-wrap gap-2">
                      {contextMutation.data.keyPhrases.map((phrase, index) => (
                        <Badge key={index} className="bg-blue-600 text-white">
                          "{phrase}"
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {contextMutation.data.summary && (
                  <div>
                    <div className="text-white font-semibold mb-2">Context Summary:</div>
                    <div className="text-gray-300 text-sm">{contextMutation.data.summary}</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Word Cloud */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Word Cloud
            </CardTitle>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">Words: {topWords.length}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                  PNG
                </Button>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                  CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-700 p-6 rounded-lg min-h-[400px] flex flex-wrap items-center justify-center gap-2">
              {topWords.map(([word, count], index) => {
                const size = Math.max(12, Math.min(32, (count / Math.max(...Object.values(wordCloudData))) * 32));
                const colors = ['text-blue-400', 'text-green-400', 'text-yellow-400', 'text-red-400', 'text-purple-400', 'text-pink-400'];
                const color = colors[index % colors.length];
                
                return (
                  <span
                    key={word}
                    className={`${color} font-semibold hover:opacity-80 cursor-pointer`}
                    style={{ fontSize: `${size}px` }}
                    title={`${word}: ${count} occurrences`}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm py-8">
          Copyright Dark Street. All rights reserved.
        </div>
      </div>
    </div>
  );
}