import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Users, Target, ExternalLink } from "lucide-react";

export default function About() {
  const leadership = [
    {
      name: "Barsha Panda",
      role: "CEO",
      description: "Leading Dark Street Tech's vision and strategic direction."
    },
    {
      name: "David Jairaj",
      role: "COO",
      description: "Overseeing operations and product development."
    }
  ];

  const principles = [
    {
      icon: Building,
      title: "Enterprise Experience",
      description: "Born from real enterprise experience, shaped by years of pattern recognition watching how organizations grow, stall, adapt, and evolve."
    },
    {
      icon: Target,
      title: "Precise Solutions",
      description: "Each product we build solves for a real, observed need. No padding. No gimmicks. Just tools that resolve friction cleanly and intelligently."
    },
    {
      icon: Users,
      title: "Thoughtful Operation",
      description: "We operate like we expect our customers to: with precision, thoughtfulness, and an eye on what's truly needed."
    }
  ];

  return (
    <div className="min-h-screen bg-surface-darkest">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            About <span className="gradient-text">Dark Street Tech</span>
          </h1>
          <p className="text-2xl text-primary-blue mb-8 font-semibold">
            A product company born from real enterprise experience.
          </p>
          <div className="max-w-4xl mx-auto text-secondary leading-relaxed space-y-6">
            <p className="text-lg">
              Dark Street Tech is the software venture of Dark Street, a strategy firm known for its clarity of thinking, refusal to follow trends, and deep work with leadership teams inside growing enterprises.
            </p>
            <p className="text-lg">
              We created Dark Street Tech to turn our insights into tools. Tools that enterprises can use every day to reduce friction, gain alignment, and perform with greater intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* Principles Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-surface-dark">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {principles.map((principle, index) => {
              const IconComponent = principle.icon;
              return (
                <Card key={index} className="card-hover h-full">
                  <CardHeader>
                    <div className="w-16 h-16 bg-primary-blue/20 rounded-xl flex items-center justify-center mb-6">
                      <IconComponent className="w-8 h-8 text-primary-blue" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white mb-4">
                      {principle.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-secondary leading-relaxed">
                      {principle.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white">
            Leadership
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {leadership.map((leader, index) => (
              <Card key={index} className="card-hover">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white">
                    {leader.name}
                  </CardTitle>
                  <p className="text-primary-blue font-semibold">{leader.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-secondary leading-relaxed">
                    {leader.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-surface-dark">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-secondary leading-relaxed space-y-6">
            <p className="text-lg">
              Our work is shaped by years of pattern recognition, watching how organizations grow, stall, adapt, and evolve. Each product we build solves for a real, observed need. No padding. No gimmicks.
            </p>
            <p className="text-lg font-semibold text-white">
              We operate like we expect our customers to: with precision, thoughtfulness, and an eye on what's truly needed.
            </p>
          </div>
        </div>
      </section>

      {/* Links Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-surface-dark rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Strategy & Advisory</h3>
              <p className="text-secondary mb-6">
                For strategic consulting and leadership advisory services.
              </p>
              <Button
                onClick={() => window.open('https://darkstreet.consulting', '_blank')}
                variant="outline"
                className="border-2 border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white transition-all duration-300 inline-flex items-center gap-2"
              >
                Visit darkstreet.consulting
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6 bg-surface-dark rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Intelligent Products</h3>
              <p className="text-secondary mb-6">
                For enterprise AI tools and intelligent solutions.
              </p>
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-primary-blue text-white hover:bg-primary-blue-dark transition-all duration-300"
              >
                Stay here
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}