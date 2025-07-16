import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Users, BarChart3, Layers, Eye, CheckCircle } from "lucide-react";

export default function PerMeaTeEnterprise() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access PerMeaTe Enterprise.",
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
      icon: Target,
      title: "Outcome Definition",
      description: "Start with a single outcome and watch the system break it down logically and systematically."
    },
    {
      icon: Layers,
      title: "Structured Hierarchy",
      description: "Get a clear, structured hierarchy of work that flows from strategic intent to tactical execution."
    },
    {
      icon: Users,
      title: "Role-Based Assignments",
      description: "Clear role-based assignments that align team members with specific responsibilities and expectations."
    },
    {
      icon: BarChart3,
      title: "Numeric Scoring",
      description: "Numeric scoring systems for task completion that provide measurable progress indicators."
    },
    {
      icon: Eye,
      title: "Organizational Dashboard",
      description: "An organizational dashboard that shows real performance, not just activity."
    },
    {
      icon: CheckCircle,
      title: "Performance Alignment",
      description: "Shared frame of reference where performance is understood, measurable, and aligned to purpose."
    }
  ];

  return (
    <div className="min-h-screen bg-surface-darkest">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            PerMeaTe <span className="gradient-text">Enterprise</span>
          </h1>
          <p className="text-2xl text-primary-blue mb-8 font-semibold">
            Where goals turn into real work.
          </p>
          <div className="max-w-4xl mx-auto text-secondary leading-relaxed space-y-6">
            <p className="text-lg">
              Enterprises don't fail from lack of ambition. They fail from weak translation, between the intent of leaders and the action of teams.
            </p>
            <p className="text-lg font-semibold text-white">
              PerMeaTe Enterprise closes that gap.
            </p>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-surface-dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white">
            It starts with a single outcome. From there, the system breaks it down, cleanly, logically, and fast, into projects, tasks, roles, and metrics.
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-blue rounded-full mt-2"></div>
                <p className="text-secondary">a structured hierarchy of work</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-blue rounded-full mt-2"></div>
                <p className="text-secondary">clear role-based assignments</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-blue rounded-full mt-2"></div>
                <p className="text-secondary">numeric scoring systems for task completion</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-blue rounded-full mt-2"></div>
                <p className="text-secondary">and an organizational dashboard that shows real performance, not just activity</p>
              </div>
            </div>
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

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-surface-dark">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-secondary leading-relaxed space-y-6">
            <p className="text-lg">
              Leaders see the full picture. Project leads gain precision and control. Team members know what matters and how their work is measured.
            </p>
            <p className="text-lg font-semibold text-white">
              No vague goals. No bloated trackers. Just a shared frame of reference, where performance is understood, measurable, and aligned to purpose.
            </p>
            <p className="text-lg">
              PerMeaTe doesn't replace your workflows. It strengthens the foundation they sit on.
            </p>
          </div>
          
          <div className="mt-12">
            <Button
              onClick={() => window.location.href = '/performance-dashboard'}
              className="bg-primary-blue text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-primary-blue-dark transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Start Using PerMeaTe Enterprise
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}