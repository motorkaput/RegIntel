import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import fetchPatternsIcon from "@assets/FetchPatterns_Icon_1752663550310_1753148786989.png";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

export default function FetchPatternsOpenLogin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: ''
  });
  
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  // Enhanced pastel color palette
  const pastelColors = {
    primary: '#6366f1', // Soft indigo
    secondary: '#ec4899', // Soft pink
    accent: '#10b981', // Soft emerald
    background: '#f1f5f9', // Light grey background
    surface: '#ffffff',
    muted: '#f8fafc', // Soft gray
    border: '#e2e8f0',
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      muted: '#94a3b8'
    }
  };

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginForm) => {
      const response = await apiRequest('/api/fetch-patterns-open/login', 'POST', credentials);
      return response as unknown as { id: string; email: string; displayName: string };
    },
    onSuccess: (userData) => {
      console.log('Login successful, session created:', userData);
      toast({
        title: "Welcome back!",
        description: `Hello ${userData.displayName}, you're now logged in.`,
      });
      setLocation('/fetch-patterns-open');
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterForm) => {
      if (userData.password !== userData.confirmPassword) {
        throw new Error("Passwords don't match");
      }
      const response = await apiRequest('/api/fetch-patterns-open/register', 'POST', {
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName
      });
      return response as unknown as { id: string; email: string; displayName: string };
    },
    onSuccess: (userData) => {
      console.log('Registration successful, session created:', userData);
      toast({
        title: "Account created!",
        description: `Welcome ${userData.displayName}, your account has been created successfully.`,
      });
      setLocation('/fetch-patterns-open');
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again with different credentials.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerForm);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: pastelColors.background }}>
      <Navbar />
      
      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <img src={fetchPatternsIcon} alt="Fetch Patterns" className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold" style={{ color: pastelColors.text.primary }}>
              Fetch Patterns
            </h1>
            <p className="text-lg" style={{ color: pastelColors.text.secondary }}>
              Sign in to start analyzing your documents
            </p>
          </div>

          <Card style={{ backgroundColor: pastelColors.surface, borderColor: pastelColors.border }}>
            <CardHeader>
              <CardTitle style={{ color: pastelColors.text.primary }}>
                Access Your Account
              </CardTitle>
              <CardDescription>
                Sign in to your existing account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Create Account</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" style={{ color: pastelColors.primary }} />
                        <span>Email Address</span>
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        data-testid="input-login-email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="flex items-center space-x-2">
                        <Lock className="w-4 h-4" style={{ color: pastelColors.primary }} />
                        <span>Password</span>
                      </Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                        data-testid="input-login-password"
                      />
                    </div>
                    
                    <Button 
                      type="submit"
                      className="w-full flex items-center justify-center space-x-2"
                      disabled={loginMutation.isPending}
                      style={{ backgroundColor: pastelColors.primary }}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? (
                        <span>Signing in...</span>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="flex items-center space-x-2">
                        <User className="w-4 h-4" style={{ color: pastelColors.primary }} />
                        <span>Display Name</span>
                      </Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Your full name"
                        value={registerForm.displayName}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, displayName: e.target.value }))}
                        required
                        data-testid="input-register-name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" style={{ color: pastelColors.primary }} />
                        <span>Email Address</span>
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        data-testid="input-register-email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="flex items-center space-x-2">
                        <Lock className="w-4 h-4" style={{ color: pastelColors.primary }} />
                        <span>Password</span>
                      </Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                        data-testid="input-register-password"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">
                        Confirm Password
                      </Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                        data-testid="input-register-confirm-password"
                      />
                    </div>
                    
                    <Button 
                      type="submit"
                      className="w-full flex items-center justify-center space-x-2"
                      disabled={registerMutation.isPending}
                      style={{ backgroundColor: pastelColors.accent }}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? (
                        <span>Creating account...</span>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-sm" style={{ color: pastelColors.text.muted }}>
              By signing up, you agree to our terms of service and privacy policy.
            </p>
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/fetch-patterns')}
              className="mt-4"
              style={{ color: pastelColors.primary }}
            >
              ← Back to Fetch Patterns Info
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}