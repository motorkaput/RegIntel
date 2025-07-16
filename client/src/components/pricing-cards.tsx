import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export default function PricingCards() {
  const { isAuthenticated } = useAuth();
  
  const { data: plans } = useQuery({
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

  const displayPlans = plans || defaultPlans;

  return (
    <section className="py-20 bg-dark-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your <span className="text-neon-green">Plan</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Start with a 30-day free trial and scale as your business grows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayPlans.map((plan) => (
            <Card 
              key={plan.id}
              className={`bg-black rounded-2xl border transition-all duration-300 relative ${
                plan.popular 
                  ? 'border-2 border-neon-green hover:shadow-[0_0_30px_rgba(0,255,136,0.3)]' 
                  : 'border-gray-600 hover:border-neon-green/60'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-neon-green text-black px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-semibold mb-2">
                  {plan.name}
                </CardTitle>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-neon-green">
                    {plan.price === 'Custom' ? 'Custom' : `$${plan.price}`}
                  </span>
                  {plan.price !== 'Custom' && (
                    <span className="text-gray-400 text-sm ml-1">per month</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-neon-green flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
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
