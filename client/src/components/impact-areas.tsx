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
      title: "Document Intelligence",
      description: "Transform unstructured documents into structured insights with enterprise-grade processing capabilities and intelligent extraction.",
      features: ["Advanced OCR & Classification", "Intelligent Data Extraction", "Multi-format Support"],
      gradient: "from-primary-blue/20 to-primary-blue/10",
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Real-time operational intelligence with advanced analytics to measure, track, and optimize enterprise performance metrics.",
      features: ["Executive Dashboards", "KPI Monitoring", "Predictive Insights"],
      gradient: "from-accent-blue/20 to-accent-blue/10",
    },
    {
      icon: Bot,
      title: "Process Automation",
      description: "Streamline complex workflows with intelligent automation that adapts to your business processes and scales with growth.",
      features: ["Workflow Orchestration", "Smart Decision Making", "Process Optimization"],
      gradient: "from-purple-500/20 to-purple-500/10",
    },
    {
      icon: Brain,
      title: "AI & Machine Learning",
      description: "Custom machine learning models designed for enterprise requirements with robust training and deployment capabilities.",
      features: ["Custom Model Development", "Pattern Recognition", "Adaptive Learning"],
      gradient: "from-gold-accent/20 to-gold-accent/10",
    },
    {
      icon: Database,
      title: "Data Engineering",
      description: "Enterprise-scale data processing and visualization solutions that transform raw data into strategic business intelligence.",
      features: ["Data Pipeline Management", "Advanced Visualization", "ETL & Integration"],
      gradient: "from-blue-400/20 to-blue-400/10",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "AI-powered security intelligence for comprehensive threat detection, risk assessment, and enterprise protection.",
      features: ["Threat Intelligence", "Anomaly Detection", "Risk Management"],
      gradient: "from-red-400/20 to-red-400/10",
    },
  ];

  return (
    <section id="solutions" className="py-24 bg-surface-darker">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Enterprise <span className="gradient-text">Solutions</span>
          </h2>
          <p className="text-xl text-secondary max-w-3xl mx-auto leading-relaxed">
            Comprehensive AI and data solutions engineered for growing enterprises seeking 
            competitive advantage through intelligent automation and strategic insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {impactAreas.map((area, index) => {
            const IconComponent = area.icon;
            return (
              <Card 
                key={index}
                className="card-hover group"
              >
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${area.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-primary-blue" />
                  </div>
                  <CardTitle className="text-2xl font-semibold text-white">
                    {area.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-secondary mb-6 leading-relaxed">
                    {area.description}
                  </p>
                  <div className="space-y-3">
                    {area.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="w-4 h-4 text-primary-blue flex-shrink-0" />
                        <span className="text-sm text-muted">{feature}</span>
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
