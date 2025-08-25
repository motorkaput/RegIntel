import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";

export default function BetaLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Credentials for original Fetch Patterns
  const ORIGINAL_PASSWORD = "9f4e7d2a8b1c5e3f6a0d7b9c2e4f8a1b";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple validation for original version
    if (username === "BetaUser" && password === ORIGINAL_PASSWORD) {
      // Set session storage to remember auth
      sessionStorage.setItem("betaAuth", "true");
      setLocation("/x7k9p/fp-analyzer");
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid username or password for Fetch Patterns Original",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-white">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="max-w-md mx-auto px-4">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Beta Access
              </CardTitle>
              <p className="text-gray-600 text-sm mt-2">
                Enter your credentials to access Fetch Patterns (Original Version)
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full"
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                >
                  {isLoading ? "Authenticating..." : "Access Beta"}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Beta access only. Contact hello@darkstreet.org for credentials.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}