import { useState } from "react";
import { Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import RegTechLayout from "./layout";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast({ title: "Error", description: "Payment system failed to load.", variant: "destructive" });
        return;
      }

      // Fetch Razorpay key from server config
      const configRes = await fetch("/api/config");
      const config = await configRes.json();

      const res = await apiRequest("/api/subscription/create-order", "POST", { planId });
      const { order, planName } = await res.json();

      const options = {
        key: config.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "RegIntel",
        description: planName,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            await apiRequest("/api/subscription/verify-payment", "POST", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
            queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
            toast({ title: "Subscription activated!", description: "Welcome to RegIntel Professional." });
          } catch {
            toast({ title: "Verification failed", description: "Please contact support.", variant: "destructive" });
          }
        },
        prefill: { email: user?.email || "" },
        theme: { color: "#001D51" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to start payment.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const subscriptionStatus = (user as any)?.subscriptionStatus;
  const isActive = subscriptionStatus === "active";

  return (
    <RegTechLayout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold font-heading text-slate-900 dark:text-white">Choose Your Plan</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {isActive ? "You're on the Professional plan." : "Upgrade to unlock the full power of RegIntel."}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Trial */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <h3 className="font-semibold text-lg font-heading text-slate-900 dark:text-white">Free Trial</h3>
            <div className="mt-3 mb-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">$0</span>
              <span className="text-slate-500 text-sm"> / 14 days</span>
            </div>
            <p className="text-sm text-slate-500 mt-2 mb-5">Full access to all features</p>
            <Button variant="outline" className="w-full" disabled>
              {subscriptionStatus === "trial" ? "Current Plan" : "Trial Ended"}
            </Button>
            <ul className="mt-5 space-y-2">
              {["All Professional features", "No credit card required", "14-day duration"].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Check className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
          </div>

          {/* Professional */}
          <div className="p-6 rounded-xl border-2 border-[#D4AF37] bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10">
            <h3 className="font-semibold text-lg font-heading text-slate-900 dark:text-white">Professional</h3>
            <div className="mt-3 mb-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">$199</span>
              <span className="text-slate-500 text-sm"> /month</span>
            </div>
            <p className="text-xs text-[#D4AF37] font-medium">or $1,990/year (save $398)</p>
            <p className="text-sm text-slate-500 mt-2 mb-5">For compliance professionals</p>

            {isActive ? (
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled>Active</Button>
            ) : (
              <div className="space-y-2">
                <Button className="w-full bg-[#D4AF37] text-[#001D51] hover:bg-[#D4AF37]/90 font-semibold"
                  disabled={loading === "professional_monthly"} onClick={() => handleSubscribe("professional_monthly")}>
                  {loading === "professional_monthly" ? "Processing..." : "Subscribe Monthly"}
                </Button>
                <Button variant="outline" className="w-full border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  disabled={loading === "professional_yearly"} onClick={() => handleSubscribe("professional_yearly")}>
                  {loading === "professional_yearly" ? "Processing..." : "Subscribe Yearly — Save $398"}
                </Button>
              </div>
            )}

            <ul className="mt-5 space-y-2">
              {["Unlimited regulatory documents", "AI-powered Q&A with citations", "Regulatory change tracking & diff",
                "Obligation extraction & analysis", "Custom alert profiles", "Session tracking & audit trail", "Priority support"].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Check className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <h3 className="font-semibold text-lg font-heading text-slate-900 dark:text-white">Institutional</h3>
            <div className="mt-3 mb-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">Custom</span>
            </div>
            <p className="text-sm text-slate-500 mt-2 mb-5">For teams and enterprises</p>
            <a href="mailto:hello@darkstreet.org">
              <Button variant="outline" className="w-full">
                <Mail className="mr-2 h-4 w-4" />Contact Sales
              </Button>
            </a>
            <ul className="mt-5 space-y-2">
              {["Multi-user access & roles", "Organization document sharing", "Custom integrations & API",
                "Dedicated account manager", "Custom SLAs", "On-premise deployment options"].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Check className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
          Questions? Email <a href="mailto:hello@darkstreet.org" className="text-[#D4AF37] hover:underline">hello@darkstreet.org</a>
        </p>
      </div>
    </RegTechLayout>
  );
}
