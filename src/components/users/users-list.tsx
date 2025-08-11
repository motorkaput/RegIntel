'use client';

import { useEffect, useState } from 'react';
import { ServerSession } from '@/lib/auth/session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getRoleDisplayName } from '@/lib/auth/rbac';
import { Mail, User, MoreHorizontal } from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  email_verified: boolean;
  created_at: string;
}

interface UsersListProps {
  session: ServerSession;
}

export function UsersList({ session }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        } else {
          setError('Failed to load users');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="h-3 bg-gray-300 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Mock data for demonstration since the API endpoint doesn't exist yet
  const mockUsers: User[] = [
    {
      id: session.userId,
      email: session.email,
      first_name: 'Current',
      last_name: 'User',
      role: session.role,
      email_verified: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'project_lead',
      email_verified: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      email: 'jane.smith@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'team_member',
      email_verified: true,
      created_at: new Date().toISOString(),
    },
  ];

  const displayUsers = users.length > 0 ? users : mockUsers;

  return (
    <div className="space-y-4">
      {displayUsers.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            
            <div>
              <div className="font-medium text-gray-900">
                {user.first_name} {user.last_name}
                {user.id === session.userId && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    You
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{user.email}</span>
                {user.email_verified && (
                  <Badge variant="outline" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary">
                  {getRoleDisplayName(user.role as any)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Mail className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {displayUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p>No users found in your organization</p>
        </div>
      )}
    </div>
  );
}