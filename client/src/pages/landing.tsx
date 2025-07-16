import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero-section";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Target, Brain, Shield, BarChart3, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-surface-darkest text-white">
      <Navbar />
      <HeroSection />
      
      {/* Current Products Section */}
      <section className="py-24 bg-surface-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Our <span className="gradient-text">Products</span>
            </h2>
            <p className="text-xl text-secondary max-w-3xl mx-auto leading-relaxed">
              Precise instruments designed for teams that think and want to perform better.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {currentProducts.map((product, index) => {
              const IconComponent = product.icon;
              return (
                <Card key={index} className="card-hover group">
                  <CardHeader>
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-primary-blue/20 rounded-xl flex items-center justify-center mr-4">
                        <IconComponent className="w-6 h-6 text-primary-blue" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-white">
                          {product.title}
                        </CardTitle>
                        <p className="text-primary-blue font-medium">{product.subtitle}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-secondary leading-relaxed">
                      {product.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.features.map((feature, idx) => (
                        <span key={idx} className="px-3 py-1 bg-primary-blue/10 text-primary-blue text-sm rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <Button
                      onClick={() => window.location.href = product.href}
                      className="w-full bg-primary-blue text-white hover:bg-primary-blue-dark transition-colors font-semibold py-3 group-hover:bg-primary-blue-dark"
                    >
                      Explore {product.title}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* What's Next Preview */}
      <section className="py-24 bg-surface-darkest">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              What's <span className="gradient-text">Coming Next</span>
            </h2>
            <p className="text-xl text-secondary max-w-3xl mx-auto leading-relaxed">
              We follow real patterns of friction inside growing enterprises and build what resolves them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {upcomingProducts.map((product, index) => {
              const IconComponent = product.icon;
              return (
                <Card key={index} className="card-hover">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary-blue/20 rounded-xl flex items-center justify-center mb-4">
                      <IconComponent className="w-6 h-6 text-primary-blue" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white">
                      {product.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-secondary leading-relaxed">
                      {product.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={() => window.location.href = '/next'}
              variant="outline"
              className="border-2 border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white transition-all duration-300"
            >
              Learn More About Our Future
            </Button>
          </div>
        </div>
      </section>
      
      {/* Contact Section */}
      <section className="py-24 bg-surface-dark">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
            Ready to <span className="gradient-text">Get Started</span>?
          </h2>
          <p className="text-xl text-secondary mb-12 max-w-3xl mx-auto leading-relaxed">
            If your team is solving problems at the edge, we're likely building for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              onClick={() => window.location.href = '/fetch-patterns'}
              className="bg-primary-blue text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-primary-blue-dark transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Try Fetch Patterns
            </Button>
            <Button
              onClick={() => window.location.href = '/permeate-enterprise'}
              variant="outline"
              className="border-2 border-primary-blue text-primary-blue px-10 py-4 rounded-lg text-lg font-semibold hover:bg-primary-blue hover:text-white transition-all duration-300"
            >
              Try PerMeaTe Enterprise
            </Button>
          </div>
          
          <div className="mt-12 pt-8 border-t border-subtle">
            <p className="text-secondary mb-4">
              For questions or custom enterprise solutions
            </p>
            <Button
              onClick={() => window.location.href = 'mailto:hello@darkstreet.org'}
              variant="ghost"
              className="text-primary-blue hover:text-primary-blue-dark hover:bg-primary-blue/10"
            >
              Contact us at hello@darkstreet.org
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
