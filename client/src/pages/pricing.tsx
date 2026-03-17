import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  interval: string;
  documentsLimit: number;
  features: string[];
}

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await fetch("/api/subscription-plans");
      if (!res.ok) throw new Error("Failed to fetch plans");
      return res.json();
    },
  });

  const handleSelectPlan = (planId: string) => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    // For now, redirect to contact for Enterprise, or show checkout for others
    if (planId === "enterprise") {
      window.location.href = "mailto:hello@regintel.darkstreet.tech?subject=Enterprise Plan Inquiry";
    } else {
      // In production, this would open Razorpay checkout
      setLocation("/regtech/console");
    }
  };

  // Fallback plans if API hasn't loaded yet
  const displayPlans: Plan[] = plans.length > 0 ? plans : [
    {
      id: "pilot",
      name: "Pilot",
      description: "3 users, 200 RegIntel Intelligence units/mo, 5 active alert sets",
      price: "299.00",
      currency: "USD",
      interval: "monthly",
      documentsLimit: 200,
      features: ["3 team members", "200 Intelligence units/month", "5 active alert sets", "Document analysis", "Obligation extraction", "Email support"],
    },
    {
      id: "professional",
      name: "Professional",
      description: "10 users, 1,000 RegIntel Intelligence units/mo, 25 active alert sets",
      price: "799.00",
      currency: "USD",
      interval: "monthly",
      documentsLimit: 1000,
      features: ["10 team members", "1,000 Intelligence units/month", "25 active alert sets", "Advanced analysis", "Priority support", "API access"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Unlimited users, custom units, unlimited alert sets",
      price: "1500.00",
      currency: "USD",
      interval: "monthly",
      documentsLimit: -1,
      features: ["Unlimited team members", "Custom Intelligence units", "Unlimited alert sets", "Dedicated support", "On-premise deployment", "SLA guarantees", "Custom integrations"],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)" }}>
      {/* Header */}
      <header className="border-b py-4 px-6" style={{ background: "var(--ds-surface)", borderColor: "var(--ds-border)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md flex items-center justify-center" style={{ background: "var(--ds-gold)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--ds-imperial)" }}>R</span>
            </div>
            <span className="brand-name text-[15px]" style={{ color: "var(--ds-text)" }}>RegIntel</span>
          </a>
          <div className="flex items-center gap-4 text-[12px]" style={{ color: "var(--ds-text-muted)" }}>
            <a href="/terms" className="hover:underline">Terms</a>
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/contact" className="hover:underline">Contact</a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "var(--ds-text)" }}>
              Simple, transparent pricing
            </h1>
            <p className="text-[15px] max-w-lg mx-auto" style={{ color: "var(--ds-text-secondary)" }}>
              Choose the plan that fits your compliance team. All plans include AI-powered regulatory intelligence.
            </p>
            <p className="text-[13px] mt-2" style={{ color: "var(--ds-gold)" }}>
              Save 20% with annual billing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {displayPlans.map((plan) => {
              const isProfessional = plan.id === "professional";
              const priceNum = parseFloat(plan.price);
              const annualPrice = Math.round(priceNum * 0.8);

              return (
                <div
                  key={plan.id}
                  className="rounded-lg border p-8 flex flex-col relative"
                  style={{
                    background: "var(--ds-surface)",
                    borderColor: isProfessional ? "var(--ds-gold)" : "var(--ds-border)",
                    borderWidth: isProfessional ? "2px" : "1px",
                    boxShadow: isProfessional ? "var(--ds-shadow-md)" : "var(--ds-shadow-sm)",
                  }}
                >
                  {isProfessional && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: "var(--ds-gold)", color: "var(--ds-imperial)" }}
                    >
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "var(--ds-text)" }}>
                      {plan.name}
                    </h2>
                    <p className="text-[13px]" style={{ color: "var(--ds-text-secondary)" }}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold" style={{ color: "var(--ds-text)" }}>
                        ${priceNum.toFixed(0)}
                      </span>
                      <span className="text-[13px]" style={{ color: "var(--ds-text-muted)" }}>/mo</span>
                    </div>
                    <p className="text-[12px] mt-1" style={{ color: "var(--ds-text-muted)" }}>
                      ${annualPrice}/mo billed annually
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13px]" style={{ color: "var(--ds-text-secondary)" }}>
                        <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "var(--ds-success)" }} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className="w-full h-10 text-[13px] font-semibold"
                    style={{
                      background: isProfessional ? "var(--ds-imperial)" : "transparent",
                      color: isProfessional ? "white" : "var(--ds-imperial)",
                      border: isProfessional ? "none" : "1px solid var(--ds-border)",
                    }}
                  >
                    {plan.id === "enterprise" ? "Contact Sales" : "Get Started"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ background: "var(--ds-deep-navy)" }}>
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <span className="text-[12px]" style={{ color: "var(--ds-text-on-dark-muted)" }}>Dark Street Tech</span>
          <div className="flex items-center gap-4 text-[12px]" style={{ color: "var(--ds-text-on-dark-muted)" }}>
            <a href="/terms" className="hover:underline">Terms</a>
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/refund" className="hover:underline">Refund</a>
            <a href="/contact" className="hover:underline">Contact</a>
            <a href="/pricing" className="hover:underline">Pricing</a>
          </div>
          <span className="text-[12px]" style={{ color: "var(--ds-text-on-dark-muted)" }}>darkstreet.tech</span>
        </div>
      </footer>
    </div>
  );
}
