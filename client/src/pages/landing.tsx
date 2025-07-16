import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero-section";
import ImpactAreas from "@/components/impact-areas";
import SaaSApps from "@/components/saas-apps";
import PricingCards from "@/components/pricing-cards";
import Footer from "@/components/footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-darkest text-white">
      <Navbar />
      <HeroSection />
      <ImpactAreas />
      <SaaSApps />
      <section id="pricing" className="py-24">
        <PricingCards />
      </section>
      
      {/* Call to Action */}
      <section className="py-24 bg-surface-dark">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
            Ready to Transform Your <span className="gradient-text">Enterprise</span>?
          </h2>
          <p className="text-xl text-secondary mb-12 max-w-3xl mx-auto leading-relaxed">
            Join leading enterprises that trust Dark Street Tech to deliver AI-powered solutions 
            that drive measurable business outcomes and competitive advantage.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary-blue text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-primary-blue-dark transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Start Your Free Trial
            </button>
            <button className="border-2 border-primary-blue text-primary-blue px-10 py-4 rounded-lg text-lg font-semibold hover:bg-primary-blue hover:text-white transition-all duration-300">
              Schedule Enterprise Demo
            </button>
          </div>
          
          {/* Enterprise Contact */}
          <div className="mt-16 pt-8 border-t border-subtle">
            <p className="text-muted text-sm mb-4">
              For enterprise solutions and custom requirements
            </p>
            <p className="text-secondary">
              Contact our Enterprise Solutions team for tailored AI implementations
            </p>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
