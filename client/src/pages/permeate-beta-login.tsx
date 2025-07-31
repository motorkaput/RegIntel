import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import permeateIcon from "@assets/PerMeaTeEnterprise_Icon_1752664675820.png";

export default function PerMeateBetaLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Cryptic hash for password
  const BETA_PASSWORD = "7c2f5a1d8b4e9c6f3a0d2b5e8c1f4a7b";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Define user credentials and types
    const validUsers = {
      "OnboardingExpertUser": {
        password: "7c2f5a1d8b4e9c6f3a0d2b5e8c1f4a7b",
        userType: "administrator",
        name: "Onboarding Expert User",
        employeeId: "ADM001"
      },
      "ProjectLeader": {
        password: "pl_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
        userType: "project_leader", 
        name: "John Smith",
        employeeId: "EMP001"
      },
      "TeamMember": {
        password: "tm_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4",
        userType: "team_member",
        name: "Sarah Johnson", 
        employeeId: "EMP002"
      },
      "OrgLeader": {
        password: "ol_z3x1c5v7b9n2m4k6j8h0g2f4d6s8a0q2",
        userType: "organization_leader",
        name: "Michael Brown",
        employeeId: "EMP003"
      }
    };

    const user = validUsers[username as keyof typeof validUsers];
    
    if (user && password === user.password) {
      sessionStorage.setItem("perMeateBetaAuth", "true");
      sessionStorage.setItem("perMeateCurrentUser", JSON.stringify({
        username,
        userType: user.userType,
        name: user.name,
        employeeId: user.employeeId
      }));
      setLocation("/z9m3k/pe-workspace");
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid username or password",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  // Custom PerMeaTe Navbar Component
  const PerMeaTeNavbar = () => (
    <nav className="nav-minimal fixed top-0 left-0 right-0 z-50 backdrop-blur-sm section-divider">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          <div className="flex items-center space-x-3">
            <img src={permeateIcon} alt="PerMeaTe Enterprise" className="h-10 w-10" />
            <span className="text-xl font-bold text-gray-900">PerMeaTe Enterprise</span>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface-white">
      <PerMeaTeNavbar />
      
      <main className="pt-24 pb-12">
        <div className="max-w-md mx-auto px-4">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">
                PerMeaTe Enterprise Beta Access
              </CardTitle>
              <p className="text-gray-600 text-sm mt-2">
                Enter your credentials to access PerMeaTe Enterprise
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