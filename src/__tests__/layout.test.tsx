import { render, screen } from '@testing-library/react';
import HeaderCompany from '@/components/layout/HeaderCompany';
import HeaderApp from '@/components/layout/HeaderApp';
import FooterCompany from '@/components/layout/FooterCompany';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

describe('Layout Components', () => {
  describe('HeaderCompany', () => {
    it('renders and is sticky', () => {
      render(<HeaderCompany />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('sticky', 'top-0');
      
      // Check navigation items
      expect(screen.getByTestId('nav-products')).toBeInTheDocument();
      expect(screen.getByTestId('nav-whats-next')).toBeInTheDocument();
      expect(screen.getByTestId('nav-company')).toBeInTheDocument();
      expect(screen.getByTestId('nav-contact')).toBeInTheDocument();
    });

    it('renders Dark Street Tech logo', () => {
      render(<HeaderCompany />);
      expect(screen.getByText('Dark Street Tech')).toBeInTheDocument();
    });
  });

  describe('HeaderApp', () => {
    const mockUser = {
      first_name: 'John',
      last_name: 'Doe',
      role: 'admin',
    };

    it('renders and is sticky below company header', () => {
      render(<HeaderApp user={mockUser} />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('sticky', 'top-12');
    });

    it('renders all navigation items', () => {
      render(<HeaderApp user={mockUser} />);
      
      expect(screen.getByTestId('nav-start')).toBeInTheDocument();
      expect(screen.getByTestId('nav-analysis')).toBeInTheDocument();
      expect(screen.getByTestId('nav-breakdown')).toBeInTheDocument();
      expect(screen.getByTestId('nav-org-upload')).toBeInTheDocument();
      expect(screen.getByTestId('nav-auto-assignment')).toBeInTheDocument();
      expect(screen.getByTestId('nav-dashboards')).toBeInTheDocument();
      expect(screen.getByTestId('nav-admin')).toBeInTheDocument();
    });

    it('displays user information', () => {
      render(<HeaderApp user={mockUser} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('(admin)')).toBeInTheDocument();
    });

    it('renders logout button', () => {
      const mockLogout = jest.fn();
      render(<HeaderApp user={mockUser} onLogout={mockLogout} />);
      
      expect(screen.getByTestId('button-logout')).toBeInTheDocument();
    });
  });

  describe('FooterCompany', () => {
    it('renders with correct copyright text', () => {
      render(<FooterCompany />);
      
      expect(screen.getByText(/Copyright\. Dark Street\. All rights reserved\./)).toBeInTheDocument();
      expect(screen.getByTestId('footer-website')).toHaveAttribute('href', 'https://darkstreet.consulting');
    });

    it('renders skip-to-content link', () => {
      render(<FooterCompany />);
      
      expect(screen.getByTestId('skip-to-content')).toBeInTheDocument();
      expect(screen.getByTestId('skip-to-content')).toHaveAttribute('href', '#main-content');
    });

    it('renders product links', () => {
      render(<FooterCompany />);
      
      expect(screen.getByTestId('footer-fetch-patterns')).toBeInTheDocument();
      expect(screen.getByTestId('footer-permeate-enterprise')).toBeInTheDocument();
    });

    it('renders company information', () => {
      render(<FooterCompany />);
      
      expect(screen.getByText('Dark Street Tech')).toBeInTheDocument();
      expect(screen.getByText(/AI-powered solutions for enterprise/)).toBeInTheDocument();
    });
  });

  describe('Sticky Behavior', () => {
    it('ensures proper z-index layering', () => {
      const { container } = render(
        <>
          <HeaderCompany />
          <HeaderApp user={{ first_name: 'Test', last_name: 'User', role: 'admin' }} />
        </>
      );
      
      const companyHeader = container.querySelector('.z-50');
      const appHeader = container.querySelector('.z-40');
      
      expect(companyHeader).toBeInTheDocument();
      expect(appHeader).toBeInTheDocument();
    });
  });
});