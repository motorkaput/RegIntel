import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function SimpleLogin() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; name?: string }) => {
      const response = await apiRequest("/api/auth/login", "POST", data);
      return await response.json();
    },
    onSuccess: () => {
      // Force refresh the auth state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Add a small delay to ensure the session is properly set
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      }, 100);
      toast({
        title: "Welcome!",
        description: "You've been logged in successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate({ email, name });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to Dark Street Tech
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Enter your email to access Fetch Patterns beta.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div>
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button 
            onClick={handleLogin}
            disabled={loginMutation.isPending}
            className="w-full bg-gray-800 hover:bg-gray-900"
          >
            {loginMutation.isPending ? "Signing in..." : "Get Beta Access"}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Beta access only. Contact hello@darkstreet.org for invitations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}