import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, Search, Bell, GitCompare, Globe, Sparkles, Library, FileText, ClipboardCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import iconUrl from "@assets/fprt-icon_1767950294399.png";

export default function RegTechLanding() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation('/regtech/documents');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await apiRequest('/api/auth/login', 'POST', { email, password });
      const userData = await response.json();

      queryClient.setQueryData(['/api/auth/me'], userData);
      
      toast({
        title: "Welcome!",
        description: "You've been logged in successfully.",
      });
      
      setLocation('/regtech/documents');
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex h-14 items-center px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <img src={iconUrl} alt="RegIntel" className="h-10 w-10" />
            <div className="hidden sm:flex flex-col justify-center h-10">
              <span className="text-base font-semibold text-slate-900 leading-tight">RegIntel</span>
              <span className="text-xs text-slate-500 leading-tight">Regulatory Intelligence Platform</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Bento Grid */}
      <main className="max-w-6xl mx-auto px-4 lg:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Hero Card - Spans 2 columns on large screens */}
          <Card className="md:col-span-2 lg:col-span-2 bg-slate-900 text-white border-0">
            <CardContent className="p-8">
              <h1 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="text-hero-title">
                AI-Powered Regulatory Intelligence
              </h1>
              <p className="text-slate-300 text-lg mb-6">
                Track global regulatory updates, analyze compliance requirements with AI, 
                and receive proactive alerts when regulations change.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-300">AML/CFT</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-300">Financial Crime</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-300">Sanctions</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-300">KYC/CDD</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-300">Fraud Detection</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-300">Consumer Protection</span>
              </div>
            </CardContent>
          </Card>

          {/* Login Card */}
          <Card className="bg-white border-slate-200 row-span-2">
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-1">Sign In</h2>
                <p className="text-sm text-slate-500">Access your regulatory platform</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-slate-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoggingIn}
                    className="mt-1"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-slate-700">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoggingIn}
                    className="mt-1"
                    data-testid="input-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-slate-900 hover:bg-slate-800" 
                  disabled={isLoggingIn}
                  data-testid="button-login"
                >
                  {isLoggingIn ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <p className="mt-4 text-xs text-slate-400 text-center">
                Want to onboard your organization? Email{" "}
                <a href="mailto:hello@darkstreet.org" className="text-slate-600 hover:text-slate-900">hello@darkstreet.org</a>
              </p>
            </CardContent>
          </Card>

          {/* Feature: Document Library */}
          <Card className="bg-blue-50 border-blue-100 hover:bg-blue-100/80 transition-colors">
            <CardContent className="p-5">
              <Library className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Document Library</h3>
              <p className="text-sm text-slate-600">Upload and manage regulatory documents with AI-powered metadata extraction</p>
            </CardContent>
          </Card>

          {/* Feature: AI Query */}
          <Card className="bg-orange-50 border-orange-100 hover:bg-orange-100/80 transition-colors">
            <CardContent className="p-5">
              <Sparkles className="h-8 w-8 text-orange-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">AI-Powered Q&A</h3>
              <p className="text-sm text-slate-600">Ask questions about regulations and get answers with source citations</p>
            </CardContent>
          </Card>

          {/* Feature: Console */}
          <Card className="bg-violet-50 border-violet-100 hover:bg-violet-100/80 transition-colors">
            <CardContent className="p-5">
              <FileText className="h-8 w-8 text-violet-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Regulatory Console</h3>
              <p className="text-sm text-slate-600">Fetch and analyze regulatory updates from official sources in real-time</p>
            </CardContent>
          </Card>

          {/* Feature: Document Diff */}
          <Card className="bg-cyan-50 border-cyan-100 hover:bg-cyan-100/80 transition-colors">
            <CardContent className="p-5">
              <GitCompare className="h-8 w-8 text-cyan-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Document Diff</h3>
              <p className="text-sm text-slate-600">Compare regulation versions to identify changes and assess impact</p>
            </CardContent>
          </Card>

          {/* Feature: Obligations Analysis */}
          <Card className="bg-amber-50 border-amber-100 hover:bg-amber-100/80 transition-colors">
            <CardContent className="p-5">
              <ClipboardCheck className="h-8 w-8 text-amber-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Obligations Analysis</h3>
              <p className="text-sm text-slate-600">AI-powered extraction and analysis of regulatory obligations with real-time insights</p>
            </CardContent>
          </Card>

          {/* Feature: Alerts */}
          <Card className="bg-rose-50 border-rose-100 hover:bg-rose-100/80 transition-colors">
            <CardContent className="p-5">
              <Bell className="h-8 w-8 text-rose-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Proactive Alerts</h3>
              <p className="text-sm text-slate-600">Set up custom alert profiles based on jurisdictions and topics</p>
            </CardContent>
          </Card>

          {/* Feature: Global Coverage - Spans 2 columns */}
          <Card className="md:col-span-2 bg-emerald-50 border-emerald-100">
            <CardContent className="p-5 flex items-start gap-4">
              <Globe className="h-8 w-8 text-emerald-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Global Regulatory Coverage</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Track regulations from financial regulators worldwide - from major economies to emerging markets.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-emerald-100 rounded text-xs text-emerald-700">Americas</span>
                  <span className="px-2 py-0.5 bg-emerald-100 rounded text-xs text-emerald-700">Europe</span>
                  <span className="px-2 py-0.5 bg-emerald-100 rounded text-xs text-emerald-700">Asia-Pacific</span>
                  <span className="px-2 py-0.5 bg-emerald-100 rounded text-xs text-emerald-700">Middle East</span>
                  <span className="px-2 py-0.5 bg-emerald-100 rounded text-xs text-emerald-700">Africa</span>
                  <span className="px-2 py-0.5 bg-emerald-100 rounded text-xs text-emerald-700">Global Bodies</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works - Spans full width */}
          <Card className="md:col-span-2 lg:col-span-3 bg-white border-slate-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">How It Works</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Upload Documents</p>
                    <p className="text-xs text-slate-500">PDF, DOCX, HTML from any regulator</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Configure Alerts</p>
                    <p className="text-xs text-slate-500">Set jurisdiction & topic preferences</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Ask Questions</p>
                    <p className="text-xs text-slate-500">Get AI answers with citations</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Track Changes</p>
                    <p className="text-xs text-slate-500">Compare versions & assess impact</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4">
        <div className="max-w-6xl mx-auto text-center text-xs text-slate-500">
          © <a href="https://darkstreet.consulting" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Dark Street</a>. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
