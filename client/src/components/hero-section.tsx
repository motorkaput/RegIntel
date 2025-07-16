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
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-dark-gray to-darker-gray"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-neon-green rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-neon-cyan rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="animate-float">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Unleash the Power of
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-cyan animate-glow">
              {" "}AI Innovation
            </span>
          </h1>
        </div>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Dark Street Tech transforms your business with cutting-edge AI solutions. 
          From document analysis to performance measurement, we've got you covered.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => window.location.href = '/api/login'}
            className="bg-neon-green text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-neon-cyan transition-all transform hover:scale-105 animate-glow"
          >
            Start Free Trial
          </Button>
          <Button
            variant="outline"
            className="border-2 border-neon-green text-neon-green px-8 py-4 rounded-lg text-lg font-semibold hover:bg-neon-green hover:text-black transition-all"
          >
            Watch Demo
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <button
          onClick={scrollToNext}
          className="text-neon-green hover:text-neon-cyan transition-colors"
          aria-label="Scroll to next section"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </div>
    </section>
  );
}
