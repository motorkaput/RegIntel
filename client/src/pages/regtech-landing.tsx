import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, GitCompare, Globe, Sparkles, Library, FileText, ClipboardCheck, Check, ArrowRight, Mail, CalendarClock, Shield, Zap } from "lucide-react";
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
  const authRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) setLocation("/regtech/documents");
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset");
    if (token) { setResetToken(token); setMode("reset"); }
  }, []);

  const scrollToAuth = useCallback((targetMode: AuthMode) => {
    setMode(targetMode);
    // Wait for React to re-render the form, then scroll
    setTimeout(() => {
      authRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
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
      toast({ title: "Welcome back!", description: "Signed in successfully." });
      setLocation("/regtech/documents");
    } catch (error: any) {
      toast({ title: "Sign In Failed", description: error.message || "Invalid credentials.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email?.includes("@") || !password || password.length < 8) {
      toast({ title: "Invalid input", description: "Email and password (8+ characters) required.", variant: "destructive" });
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
    if (!email?.includes("@")) { toast({ title: "Invalid email", variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      await apiRequest("/api/auth/forgot-password", "POST", { email });
      toast({ title: "Check your email", description: "If that email exists, a reset link has been sent." });
    } catch { toast({ title: "Error", description: "Something went wrong.", variant: "destructive" }); }
    finally { setIsSubmitting(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) { toast({ title: "Invalid password", description: "Must be 8+ characters.", variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      await apiRequest("/api/auth/reset-password", "POST", { token: resetToken, password: newPassword });
      toast({ title: "Password reset!", description: "You can now sign in with your new password." });
      setMode("login"); setResetToken(null); window.history.replaceState({}, "", "/");
    } catch (error: any) { toast({ title: "Reset Failed", description: error.message || "Invalid or expired token.", variant: "destructive" }); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#001D51] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white font-heading animate-pulse">RegIntel</h1>
          <p className="text-sm text-[#D4AF37]/60 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  const GoogleIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#001D51] text-white font-body">
      {/* ─── Header ─── */}
      <header className="border-b border-white/10 sticky top-0 z-50 bg-[#001D51]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
          <span className="text-xl font-bold font-heading tracking-tight">RegIntel</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 text-sm" onClick={() => scrollToAuth("login")}>
              Sign In
            </Button>
            <Button className="bg-[#D4AF37] text-[#001D51] hover:bg-[#c9a432] text-sm font-semibold" onClick={() => scrollToAuth("register")}>
              Start Free Trial
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="max-w-6xl mx-auto px-4 lg:px-6 pt-16 pb-12 lg:pt-24 lg:pb-20">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Left: Copy — 3 cols */}
          <div className="lg:col-span-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium mb-6">
              <Zap className="h-3 w-3" /> AI-Powered Regulatory Intelligence
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold font-heading leading-[1.1] mb-6">
              Stay Ahead of Every<br />
              <span className="text-[#D4AF37]">Regulatory Change</span>
            </h1>
            <p className="text-lg text-white/60 mb-8 leading-relaxed max-w-xl">
              Upload regulatory documents, ask AI questions with citations, track obligation deadlines,
              and get proactive alerts when regulations change — across 40+ global regulators.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {["AML/CFT", "Financial Crime", "Sanctions", "KYC/CDD", "Fraud Detection", "Consumer Protection"].map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/50">{tag}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-[#D4AF37] text-[#001D51] hover:bg-[#c9a432] font-semibold px-8" onClick={() => scrollToAuth("register")}>
                Start 14-Day Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10 px-8" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
                View Pricing
              </Button>
            </div>
          </div>

          {/* Right: Auth Card — 2 cols */}
          <div className="lg:col-span-2" ref={authRef}>
            <Card className="bg-white/[0.06] border-white/10 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-6">
                {mode === "login" && (
                  <>
                    <h2 className="text-xl font-semibold mb-1 font-heading">Sign In</h2>
                    <p className="text-sm text-white/50 mb-5">Access your regulatory platform</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <Label className="text-white/70 text-xs">Email</Label>
                        <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20" />
                      </div>
                      <div>
                        <Label className="text-white/70 text-xs">Password</Label>
                        <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20" />
                      </div>
                      <Button type="submit" className="w-full bg-[#D4AF37] text-[#001D51] hover:bg-[#c9a432] font-semibold h-11" disabled={isSubmitting}>
                        {isSubmitting ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                    <div className="my-4 relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div><div className="relative flex justify-center text-xs"><span className="px-2 text-white/30 bg-[#001D51]">or</span></div></div>
                    <a href="/api/auth/google" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-white/20 rounded-md text-sm text-white/70 hover:bg-white/10 transition"><GoogleIcon /> Continue with Google</a>
                    <div className="mt-4 flex justify-between text-xs">
                      <button type="button" onClick={() => setMode("forgot")} className="text-[#D4AF37] hover:underline">Forgot password?</button>
                      <button type="button" onClick={() => setMode("register")} className="text-[#D4AF37] hover:underline">Create account</button>
                    </div>
                  </>
                )}

                {mode === "register" && (
                  <>
                    <h2 className="text-xl font-semibold mb-1 font-heading">Create Account</h2>
                    <p className="text-sm text-white/50 mb-5">Start your 14-day free trial — no credit card required</p>
                    <form onSubmit={handleRegister} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-white/70 text-xs">First Name</Label><Input placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#D4AF37]/50" /></div>
                        <div><Label className="text-white/70 text-xs">Last Name</Label><Input placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#D4AF37]/50" /></div>
                      </div>
                      <div><Label className="text-white/70 text-xs">Email</Label><Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#D4AF37]/50" /></div>
                      <div><Label className="text-white/70 text-xs">Password</Label><Input type="password" placeholder="8+ characters" value={password} onChange={e => setPassword(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#D4AF37]/50" /></div>
                      <Button type="submit" className="w-full bg-[#D4AF37] text-[#001D51] hover:bg-[#c9a432] font-semibold h-11" disabled={isSubmitting}>
                        {isSubmitting ? "Creating account..." : "Start Free Trial"}
                      </Button>
                    </form>
                    <div className="my-4 relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div><div className="relative flex justify-center text-xs"><span className="px-2 text-white/30 bg-[#001D51]">or</span></div></div>
                    <a href="/api/auth/google" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-white/20 rounded-md text-sm text-white/70 hover:bg-white/10 transition"><GoogleIcon /> Continue with Google</a>
                    <p className="mt-4 text-center text-xs text-white/40">Already have an account? <button type="button" onClick={() => setMode("login")} className="text-[#D4AF37] hover:underline">Sign in</button></p>
                  </>
                )}

                {mode === "forgot" && (
                  <>
                    <h2 className="text-xl font-semibold mb-1 font-heading">Reset Password</h2>
                    <p className="text-sm text-white/50 mb-5">We'll email you a reset link</p>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div><Label className="text-white/70 text-xs">Email</Label><Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#D4AF37]/50" /></div>
                      <Button type="submit" className="w-full bg-[#D4AF37] text-[#001D51] hover:bg-[#c9a432] font-semibold h-11" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send Reset Link"}</Button>
                    </form>
                    <p className="mt-4 text-center text-xs text-white/40"><button type="button" onClick={() => setMode("login")} className="text-[#D4AF37] hover:underline">Back to Sign In</button></p>
                  </>
                )}

                {mode === "reset" && (
                  <>
                    <h2 className="text-xl font-semibold mb-1 font-heading">Set New Password</h2>
                    <p className="text-sm text-white/50 mb-5">Choose a new password for your account</p>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div><Label className="text-white/70 text-xs">New Password</Label><Input type="password" placeholder="8+ characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={isSubmitting} className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#D4AF37]/50" /></div>
                      <Button type="submit" className="w-full bg-[#D4AF37] text-[#001D51] hover:bg-[#c9a432] font-semibold h-11" disabled={isSubmitting}>{isSubmitting ? "Resetting..." : "Reset Password"}</Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Capabilities ─── */}
      <section className="bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-heading mb-3">Built for Compliance Teams</h2>
            <p className="text-white/50 max-w-2xl mx-auto">Every feature a regulatory compliance officer needs — from document ingestion to obligation tracking — in one platform.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Library, title: "Document Library", desc: "Upload PDFs, DOCX, HTML. AI extracts metadata, classifies, and indexes automatically.", color: "from-blue-500/20 to-blue-600/5" },
              { icon: Sparkles, title: "AI Query Engine", desc: "Ask natural-language questions. Get answers with source citations and confidence scores.", color: "from-[#D4AF37]/20 to-[#D4AF37]/5" },
              { icon: FileText, title: "Regulatory Console", desc: "Paste a regulator URL. AI reads, summarizes, and extracts key points in seconds.", color: "from-violet-500/20 to-violet-600/5" },
              { icon: GitCompare, title: "Document Diff", desc: "Compare two regulation versions. See additions, removals, amendments, and impact scores.", color: "from-cyan-500/20 to-cyan-600/5" },
              { icon: ClipboardCheck, title: "Obligations", desc: "AI extracts obligations by area (KYC, Sanctions, Reporting) with actors and penalties.", color: "from-amber-500/20 to-amber-600/5" },
              { icon: CalendarClock, title: "Deadline Tracker", desc: "Dashboard of upcoming compliance deadlines. Overdue, this week, this month — at a glance.", color: "from-red-500/20 to-red-600/5" },
              { icon: Bell, title: "Automated Alerts", desc: "Monitor 40+ regulators. Get email notifications when relevant publications appear.", color: "from-[#E4ADB2]/20 to-[#E4ADB2]/5" },
              { icon: Shield, title: "Audit Trail", desc: "Every AI decision logged. Full transparency for regulators and internal audit.", color: "from-emerald-500/20 to-emerald-600/5" },
            ].map(f => (
              <div key={f.title} className={`p-5 rounded-xl bg-gradient-to-br ${f.color} border border-white/[0.06] hover:border-[#D4AF37]/20 transition-all duration-300 group`}>
                <f.icon className="h-7 w-7 text-white/80 mb-3 group-hover:text-[#D4AF37] transition-colors" />
                <h3 className="font-semibold text-sm mb-1.5 text-white/90">{f.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Global Coverage ─── */}
      <section className="max-w-6xl mx-auto px-4 lg:px-6 py-16">
        <div className="p-8 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-white/[0.06]">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Globe className="h-10 w-10 text-emerald-400 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold font-heading mb-2">40+ Regulators. 17 Jurisdictions.</h3>
              <p className="text-sm text-white/50 mb-5">Automated monitoring across FinCEN, FCA, MAS, AUSTRAC, RBI, FATF, and more. Daily, weekly, or monthly cadence.</p>
              <div className="flex flex-wrap gap-2">
                {["US", "UK", "EU", "India", "Singapore", "Hong Kong", "UAE", "Australia", "Malaysia", "Thailand", "FATF", "BIS"].map(r => (
                  <span key={r} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/50">{r}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-heading mb-3">Simple, Transparent Pricing</h2>
            <p className="text-white/50">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Free Trial */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider mb-2">Free Trial</p>
              <div className="flex items-baseline gap-1 mb-1"><span className="text-4xl font-bold">$0</span></div>
              <p className="text-sm text-white/40 mb-6">14 days · All features · No credit card</p>
              <Button className="w-full bg-white/10 text-white hover:bg-white/20 font-semibold" onClick={() => scrollToAuth("register")}>Start Free Trial</Button>
              <ul className="mt-6 space-y-2.5">
                {["Full platform access", "All AI features included", "No credit card required"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/50"><Check className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />{f}</li>
                ))}
              </ul>
            </div>

            {/* Professional */}
            <div className="p-6 rounded-2xl bg-[#D4AF37]/[0.08] border-2 border-[#D4AF37]/30 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#D4AF37] text-[#001D51] rounded-full text-xs font-bold">Most Popular</div>
              <p className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider mb-2">Professional</p>
              <div className="flex items-baseline gap-1 mb-1"><span className="text-4xl font-bold">$199</span><span className="text-white/40 text-sm">/mo</span></div>
              <p className="text-xs text-[#D4AF37]">or $1,990/year — save $398</p>
              <p className="text-sm text-white/40 mb-6 mt-1">For compliance professionals</p>
              <Button className="w-full bg-[#D4AF37] text-[#001D51] hover:bg-[#c9a432] font-semibold" onClick={() => scrollToAuth("register")}>Get Started</Button>
              <ul className="mt-6 space-y-2.5">
                {["Unlimited regulatory documents", "AI Q&A with citations", "Regulatory change tracking", "Obligation extraction", "Automated alert monitoring", "Deadline dashboard", "Priority support"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/50"><Check className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />{f}</li>
                ))}
              </ul>
            </div>

            {/* Institutional */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider mb-2">Institutional</p>
              <div className="flex items-baseline gap-1 mb-1"><span className="text-4xl font-bold">Custom</span></div>
              <p className="text-sm text-white/40 mb-6">For teams and enterprises</p>
              <a href="mailto:hello@darkstreet.org"><Button variant="outline" className="w-full border-white/20 text-white bg-transparent hover:bg-white/10 font-semibold"><Mail className="mr-2 h-4 w-4" />Contact Sales</Button></a>
              <ul className="mt-6 space-y-2.5">
                {["Multi-user access & roles", "Organization document sharing", "Custom integrations & API", "Dedicated account manager", "Custom SLAs"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/50"><Check className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="max-w-6xl mx-auto px-4 lg:px-6 py-20">
        <h2 className="text-3xl font-bold font-heading text-center mb-12">How It Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { step: "1", title: "Upload Documents", desc: "PDF, DOCX, or HTML from any regulator worldwide" },
            { step: "2", title: "Configure Alerts", desc: "Choose jurisdictions, regulators, and scan cadence" },
            { step: "3", title: "Ask Questions", desc: "Query your corpus — AI returns answers with citations" },
            { step: "4", title: "Track Deadlines", desc: "Obligations with deadlines, penalties, and impact scores" },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="w-12 h-12 bg-[#D4AF37] text-[#001D51] rounded-2xl flex items-center justify-center text-lg font-bold mx-auto mb-4">{s.step}</div>
              <p className="font-semibold text-sm mb-1">{s.title}</p>
              <p className="text-xs text-white/40">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <span className="text-lg font-bold font-heading">RegIntel</span>
            <div className="flex items-center gap-6 text-xs text-white/40">
              <a href="mailto:hello@darkstreet.org" className="hover:text-[#D4AF37] transition flex items-center gap-1"><Mail className="h-3 w-3" /> hello@darkstreet.org</a>
              <a href="https://darkstreet.tech" target="_blank" rel="noopener" className="hover:text-[#D4AF37] transition">darkstreet.tech</a>
            </div>
          </div>
          <p className="text-center text-[11px] text-white/20">© {new Date().getFullYear()} Dark Street Tech. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
