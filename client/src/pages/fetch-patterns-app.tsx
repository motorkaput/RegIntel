import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function FetchPatternsApp() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access Fetch Patterns.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue mx-auto"></div>
          <p className="text-secondary">Loading Fetch Patterns...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-surface-white">
      {/* Fetch Patterns SaaS Application will be integrated here */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-light text-primary">Fetch Patterns</h1>
          <p className="text-secondary">SaaS application integration in progress...</p>
          <div className="bg-surface-light p-8 rounded-lg">
            <p className="text-sm text-secondary">
              This is where the Fetch Patterns SaaS application will be integrated once the repository access is configured.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}