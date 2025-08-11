import { ReactNode } from 'react';
import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { HeaderApp } from '@/components/layout/header-app';
import { FooterCompany } from '@/components/layout/footer-company';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderApp session={session} />
      <main className="pt-16">
        {children}
      </main>
      <FooterCompany />
    </div>
  );
}