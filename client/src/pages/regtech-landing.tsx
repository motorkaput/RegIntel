import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function RegTechLanding() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/regtech/console");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: "Password Required", description: "Please enter your password.", variant: "destructive" });
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await apiRequest("/api/auth/login", "POST", { email, password });
      const userData = await response.json();
      queryClient.setQueryData(["/api/auth/me"], userData);
      toast({ title: "Welcome!", description: "You've been logged in successfully." });
      setLocation("/regtech/console");
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message || "Invalid credentials.", variant: "destructive" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName) {
      toast({ title: "Name Required", description: "Please enter your first and last name.", variant: "destructive" });
      return;
    }
    if (!email || !email.includes("@")) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (!password || password.length < 8) {
      toast({ title: "Password Too Short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await apiRequest("/api/auth/register", "POST", { email, password, firstName, lastName });
      const userData = await response.json();
      queryClient.setQueryData(["/api/auth/me"], userData);
      toast({ title: "Account Created", description: "Welcome to RegIntel!" });
      setLocation("/regtech/console");
    } catch (error: any) {
      toast({ title: "Registration Failed", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ds-bg)" }}>
        <div className="text-center">
          <div
            className="h-10 w-10 rounded-md flex items-center justify-center mx-auto mb-3"
            style={{ background: "var(--ds-gold)" }}
          >
            <span className="text-sm font-bold" style={{ color: "var(--ds-imperial)" }}>R</span>
          </div>
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)" }}>
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card
          className="w-full max-w-[420px] border"
          style={{
            background: "var(--ds-surface)",
            borderColor: "var(--ds-border)",
            borderRadius: "var(--ds-radius-lg)",
            boxShadow: "var(--ds-shadow-md)",
          }}
        >
          <CardContent className="p-10">
            {/* Brand */}
            <div className="text-center mb-8">
              <div
                className="h-12 w-12 rounded-md flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--ds-gold)" }}
              >
                <span className="text-lg font-bold" style={{ color: "var(--ds-imperial)" }}>R</span>
              </div>
              <h1 className="brand-name text-2xl" style={{ color: "var(--ds-text)" }}>
                RegIntel
              </h1>
              <p className="text-[13px] mt-1" style={{ color: "var(--ds-text-secondary)" }}>
                AI-powered regulatory intelligence platform
              </p>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <a href="/api/auth/google" className="block">
                <Button
                  variant="outline"
                  className="w-full h-10 text-[13px] font-medium gap-3"
                  style={{ borderColor: "var(--ds-border)", color: "var(--ds-text)" }}
                  type="button"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>
              </a>
              <a href="/api/auth/microsoft" className="block">
                <Button
                  variant="outline"
                  className="w-full h-10 text-[13px] font-medium gap-3"
                  style={{ borderColor: "var(--ds-border)", color: "var(--ds-text)" }}
                  type="button"
                >
                  <svg className="h-4 w-4" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                  Continue with Microsoft
                </Button>
              </a>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px" style={{ background: "var(--ds-border)" }} />
              <span className="text-[12px] font-medium" style={{ color: "var(--ds-text-muted)" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "var(--ds-border)" }} />
            </div>

            {/* Email/Password Form */}
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-[12px] font-medium" style={{ color: "var(--ds-text-secondary)" }}>
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoggingIn}
                    className="mt-1.5 h-10"
                    style={{ borderColor: "var(--ds-border)" }}
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-[12px] font-medium" style={{ color: "var(--ds-text-secondary)" }}>
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoggingIn}
                    className="mt-1.5 h-10"
                    style={{ borderColor: "var(--ds-border)" }}
                    data-testid="input-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-10 text-[13px] font-semibold"
                  disabled={isLoggingIn}
                  style={{ background: "var(--ds-imperial)", color: "white" }}
                  data-testid="button-login"
                >
                  {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
                <p className="text-center text-[13px]" style={{ color: "var(--ds-text-secondary)" }}>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="font-medium underline-offset-2 hover:underline"
                    style={{ color: "var(--ds-gold)" }}
                  >
                    Create account
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName" className="text-[12px] font-medium" style={{ color: "var(--ds-text-secondary)" }}>
                      First name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isLoggingIn}
                      className="mt-1.5 h-10"
                      style={{ borderColor: "var(--ds-border)" }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-[12px] font-medium" style={{ color: "var(--ds-text-secondary)" }}>
                      Last name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isLoggingIn}
                      className="mt-1.5 h-10"
                      style={{ borderColor: "var(--ds-border)" }}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reg-email" className="text-[12px] font-medium" style={{ color: "var(--ds-text-secondary)" }}>
                    Email
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoggingIn}
                    className="mt-1.5 h-10"
                    style={{ borderColor: "var(--ds-border)" }}
                  />
                </div>
                <div>
                  <Label htmlFor="reg-password" className="text-[12px] font-medium" style={{ color: "var(--ds-text-secondary)" }}>
                    Password
                  </Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoggingIn}
                    className="mt-1.5 h-10"
                    style={{ borderColor: "var(--ds-border)" }}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-10 text-[13px] font-semibold"
                  disabled={isLoggingIn}
                  style={{ background: "var(--ds-imperial)", color: "white" }}
                >
                  {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
                <p className="text-center text-[13px]" style={{ color: "var(--ds-text-secondary)" }}>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-medium underline-offset-2 hover:underline"
                    style={{ color: "var(--ds-gold)" }}
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Links */}
      <footer className="py-6 text-center">
        <div className="flex items-center justify-center gap-4 mb-3 text-[12px]" style={{ color: "var(--ds-text-muted)" }}>
          <a href="/terms" className="hover:underline" style={{ color: "var(--ds-text-muted)" }}>Terms</a>
          <a href="/privacy" className="hover:underline" style={{ color: "var(--ds-text-muted)" }}>Privacy</a>
          <a href="/contact" className="hover:underline" style={{ color: "var(--ds-text-muted)" }}>Contact</a>
        </div>
        <p className="text-[11px]" style={{ color: "var(--ds-text-muted)" }}>Dark Street Tech</p>
      </footer>
    </div>
  );
}
