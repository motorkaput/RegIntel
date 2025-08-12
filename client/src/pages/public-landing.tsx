import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2, Users, Target, BarChart3, Zap, Shield } from "lucide-react";
import { Link } from "wouter";

export default function PublicLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold text-white">PerMeaTe Enterprise</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
            <a href="#contact" className="text-slate-300 hover:text-white transition-colors">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Transform Your Organization's
            <span className="block text-blue-400">Goal-to-Work Breakdown</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            AI-powered enterprise platform that intelligently breaks down organizational goals into actionable tasks, 
            tracks performance, and provides deep insights across your entire workforce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" data-testid="button-create-organization">
                Create Your Organization
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-3" data-testid="button-learn-more">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Enterprise-Grade Organizational Intelligence
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Everything you need to transform goals into results with AI-powered insights and comprehensive tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <Target className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle className="text-white">AI Goal Breakdown</CardTitle>
                <CardDescription className="text-slate-400">
                  Intelligent decomposition of high-level organizational goals into specific, actionable tasks with clear ownership.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <Users className="h-12 w-12 text-green-400 mb-4" />
                <CardTitle className="text-white">Team Orchestration</CardTitle>
                <CardDescription className="text-slate-400">
                  Seamless onboarding, role management, and invitation system with multi-tenant security and access controls.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Performance Analytics</CardTitle>
                <CardDescription className="text-slate-400">
                  Real-time dashboards, comprehensive scoring systems, and role-based analytics with export capabilities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <Zap className="h-12 w-12 text-yellow-400 mb-4" />
                <CardTitle className="text-white">Third-Party Integrations</CardTitle>
                <CardDescription className="text-slate-400">
                  Native connections to Jira, Trello, Asana, and other task management platforms with bi-directional sync.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <Shield className="h-12 w-12 text-red-400 mb-4" />
                <CardTitle className="text-white">Enterprise Security</CardTitle>
                <CardDescription className="text-slate-400">
                  Row-level security, comprehensive audit logs, GDPR/CCPA compliance, and role-based access control.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <Building2 className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle className="text-white">Multi-Tenant Architecture</CardTitle>
                <CardDescription className="text-slate-400">
                  Scalable infrastructure supporting unlimited organizations with isolated data and billing management.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Organization?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join forward-thinking companies using AI-powered goal-to-work breakdown for unprecedented organizational clarity.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg" data-testid="button-get-started">
              Get Started Today
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Building2 className="h-6 w-6 text-blue-400" />
              <span className="text-lg font-semibold text-white">PerMeaTe Enterprise</span>
            </div>
            <nav className="flex space-x-6">
              <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}