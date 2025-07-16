import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Search, Brain, BarChart3, Target, MessageCircle } from "lucide-react";

export default function FetchPatterns() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-darkest flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const features = [
    {
      icon: FileText,
      title: "Document Processing",
      description: "Upload single documents or batches. The system reads, classifies, and processes them intelligently."
    },
    {
      icon: Search,
      title: "Pattern Recognition",
      description: "Surface dominant themes, keywords, and recurring patterns across your document collection."
    },
    {
      icon: Brain,
      title: "Sentiment Analysis",
      description: "Understand tone, sentiment, and emotional context within your documents."
    },
    {
      icon: BarChart3,
      title: "Risk Detection",
      description: "Identify potential risks, red flags, and critical gaps in your content."
    },
    {
      icon: Target,
      title: "Contextual Analysis",
      description: "Analyze by specific context: product quality, customer sentiment, competitive strategy."
    },
    {
      icon: MessageCircle,
      title: "Direct Questioning",
      description: "Ask questions directly to your document collection and get intelligent answers."
    }
  ];

  return (
    <div className="min-h-screen bg-surface-darkest">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            Fetch <span className="gradient-text">Patterns</span>
          </h1>
          <p className="text-2xl text-primary-blue mb-8 font-semibold">
            What your documents are trying to tell you.
          </p>
          <div className="max-w-4xl mx-auto text-secondary leading-relaxed space-y-6">
            <p className="text-lg">
              Most teams are sitting on a goldmine of insight, locked in decks, docs, transcripts, and notes that no one has time to process.
            </p>
            <p className="text-lg font-semibold text-white">
              Fetch Patterns makes that insight visible.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="card-hover">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary-blue/20 rounded-xl flex items-center justify-center mb-4">
                      <IconComponent className="w-6 h-6 text-primary-blue" />
                    </div>
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-secondary leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-surface-dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white">
            Upload a single document or a batch. The system reads them, classifies them, and surfaces what matters:
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-blue rounded-full mt-2"></div>
                <p className="text-secondary">dominant themes and keywords</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-blue rounded-full mt-2"></div>
                <p className="text-secondary">tone and sentiment</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-blue rounded-full mt-2"></div>
                <p className="text-secondary">potential risks or red flags</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-blue rounded-full mt-2"></div>
                <p className="text-secondary">recurring gaps or blind spots</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-blue rounded-full mt-2"></div>
                <p className="text-secondary">clear, AI-written summaries</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-blue rounded-full mt-2"></div>
                <p className="text-secondary">and the ability to ask questions directly</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-secondary leading-relaxed space-y-6">
            <p className="text-lg">
              You can analyze by context: product quality, customer sentiment, competitive strategy, team feedback. Or simply explore what emerges.
            </p>
            <p className="text-lg">
              Whether you're working on a pitch, reviewing field reports, or onboarding a new hire, Fetch Patterns helps you focus attention where it counts.
            </p>
            <p className="text-lg font-semibold text-white">
              No training needed. No workflow disruption. Just insight that's already there, finally made visible.
            </p>
          </div>
          
          <div className="mt-12">
            <Button
              onClick={() => window.location.href = '/document-analyzer'}
              className="bg-primary-blue text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-primary-blue-dark transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Start Using Fetch Patterns
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}