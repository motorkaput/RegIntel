import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";

export default function Beta2Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Credentials for Beta2 Fetch Patterns
  const BETA2_PASSWORD = "9f4e7d2a8b1c5e3f6a0d7b9c2e4f8a1b";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple validation for Beta2 version
    if (username === "BetaUser2" && password === BETA2_PASSWORD) {
      // Set session storage to remember auth
      sessionStorage.setItem("beta2Auth", "true");
      setLocation("/h5p2m/fp-beta2");
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid username or password for Fetch Patterns Beta2",
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
                Beta2 Access
              </CardTitle>
              <p className="text-gray-600 text-sm mt-2">
                Enter your credentials to access Fetch Patterns (Beta2 Version)
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "Authenticating..." : "Access Beta2"}
                </Button>
              </form>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Demo Credentials:</strong><br />
                  Username: BetaUser2<br />
                  Password: 9f4e7d2a8b1c5e3f6a0d7b9c2e4f8a1b
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}