import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, GitCompare, Globe, Sparkles, Library, FileText, ClipboardCheck, Check, ArrowRight, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type AuthMode = "login" | "register" | "forgot" | "reset";

export default function RegTechLanding() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && isAuthenticated) setLocation("/regtech/documents");
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset");
    if (token) { setResetToken(token); setMode("reset"); }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email?.includes("@") || !password) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiRequest("/api/auth/login", "POST", { email, password });
      const data = await res.json();
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({ title: "Welcome back!", description: "Logged in successfully." });
      setLocation("/regtech/documents");
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message || "Invalid credentials.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email?.includes("@") || !password || password.length < 8) {
      toast({ title: "Invalid input", description: "Email and password (8+ chars) required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiRequest("/api/auth/register", "POST", { email, password, firstName, lastName });
      const data = await res.json();
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({ title: "Welcome to RegIntel!", description: "Your 14-day free trial has started." });
      setLocation("/regtech/documents");
    } catch (error: any) {
      toast({ title: "Registration Failed", description: error.message || "Could not create account.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email?.includes("@")) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await apiRequest("/api/auth/forgot-password", "POST", { email });
      toast({ title: "Check your email", description: "If that email exists, a reset link has been sent." });
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast({ title: "Invalid password", description: "Must be 8+ characters.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await apiRequest("/api/auth/reset-password", "POST", { token: resetToken, password: newPassword });
      toast({ title: "Password reset!", description: "You can now log in with your new password." });
      setMode("login");
      setResetToken(null);
      window.history.replaceState({}, "", "/");
    } catch (error: any) {
      toast({ title: "Reset Failed", description: error.message || "Invalid or expired token.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#001D51] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white font-heading animate-pulse">regintel</h1>
          <p className="text-sm text-[#D4AF37] mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: Library, title: "Document Library", desc: "Upload and manage regulatory documents with AI-powered metadata extraction", color: "text-blue-400" },
    { icon: Sparkles, title: "AI-Powered Q&A", desc: "Ask questions about regulations and get answers with source citations", color: "text-[#D4AF37]" },
    { icon: FileText, title: "Regulatory Console", desc: "Fetch and analyze regulatory updates from official sources", color: "text-violet-400" },
    { icon: GitCompare, title: "Document Diff", desc: "Compare regulation versions to identify changes and assess impact", color: "text-cyan-400" },
    { icon: ClipboardCheck, title: "Obligations Analysis", desc: "AI-powered extraction and analysis of regulatory obligations", color: "text-amber-400" },
    { icon: Bell, title: "Proactive Alerts", desc: "Custom alert profiles based on jurisdictions and topics", color: "text-[#E4ADB2]" },
  ];

  const plans = [
    {
      name: "Free Trial", price: "$0", period: "14 days", desc: "Full access to all features",
      features: ["All Professional features", "No credit card required", "14-day duration"],
      cta: "Start Free Trial", action: () => setMode("register"), highlight: false,
    },
    {
      name: "Professional", price: "$199", period: "/month", yearlyPrice: "$1,990/year", desc: "For compliance professionals",
      features: ["Unlimited regulatory documents", "AI-powered Q&A with citations", "Change tracking & diff", "Obligation extraction", "Custom alerts", "Priority support"],
      cta: "Get Started", action: () => setMode("register"), highlight: true,
    },
    {
      name: "Institutional", price: "Custom", period: "", desc: "For teams and enterprises",
      features: ["Multi-user access & roles", "Organization document sharing", "Custom integrations & API", "Dedicated account manager", "Custom SLAs"],
      cta: "Contact Sales", action: () => { window.location.href = "mailto:hello@darkstreet.org"; }, highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#001D51] text-white font-body">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-heading text-white">regintel</span>
            <span className="text-xs text-[#D4AF37] hidden sm:inline">by Dark Street Tech</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 text-sm" onClick={() => { setMode("login"); document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" }); }}>
              Sign In
            </Button>
            <Button className="bg-[#D4AF37] text-[#001D51] hover:bg-[#D4AF37]/90 text-sm font-semibold" onClick={() => { setMode("register"); document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" }); }}>
              Start Free Trial
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 lg:px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium mb-6">
              Regulatory Intelligence Platform
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold font-heading leading-tight mb-6">
              AI-Powered Compliance Intelligence
            </h1>
            <p className="text-lg text-white/70 mb-8 leading-relaxed">
              Track global regulatory updates, analyze compliance requirements with AI,
              and receive proactive alerts when regulations change. Built for financial crime, AML/CFT, and sanctions professionals.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {["AML/CFT", "Financial Crime", "Sanctions", "KYC/CDD", "Fraud Detection", "Consumer Protection"].map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white/60">{tag}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-[#D4AF37] text-[#001D51] hover:bg-[#D4AF37]/90 font-semibold px-6" onClick={() => { setMode("register"); document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" }); }}>
                Start 14-Day Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-6" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
                View Pricing
              </Button>
            </div>
          </div>

          {/* Auth Card */}
          <div id="auth">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-6">
                {mode === "login" && (
                  <>
                    <h2 className="text-xl font-semibold mb-1 font-heading">Sign In</h2>
                    <p className="text-sm text-white/50 mb-5">Access your regulatory platform</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <Label className="text-white/70">Email</Label>
                        <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                      </div>
                      <div>
                        <Label className="text-white/70">Password</Label>
                        <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                      </div>
                      <Button type="submit" className="w-full bg-[#D4AF37] text-[#001D51] hover:bg-[#D4AF37]/90 font-semibold" disabled={isSubmitting}>
                        {isSubmitting ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                    <div className="mt-4 space-y-3">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                        <div className="relative flex justify-center text-xs"><span className="bg-transparent px-2 text-white/40">or</span></div>
                      </div>
                      <a href="/api/auth/google" className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-white/20 rounded-md text-sm text-white/70 hover:bg-white/10 transition">
                        <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Continue with Google
                      </a>
                    </div>
                    <div className="mt-4 flex justify-between text-xs">
                      <button onClick={() => setMode("forgot")} className="text-[#D4AF37] hover:text-[#D4AF37]/80">Forgot password?</button>
                      <button onClick={() => setMode("register")} className="text-[#D4AF37] hover:text-[#D4AF37]/80">Create account</button>
                    </div>
                  </>
                )}

                {mode === "register" && (
                  <>
                    <h2 className="text-xl font-semibold mb-1 font-heading">Create Account</h2>
                    <p className="text-sm text-white/50 mb-5">Start your 14-day free trial — no credit card required</p>
                    <form onSubmit={handleRegister} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-white/70">First Name</Label>
                          <Input placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                        </div>
                        <div>
                          <Label className="text-white/70">Last Name</Label>
                          <Input placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-white/70">Email</Label>
                        <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                      </div>
                      <div>
                        <Label className="text-white/70">Password</Label>
                        <Input type="password" placeholder="8+ characters" value={password} onChange={e => setPassword(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                      </div>
                      <Button type="submit" className="w-full bg-[#D4AF37] text-[#001D51] hover:bg-[#D4AF37]/90 font-semibold" disabled={isSubmitting}>
                        {isSubmitting ? "Creating account..." : "Start Free Trial"}
                      </Button>
                    </form>
                    <div className="mt-4 space-y-3">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                        <div className="relative flex justify-center text-xs"><span className="bg-transparent px-2 text-white/40">or</span></div>
                      </div>
                      <a href="/api/auth/google" className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-white/20 rounded-md text-sm text-white/70 hover:bg-white/10 transition">
                        <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Continue with Google
                      </a>
                    </div>
                    <p className="mt-4 text-center text-xs text-white/40">
                      Already have an account?{" "}
                      <button onClick={() => setMode("login")} className="text-[#D4AF37] hover:text-[#D4AF37]/80">Sign in</button>
                    </p>
                  </>
                )}

                {mode === "forgot" && (
                  <>
                    <h2 className="text-xl font-semibold mb-1 font-heading">Reset Password</h2>
                    <p className="text-sm text-white/50 mb-5">We'll send you a reset link</p>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <Label className="text-white/70">Email</Label>
                        <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                      </div>
                      <Button type="submit" className="w-full bg-[#D4AF37] text-[#001D51] hover:bg-[#D4AF37]/90 font-semibold" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </form>
                    <p className="mt-4 text-center text-xs text-white/40">
                      <button onClick={() => setMode("login")} className="text-[#D4AF37] hover:text-[#D4AF37]/80">Back to Sign In</button>
                    </p>
                  </>
                )}

                {mode === "reset" && (
                  <>
                    <h2 className="text-xl font-semibold mb-1 font-heading">Set New Password</h2>
                    <p className="text-sm text-white/50 mb-5">Choose a new password for your account</p>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div>
                        <Label className="text-white/70">New Password</Label>
                        <Input type="password" placeholder="8+ characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                      </div>
                      <Button type="submit" className="w-full bg-[#D4AF37] text-[#001D51] hover:bg-[#D4AF37]/90 font-semibold" disabled={isSubmitting}>
                        {isSubmitting ? "Resetting..." : "Reset Password"}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-16">
          <h2 className="text-2xl font-bold font-heading text-center mb-2">Everything You Need</h2>
          <p className="text-center text-white/50 mb-10">Comprehensive regulatory intelligence in one platform</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 transition">
                <f.icon className={`h-8 w-8 ${f.color} mb-3`} />
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Coverage */}
      <section className="max-w-6xl mx-auto px-4 lg:px-6 py-16">
        <div className="flex items-start gap-4 p-6 rounded-xl bg-white/5 border border-white/10">
          <Globe className="h-8 w-8 text-emerald-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-lg mb-2 font-heading">Global Regulatory Coverage</h3>
            <p className="text-sm text-white/50 mb-4">Track regulations from financial regulators worldwide — from major economies to emerging markets.</p>
            <div className="flex flex-wrap gap-2">
              {["Americas", "Europe", "Asia-Pacific", "Middle East", "Africa", "Global Bodies"].map(r => (
                <span key={r} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-300">{r}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-16">
          <h2 className="text-2xl font-bold font-heading text-center mb-2">Simple Pricing</h2>
          <p className="text-center text-white/50 mb-10">Start free, upgrade when you're ready</p>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.name} className={`p-6 rounded-xl border ${plan.highlight ? "bg-[#D4AF37]/10 border-[#D4AF37]/30" : "bg-white/5 border-white/10"}`}>
                <h3 className="font-semibold text-lg font-heading">{plan.name}</h3>
                <div className="mt-3 mb-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-white/50 text-sm">{plan.period}</span>}
                </div>
                {(plan as any).yearlyPrice && (
                  <p className="text-xs text-[#D4AF37]">or {(plan as any).yearlyPrice} (save $398)</p>
                )}
                <p className="text-sm text-white/50 mt-2 mb-5">{plan.desc}</p>
                <Button onClick={plan.action} className={`w-full font-semibold ${plan.highlight ? "bg-[#D4AF37] text-[#001D51] hover:bg-[#D4AF37]/90" : "bg-white/10 text-white hover:bg-white/20"}`}>
                  {plan.cta}
                </Button>
                <ul className="mt-5 space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                      <Check className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 lg:px-6 py-16">
        <h2 className="text-2xl font-bold font-heading text-center mb-10">How It Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: "1", title: "Upload Documents", desc: "PDF, DOCX, HTML from any regulator" },
            { step: "2", title: "Configure Alerts", desc: "Set jurisdiction & topic preferences" },
            { step: "3", title: "Ask Questions", desc: "Get AI answers with citations" },
            { step: "4", title: "Track Changes", desc: "Compare versions & assess impact" },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#D4AF37] text-[#001D51] rounded-full flex items-center justify-center text-sm font-bold">{s.step}</div>
              <div>
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-white/50 mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-heading">regintel</span>
              <span className="text-xs text-[#D4AF37]">by Dark Street Tech</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-white/40">
              <a href="mailto:hello@darkstreet.org" className="hover:text-[#D4AF37] transition flex items-center gap-1"><Mail className="h-3 w-3" /> hello@darkstreet.org</a>
              <a href="https://darkstreet.tech" target="_blank" className="hover:text-[#D4AF37] transition">darkstreet.tech</a>
            </div>
          </div>
          <p className="text-center text-xs text-white/20 mt-6">© {new Date().getFullYear()} Dark Street Tech. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
