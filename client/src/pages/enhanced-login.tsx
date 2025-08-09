import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";

export default function EnhancedLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Credentials for enhanced Fetch Patterns
  const ENHANCED_PASSWORD = "e7n9h2a5n8c3e1d6f4p9a2t7t5e0r3n8";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple validation for enhanced version
    if (username === "EnhancedUser" && password === ENHANCED_PASSWORD) {
      // Set session storage to remember auth
      sessionStorage.setItem("enhancedAuth", "true");
      setLocation("/q4w8r/fp-enhanced");
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid username or password for Fetch Patterns Enhanced",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #A0D2E8 0%, #E5EAF5 25%, #D3B0F4 50%, #A45BB3 75%, #49405F 100%)'
    }}>
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="max-w-md mx-auto px-4">
          <Card className="backdrop-blur-sm border-2" style={{
            backgroundColor: 'rgba(229, 234, 245, 0.9)',
            borderColor: '#D3B0F4'
          }}>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold" style={{ color: '#49405F' }}>
                Enhanced Access
              </CardTitle>
              <p className="text-sm mt-2" style={{ color: '#A45BB3' }}>
                Enter your credentials to access Fetch Patterns Enhanced
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#49405F' }}>
                    Username
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full border-2"
                    style={{ 
                      borderColor: '#A0D2E8',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)'
                    }}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#49405F' }}>
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full border-2"
                    style={{ 
                      borderColor: '#A0D2E8',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)'
                    }}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #A45BB3 0%, #A0D2E8 100%)'
                  }}
                >
                  {isLoading ? "Signing In..." : "Access Enhanced Version"}
                </Button>
              </form>
              
              <div className="mt-6 pt-4 border-t text-center text-xs" style={{ 
                borderColor: '#D3B0F4',
                color: '#A45BB3' 
              }}>
                Fetch Patterns Enhanced - Minimal Color Scheme
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}