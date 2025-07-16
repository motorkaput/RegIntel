import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export default function HeroSection() {
  const scrollToNext = () => {
    const nextSection = document.querySelector("#solutions");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Professional Background */}
      <div className="absolute inset-0 gradient-bg"></div>
      
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-blue rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-accent-blue rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white">
            Intelligent tech for
            <span className="gradient-text block mt-2">
              growing enterprises
            </span>
          </h1>
        </div>
        
        <p className="text-xl md:text-2xl text-secondary mb-8 max-w-4xl mx-auto leading-relaxed">
          At Dark Street, we are building AI-powered tech for growing enterprises.
        </p>
        
        <p className="text-lg text-secondary mb-8 max-w-5xl mx-auto leading-relaxed">
          Our SaaS products are designed to solve hard, often invisible problems that stall momentum in scaling organizations: broken task ownership, weak feedback loops, hidden complexity in goals, and documents no one truly reads.
        </p>
        
        <div className="mb-12 max-w-4xl mx-auto text-secondary leading-relaxed">
          <p className="mb-4">
            We don't create generic tools. We create precise instruments, designed for teams that think and want to perform better.
          </p>
          <p>
            Backed by years of strategic consulting and enterprise insight, Dark Street Tech is the product arm of Dark Street. We combine systems thinking, cognitive design, and practical execution into tools that make work clearer, lighter, and more aligned.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button
            onClick={() => window.location.href = '/fetch-patterns'}
            className="bg-primary-blue text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-primary-blue-dark transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Explore Fetch Patterns
          </Button>
          <Button
            onClick={() => window.location.href = '/permeate-enterprise'}
            variant="outline"
            className="border-2 border-primary-blue text-primary-blue px-10 py-4 rounded-lg text-lg font-semibold hover:bg-primary-blue hover:text-white transition-all duration-300"
          >
            Try PerMeaTe Enterprise
          </Button>
        </div>
        
        {/* Two Products Section */}
        <div className="mt-16 pt-8 border-t border-subtle">
          <p className="text-white text-lg mb-8 font-semibold">Two products are now live:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="text-primary-blue font-semibold mb-2">Fetch Patterns</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Upload one or many documents. Let the intelligence surface the patterns: keywords, sentiment, risk, gaps, and meaning. Ask questions directly.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-primary-blue font-semibold mb-2">PerMeaTe Enterprise</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Define an outcome. Watch the system break it down into projects, tasks, metrics, and roles, ready to assign, score, and lead.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <button
          onClick={scrollToNext}
          className="text-primary-blue hover:text-accent-blue transition-colors"
          aria-label="Scroll to next section"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
