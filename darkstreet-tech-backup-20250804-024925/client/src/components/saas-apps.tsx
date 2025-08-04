import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, BarChart3, Zap, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function SaaSApps() {
  const { isAuthenticated } = useAuth();

  const apps = [
    {
      icon: FileText,
      name: "DocuMind AI",
      subtitle: "Intelligent Document Analysis",
      description: "Transform your document processing with AI-powered analysis, extraction, and insights generation.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=400",
      metrics: [
        { label: "Accuracy", value: "99.8%" },
        { label: "Processing Speed", value: "10x Faster" },
      ],
      link: "/document-analyzer",
    },
    {
      icon: BarChart3,
      name: "MetricsMaster",
      subtitle: "Performance Analytics Platform",
      description: "Real-time performance tracking and predictive analytics to optimize your business operations.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=400",
      metrics: [
        { label: "Data Updates", value: "Real-time" },
        { label: "Insights", value: "AI-Powered" },
      ],
      link: "/performance-dashboard",
    },
  ];

  const handleAppClick = (link: string) => {
    if (isAuthenticated) {
      window.location.href = link;
    } else {
      window.location.href = "/api/login";
    }
  };

  return (
    <section className="py-24 bg-surface-darkest">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Enterprise <span className="gradient-text">Applications</span>
          </h2>
          <p className="text-xl text-secondary max-w-3xl mx-auto leading-relaxed">
            Powerful AI-driven applications designed for enterprise scalability and performance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {apps.map((app, index) => {
            const IconComponent = app.icon;
            return (
              <Card 
                key={index}
                className="card-hover group overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-primary-blue/20 rounded-xl flex items-center justify-center mr-4 group-hover:bg-primary-blue/30 transition-colors">
                      <IconComponent className="w-6 h-6 text-primary-blue" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-semibold text-white">
                        {app.name}
                      </CardTitle>
                      <p className="text-muted text-sm">{app.subtitle}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="relative">
                    <img 
                      src={app.image}
                      alt={app.name}
                      className="w-full h-48 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-darkest/80 to-transparent rounded-xl"></div>
                  </div>

                  <p className="text-secondary leading-relaxed">
                    {app.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {app.metrics.map((metric, metricIndex) => (
                      <div key={metricIndex} className="text-center">
                        <div className="text-2xl font-bold text-primary-blue">
                          {metric.value}
                        </div>
                        <div className="text-sm text-muted">
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleAppClick(app.link)}
                    className="w-full bg-primary-blue text-white hover:bg-primary-blue-dark transition-colors font-semibold py-3"
                  >
                    {isAuthenticated ? `Access ${app.name}` : `Sign In to Access ${app.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
