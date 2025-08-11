import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Target, Users, Zap } from 'lucide-react';

export default async function HomePage() {
  const session = await getServerSession();
  
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">PerMeaTe Enterprise</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Goals Into
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {' '}Actionable Results
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            PerMeaTe Enterprise is the AI-powered platform that helps teams convert strategic 
            objectives into manageable tasks with intelligent breakdown and assignment.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Start Your Organization
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Target className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>AI Goal Breakdown</CardTitle>
              <CardDescription>
                Transform high-level objectives into actionable tasks with intelligent AI analysis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Users className="h-10 w-10 text-green-600 mb-4" />
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Multi-tenant architecture with role-based access for seamless team coordination
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Zap className="h-10 w-10 text-purple-600 mb-4" />
              <CardTitle>Enterprise Ready</CardTitle>
              <CardDescription>
                Production-grade security, audit trails, and performance analytics built-in
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join enterprise teams who are already using PerMeaTe to turn strategic vision 
              into tactical execution with measurable results.
            </p>
            <Link href="/register">
              <Button size="lg" className="px-8">
                Create Your Organization
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}