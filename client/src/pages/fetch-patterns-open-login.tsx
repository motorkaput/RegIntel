import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Simple login page that redirects to Replit Auth
export default function FetchPatternsOpenLogin() {
  const handleLogin = () => {
    window.location.href = '/api/login?returnTo=/fetch-patterns-open';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-purple-700">
            Fetch Patterns Open Beta
          </CardTitle>
          <CardDescription>
            Sign in to access advanced AI document analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleLogin}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Sign in with Replit
          </Button>
          <p className="text-sm text-center text-gray-600 mt-4">
            Secure authentication powered by Replit
          </p>
        </CardContent>
      </Card>
    </div>
  );
}