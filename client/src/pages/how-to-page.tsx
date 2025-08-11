import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Upload, 
  BarChart3, 
  MessageSquare, 
  Download,
  AlertCircle,
  CheckCircle,
  Users,
  TrendingUp,
  Eye,
  Search,
  User,
  LogOut,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import fetchPatternsIcon from "@assets/FetchPatterns_Icon_1752663550310_1753148786989.png";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function HowToPage() {
  const handleLogout = () => {
    sessionStorage.removeItem("betaAuth");
    window.location.href = "/beta-login";
  };

  const handleBackToApp = () => {
    window.close();
    // Fallback if window.close() doesn't work
    window.location.href = "/x7k9p/fp-analyzer";
  };

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
                <h1 className="text-xl font-bold text-gray-900">FetchPatterns - How to Use</h1>
                <p className="text-gray-600 text-xs">Complete guide to document analysis features</p>
              </div>
            </div>
            
            {/* Header Controls */}
            <div className="flex items-center gap-3">
              {/* Back to App Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToApp}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8"
                title="Back to Fetch Patterns"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              {/* Refresh Page Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8"
                title="Refresh Page"
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
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                How to Use Fetch Patterns
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                A comprehensive guide to understanding and effectively using our AI-powered document analysis platform
              </p>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Who This App Is For */}
        <section className="mb-12">
          <Card className="border-l-4 border-l-accent-blue">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent-blue">
                <Users className="h-5 w-5 text-accent-blue" />
                Who This App Is For
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Business Professionals</h3>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Analysts reviewing reports and proposals</li>
                    <li>• Managers processing team documents</li>
                    <li>• Consultants analyzing client materials</li>
                    <li>• Researchers handling multiple documents</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Content Teams</h3>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Writers analyzing source materials</li>
                    <li>• Editors reviewing document sentiment</li>
                    <li>• Marketing teams processing feedback</li>
                    <li>• Legal teams reviewing contracts</li>
                  </ul>
                </div>
              </div>
              <div className="bg-accent-blue-light p-4 rounded-lg" style={{ backgroundColor: 'var(--accent-blue-light)' }}>
                <p className="text-accent-blue font-medium">
                  Perfect for anyone who needs to quickly understand the key themes, sentiment, and insights from business documents without reading everything manually.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Understanding Key Terms */}
        <section className="mb-12">
          <Card className="border-l-4 border-l-accent-green">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent-green">
                <Search className="h-5 w-5 text-accent-green" />
                Understanding Key Terms & Functions
              </CardTitle>
              <CardDescription>
                Learn what each feature does and how the AI analyzes your documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Analysis Terms */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Analysis Results</h3>
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Sentiment Analysis</h4>
                      <p className="text-gray-600 text-sm">
                        Determines if your document expresses positive, negative, or neutral emotions. 
                        Shown as a percentage (e.g., 85% positive means very optimistic tone).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Classification</h4>
                      <p className="text-gray-600 text-sm">
                        Categorizes your document type (e.g., "Business Proposal", "Technical Report", "Marketing Material").
                        Helps you quickly understand what kind of document you're dealing with.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Key Insights</h4>
                      <p className="text-gray-600 text-sm">
                        Important findings and takeaways extracted by AI. These are the most significant points 
                        you should know about the document.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Risk Flags</h4>
                      <p className="text-gray-600 text-sm">
                        Potential concerns or issues identified in the document. 
                        Pay attention to these for risk management and decision-making.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dashboard Metrics */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Dashboard Metrics</h3>
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Positive/Negative Sentiment Documents</h4>
                      <p className="text-gray-600 text-sm">
                        Shows the percentage breakdown of your documents by sentiment. 
                        Helps you understand the overall tone of your document collection.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Total Documents</h4>
                      <p className="text-gray-600 text-sm">
                        The number of documents you've analyzed. Track your usage and productivity over time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* How to Use Effectively */}
        <section className="mb-12">
          <Card className="border-l-4 border-l-accent-purple">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent-purple">
                <CheckCircle className="h-5 w-5 text-accent-purple" />
                How to Use Fetch Patterns Most Effectively
              </CardTitle>
              <CardDescription>
                Step-by-step guide to get the most value from document analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Step 1: Upload */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">Step 1</Badge>
                  <h3 className="font-semibold text-gray-900">Upload Your Documents</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Upload className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        <strong>Supported formats:</strong> PDF, DOCX, XLSX, PPTX, and images (JPG, PNG)
                      </p>
                      <p className="text-gray-600 text-sm">
                        You can upload multiple files at once. The walking dog animation shows your upload progress!
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Best Practices:</h4>
                  <ul className="text-gray-600 text-sm space-y-1 ml-4">
                    <li>• Upload clear, well-formatted documents for best analysis results</li>
                    <li>• Group related documents together for easier comparison</li>
                    <li>• Start with your most important documents first</li>
                  </ul>
                </div>
              </div>

              <Separator />

              {/* Step 2: Review Analysis */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">Step 2</Badge>
                  <h3 className="font-semibold text-gray-900">Review AI Analysis Results</h3>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">What to Look For:</h4>
                  <ul className="text-gray-600 text-sm space-y-1 ml-4">
                    <li>• <strong>Sentiment Score:</strong> Is the document positive (above 70%), neutral (40-70%), or negative (below 40%)?</li>
                    <li>• <strong>Key Insights:</strong> What are the main takeaways that matter for your work?</li>
                    <li>• <strong>Risk Flags:</strong> Are there any concerns that need immediate attention?</li>
                    <li>• <strong>Classification:</strong> Does the AI correctly understand what type of document this is?</li>
                  </ul>
                </div>
              </div>

              <Separator />

              {/* Step 3: Ask Questions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">Step 3</Badge>
                  <h3 className="font-semibold text-gray-900">Ask Targeted Questions</h3>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-purple-800 font-medium">
                        Use the Q&A feature to get specific answers about your documents
                      </p>
                      <p className="text-purple-700 text-sm">
                        The AI can answer questions using the content from all your uploaded documents.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Effective Question Examples:</h4>
                  <ul className="text-gray-600 text-sm space-y-1 ml-4">
                    <li>• "What are the main risks mentioned across all documents?"</li>
                    <li>• "What budget figures are discussed in these proposals?"</li>
                    <li>• "What are the key recommendations from these reports?"</li>
                    <li>• "Are there any contradictions between these documents?"</li>
                    <li>• "What are the next steps mentioned in these materials?"</li>
                  </ul>
                </div>
              </div>

              <Separator />

              {/* Step 4: Generate Reports */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-orange-50 text-orange-700">Step 4</Badge>
                  <h3 className="font-semibold text-gray-900">Generate & Share Reports</h3>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Download className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-orange-800 font-medium">
                        Create professional PDF reports with all your analysis results
                      </p>
                      <p className="text-orange-700 text-sm">
                        Reports include word clouds, analysis summaries, and Q&A results in a clean, shareable format.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Report Best Practices:</h4>
                  <ul className="text-gray-600 text-sm space-y-1 ml-4">
                    <li>• Generate reports after you've asked all your questions</li>
                    <li>• Use reports for stakeholder presentations and documentation</li>
                    <li>• Reports maintain the exact format of your browser's "Save as PDF" function</li>
                    <li>• Include context by analyzing related documents together</li>
                  </ul>
                </div>
              </div>

            </CardContent>
          </Card>
        </section>

        {/* Pro Tips */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Pro Tips for Maximum Value
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Document Preparation</h3>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• Ensure documents have clear text (not just images)</li>
                    <li>• Remove unnecessary pages to focus analysis</li>
                    <li>• Use descriptive filenames for easier identification</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Analysis Strategy</h3>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• Start with overview questions before diving deep</li>
                    <li>• Compare sentiment across similar document types</li>
                    <li>• Use the dashboard metrics to spot trends</li>
                  </ul>
                </div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-indigo-800 text-sm">
                  <strong>Remember:</strong> Fetch Patterns is designed to augment your analysis, not replace your expertise. 
                  Use the AI insights as a starting point for deeper investigation and decision-making.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Getting Started */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Ready to Get Started?</CardTitle>
              <CardDescription className="text-center">
                You now have everything you need to effectively use Fetch Patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <p className="text-gray-600">
                  Start by uploading your first document and exploring the AI analysis results. 
                  Remember, you can always return to this guide for reference.
                </p>
                <div className="flex justify-center gap-4">
                  <Badge variant="secondary">Upload Documents</Badge>
                  <Badge variant="secondary">Review Analysis</Badge>
                  <Badge variant="secondary">Ask Questions</Badge>
                  <Badge variant="secondary">Generate Reports</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}