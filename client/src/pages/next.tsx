import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Brain, Shield, BarChart3, Mail } from "lucide-react";

export default function Next() {
  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-24 section-divider">
          <div className="container-section">
            <div className="space-y-8">
              <h1 className="text-responsive-md font-semibold text-primary">
                What's coming next
              </h1>
              <p className="text-responsive-xl text-secondary font-light">
                If your team is solving problems at the edge, we're likely building for you.
              </p>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="py-16 bg-surface-light section-divider">
          <div className="container-section">
            <div className="space-y-8">
              <p className="text-lg text-secondary leading-relaxed">
                At Dark Street Tech, we don't chase feature sets. We follow real patterns of friction inside growing enterprises. And we build what resolves them, cleanly and intelligently.
              </p>
              
              <p className="text-lg text-primary font-medium">
                Here's a preview of what we're working on:
              </p>
            </div>
          </div>
        </section>

        {/* Upcoming Products */}
        <section className="py-20 section-divider">
          <div className="container-section">
            <div className="space-y-16">
              
              {/* Enterprise Mind */}
              <div className="card-minimal p-8 space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-accent-blue-light rounded-sm flex items-center justify-center flex-shrink-0">
                    <Brain className="w-6 h-6 text-accent-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-primary">
                      Enterprise Mind
                    </h3>
                    <p className="text-secondary mt-2">
                      A cognitive layer for leadership. Designed to connect the scattered dots, documents, decisions, patterns, and context. So that enterprise leaders can think more clearly, and act ahead of the curve.
                    </p>
                  </div>
                </div>
              </div>

              {/* QOAN */}
              <div className="card-minimal p-8 space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-accent-blue-light rounded-sm flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-accent-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-primary">
                      QOAN
                    </h3>
                    <p className="text-secondary mt-2">
                      A trust protocol for work. Built for a world where attention is the scarcest resource, QOAN brings proof-of-attention and proof-of-completion to human effort. Precision. Accountability. Fairness. Built into every assignment.
                    </p>
                  </div>
                </div>
              </div>

              {/* PCI Index */}
              <div className="card-minimal p-8 space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-accent-blue-light rounded-sm flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-accent-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-primary">
                      PCI Index
                    </h3>
                    <p className="text-secondary mt-2">
                      A new lens for enterprise value. Moving beyond standard metrics, PCI identifies the hidden signals of innovation, influence, and resilience inside organizations. Signals that most balance sheets miss.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16 bg-surface-light section-divider">
          <div className="container-section">
            <div>
              <p className="text-lg text-secondary leading-relaxed">
                Each of these is under active development. Write to{" "}
                <a 
                  href="mailto:hello@darkstreet.org" 
                  className="text-accent-blue hover:underline transition-colors"
                >
                  hello@darkstreet.org
                </a>
                {" "}if you want to know more.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}