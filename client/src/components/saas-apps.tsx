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
    <section className="py-20 bg-gradient-to-b from-black to-dark-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            AI-Powered <span className="text-neon-green">SaaS</span> Applications
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Experience the future of business automation with our suite of intelligent applications.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {apps.map((app, index) => {
            const IconComponent = app.icon;
            return (
              <Card 
                key={index}
                className="bg-dark-gray rounded-2xl border border-neon-green/20 hover:border-neon-green/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] group overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-neon-green/20 rounded-xl flex items-center justify-center mr-4 group-hover:bg-neon-green/30 transition-colors">
                      <IconComponent className="w-6 h-6 text-neon-green" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-semibold text-neon-green">
                        {app.name}
                      </CardTitle>
                      <p className="text-gray-400 text-sm">{app.subtitle}</p>
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl"></div>
                  </div>

                  <p className="text-gray-300">
                    {app.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {app.metrics.map((metric, metricIndex) => (
                      <div key={metricIndex} className="text-center">
                        <div className="text-2xl font-bold text-neon-green">
                          {metric.value}
                        </div>
                        <div className="text-sm text-gray-400">
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleAppClick(app.link)}
                    className="w-full bg-neon-green text-black hover:bg-neon-cyan transition-colors font-semibold py-3"
                  >
                    {isAuthenticated ? `Try ${app.name}` : `Sign In to Use ${app.name}`}
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
