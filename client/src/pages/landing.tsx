import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero-section";
import NFTShowcase from "@/components/nft-showcase";
import ImpactAreas from "@/components/impact-areas";
import SaaSApps from "@/components/saas-apps";
import PricingCards from "@/components/pricing-cards";
import Footer from "@/components/footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />
      <NFTShowcase />
      <ImpactAreas />
      <SaaSApps />
      <section id="pricing" className="py-20">
        <PricingCards />
      </section>
      
      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-black via-dark-gray to-black">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your <span className="text-neon-green">Business</span>?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of companies already using Dark Street Tech's AI solutions to streamline their operations and boost productivity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-neon-green text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-neon-cyan transition-all transform hover:scale-105"
            >
              Start Your Free Trial
            </button>
            <button className="border-2 border-neon-green text-neon-green px-8 py-4 rounded-lg text-lg font-semibold hover:bg-neon-green hover:text-black transition-all">
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
