import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Building2, Loader2 } from 'lucide-react';

export default function PerMeaTeRegisterPage() {
  const [formData, setFormData] = useState({
    tenant_name: '',
    domain: '',
    admin_email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    bootstrap_token: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/permeate/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_name: formData.tenant_name,
          domain: formData.domain,
          admin_email: formData.admin_email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          bootstrap_token: formData.bootstrap_token,
        }),
      });

      if (response.ok) {
        setLocation('/permeate-dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Building2 className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">PerMeaTe Enterprise</h1>
          <p className="text-gray-600 mt-2">Create your organization</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Set up your organization and admin account
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Organization Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Organization Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="tenant_name" className="text-sm font-medium">
                      Organization Name
                    </label>
                    <Input
                      id="tenant_name"
                      name="tenant_name"
                      placeholder="Acme Corp"
                      value={formData.tenant_name}
                      onChange={handleChange}
                      required
                      data-testid="input-tenant-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="domain" className="text-sm font-medium">
                      Domain
                    </label>
                    <Input
                      id="domain"
                      name="domain"
                      placeholder="acme"
                      value={formData.domain}
                      onChange={handleChange}
                      pattern="[a-z0-9-]+"
                      title="Only lowercase letters, numbers, and hyphens allowed"
                      required
                      data-testid="input-domain"
                    />
                  </div>
                </div>
              </div>

              {/* Admin User Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Administrator Account</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="first_name" className="text-sm font-medium">
                      First Name
                    </label>
                    <Input
                      id="first_name"
                      name="first_name"
                      placeholder="John"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      data-testid="input-first-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="last_name" className="text-sm font-medium">
                      Last Name
                    </label>
                    <Input
                      id="last_name"
                      name="last_name"
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="admin_email" className="text-sm font-medium">
                    Admin Email
                  </label>
                  <Input
                    id="admin_email"
                    name="admin_email"
                    type="email"
                    placeholder="admin@acme.com"
                    value={formData.admin_email}
                    onChange={handleChange}
                    required
                    data-testid="input-admin-email"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      minLength={8}
                      required
                      data-testid="input-password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Repeat password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      minLength={8}
                      required
                      data-testid="input-confirm-password"
                    />
                  </div>
                </div>
              </div>

              {/* Bootstrap Token */}
              <div className="space-y-2">
                <label htmlFor="bootstrap_token" className="text-sm font-medium">
                  Bootstrap Token
                </label>
                <Input
                  id="bootstrap_token"
                  name="bootstrap_token"
                  type="password"
                  placeholder="Enter bootstrap token"
                  value={formData.bootstrap_token}
                  onChange={handleChange}
                  required
                  data-testid="input-bootstrap-token"
                />
                <p className="text-xs text-gray-500">
                  Use: bootstrap-dev-token-2024 (development only)
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-register"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating organization...
                  </>
                ) : (
                  'Create organization'
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setLocation('/permeate-login')}
                  className="text-blue-600 hover:underline"
                >
                  Sign in here
                </button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}