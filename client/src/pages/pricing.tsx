import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import PricingCards from "@/components/pricing-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Shield, Headphones, Code, Building } from "lucide-react";

export default function Pricing() {
  const { data: plans } = useQuery({
    queryKey: ['/api/subscription-plans'],
    retry: false,
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-black via-dark-gray to-darker-gray">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Choose Your <span className="text-neon-green">AI Plan</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Start with a 30-day free trial and scale as your business grows. No hidden fees, cancel anytime.
            </p>
            <Badge variant="outline" className="text-neon-green border-neon-green">
              30-Day Free Trial • No Credit Card Required
            </Badge>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20">
          <PricingCards />
        </section>

        {/* Feature Comparison */}
        <section className="py-20 bg-dark-gray">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                Compare <span className="text-neon-green">Features</span>
              </h2>
              <p className="text-xl text-gray-300">
                See what's included in each plan and find the perfect fit for your needs.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-4 px-6 text-lg font-semibold">Features</th>
                    <th className="text-center py-4 px-6 text-lg font-semibold text-neon-green">Starter</th>
                    <th className="text-center py-4 px-6 text-lg font-semibold text-neon-green">Professional</th>
                    <th className="text-center py-4 px-6 text-lg font-semibold text-neon-green">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="py-4 px-6">Documents per month</td>
                    <td className="text-center py-4 px-6">1,000</td>
                    <td className="text-center py-4 px-6">10,000</td>
                    <td className="text-center py-4 px-6">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-4 px-6">AI Analysis</td>
                    <td className="text-center py-4 px-6">
                      <CheckCircle className="w-5 h-5 text-neon-green mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircle className="w-5 h-5 text-neon-green mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircle className="w-5 h-5 text-neon-green mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-4 px-6">API Access</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6">
                      <CheckCircle className="w-5 h-5 text-neon-green mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <CheckCircle className="w-5 h-5 text-neon-green mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-4 px-6">Custom Models</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6">
                      <CheckCircle className="w-5 h-5 text-neon-green mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-4 px-6">Support</td>
                    <td className="text-center py-4 px-6">Email</td>
                    <td className="text-center py-4 px-6">Priority</td>
                    <td className="text-center py-4 px-6">24/7 Dedicated</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20 bg-gradient-to-b from-black to-dark-gray">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                Why Choose <span className="text-neon-green">Dark Street Tech</span>?
              </h2>
              <p className="text-xl text-gray-300">
                Leading AI technology with enterprise-grade security and support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="bg-dark-gray border-neon-green/20 hover:border-neon-green/60 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-neon-green/20 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-neon-green" />
                  </div>
                  <CardTitle className="text-neon-green">Lightning Fast</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Process documents in seconds with our optimized AI algorithms and cloud infrastructure.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-dark-gray border-neon-green/20 hover:border-neon-green/60 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-neon-green/20 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-neon-green" />
                  </div>
                  <CardTitle className="text-neon-green">Enterprise Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Bank-grade encryption and compliance with industry standards to keep your data safe.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-dark-gray border-neon-green/20 hover:border-neon-green/60 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-neon-green/20 rounded-lg flex items-center justify-center mb-4">
                    <Headphones className="w-6 h-6 text-neon-green" />
                  </div>
                  <CardTitle className="text-neon-green">24/7 Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Our expert team is available around the clock to help you succeed with AI integration.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-dark-gray border-neon-green/20 hover:border-neon-green/60 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-neon-green/20 rounded-lg flex items-center justify-center mb-4">
                    <Code className="w-6 h-6 text-neon-green" />
                  </div>
                  <CardTitle className="text-neon-green">Developer Friendly</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Comprehensive APIs and SDKs to integrate AI capabilities into your existing systems.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-dark-gray border-neon-green/20 hover:border-neon-green/60 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-neon-green/20 rounded-lg flex items-center justify-center mb-4">
                    <Building className="w-6 h-6 text-neon-green" />
                  </div>
                  <CardTitle className="text-neon-green">Scalable Architecture</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Built to handle everything from small businesses to enterprise-level workloads.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-dark-gray border-neon-green/20 hover:border-neon-green/60 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-neon-green/20 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="w-6 h-6 text-neon-green" />
                  </div>
                  <CardTitle className="text-neon-green">Proven Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Trusted by thousands of companies worldwide with 99.9% uptime and accuracy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-dark-gray">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                Frequently Asked <span className="text-neon-green">Questions</span>
              </h2>
            </div>

            <div className="space-y-6">
              <Card className="bg-darker-gray border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg">How does the free trial work?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Start with a 30-day free trial with full access to all features. No credit card required. 
                    After the trial, choose a plan that fits your needs.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-darker-gray border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg">Can I change my plan anytime?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                    and billing is prorated.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-darker-gray border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    We accept all major credit cards, debit cards, and UPI payments through our secure 
                    Razorpay integration.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-darker-gray border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg">Is my data secure?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Absolutely. We use bank-grade encryption, comply with industry standards, and never 
                    share your data with third parties.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
