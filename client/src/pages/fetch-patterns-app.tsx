
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
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import fetchPatternsIcon from "@assets/FetchPatterns_Icon_1752663550310_1753148786989.png";
import fetchDogGif from "@assets/fpdog_1755853087353.gif";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import html2canvas from 'html2canvas';
// @ts-ignore
import html2pdf from 'html2pdf.js';
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

export default function FetchPatternsApp() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Check beta authentication
  useEffect(() => {
    const betaAuth = sessionStorage.getItem("betaAuth");
    if (!betaAuth) {
      setLocation("/beta-login");
    }
  }, [setLocation]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // For cumulative uploads
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressStage, setProgressStage] = useState<'uploading' | 'analyzing' | 'fetching' | 'done' | null>(null);
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

  // App is now free - no authentication required

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
      
      console.log('Making API request to /api/fetch-patterns/question with documents:', documents.length);
      const response = await apiRequest("/api/fetch-patterns/question", "POST", { question, documents });
      const result = await response.json();
      console.log('API response received:', result);
      return result;
    },
    onSuccess: (data, variables) => {
      console.log('Question mutation success:', data);
      // Add to history instead of replacing
      setQuestionHistory(prev => [{ question: variables, data }, ...prev]);
      setQuestion(""); // Clear input after successful submission
    },
    onError: (error) => {
      console.error('Question mutation error:', error);
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
      
      console.log('Making API request to /api/fetch-patterns/context-analysis with documents:', documents.length);
      const response = await apiRequest("/api/fetch-patterns/context-analysis", "POST", { context, documents });
      const result = await response.json();
      console.log('API response received:', result);
      return result;
    },
    onSuccess: (data, variables) => {
      console.log('Context mutation success:', data);
      // Add to history instead of replacing
      setContextHistory(prev => [{ query: variables, data }, ...prev]);
      setContextQuery(""); // Clear input after successful submission
    },
    onError: (error) => {
      console.error('Context mutation error:', error);
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
    onMutate: () => {
      setProgressStage('uploading');
      setUploadProgress(0);
    },
    onSuccess: (data) => {
      const totalDocs = data.analyses ? data.analyses.length : 0;
      
      // Start progress bar system
      setProgressStage('analyzing');
      setUploadProgress(0);
      
      setSelectedFiles(null);
      setPendingFiles([]); // Clear pending files after successful upload
      
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
            
            // Update progress (without recreating toast to prevent blinking)
            const completedCount = updatedAnalyses.filter(a => a.status === 'completed' || a.status === 'error').length;
            
            // Update progress bar
            if (completedCount < totalDocs) {
              const progressPercent = Math.round((completedCount / totalDocs) * 100);
              setUploadProgress(progressPercent);
              
              if (progressPercent < 50) {
                setProgressStage('analyzing');
              } else if (progressPercent < 90) {
                setProgressStage('fetching');
              }
            }
            
            // Stop polling if all analyses are completed or have errors
            const allDone = updatedAnalyses.every(a => a.status === 'completed' || a.status === 'error');
            if (allDone) {
              clearInterval(interval);
              setPollInterval(null);
              
              // Complete progress
              setProgressStage('done');
              setUploadProgress(100);
              
              // Auto-scroll to metrics boxes after completion
              setTimeout(() => {
                setProgressStage(null); // Hide progress bar
                const metricsElement = document.getElementById('session-metrics');
                if (metricsElement) {
                  // Scroll to show the top of the metrics section
                  const elementRect = metricsElement.getBoundingClientRect();
                  const absoluteElementTop = elementRect.top + window.pageYOffset;
                  const offset = 80; // Account for navbar height
                  window.scrollTo({ 
                    top: absoluteElementTop - offset, 
                    behavior: 'smooth' 
                  });
                }
              }, 1500);
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
      console.log('Asking question:', question);
      console.log('Session analyses:', sessionAnalyses.length);
      questionMutation.mutate(question);
    }
  };

  const handleContextAnalysis = () => {
    if (contextQuery.trim()) {
      console.log('Analyzing context:', contextQuery);
      console.log('Session analyses:', sessionAnalyses.length);
      contextMutation.mutate(contextQuery);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("betaAuth");
    setLocation("/beta-login");
  };

  const exportToPDF = async () => {
    try {
      const currentDate = new Date();
      const dateStr = currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const timeStr = currentDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      
      // Capture the actual word cloud from the page (like Opera's Save as PDF)
      let wordCloudDataUrl = '';
      if (completedAnalyses.length > 0 && topWords.length > 0) {
        try {
          console.log('Capturing word cloud from page...');
          
          // Find the word cloud element
          const wordCloudElement = document.getElementById('word-cloud');
          if (wordCloudElement) {
            // Import html2canvas dynamically
            const html2canvas = (await import('html2canvas')).default;
            
            // Capture the word cloud section
            const canvas = await html2canvas(wordCloudElement, {
              backgroundColor: '#ffffff',
              scale: 2, // Higher quality
              useCORS: true,
              allowTaint: true,
              width: wordCloudElement.offsetWidth,
              height: wordCloudElement.offsetHeight
            });
            
            wordCloudDataUrl = canvas.toDataURL('image/png');
            console.log('Word cloud captured from page, length:', wordCloudDataUrl.length);
          }
        } catch (error) {
          console.error('Word cloud capture error:', error);
          // Fallback to simple text list if capture fails
          console.log('Using fallback word list...');
        }
      }

      // Create a styled HTML report
      const reportHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>FetchPatterns Analysis Report</title>
          <style>
            @media print {
              body { 
                margin: 0; 
                padding: 20px; 
              }
              * { 
                page-break-inside: avoid !important; 
                break-inside: avoid !important;
                page-break-before: avoid !important;
                page-break-after: avoid !important;
              }
              .section, .context-item, .qa-item {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              @page {
                size: auto;
                margin: 0.5in;
              }
              html, body {
                height: auto !important;
                overflow: visible !important;
                page-break-inside: avoid !important;
              }
            }
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              max-width: 800px; 
              margin: 0; 
              padding: 20px; 
              color: #1f2937; 
              background: white; 
              line-height: 1.4;
            }
            .header { 
              display: flex; 
              align-items: center; 
              gap: 12px; 
              margin-bottom: 24px; 
              padding-bottom: 16px; 
              border-bottom: 2px solid #e5e7eb; 
            }
            .header img { 
              width: 40px; 
              height: 40px; 
              object-fit: contain; 
            }
            

            .header h1 { 
              margin: 0; 
              font-size: 24px; 
              font-weight: bold; 
              color: #1f2937; 
            }
            .header p { 
              margin: 0; 
              font-size: 12px; 
              color: #6b7280; 
            }
            .report-header { 
              background: #f9fafb; 
              padding: 16px; 
              border-radius: 8px; 
              margin-bottom: 24px; 
            }
            .metrics-grid { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 16px; 
              margin-bottom: 32px; 
            }
            .metric-card { 
              background: white; 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              padding: 16px; 
              text-align: center; 
            }
            .section { 
              margin-bottom: 32px; 
            }
            .qa-item, .context-item { 
              background: #f9fafb; 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              padding: 16px; 
              margin-bottom: 16px; 
            }
            .sentiment-grid { 
              display: flex; 
              justify-content: space-around; 
              background: white; 
              padding: 16px; 
              border-radius: 6px; 
              border: 1px solid #e5e7eb; 
            }
            .sentiment-box { 
              text-align: center; 
              flex: 1; 
              margin: 0 4px; 
            }
            .sentiment-positive { 
              background: #dcfce7; 
              color: #15803d; 
              padding: 8px 12px; 
              border-radius: 6px; 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 4px; 
            }
            .sentiment-negative { 
              background: #fef2f2; 
              color: #dc2626; 
              padding: 8px 12px; 
              border-radius: 6px; 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 4px; 
            }
            .sentiment-neutral { 
              background: #f3f4f6; 
              color: #6b7280; 
              padding: 8px 12px; 
              border-radius: 6px; 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 4px; 
            }
            .tag { 
              display: inline-block; 
              padding: 4px 8px; 
              border-radius: 4px; 
              font-size: 12px; 
              margin-right: 8px; 
              margin-bottom: 4px; 
            }
            .tag-classification { 
              background: #dbeafe; 
              color: #1e40af; 
              border: 1px solid #bfdbfe; 
            }
            .tag-keyword { 
              background: #f3e8ff; 
              color: #7c3aed; 
              border: 1px solid #e9d5ff; 
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <img src="${fetchPatternsIcon}" alt="FetchPatterns" />
            <div>
              <h1>FetchPatterns</h1>
              <p>AI-Powered Document Analysis & Visualization</p>
            </div>
          </div>
          
          <!-- Report Header -->
          <div class="report-header">
            <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #1f2937;">Analysis Report</h2>
            <div style="font-size: 14px; color: #6b7280;">
              <p style="margin: 4px 0;">Generated by: Beta User</p>
              <p style="margin: 4px 0;">Date: ${dateStr}</p>
              <p style="margin: 4px 0;">Time: ${timeStr}</p>
              <p style="margin: 4px 0;">Documents Analyzed: ${sessionAnalyses.length}</p>
            </div>
          </div>
          
          <!-- Session Metrics -->
          <div class="section">
            <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1f2937;">Session Metrics</h3>
            <div class="metrics-grid">
              <div class="metric-card">
                <div style="font-size: 28px; font-weight: bold; color: #374151; margin-bottom: 8px;">${completedAnalyses.length}</div>
                <div style="font-size: 12px; color: #6b7280;">Documents Processed</div>
              </div>
              <div class="metric-card">
                <div style="font-size: 28px; font-weight: bold; color: #374151; margin-bottom: 8px;">${uniqueKeywords}</div>
                <div style="font-size: 12px; color: #6b7280;">Unique Keywords</div>
              </div>
              <div class="metric-card">
                <div style="font-size: 28px; font-weight: bold; color: #374151; margin-bottom: 8px;">${positiveSentimentDocs.length}</div>
                <div style="font-size: 12px; color: #6b7280;">Positive Sentiment Documents</div>
                <div style="font-size: 10px; color: #9ca3af;">${positivePercentage}% of all documents</div>
              </div>
              <div class="metric-card">
                <div style="font-size: 28px; font-weight: bold; color: #374151; margin-bottom: 8px;">${negativeSentimentDocs.length}</div>
                <div style="font-size: 12px; color: #6b7280;">Negative Sentiment Documents</div>
                <div style="font-size: 10px; color: #9ca3af;">${negativePercentage}% of all documents</div>
              </div>
            </div>
          </div>
          
          <!-- Document Analyses -->
          ${completedAnalyses.length > 0 ? `
          <div class="section">
            <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1f2937;">Document Analyses</h3>
            ${completedAnalyses.map((analysis, index) => `
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${analysis.originalName}</h4>
                
                <!-- Classification and Keywords -->
                <div style="margin-bottom: 12px;">
                  ${analysis.classification ? `<span class="tag tag-classification">${analysis.classification}</span>` : ''}
                  ${analysis.keywords ? analysis.keywords.slice(0, 3).map(keyword => `<span class="tag tag-keyword">${keyword}</span>`).join('') : ''}
                </div>
                
                ${analysis.summary ? `<p style="margin: 0 0 12px 0; font-size: 14px; color: #374151; line-height: 1.5;">${analysis.summary}</p>` : ''}
                
                ${analysis.sentiment ? `
                <div style="margin-bottom: 8px;">
                  <span style="font-size: 12px; color: #6b7280;"><strong>Sentiment:</strong> ${analysis.sentiment.label} (${(analysis.sentiment.score * 100).toFixed(1)}%)</span>
                </div>` : ''}
                
                ${analysis.wordCount ? `
                <div style="font-size: 12px; color: #6b7280;">
                  <strong>Word Count:</strong> ${analysis.wordCount} words
                </div>` : ''}
              </div>
            `).join('')}
          </div>` : ''}
          
          <!-- Q&A History -->
          ${questionHistory.length > 0 ? `
          <div class="section">
            <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1f2937;">Q&A History</h3>
            ${questionHistory.map((qa, index) => `
              <div class="qa-item">
                <div style="margin-bottom: 12px; line-height: 1.5;">
                  <strong style="color: #1f2937; font-size: 14px;">Question ${index + 1}:</strong>
                  <div style="margin-top: 4px; color: #374151; font-size: 14px; line-height: 1.6;">${qa.question || 'N/A'}</div>
                </div>
                <div style="margin-bottom: 12px; line-height: 1.5;">
                  <strong style="color: #1f2937; font-size: 14px;">Answer:</strong>
                  <div style="margin-top: 4px; color: #374151; font-size: 14px; line-height: 1.6;">${(qa.data?.answer || (qa as any).answer || 'N/A').replace(/\*\*/g, '').replace(/\*/g, '').replace(/—/g, '-').replace(/–/g, '-')}</div>
                </div>
                <div style="font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  <strong>Confidence Score:</strong> ${qa.data?.confidence ? (qa.data.confidence * 100).toFixed(1) : ((qa as any).confidence ? ((qa as any).confidence * 100).toFixed(1) : 'N/A')}%
                </div>
              </div>
            `).join('')}
          </div>` : ''}
          
          <!-- Context-Specific Sentiment Analysis -->
          ${contextHistory.length > 0 ? `
          <div class="section">
            <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1f2937;">Context-Specific Sentiment Analysis</h3>
            ${contextHistory.map((context, index) => `
              <div class="context-item" style="padding: 20px;">
                <div style="margin-bottom: 16px;">
                  <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Context Query:</h4>
                  <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 14px; color: #374151; line-height: 1.5;">
                    "${context.query || (context as any).context || 'N/A'}"
                  </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <h5 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937;">Analysis Summary:</h5>
                  <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${(context.data?.summary || (context as any).summary || 'N/A').replace(/\*\*/g, '').replace(/\*/g, '').replace(/—/g, '-').replace(/–/g, '-')}</p>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <h5 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">Sentiment Breakdown:</h5>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                      <div style="width: 80px; font-size: 14px; font-weight: 500; color: #374151;">Positive</div>
                      <div style="flex: 1; background: #e5e7eb; border-radius: 9999px; height: 24px; position: relative;">
                        <div style="background: #10b981; height: 24px; border-radius: 9999px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; width: ${context.data?.sentimentBreakdown?.positive || (context as any).sentimentBreakdown?.positive || 0}%;">
                          <span style="color: white; font-size: 14px; font-weight: 500;">${context.data?.sentimentBreakdown?.positive || (context as any).sentimentBreakdown?.positive || 0}%</span>
                        </div>
                      </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                      <div style="width: 80px; font-size: 14px; font-weight: 500; color: #374151;">Negative</div>
                      <div style="flex: 1; background: #e5e7eb; border-radius: 9999px; height: 24px; position: relative;">
                        <div style="background: #a855f7; height: 24px; border-radius: 9999px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; width: ${context.data?.sentimentBreakdown?.negative || (context as any).sentimentBreakdown?.negative || 0}%;">
                          <span style="color: white; font-size: 14px; font-weight: 500;">${context.data?.sentimentBreakdown?.negative || (context as any).sentimentBreakdown?.negative || 0}%</span>
                        </div>
                      </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                      <div style="width: 80px; font-size: 14px; font-weight: 500; color: #374151;">Neutral</div>
                      <div style="flex: 1; background: #e5e7eb; border-radius: 9999px; height: 24px; position: relative;">
                        <div style="background: #6b7280; height: 24px; border-radius: 9999px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; width: ${context.data?.sentimentBreakdown?.neutral || (context as any).sentimentBreakdown?.neutral || 0}%;">
                          <span style="color: white; font-size: 14px; font-weight: 500;">${context.data?.sentimentBreakdown?.neutral || (context as any).sentimentBreakdown?.neutral || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style="background: #dbeafe; border: 1px solid #bfdbfe; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 16px; margin-top: 16px;">
                  <div style="margin-bottom: 16px;">
                    <div style="color: #1f2937; font-weight: 600; margin-bottom: 8px;">Emotional Tone:</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                      ${(context.data?.emotionalTone || (context as any).emotionalTone || ['neutral']).map((tone: string) => 
                        `<span style="background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${tone}</span>`
                      ).join('')}
                    </div>
                  </div>
                  
                  <div style="margin-bottom: 16px;">
                    <div style="color: #1f2937; font-weight: 600; margin-bottom: 8px;">Key Phrases:</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                      ${(context.data?.keyPhrases || (context as any).keyPhrases || []).slice(0, 5).map((phrase: string) => 
                        `<span style="background: #fce7f3; color: #be185d; border: 1px solid #f9a8d4; padding: 4px 8px; border-radius: 4px; font-size: 12px;">"${phrase}"</span>`
                      ).join('')}
                    </div>
                  </div>
                  
                  <div>
                    <div style="color: #1f2937; font-weight: 600; margin-bottom: 8px;">Context Summary:</div>
                    <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #bfdbfe; font-size: 14px; color: #374151; line-height: 1.5;">
                      ${(context.data?.summary || (context as any).summary || 'N/A').replace(/\*\*/g, '').replace(/\*/g, '').replace(/—/g, '-').replace(/–/g, '-')}
                    </div>
                  </div>
                  
                  <div style="margin-top: 12px; font-size: 12px; color: #6b7280;">
                    <strong>Total Mentions:</strong> ${context.data?.mentions || (context as any).mentions || 0}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>` : ''}
          
          <!-- Word Cloud - Moved to end like in app -->
          ${wordCloudDataUrl ? `
          <div class="section" style="page-break-inside: avoid; margin-bottom: 32px;">
            <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Word Cloud Analysis (${wordCount} words)</h3>
            <div style="text-align: center; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 16px 0;">
              <img src="${wordCloudDataUrl}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" alt="Word Cloud Visualization" />
            </div>
          </div>` : ''}
          
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
            Generated by FetchPatterns - AI-Powered Document Analysis & Visualization
          </div>
        </body>
        </html>
      `;
      
      // Open report in new window and trigger print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportHtml);
        printWindow.document.close();
        
        // Wait for content to load, then focus and print
        printWindow.onload = () => {
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
        
        toast({
          title: "Print Dialog Opened",
          description: "Use your browser's print dialog to save as PDF with perfect formatting.",
        });
      } else {
        // Fallback: create blob and download
        const blob = new Blob([reportHtml], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FetchPatterns_Report_${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}_${String(currentDate.getHours()).padStart(2, '0')}-${String(currentDate.getMinutes()).padStart(2, '0')}.html`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "HTML Report Downloaded",
          description: "Open the HTML file and use your browser's print function to save as PDF.",
        });
      }
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate statistics
  const completedAnalyses = analyses.filter(a => a.status === 'completed');
  const uniqueKeywords = Array.from(new Set(completedAnalyses.flatMap(a => a.keywords || []))).length;
  const positiveSentimentDocs = completedAnalyses.filter(a => 
    a.sentiment && a.sentiment.label === 'positive'
  );
  const negativeSentimentDocs = completedAnalyses.filter(a => 
    a.sentiment && a.sentiment.label === 'negative'
  );
  
  // Calculate percentages
  const positivePercentage = completedAnalyses.length > 0 ? 
    Math.round((positiveSentimentDocs.length / completedAnalyses.length) * 100) : 0;
  const negativePercentage = completedAnalyses.length > 0 ? 
    Math.round((negativeSentimentDocs.length / completedAnalyses.length) * 100) : 0;

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

  const exportPNG = async (elementId: string, filename: string) => {
    try {
      // Create a clean export element
      const exportDiv = document.createElement('div');
      exportDiv.style.width = '800px';
      exportDiv.style.height = '600px';
      exportDiv.style.backgroundColor = '#ffffff';
      exportDiv.style.padding = '40px';
      exportDiv.style.fontFamily = 'Roboto, sans-serif';
      exportDiv.style.position = 'absolute';
      exportDiv.style.left = '-9999px';
      
      // Add header text
      const headerDiv = document.createElement('div');
      headerDiv.style.marginBottom = '20px';
      headerDiv.innerHTML = `
        <div style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 4px;">
          Fetch Patterns Word Cloud
        </div>
        <div style="font-size: 14px; color: #6b7280;">
          ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      `;
      exportDiv.appendChild(headerDiv);
      
      // Add word cloud container
      const wordCloudDiv = document.createElement('div');
      wordCloudDiv.style.width = '720px';
      wordCloudDiv.style.height = '480px';
      wordCloudDiv.style.position = 'relative';
      
      // Clone the original word cloud content
      const originalWordCloud = document.querySelector('#word-cloud .bg-white.p-8');
      if (originalWordCloud) {
        const wordCloudClone = originalWordCloud.cloneNode(true) as HTMLElement;
        wordCloudClone.style.width = '100%';
        wordCloudClone.style.height = '100%';
        wordCloudClone.style.padding = '20px';
        wordCloudDiv.appendChild(wordCloudClone);
      }
      
      exportDiv.appendChild(wordCloudDiv);
      document.body.appendChild(exportDiv);

      // Capture the clean export
      const canvas = await (html2canvas as any)(exportDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        width: 800,
        height: 600,
      });

      // Remove the temporary element
      document.body.removeChild(exportDiv);

      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error", 
        description: "Failed to export word cloud. Please try again.",
        variant: "destructive",
      });
    }
  };

  // App is now free and accessible without authentication

  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      
      <main className="pt-0 pb-6">
        {/* FetchPatterns specific header - sticky and compact */}
        <div className="bg-gray-50 border-b border-gray-200 py-3 sticky z-20" style={{top: '64px'}}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={fetchPatternsIcon} alt="FetchPatterns" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">FetchPatterns</h1>
                <p className="text-gray-600 text-xs">AI-Powered Document Analysis & Visualization</p>
              </div>
            </div>
            
            {/* Header Controls */}
            <div className="flex items-center gap-3">
              {/* How to Use Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('/x7k9p/how-to', '_blank')}
                className="text-accent-blue hover:text-accent-blue hover:bg-accent-blue-light h-8"
                title="Open How to Use Guide in new tab"
                data-testid="button-help"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
              
              {/* PDF Download Button */}
              {sessionAnalyses.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportToPDF}
                  className="text-accent-green hover:text-accent-green hover:bg-accent-green-light h-8"
                  title="Download comprehensive PDF report with all analyses"
                  data-testid="button-download-pdf"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              
              {/* Refresh Session Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-accent-purple hover:text-accent-purple hover:bg-accent-purple-light h-8"
                title="Refresh page and start a new analysis session"
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {/* User Display */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>Beta User</span>
              </div>
              
              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-accent-orange hover:text-accent-orange hover:bg-accent-orange-light h-8"
                title="Log out of Fetch Patterns"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">


        {/* Upload Section */}
        <Card className="bg-white border-l-4 border-l-accent-cyan">
          <CardHeader>
            <CardTitle className="text-accent-cyan">
              Upload Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label 
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-accent-cyan border-dashed rounded-lg cursor-pointer bg-accent-cyan-light hover:bg-accent-cyan-light transition-colors"
                  title="Click to select files for analysis"
                  data-testid="upload-area"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-accent-cyan" />
                    <p className="mb-2 text-sm text-accent-cyan">
                      {selectedFiles ? (
                        <span className="font-semibold">{selectedFiles.length} files selected</span>
                      ) : (
                        <span className="font-semibold">Choose files</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">Select multiple files (PDF, DOCX, PPTX, XLSX, TXT, Images)</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.docx,.pptx,.xlsx,.txt,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    data-testid="input-file-upload"
                  />
                </label>
              </div>

              {/* Walking dog container - separate but visually connected */}
              {progressStage && progressStage !== 'done' && (
                <div className="bg-gray-50 border border-b-0 rounded-t-lg" style={{ paddingTop: '8px', paddingBottom: '4px', paddingLeft: '16px', paddingRight: '16px', marginBottom: '0px' }}>
                  <div className="relative w-full h-12">
                    {/* Walking dog animation */}
                    <div 
                      className="absolute top-0 transition-all duration-500 ease-linear"
                      style={{ 
                        left: `calc(${Math.min(uploadProgress, 95)}% - 0px)`,
                        width: '40px',
                        height: '40px'
                      }}
                    >
                      <img 
                        src={fetchDogGif} 
                        alt="Walking dog"
                        style={{ 
                          width: '40px', 
                          height: '40px',
                          objectFit: 'contain',
                          imageRendering: 'pixelated',
                          transform: 'scale(2.5)',
                          transformOrigin: 'center'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Bar with textual states */}
              {progressStage && (
                <div className="bg-gray-50 p-4 border" style={{ 
                  borderTop: progressStage !== 'done' ? 'none' : '1px solid #d1d5db', 
                  borderRadius: progressStage !== 'done' ? '0 0 8px 8px' : '8px',
                  marginTop: progressStage !== 'done' ? '0px' : undefined,
                  paddingTop: progressStage !== 'done' ? '0px' : '16px'
                }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-700">
                      {progressStage === 'uploading' && 'Uploading...'}
                      {progressStage === 'analyzing' && 'Analyzing...'}
                      {progressStage === 'fetching' && 'Fetching patterns...'}
                      {progressStage === 'done' && 'Done'}
                    </div>
                    <div className="text-sm text-gray-500">{uploadProgress}%</div>
                  </div>
                  <div className="relative w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-accent-blue h-2 rounded-full transition-all duration-500"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={handleUpload}
                disabled={!selectedFiles || uploadMutation.isPending || !!progressStage}
                className="w-full bg-accent-blue hover:bg-accent-blue-dark text-white transition-colors"
                title="Start document analysis process"
                data-testid="button-upload-analyze"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload & Analyze"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div id="session-metrics" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white text-center p-6 border-l-4 border-accent-blue">
            <div className="text-4xl font-bold text-accent-blue mb-2">{completedAnalyses.length}</div>
            <div className="text-sm text-gray-500">Documents Processed</div>
          </Card>
          <Card className="bg-white text-center p-6 border-l-4 border-accent-purple">
            <div className="text-4xl font-bold text-accent-purple mb-2">{uniqueKeywords}</div>
            <div className="text-sm text-gray-500">Unique Keywords</div>
          </Card>
          <Card className="bg-white text-center p-6 border-l-4 border-accent-green">
            <div className="text-4xl font-bold text-accent-green mb-2">{positiveSentimentDocs.length}</div>
            <div className="text-sm text-gray-500">Positive Sentiment Documents</div>
            <div className="text-xs text-gray-400">{positivePercentage}% of all documents</div>
          </Card>
          <Card className="bg-white text-center p-6 border-l-4 border-accent-orange">
            <div className="text-4xl font-bold text-accent-orange mb-2">{negativeSentimentDocs.length}</div>
            <div className="text-sm text-gray-500">Negative Sentiment Documents</div>
            <div className="text-xs text-gray-400">{negativePercentage}% of all documents</div>
          </Card>
        </div>

        {/* Document Summaries */}
        <Card className="bg-white" id="document-summaries">
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
                            className="bg-accent-blue-light text-accent-blue border-accent-blue text-xs px-2 py-1"
                          >
                            {analysis.classification}
                          </Badge>
                        )}
                        {analysis.keywords && analysis.keywords.slice(0, 3).map((keyword, idx) => {
                          const colors = [
                            "bg-accent-purple-light text-accent-purple border-accent-purple",
                            "bg-accent-green-light text-accent-green border-accent-green", 
                            "bg-accent-orange-light text-accent-orange border-accent-orange"
                          ];
                          return (
                            <Badge 
                              key={idx}
                              variant="outline" 
                              className={`${colors[idx % 3]} text-xs px-2 py-1`}
                            >
                              {keyword}
                            </Badge>
                          );
                        })}
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

        {/* Ask Questions Section */}
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">
                Ask Questions About Your Documents
              </CardTitle>
              {questionHistory.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const csvRows = ['Question,Answer,Confidence %'];
                    questionHistory.forEach(item => {
                      csvRows.push(`"${item.question}","${item.data.answer}","${(item.data.confidence * 100).toFixed(1)}"`);
                    });
                    const csvContent = csvRows.join('\n');
                    exportCSV(csvContent, `Fetch_Patterns_Q&A_${new Date().toISOString().slice(0,10)}.csv`);
                  }}
                  className="text-gray-600 border-gray-300"
                  title="Export Q&A history as CSV file"
                  data-testid="button-export-qa-csv"
                >
                  CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type in a question about the documents uploaded"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                title="Ask any question about your uploaded documents"
                data-testid="input-question"
              />
              <Button 
                onClick={() => {
                  console.log('ASK QUESTION BUTTON CLICKED!');
                  handleAskQuestion();
                }}
                disabled={!question.trim() || questionMutation.isPending}
                className="bg-accent-green hover:bg-accent-green text-white transition-colors"
                style={{ backgroundColor: 'var(--accent-green)' }}
                title="Get AI-powered answers about your uploaded documents"
                data-testid="button-ask-question"
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
                title="Export context analysis results as CSV file"
                data-testid="button-export-context-csv"
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
                title="Enter a specific topic or theme to analyze across all documents"
                data-testid="input-context-query"
              />
              <Button 
                onClick={() => {
                  console.log('CONTEXT ANALYSIS BUTTON CLICKED!');
                  handleContextAnalysis();
                }}
                disabled={!contextQuery.trim() || contextMutation.isPending}
                className="bg-accent-purple hover:bg-accent-purple text-white transition-colors"
                style={{ backgroundColor: 'var(--accent-purple)' }}
                title="Analyze sentiment and mentions for specific topics across all documents"
                data-testid="button-analyze-context"
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
                              className="bg-accent-green h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${item.data.sentimentBreakdown.positive}%`, backgroundColor: 'var(--accent-green)' }}
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
                              className="bg-accent-orange h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${item.data.sentimentBreakdown.negative}%`, backgroundColor: 'var(--accent-orange)' }}
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
                              className="bg-accent-cyan h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${item.data.sentimentBreakdown.neutral}%`, backgroundColor: 'var(--accent-cyan)' }}
                            >
                              <span className="text-white text-sm font-medium">
                                {item.data.sentimentBreakdown.neutral}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Details in blue box */}
                      <Card className="bg-accent-blue-light border-accent-blue border-l-4 border-l-accent-blue"
                            style={{ backgroundColor: 'var(--accent-blue-light)', borderColor: 'var(--accent-blue)', borderLeftColor: 'var(--accent-blue)' }}>
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
                                  <Badge key={phraseIndex} className="bg-accent-pink-light text-accent-pink border-accent-pink">
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
        <Card className="bg-white border-l-4 border-l-accent-pink" id="word-cloud">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-accent-pink">
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
                    title="Set number of words to display in word cloud (1-100)"
                    data-testid="input-word-count"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportPNG('word-cloud', `Fetch_Patterns_WordCloud_${new Date().toISOString().slice(0,10)}.png`)}
                    className="text-gray-600 border-gray-300"
                    title="Export word cloud as PNG image"
                    data-testid="button-export-wordcloud-png"
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
                    title="Export word frequency data as CSV file"
                    data-testid="button-export-wordcloud-csv"
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
            >
              {topWords.length > 0 ? (
                <WordCloud 
                  words={topWords.map(([text, value]) => ({ text, value }))}
                  width={600} // Wider to fill container better
                  height={450}
                />
              ) : (
                <div className="text-gray-400 text-center h-[450px] flex flex-col items-center justify-center">
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