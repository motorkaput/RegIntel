import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { User, Building } from "lucide-react";
import barshaPandaPhoto from "@assets/BarshaPanda_1752666897513.jpeg";
import davidJairajPhoto from "@assets/DavidJairaj_1752666897514.jpeg";

export default function About() {
  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-6 section-divider">
          <div className="container-section">
            <div className="space-y-8">
              <h1 className="text-responsive-md text-primary">
                About Dark Street Tech
              </h1>
              <p className="text-responsive-xxl text-secondary font-light">
                A product company born from real enterprise experience.
              </p>
            </div>
          </div>
        </section>

        {/* Company Background */}
        <section className="py-6 bg-surface-light section-divider">
          <div className="container-section">
            <div className="space-y-8">
              <p className="text-lg text-secondary leading-relaxed">
                Dark Street Tech is the software venture of Dark Street, a strategy firm known for its clarity of thinking, refusal to follow trends, and deep work with leadership teams inside growing enterprises.
              </p>
              
              <p className="text-lg text-secondary leading-relaxed">
                We created Dark Street Tech to turn our insights into tools. Tools that enterprises can use every day to reduce friction, gain alignment, and perform with greater intelligence.
              </p>
              
              <p className="text-lg text-secondary leading-relaxed">
                Our work is shaped by years of pattern recognition, watching how organizations grow, stall, adapt, and evolve. Each product we build solves for a real, observed need. No padding. No gimmicks.
              </p>
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section className="py-6 section-divider">
          <div className="container-section">
            <div>
              <h2 className="text-responsive-lg font-semibold text-primary mb-12">
                Leadership
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Barsha Panda */}
                <div className="card-minimal p-8 space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img 
                        src={barshaPandaPhoto} 
                        alt="Barsha Panda" 
                        className="w-12 h-12 object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-primary">
                        Barsha Panda
                      </h3>
                      <p className="text-secondary mt-2">
                        CEO
                      </p>
                    </div>
                  </div>
                </div>

                {/* David Jairaj */}
                <div className="card-minimal p-8 space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img 
                        src={davidJairajPhoto} 
                        alt="David Jairaj" 
                        className="w-12 h-12 object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-primary">
                        David Jairaj
                      </h3>
                      <p className="text-secondary mt-2">
                        COO
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="py-6 bg-surface-light section-divider">
          <div className="container-section">
            <div className="space-y-8">
              <p className="text-lg text-primary font-medium">
                We operate like we expect our customers to: with precision, thoughtfulness, and an eye on what's truly needed.
              </p>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="py-6 section-divider">
          <div className="container-section">
            <div className="space-y-4">
              <p className="text-lg text-secondary">
                For strategy and advisory, visit{" "}
                <a 
                  href="https://darkstreet.consulting" 
                  className="text-accent-blue hover:underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  darkstreet.consulting
                </a>
                .
              </p>
              <p className="text-lg text-secondary">
                For intelligent products, stay here.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}