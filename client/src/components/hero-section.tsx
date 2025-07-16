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
            Making growing enterprises stronger with
            <span className="gradient-text block mt-2">
              smart and powerful AI
            </span>
          </h1>
        </div>
        
        <p className="text-xl md:text-2xl text-secondary mb-12 max-w-4xl mx-auto leading-relaxed">
          Data analysis and visualization for leadership visibility, high performance, and strategic advantage. 
          Transform raw data into actionable insights that drive enterprise growth.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary-blue text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-primary-blue-dark transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Start Free Trial
          </Button>
          <Button
            variant="outline"
            className="border-2 border-primary-blue text-primary-blue px-10 py-4 rounded-lg text-lg font-semibold hover:bg-primary-blue hover:text-white transition-all duration-300"
          >
            Schedule Demo
          </Button>
        </div>
        
        {/* Enterprise Trust Indicators */}
        <div className="mt-16 pt-8 border-t border-subtle">
          <p className="text-muted text-sm mb-4 uppercase tracking-wide">Trusted by Enterprise Leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-secondary font-semibold">Fortune 500 Companies</div>
            <div className="text-secondary font-semibold">Growing Enterprises</div>
            <div className="text-secondary font-semibold">Data-Driven Organizations</div>
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
