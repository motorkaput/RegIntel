import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Calendar, Shield, Star, CheckCircle, XCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Extend window interface for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Subscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: {
    name: string;
    price: string;
    features: string[];
  };
}

export default function Subscription() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: subscription, isLoading: subscriptionLoading } = useQuery<Subscription>({
    queryKey: ['/api/subscription'],
    retry: false,
  });

  interface Plan {
    id: string;
    name: string;
    price: string;
    description: string;
    features: string[];
    popular: boolean;
  }

  const { data: plans } = useQuery<Plan[]>({
    queryKey: ['/api/subscription-plans'],
    retry: false,
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/subscription/create', { planId });
      return response.json();
    },
    onSuccess: (data) => {
      // Handle Razorpay payment
      if (window.Razorpay) {
        const options = {
          key: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
          subscription_id: data.razorpaySubscription.id,
          name: 'Dark Street Tech',
          description: 'AI-Powered SaaS Subscription',
          handler: function (response: any) {
            // Verify payment
            verifyPaymentMutation.mutate(response);
          },
          prefill: {
            name: 'User',
            email: 'user@example.com',
          },
          theme: {
            color: '#00FF88',
          },
        };
        
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest('POST', '/api/subscription/verify', paymentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription activated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to verify payment",
        variant: "destructive",
      });
    },
  });

  if (isLoading || subscriptionLoading) {
    return <LoadingSpinner />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'cancelled':
        return 'text-red-500';
      case 'expired':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Subscription <span className="text-neon-green">Management</span>
            </h1>
            <p className="text-xl text-gray-300">
              Manage your subscription, billing, and plan details.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Current Subscription */}
            <div className="lg:col-span-2">
              <Card className="bg-dark-gray border-neon-green/20 mb-6">
                <CardHeader>
                  <CardTitle className="text-neon-green flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Current Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subscription ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-neon-green">
                            {subscription.plan.name}
                          </h3>
                          <p className="text-gray-400">
                            ${subscription.plan.price}/month
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(subscription.status)}
                          <Badge 
                            variant="outline"
                            className={`${getStatusColor(subscription.status)} border-current`}
                          >
                            {subscription.status}
                          </Badge>
                        </div>
                      </div>

                      <Separator className="bg-gray-600" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Current Period</p>
                          <p className="font-medium">
                            {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {' '}
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Next Billing</p>
                          <p className="font-medium">
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <Separator className="bg-gray-600" />

                      <div>
                        <p className="text-sm text-gray-400 mb-2">Plan Features</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {subscription.plan.features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-neon-green" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button 
                          variant="outline" 
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          Cancel Subscription
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Active Subscription</h3>
                      <p className="text-gray-400 mb-4">
                        You're currently on the free trial. Upgrade to unlock premium features.
                      </p>
                      <Button 
                        onClick={() => window.location.href = '/pricing'}
                        className="bg-neon-green text-black hover:bg-neon-cyan"
                      >
                        View Plans
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Billing History */}
              <Card className="bg-dark-gray border-neon-green/20">
                <CardHeader>
                  <CardTitle className="text-neon-green flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Billing History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No billing history available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upgrade Options */}
            <div className="lg:col-span-1">
              <Card className="bg-dark-gray border-neon-green/20">
                <CardHeader>
                  <CardTitle className="text-neon-green flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Upgrade Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {plans?.map((plan: any) => (
                      <div key={plan.id} className="p-4 border border-gray-600 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{plan.name}</h4>
                          <span className="text-neon-green font-bold">${plan.price}</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{plan.description}</p>
                        <Button
                          onClick={() => createSubscriptionMutation.mutate(plan.id)}
                          disabled={createSubscriptionMutation.isPending}
                          className="w-full bg-neon-green text-black hover:bg-neon-cyan"
                          size="sm"
                        >
                          {createSubscriptionMutation.isPending ? 'Processing...' : 'Upgrade'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Usage Stats */}
              <Card className="bg-dark-gray border-neon-green/20 mt-6">
                <CardHeader>
                  <CardTitle className="text-neon-green">Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Documents This Month</span>
                        <span>45 / 1,000</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-neon-green h-2 rounded-full" 
                          style={{ width: '4.5%' }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>API Calls</span>
                        <span>120 / 5,000</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-neon-green h-2 rounded-full" 
                          style={{ width: '2.4%' }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Storage Used</span>
                        <span>2.1 GB / 10 GB</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-neon-green h-2 rounded-full" 
                          style={{ width: '21%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
