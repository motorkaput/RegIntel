import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DynamicHero from "@/components/dynamic-hero";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight } from "lucide-react";
import permeateIcon from "@assets/PerMeaTeEnterprise_Icon_1752664675820.png";

export default function PerMeaTeEnterprise() {
  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      
      <main className="pt-20">
        <DynamicHero 
          title="PerMeaTe Enterprise" 
          subtitle="Where goals turn into real, measurable work." 
        />

        {/* Problem Statement */}
        <section className="py-6 bg-surface-light section-divider">
          <div className="container-section">
            <div className="space-y-8">
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
        <section className="py-6 section-divider">
          <div className="container-section">
            <div className="space-y-6">
              <p className="text-lg text-secondary leading-relaxed">
                It starts with a single outcome. From there, the system breaks it down, cleanly, logically, and fast, into projects, tasks, roles, and metrics.
              </p>
              
              <h2 className="text-lg text-primary mb-6">
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
        <section className="py-6 bg-surface-light section-divider">
          <div className="container-section">
            <div className="space-y-8">
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
        <section className="py-6 section-divider">
          <div className="container-section">
            <div className="space-y-8">
              <p className="text-lg text-primary font-medium">
                PerMeaTe doesn't replace your workflows. It strengthens the foundation they sit on.
              </p>
              
              <div>
                <Button 
                  className="btn-primary px-8 py-4 text-lg flex items-center gap-2"
                  onClick={() => window.location.href = '/permeate-beta-login'}
                >
                  Launch PerMeaTe Enterprise
                  <ArrowRight className="w-5 h-5" />
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