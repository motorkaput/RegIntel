import { Button } from "@/components/ui/button";
import { ArrowRight, Code, Terminal } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="min-h-screen bg-surface-white flex items-center justify-center section-divider">
      <div className="container-section py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-responsive-xl font-bold text-primary leading-tight">
                Intelligent tech for
                <span className="text-gradient block mt-2">
                  growing enterprises
                </span>
              </h1>
            </div>
            
            <div className="space-y-6 text-secondary">
              <p className="text-lg leading-relaxed">
                At Dark Street, we are building AI-powered tech for growing enterprises.
              </p>
              
              <p className="leading-relaxed">
                Our SaaS products are designed to solve hard, often invisible problems that stall momentum in scaling organizations: broken task ownership, weak feedback loops, hidden complexity in goals, and documents no one truly reads.
              </p>
              
              <div className="space-y-4">
                <p className="leading-relaxed">
                  We don't create generic tools. We create precise instruments, designed for teams that think and want to perform better.
                </p>
                <p className="leading-relaxed">
                  Backed by years of strategic consulting and enterprise insight, Dark Street Tech is the product arm of Dark Street. We combine systems thinking, cognitive design, and practical execution into tools that make work clearer, lighter, and more aligned.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => window.location.href = '/fetch-patterns'}
                className="btn-primary flex items-center gap-2"
              >
                Explore Fetch Patterns
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => window.location.href = '/permeate-enterprise'}
                className="btn-outline"
              >
                Try PerMeaTe Enterprise
              </Button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="bg-surface-light border border-medium rounded-sm p-6 space-y-4">
              {/* Code editor mockup */}
              <div className="flex items-center justify-between pb-3 border-b border-light">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-accent-blue" />
                  <span className="text-sm font-medium text-primary">enterprise.config</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-3 font-mono text-sm">
                <div className="flex">
                  <span className="text-muted w-8">1</span>
                  <span className="text-accent-blue">const</span>
                  <span className="text-primary ml-2">products = {"{"}</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">2</span>
                  <span className="text-primary ml-4">fetchPatterns: {"{"}</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">3</span>
                  <span className="text-primary ml-6">purpose:</span>
                  <span className="text-green-600 ml-2">"document intelligence"</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">4</span>
                  <span className="text-primary ml-4">{"}"}, </span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">5</span>
                  <span className="text-primary ml-4">permeateEnterprise: {"{"}</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">6</span>
                  <span className="text-primary ml-6">purpose:</span>
                  <span className="text-green-600 ml-2">"goal decomposition"</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">7</span>
                  <span className="text-primary ml-4">{"}"}</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">8</span>
                  <span className="text-primary">{"}"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Two Products Grid */}
        <div className="mt-24 pt-12 border-t border-light">
          <div className="text-center mb-12">
            <h2 className="text-responsive-lg font-semibold text-primary mb-4">
              Two products are now live:
            </h2>
          </div>
          
          <div className="layout-grid layout-grid-2 gap-8">
            <div className="card-minimal p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-accent-blue-light rounded-sm flex items-center justify-center flex-shrink-0">
                  <Code className="w-4 h-4 text-accent-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-2">Fetch Patterns</h3>
                  <p className="text-secondary text-sm leading-relaxed">
                    Upload one or many documents. Let the intelligence surface the patterns: keywords, sentiment, risk, gaps, and meaning. Ask questions directly.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="card-minimal p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-accent-blue-light rounded-sm flex items-center justify-center flex-shrink-0">
                  <Terminal className="w-4 h-4 text-accent-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-2">PerMeaTe Enterprise</h3>
                  <p className="text-secondary text-sm leading-relaxed">
                    Define an outcome. Watch the system break it down into projects, tasks, metrics, and roles, ready to assign, score, and lead.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}