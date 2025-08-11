'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HeaderCompany from '@/components/layout/HeaderCompany';
import HeaderApp from '@/components/layout/HeaderApp';
import FooterCompany from '@/components/layout/FooterCompany';

interface User {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  tenant: {
    id: string;
    name: string;
    domain: string;
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else if (response.status === 401) {
          router.push('/login');
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        data-testid="skip-to-content"
      >
        Skip to main content
      </a>

      {/* Two-tier sticky header */}
      <HeaderCompany />
      <HeaderApp user={user} onLogout={handleLogout} />

      {/* Main content */}
      <main id="main-content" className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <FooterCompany />
    </div>
  );
}