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
              <h2 className="text-lg text-primary font-medium mb-12">
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
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-primary">
                        Barsha Panda
                      </h3>
                      <div className="mt-4 space-y-3">
                        <p className="text-secondary">Advisor to CXOs on vision, leadership, culture, and crisis management</p>
                        <p className="text-secondary">Combines political economy with market strategy for sharper decisions</p>
                        <p className="text-secondary">Leads a tech incubator solving real-world problems through design and insight</p>
                        <p className="text-secondary">20+ years in strategic roles at Oracle (Europe, MEA) and Yahoo (global)</p>
                        <p className="text-secondary">Works across markets including India, US, Europe, and Singapore</p>
                        <p className="text-secondary">Holds a Master's in Communication; studied at LSE and IESE</p>
                        <p className="text-secondary">Writes on scalable patterns and counter-conventional thinking</p>
                        <p className="text-secondary">Speaker and mentor to women in tech and business</p>
                        <div className="mt-4 space-y-2">
                          <p className="text-secondary">
                            <a href="https://www.linkedin.com/in/barshapanda/" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
                              LinkedIn: https://www.linkedin.com/in/barshapanda/
                            </a>
                          </p>
                          <p className="text-secondary">
                            <a href="https://x.com/BarshaPanda" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
                              X: https://x.com/BarshaPanda
                            </a>
                          </p>
                        </div>
                      </div>
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
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-primary">
                        David Jairaj
                      </h3>
                      <div className="mt-4 space-y-3">
                        <p className="text-secondary">Architect of process and tech systems for growing enterprises</p>
                        <p className="text-secondary">Integrates business philosophy, design, and tech into future-ready systems</p>
                        <p className="text-secondary">25+ years spanning research, tech, design, and community outreach</p>
                        <p className="text-secondary">Led strategy and comms at Microsoft India Development Center for 10+ years</p>
                        <p className="text-secondary">Co-founder and COO of Dark Street; leads product at Dark Street Tech</p>
                        <p className="text-secondary">Collaborates with developers, designers, and data scientists</p>
                        <p className="text-secondary">Self-taught programmer, DJ, and street artist</p>
                        <p className="text-secondary">Makes music as SilverBachDJ</p>
                        <div className="mt-4">
                          <p className="text-secondary">
                            <a href="https://www.linkedin.com/in/davidjairaj/" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
                              LinkedIn: https://www.linkedin.com/in/davidjairaj/
                            </a>
                          </p>
                        </div>
                      </div>
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