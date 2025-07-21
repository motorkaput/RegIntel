import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import fetchPatternsIcon from "@assets/FetchPatterns_Icon_1752663550310.png";

export default function FetchPatterns() {
  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-6 section-divider">
          <div className="container-section">
            <div className="space-y-8">
              <h1 className="text-responsive-md text-primary">
                Fetch Patterns
              </h1>
              <p className="text-responsive-xxl text-secondary font-light">
                What your documents are trying to tell you.
              </p>
            </div>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="py-6 bg-surface-light section-divider">
          <div className="container-section">
            <div className="space-y-8">
              <p className="text-lg text-secondary leading-relaxed">
                Most teams are sitting on a goldmine of insight, locked in decks, docs, transcripts, and notes that no one has time to process.
              </p>
              
              <p className="text-lg text-primary font-medium">
                Fetch Patterns makes that insight visible.
              </p>
            </div>
          </div>
        </section>

        {/* What You Get */}
        <section className="py-6 section-divider">
          <div className="container-section">
            <div>
              <h2 className="text-lg text-primary mb-6">
                Upload a single document or a batch. The system reads them, classifies them, and surfaces what matters:
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-accent-blue rounded-full mt-3"></div>
                    <p className="text-secondary">dominant themes and keywords</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-accent-blue rounded-full mt-3"></div>
                    <p className="text-secondary">tone and sentiment</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-accent-blue rounded-full mt-3"></div>
                    <p className="text-secondary">potential risks or red flags</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-accent-blue rounded-full mt-3"></div>
                    <p className="text-secondary">recurring gaps or blind spots</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-accent-blue rounded-full mt-3"></div>
                    <p className="text-secondary">clear, AI-written summaries</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-accent-blue rounded-full mt-3"></div>
                    <p className="text-secondary">and the ability to ask questions directly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-6 bg-surface-light section-divider">
          <div className="container-section">
            <div className="space-y-8">
              <p className="text-lg text-secondary leading-relaxed">
                You can analyze by context: product quality, customer sentiment, competitive strategy, team feedback. Or simply explore what emerges. Whether you're working on a pitch, reviewing field reports, or onboarding a new hire, Fetch Patterns helps you focus attention where it counts.
              </p>
              
              <p className="text-lg text-primary font-medium">
                No training needed. No workflow disruption. Just insight that's already there, finally made visible.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-6 section-divider">
          <div className="container-section">
            <div>
              <Link href="/app/fetch-patterns">
                <Button className="btn-primary px-8 py-4 text-lg flex items-center gap-2">
                  Launch Fetch Patterns
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}