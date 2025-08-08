import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Upload, MessageSquare, Sparkles, Download } from 'lucide-react';
import { useLocation } from 'wouter';

export default function FetchPatternsGuide() {
  const [, setLocation] = useLocation();

  const colors = {
    primary: '#8B5FBF', // Soft purple
    secondary: '#FF8A80', // Soft coral
    accent: '#81C784', // Soft green
    background: '#F3E5F5', // Very light purple
    surface: '#FFFFFF',
    text: '#4A4A4A',
    muted: '#A1A1A1'
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            onClick={() => setLocation('/fetch-patterns-open')}
            variant="outline"
            className="mr-4 border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: colors.primary }}>
              Fetch Patterns User Guide
            </h1>
            <p className="text-lg mt-2" style={{ color: colors.text }}>
              Learn how to make the most of your document analysis experience
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Getting Started */}
          <Card className="border border-purple-200">
            <CardHeader>
              <CardTitle style={{ color: colors.primary }}>Getting Started</CardTitle>
              <CardDescription>
                Welcome to Fetch Patterns Open Beta! Here's how to begin analyzing your documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: colors.primary }}>
                  1
                </div>
                <div>
                  <h4 className="font-medium">Create Your Account</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sign up with your email and password to get started. Your account keeps all your document analyses secure.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: colors.secondary }}>
                  2
                </div>
                <div>
                  <h4 className="font-medium">Upload Documents</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload PDF, DOCX, XLSX, images, or PPTX files. Our AI will automatically extract and analyze the content.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: colors.accent }}>
                  3
                </div>
                <div>
                  <h4 className="font-medium">Explore Results</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    View AI-generated insights, ask questions, and analyze patterns across your document collection.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Guide */}
          <Card className="border border-purple-200">
            <CardHeader>
              <CardTitle style={{ color: colors.primary }}>Features Overview</CardTitle>
              <CardDescription>
                Explore the powerful features available in Fetch Patterns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Tab */}
              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3E5F5' }}>
                  <Upload className="w-6 h-6" style={{ color: colors.primary }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2">Upload Tab</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Drag and drop or select files to upload. Supported formats include:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li><strong>PDF:</strong> Text extraction from reports, contracts, research papers</li>
                    <li><strong>DOCX:</strong> Microsoft Word documents with full text analysis</li>
                    <li><strong>XLSX:</strong> Excel spreadsheets with data extraction</li>
                    <li><strong>Images (JPG, PNG):</strong> OCR text extraction from photos and scans</li>
                    <li><strong>PPTX:</strong> PowerPoint presentations with slide content analysis</li>
                  </ul>
                </div>
              </div>

              {/* Documents Tab */}
              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3E5F5' }}>
                  <FileText className="w-6 h-6" style={{ color: colors.primary }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2">Documents Tab</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    View all your uploaded documents and their AI analysis results:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li><strong>Classification:</strong> AI categorizes document type (contract, report, invoice, etc.)</li>
                    <li><strong>Sentiment Analysis:</strong> Emotional tone detection (positive, negative, neutral)</li>
                    <li><strong>Keywords:</strong> Important terms and concepts automatically extracted</li>
                    <li><strong>Summary:</strong> AI-generated overview of key points and themes</li>
                    <li><strong>Processing Status:</strong> Real-time updates on document processing</li>
                  </ul>
                </div>
              </div>

              {/* Q&A Tab */}
              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3E5F5' }}>
                  <MessageSquare className="w-6 h-6" style={{ color: colors.primary }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2">Q&A Tab</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ask natural language questions about your documents:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li><strong>Cross-document search:</strong> Find information across multiple files</li>
                    <li><strong>Confidence scoring:</strong> AI provides confidence level for each answer</li>
                    <li><strong>Source citations:</strong> See which documents provided the answer</li>
                    <li><strong>Natural language:</strong> Ask questions like "What are the main risks mentioned?"</li>
                  </ul>
                </div>
              </div>

              {/* Insights Tab */}
              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3E5F5' }}>
                  <Sparkles className="w-6 h-6" style={{ color: colors.primary }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2">Insights Tab</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Get contextual analysis and discover patterns:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li><strong>Context Analysis:</strong> Analyze specific topics or themes across documents</li>
                    <li><strong>Sentiment Breakdown:</strong> Overall emotional tone distribution</li>
                    <li><strong>Key Phrases:</strong> Important terms related to your context query</li>
                    <li><strong>Pattern Recognition:</strong> Identify trends and connections between documents</li>
                  </ul>
                </div>
              </div>

              {/* PDF Export */}
              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3E5F5' }}>
                  <Download className="w-6 h-6" style={{ color: colors.primary }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2">PDF Export</h4>
                  <p className="text-sm text-muted-foreground">
                    Export your analysis results as a professional PDF report including document summaries, 
                    classifications, sentiment analysis, and key insights. Perfect for sharing with colleagues 
                    or including in presentations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips & Best Practices */}
          <Card className="border border-purple-200">
            <CardHeader>
              <CardTitle style={{ color: colors.primary }}>Tips & Best Practices</CardTitle>
              <CardDescription>
                Get the most out of Fetch Patterns with these helpful tips.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#E8F5E8' }}>
                  <h4 className="font-medium text-green-800 mb-2">📄 Document Quality</h4>
                  <p className="text-sm text-green-700">
                    For best results, upload clear, high-resolution documents. Avoid heavily formatted files 
                    with complex layouts that might affect text extraction.
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF3E0' }}>
                  <h4 className="font-medium text-orange-800 mb-2">🔍 Question Techniques</h4>
                  <p className="text-sm text-orange-700">
                    Ask specific questions for better results. Instead of "What's in this document?", 
                    try "What are the key financial metrics mentioned?"
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: '#E3F2FD' }}>
                  <h4 className="font-medium text-blue-800 mb-2">📊 Context Analysis</h4>
                  <p className="text-sm text-blue-700">
                    Use the Insights tab to explore themes across multiple documents. Enter topics like 
                    "customer satisfaction" or "risk factors" to find patterns.
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F3E5F5' }}>
                  <h4 className="font-medium text-purple-800 mb-2">⚡ Processing Time</h4>
                  <p className="text-sm text-purple-700">
                    Large documents may take a few minutes to process. You can upload multiple files 
                    simultaneously - they'll process in parallel.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Terms */}
          <Card className="border border-purple-200">
            <CardHeader>
              <CardTitle style={{ color: colors.primary }}>Technical Terms Explained</CardTitle>
              <CardDescription>
                Understanding the terminology used in Fetch Patterns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="border-l-4 pl-4" style={{ borderLeftColor: colors.primary }}>
                  <h4 className="font-medium">Classification</h4>
                  <p className="text-sm text-muted-foreground">
                    AI automatically categorizes your document type (e.g., contract, report, invoice) based on content analysis.
                  </p>
                </div>

                <div className="border-l-4 pl-4" style={{ borderLeftColor: colors.secondary }}>
                  <h4 className="font-medium">Sentiment Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Measures the emotional tone of text content, providing positive, negative, or neutral classifications with confidence scores.
                  </p>
                </div>

                <div className="border-l-4 pl-4" style={{ borderLeftColor: colors.accent }}>
                  <h4 className="font-medium">OCR (Optical Character Recognition)</h4>
                  <p className="text-sm text-muted-foreground">
                    Technology that extracts text from images and scanned documents, making them searchable and analyzable.
                  </p>
                </div>

                <div className="border-l-4 pl-4" style={{ borderLeftColor: '#FF9800' }}>
                  <h4 className="font-medium">Context Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Advanced analysis that examines how specific topics or themes appear across your document collection.
                  </p>
                </div>

                <div className="border-l-4 pl-4" style={{ borderLeftColor: '#9C27B0' }}>
                  <h4 className="font-medium">Confidence Score</h4>
                  <p className="text-sm text-muted-foreground">
                    A percentage indicating how certain the AI is about its analysis or answer, helping you evaluate reliability.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="border border-purple-200">
            <CardHeader>
              <CardTitle style={{ color: colors.primary }}>Need Help?</CardTitle>
              <CardDescription>
                Get assistance with your Fetch Patterns experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Fetch Patterns is currently in Open Beta. We're actively improving the platform based on user feedback.
                </p>
                <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                  <h4 className="font-medium mb-2">🐕 Your AI Fetch Companion</h4>
                  <p className="text-sm text-muted-foreground">
                    The animated dog icon represents your AI assistant that's always working to fetch the best 
                    insights from your documents. When it bounces, it's a friendly reminder that your AI companion 
                    is ready for the next analysis task!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}