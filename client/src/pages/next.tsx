import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Shield, BarChart3, Mail } from "lucide-react";

export default function Next() {
  const upcomingProducts = [
    {
      icon: Brain,
      title: "Enterprise Mind",
      description: "A cognitive layer for leadership. Designed to connect the scattered dots, documents, decisions, patterns, and context. So that enterprise leaders can think more clearly, and act ahead of the curve."
    },
    {
      icon: Shield,
      title: "QOAN",
      description: "A trust protocol for work. Built for a world where attention is the scarcest resource, QOAN brings proof-of-attention and proof-of-completion to human effort. Precision. Accountability. Fairness. Built into every assignment."
    },
    {
      icon: BarChart3,
      title: "PCI Index",
      description: "A new lens for enterprise value. Moving beyond standard metrics, PCI identifies the hidden signals of innovation, influence, and resilience inside organizations. Signals that most balance sheets miss."
    }
  ];

  return (
    <div className="min-h-screen bg-surface-darkest">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            What's coming <span className="gradient-text">next</span>
          </h1>
          <p className="text-2xl text-primary-blue mb-8 font-semibold">
            If your team is solving problems at the edge, we're likely building for you.
          </p>
          <div className="max-w-4xl mx-auto text-secondary leading-relaxed space-y-6">
            <p className="text-lg">
              At Dark Street Tech, we don't chase feature sets. We follow real patterns of friction inside growing enterprises. And we build what resolves them, cleanly and intelligently.
            </p>
            <p className="text-lg font-semibold text-white">
              Here's a preview of what we're working on:
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Products */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {upcomingProducts.map((product, index) => {
              const IconComponent = product.icon;
              return (
                <Card key={index} className="card-hover h-full">
                  <CardHeader>
                    <div className="w-16 h-16 bg-primary-blue/20 rounded-xl flex items-center justify-center mb-6">
                      <IconComponent className="w-8 h-8 text-primary-blue" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white mb-4">
                      {product.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-secondary leading-relaxed">
                      {product.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Development Status */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-surface-dark">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-secondary leading-relaxed space-y-6">
            <p className="text-lg font-semibold text-white">
              Each of these is under active development.
            </p>
          </div>
          
          <div className="mt-12">
            <Button
              onClick={() => window.location.href = 'mailto:hello@darkstreet.org'}
              className="bg-primary-blue text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-primary-blue-dark transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-3"
            >
              <Mail className="w-5 h-5" />
              Contact Us at hello@darkstreet.org
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}