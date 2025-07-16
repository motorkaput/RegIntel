import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  BarChart3, 
  Bot, 
  Brain, 
  Database, 
  Shield,
  CheckCircle
} from "lucide-react";

export default function ImpactAreas() {
  const impactAreas = [
    {
      icon: FileText,
      title: "Document Analysis",
      description: "Advanced AI algorithms extract insights from complex documents, automate processing, and provide intelligent summaries.",
      features: ["OCR & Text Recognition", "Sentiment Analysis", "Data Extraction"],
      gradient: "from-neon-green/20 to-neon-green/10",
    },
    {
      icon: BarChart3,
      title: "Performance Measurement",
      description: "Real-time analytics and performance tracking to help you make data-driven decisions and optimize your operations.",
      features: ["Real-time Dashboards", "KPI Tracking", "Predictive Analytics"],
      gradient: "from-neon-cyan/20 to-neon-cyan/10",
    },
    {
      icon: Bot,
      title: "AI Automation",
      description: "Streamline workflows with intelligent automation that learns from your processes and continuously improves efficiency.",
      features: ["Workflow Automation", "Smart Notifications", "Process Optimization"],
      gradient: "from-purple-500/20 to-purple-500/10",
    },
    {
      icon: Brain,
      title: "Machine Learning",
      description: "Custom ML models trained on your data to solve specific business challenges and unlock new opportunities.",
      features: ["Custom Model Training", "Pattern Recognition", "Predictive Modeling"],
      gradient: "from-yellow-400/20 to-yellow-400/10",
    },
    {
      icon: Database,
      title: "Data Processing",
      description: "Transform raw data into actionable insights with our advanced data processing and visualization tools.",
      features: ["Data Cleaning", "Data Visualization", "ETL Pipelines"],
      gradient: "from-blue-400/20 to-blue-400/10",
    },
    {
      icon: Shield,
      title: "Security Intelligence",
      description: "AI-powered security monitoring and threat detection to protect your business from evolving cyber threats.",
      features: ["Threat Detection", "Anomaly Detection", "Risk Assessment"],
      gradient: "from-red-400/20 to-red-400/10",
    },
  ];

  return (
    <section id="solutions" className="py-20 bg-dark-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Our <span className="text-neon-green">Impact</span> Areas
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover how Dark Street Tech is revolutionizing industries through 
            AI-powered solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {impactAreas.map((area, index) => {
            const IconComponent = area.icon;
            return (
              <Card 
                key={index}
                className="bg-black rounded-xl border border-neon-green/20 hover:border-neon-green/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] group"
              >
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${area.gradient} rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-neon-green" />
                  </div>
                  <CardTitle className="text-2xl font-semibold text-neon-green">
                    {area.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-6">
                    {area.description}
                  </p>
                  <div className="space-y-2">
                    {area.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-neon-green flex-shrink-0" />
                        <span className="text-sm text-gray-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
