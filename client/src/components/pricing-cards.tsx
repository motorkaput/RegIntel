import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  popular: boolean;
}

export default function PricingCards() {
  const { isAuthenticated } = useAuth();
  
  const { data: plans } = useQuery<Plan[]>({
    queryKey: ['/api/subscription-plans'],
    retry: false,
  });

  const handlePlanClick = (planId: string) => {
    if (isAuthenticated) {
      window.location.href = `/subscription?plan=${planId}`;
    } else {
      window.location.href = "/api/login";
    }
  };

  // Default plans if API fails
  const defaultPlans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '29',
      description: 'Perfect for individuals getting started',
      features: [
        'Up to 1,000 documents/month',
        'Basic AI analysis',
        'Email support',
        'Dashboard access'
      ],
      popular: false,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '99',
      description: 'For growing businesses',
      features: [
        'Up to 10,000 documents/month',
        'Advanced AI analysis',
        'Priority support',
        'Custom integrations',
        'API access'
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations',
      features: [
        'Unlimited documents',
        'Custom AI models',
        '24/7 dedicated support',
        'On-premise deployment',
        'SLA guarantees'
      ],
      popular: false,
    },
  ];

  const displayPlans: Plan[] = plans || defaultPlans;

  return (
    <section className="py-24 bg-surface-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Enterprise <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-xl text-secondary max-w-3xl mx-auto leading-relaxed">
            Flexible pricing plans designed to scale with your enterprise needs. 
            Start with a 30-day free trial and upgrade as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayPlans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative card-hover transition-all duration-300 ${
                plan.popular 
                  ? 'border-2 border-primary-blue' 
                  : 'border border-subtle'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary-blue text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-semibold mb-2 text-white">
                  {plan.name}
                </CardTitle>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-primary-blue">
                    {plan.price === 'Custom' ? 'Custom' : `$${plan.price}`}
                  </span>
                  {plan.price !== 'Custom' && (
                    <span className="text-muted text-sm ml-1">per month</span>
                  )}
                </div>
                <p className="text-muted text-sm">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-primary-blue flex-shrink-0" />
                      <span className="text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handlePlanClick(plan.id)}
                  className={`w-full py-3 font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-neon-green text-black hover:bg-neon-cyan'
                      : 'bg-neon-green text-black hover:bg-neon-cyan'
                  }`}
                >
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
