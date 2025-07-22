import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { isUnauthorizedError } from "@/lib/authUtils";
import { FileText, BarChart3, Brain, Zap, Shield, Database } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="pt-32">
        {/* Welcome Section */}
        <section className="py-20 bg-gradient-to-br from-black via-dark-gray to-darker-gray">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Welcome back, <span className="text-neon-green">{user?.firstName || 'User'}</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Your AI-powered workspace is ready. Start analyzing documents, tracking performance, and automating workflows.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <Card className="bg-dark-gray border-neon-green/20 hover:border-neon-green/60 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neon-green/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-neon-green" />
                    </div>
                    <CardTitle className="text-lg text-white">Document Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">Upload and analyze documents with AI-powered insights</p>
                  <Link href="/document-analyzer">
                    <Button className="w-full bg-neon-green text-black hover:bg-neon-cyan">
                      Start Analyzing
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-dark-gray border-neon-green/20 hover:border-neon-green/60 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neon-green/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-neon-green" />
                    </div>
                    <CardTitle className="text-lg text-white">Performance Dashboard</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">View real-time analytics and performance metrics</p>
                  <Link href="/performance-dashboard">
                    <Button className="w-full bg-neon-green text-black hover:bg-neon-cyan">
                      View Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-dark-gray border-neon-green/20 hover:border-neon-green/60 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neon-green/20 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-neon-green" />
                    </div>
                    <CardTitle className="text-lg text-white">AI Automation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">Set up intelligent workflows and automation</p>
                  <Button className="w-full bg-neon-green text-black hover:bg-neon-cyan">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Features Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-dark-gray border-neon-green/20">
                <CardHeader>
                  <CardTitle className="text-xl text-neon-green">Your AI Toolkit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Lightning-fast document processing</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Enterprise-grade security</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Database className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Intelligent data extraction</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Real-time analytics</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-dark-gray border-neon-green/20">
                <CardHeader>
                  <CardTitle className="text-xl text-neon-green">Subscription Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Current Plan:</span>
                      <Badge variant="outline" className="text-neon-green border-neon-green">
                        {user?.subscriptionStatus === 'trial' ? 'Free Trial' : 'Active'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Status:</span>
                      <span className="text-neon-green">Active</span>
                    </div>
                    <div className="pt-2">
                      <Link href="/subscription">
                        <Button variant="outline" className="w-full border-neon-green text-neon-green hover:bg-neon-green hover:text-black">
                          Manage Subscription
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
