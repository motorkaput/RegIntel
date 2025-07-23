import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { FileText, Target, Brain, Shield, BarChart3, ArrowRight } from "lucide-react";
import fetchPatternsIcon from "@assets/FetchPatterns_Icon_1752663550310.png";
import permeateIcon from "@assets/PerMeaTeEnterprise_Icon_1752664675820.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 section-divider bg-gradient-to-br from-surface-white via-surface-light to-surface-grey">
          <div className="container-section">
            <div className="max-w-4xl">
              <h1 className="text-responsive-md text-primary mb-8 font-light tracking-tight">
                Dark Street Tech
              </h1>
              <p className="text-responsive-xxl text-secondary font-light leading-relaxed">
                Intelligent tech for growing enterprises.
              </p>
              <div className="mt-12 w-24 h-px bg-gradient-to-r from-accent-blue to-transparent"></div>
            </div>
          </div>
        </section>

        {/* Company Description */}
        <section className="py-6 bg-surface-light section-divider">
          <div className="container-section">
            <div className="space-y-8">
              <p className="text-lg text-secondary leading-relaxed">
                <span className="font-semibold">At Dark Street, we are building AI-powered tech for growing enterprises.</span>
              </p>
              
              <p className="text-lg text-secondary leading-relaxed">
                Our SaaS products are designed to solve hard, often invisible problems that stall momentum in scaling organizations: broken task ownership, weak feedback loops, hidden complexity in goals, and documents no one truly reads.
              </p>
              
              <p className="text-lg text-secondary leading-relaxed">
                We don't create generic tools. We create precise instruments, designed for teams that think and want to perform better. Backed by years of strategic consulting and enterprise insight, Dark Street Tech is the product arm of Dark Street. We combine systems thinking, cognitive design, and practical execution into tools that make work clearer, lighter, and more aligned.
              </p>
            </div>
          </div>
        </section>

        {/* Current Products */}
        <section className="py-6 section-divider">
          <div className="container-section">
            <div>
              <h2 className="text-lg text-primary mb-6">
                PRODUCTS IN BETA
              </h2>
              
              <div className="space-y-6">
                {/* Fetch Patterns */}
                <div className="card-minimal p-8 space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent-blue-light rounded-sm flex items-center justify-center flex-shrink-0">
                      <img src={fetchPatternsIcon} alt="Fetch Patterns" className="w-12 h-12" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-primary">
                        Fetch Patterns
                      </h3>
                      <p className="text-secondary mt-2">
                        Upload one or many documents. Let the intelligence surface the patterns: keywords, sentiment, risk, gaps, and meaning. Ask questions directly.
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/fetch-patterns'}
                    className="btn-primary"
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {/* PerMeaTe Enterprise */}
                <div className="card-minimal p-8 space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent-blue-light rounded-sm flex items-center justify-center flex-shrink-0">
                      <img src={permeateIcon} alt="PerMeaTe Enterprise" className="w-12 h-12" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-primary">
                        PerMeaTe Enterprise
                      </h3>
                      <p className="text-secondary mt-2">
                        Define an outcome. Watch the system break it down into projects, tasks, metrics, and roles, ready to assign, score, and lead.
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/permeate-enterprise'}
                    className="btn-primary"
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}