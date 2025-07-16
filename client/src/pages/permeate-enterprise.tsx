import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight } from "lucide-react";

export default function PerMeaTeEnterprise() {
  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-24 section-divider">
          <div className="container-section">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h1 className="text-responsive-xl font-semibold text-primary">
                PerMeaTe Enterprise
              </h1>
              <p className="text-responsive-md text-secondary font-light">
                Where goals turn into real work.
              </p>
            </div>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="py-16 bg-surface-light section-divider">
          <div className="container-section">
            <div className="max-w-4xl mx-auto space-y-8">
              <p className="text-lg text-secondary leading-relaxed">
                Enterprises don't fail from lack of ambition. They fail from weak translation, between the intent of leaders and the action of teams.
              </p>
              
              <p className="text-lg text-primary font-medium">
                PerMeaTe Enterprise closes that gap.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 section-divider">
          <div className="container-section">
            <div className="max-w-4xl mx-auto space-y-12">
              <p className="text-lg text-secondary leading-relaxed">
                It starts with a single outcome. From there, the system breaks it down, cleanly, logically, and fast, into projects, tasks, roles, and metrics.
              </p>
              
              <h2 className="text-responsive-lg font-semibold text-primary">
                You get:
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-accent-blue rounded-full mt-3"></div>
                  <p className="text-secondary">a structured hierarchy of work</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-accent-blue rounded-full mt-3"></div>
                  <p className="text-secondary">clear role-based assignments</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-accent-blue rounded-full mt-3"></div>
                  <p className="text-secondary">numeric scoring systems for task completion</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-accent-blue rounded-full mt-3"></div>
                  <p className="text-secondary">and an organizational dashboard that shows real performance, not just activity.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-surface-light section-divider">
          <div className="container-section">
            <div className="max-w-4xl mx-auto space-y-8">
              <p className="text-lg text-secondary leading-relaxed">
                Leaders see the full picture. Project leads gain precision and control. Team members know what matters and how their work is measured.
              </p>
              
              <p className="text-lg text-primary font-medium">
                No vague goals. No bloated trackers. Just a shared frame of reference, where performance is understood, measurable, and aligned to purpose.
              </p>
            </div>
          </div>
        </section>

        {/* Final Message */}
        <section className="py-20 section-divider">
          <div className="container-section">
            <div className="max-w-4xl mx-auto space-y-8">
              <p className="text-lg text-primary font-medium">
                PerMeaTe doesn't replace your workflows. It strengthens the foundation they sit on.
              </p>
              
              <div className="text-center">
                <Button 
                  onClick={() => window.location.href = '#'} 
                  className="btn-primary px-8 py-4 text-lg"
                >
                  Launch PerMeaTe Enterprise
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}