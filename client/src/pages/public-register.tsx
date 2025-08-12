import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Loader2, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RegisterData {
  company_name: string;
  domain: string;
  admin_email: string;
  password: string;
  first_name: string;
  last_name: string;
  bootstrap_token: string;
}

export default function PublicRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<RegisterData>({
    company_name: "",
    domain: "",
    admin_email: "",
    password: "",
    first_name: "",
    last_name: "",
    bootstrap_token: "",
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/tenants/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration successful",
        description: "Welcome to PerMeaTe Enterprise! Redirecting to your dashboard...",
      });
      
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.company_name || !formData.domain || !formData.admin_email || 
        !formData.password || !formData.first_name || !formData.last_name) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    // Check domain format (lowercase, alphanumeric, hyphens)
    const domainRegex = /^[a-z0-9-]+$/;
    if (!domainRegex.test(formData.domain)) {
      toast({
        title: "Invalid domain",
        description: "Domain must contain only lowercase letters, numbers, and hyphens",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5 text-slate-400" />
            <Building2 className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold text-white">PerMeaTe Enterprise</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-slate-900 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Create Your Organization</CardTitle>
            <CardDescription className="text-slate-400">
              Set up your PerMeaTe Enterprise workspace in minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
                  Company Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name" className="text-slate-300">Company Name *</Label>
                    <Input
                      id="company_name"
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange("company_name", e.target.value)}
                      placeholder="Acme Corporation"
                      className="bg-slate-800 border-slate-600 text-white"
                      data-testid="input-company-name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="domain" className="text-slate-300">Domain/Subdomain *</Label>
                    <Input
                      id="domain"
                      type="text"
                      value={formData.domain}
                      onChange={(e) => handleInputChange("domain", e.target.value.toLowerCase())}
                      placeholder="acme"
                      className="bg-slate-800 border-slate-600 text-white"
                      data-testid="input-domain"
                      required
                    />
                    <p className="text-xs text-slate-500">This will be your unique identifier</p>
                  </div>
                </div>
              </div>

              {/* Admin User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
                  Administrator Account
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-slate-300">First Name *</Label>
                    <Input
                      id="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                      placeholder="John"
                      className="bg-slate-800 border-slate-600 text-white"
                      data-testid="input-first-name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-slate-300">Last Name *</Label>
                    <Input
                      id="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                      placeholder="Doe"
                      className="bg-slate-800 border-slate-600 text-white"
                      data-testid="input-last-name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_email" className="text-slate-300">Email Address *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => handleInputChange("admin_email", e.target.value)}
                    placeholder="john@acme.com"
                    className="bg-slate-800 border-slate-600 text-white"
                    data-testid="input-email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-800 border-slate-600 text-white"
                    data-testid="input-password"
                    required
                  />
                  <p className="text-xs text-slate-500">Minimum 6 characters</p>
                </div>
              </div>

              {/* Bootstrap Token */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
                  Access Authorization
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="bootstrap_token" className="text-slate-300">Bootstrap Token</Label>
                  <Input
                    id="bootstrap_token"
                    type="text"
                    value={formData.bootstrap_token}
                    onChange={(e) => handleInputChange("bootstrap_token", e.target.value)}
                    placeholder="Enter your bootstrap token"
                    className="bg-slate-800 border-slate-600 text-white"
                    data-testid="input-bootstrap-token"
                  />
                  <p className="text-xs text-slate-500">
                    For development: use "bootstrap-dev-token-2024"
                  </p>
                </div>
              </div>

              {registerMutation.error && (
                <Alert className="border-red-600 bg-red-950/50">
                  <AlertDescription className="text-red-400">
                    {registerMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={registerMutation.isPending}
                data-testid="button-create-organization"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  "Create Organization"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400">
                Already have an account?{" "}
                <Link href="/permeate-login" className="text-blue-400 hover:text-blue-300">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}