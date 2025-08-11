'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MagicLinkVerifyPage() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setError('Invalid magic link - missing parameters');
      setIsVerifying(false);
      return;
    }

    const verifyMagicLink = async () => {
      try {
        const response = await fetch('/api/auth/magic-link/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, email }),
        });

        if (response.ok) {
          setIsSuccess(true);
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          const data = await response.json();
          setError(data.error || 'Magic link verification failed');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyMagicLink();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PerMeaTe Enterprise</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {isVerifying && <Loader2 className="h-5 w-5 animate-spin" />}
              {isSuccess && <CheckCircle className="h-5 w-5 text-green-600" />}
              {error && <XCircle className="h-5 w-5 text-red-600" />}
              
              {isVerifying && 'Verifying magic link...'}
              {isSuccess && 'Success!'}
              {error && 'Verification failed'}
            </CardTitle>
            
            <CardDescription>
              {isVerifying && 'Please wait while we verify your magic link'}
              {isSuccess && 'You have been successfully signed in. Redirecting to dashboard...'}
              {error && 'There was a problem with your magic link'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isSuccess && (
              <Alert className="mb-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Welcome back! You will be redirected to your dashboard shortly.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => router.push('/login')}
                  className="w-full"
                  data-testid="button-back-to-login"
                >
                  Back to login
                </Button>
                
                <Button 
                  onClick={() => router.push('/magic-link')}
                  variant="outline"
                  className="w-full"
                  data-testid="button-request-new-link"
                >
                  Request new magic link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}