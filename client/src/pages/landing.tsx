import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero-section";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { FileText, Target, Brain, Shield, BarChart3, ArrowRight, Mail } from "lucide-react";

export default function Landing() {
  const currentProducts = [
    {
      icon: FileText,
      title: "Fetch Patterns",
      subtitle: "What your documents are trying to tell you",
      description: "Upload one or many documents. Let the intelligence surface the patterns: keywords, sentiment, risk, gaps, and meaning. Ask questions directly.",
      href: "/fetch-patterns",
      features: ["Document Intelligence", "Pattern Recognition", "Direct Questioning"]
    },
    {
      icon: Target,
      title: "PerMeaTe Enterprise",
      subtitle: "Where goals turn into real work",
      description: "Define an outcome. Watch the system break it down into projects, tasks, metrics, and roles, ready to assign, score, and lead.",
      href: "/permeate-enterprise",
      features: ["Goal Breakdown", "Task Management", "Performance Tracking"]
    }
  ];

  const upcomingProducts = [
    {
      icon: Brain,
      title: "Enterprise Mind",
      description: "A cognitive layer for leadership to connect scattered dots and think more clearly."
    },
    {
      icon: Shield,
      title: "QOAN",
      description: "A trust protocol for work bringing proof-of-attention to human effort."
    },
    {
      icon: BarChart3,
      title: "PCI Index",
      description: "A new lens for enterprise value identifying hidden signals of innovation."
    }
  ];

  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      <HeroSection />
      
      {/* Current Products Section */}
      <section className="py-24 bg-surface-light section-divider">
        <div className="container-section">
          <div className="text-center mb-16">
            <h2 className="text-responsive-lg font-semibold text-primary mb-6">
              Our <span className="text-gradient">Products</span>
            </h2>
            <p className="text-secondary max-w-3xl mx-auto leading-relaxed">
              Precise instruments designed for teams that think and want to perform better.
            </p>
          </div>

          <div className="layout-grid layout-grid-2 gap-12">
            {currentProducts.map((product, index) => {
              const IconComponent = product.icon;
              return (
                <div key={index} className="card-minimal p-8 space-y-6 animate-fade-in">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent-blue-light rounded-sm flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-accent-blue" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-primary mb-2">
                        {product.title}
                      </h3>
                      <p className="text-accent-blue text-sm font-medium">{product.subtitle}</p>
                    </div>
                  </div>
                  
                  <p className="text-secondary leading-relaxed">
                    {product.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {product.features.map((feature, idx) => (
                      <span key={idx} className="status-indicator bg-accent-blue-light text-accent-blue">
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => window.location.href = product.href}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    Explore {product.title}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What's Next Preview */}
      <section className="py-24 bg-surface-white section-divider">
        <div className="container-section">
          <div className="text-center mb-16">
            <h2 className="text-responsive-lg font-semibold text-primary mb-6">
              What's <span className="text-gradient">Coming Next</span>
            </h2>
            <p className="text-secondary max-w-3xl mx-auto leading-relaxed">
              We follow real patterns of friction inside growing enterprises and build what resolves them.
            </p>
          </div>

          <div className="layout-grid layout-grid-3 gap-8">
            {upcomingProducts.map((product, index) => {
              const IconComponent = product.icon;
              return (
                <div key={index} className="card-minimal p-6 space-y-4">
                  <div className="w-10 h-10 bg-accent-blue-light rounded-sm flex items-center justify-center mb-4">
                    <IconComponent className="w-5 h-5 text-accent-blue" />
                  </div>
                  <h3 className="font-semibold text-primary">
                    {product.title}
                  </h3>
                  <p className="text-secondary text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={() => window.location.href = '/next'}
              className="btn-outline"
            >
              Learn More About Our Future
            </Button>
          </div>
        </div>
      </section>
      
      {/* Contact Section */}
      <section className="py-24 bg-surface-grey section-divider">
        <div className="container-section text-center">
          <h2 className="text-responsive-lg font-semibold text-primary mb-8">
            Ready to <span className="text-gradient">Get Started</span>?
          </h2>
          <p className="text-secondary mb-12 max-w-3xl mx-auto leading-relaxed">
            If your team is solving problems at the edge, we're likely building for you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={() => window.location.href = '/fetch-patterns'}
              className="btn-primary flex items-center gap-2"
            >
              Try Fetch Patterns
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => window.location.href = '/permeate-enterprise'}
              className="btn-outline"
            >
              Try PerMeaTe Enterprise
            </Button>
          </div>
          
          <div className="pt-8 border-t border-light">
            <p className="text-secondary mb-4 text-sm">
              For questions or custom enterprise solutions
            </p>
            <Button
              onClick={() => window.location.href = 'mailto:hello@darkstreet.org'}
              variant="ghost"
              className="text-accent-blue hover:text-accent-blue-dark hover:bg-accent-blue-light text-sm flex items-center gap-2 mx-auto"
            >
              <Mail className="w-4 h-4" />
              Contact us at hello@darkstreet.org
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
