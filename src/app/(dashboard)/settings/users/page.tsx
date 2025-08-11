import { getServerSession } from '@/lib/auth/session';
import { canInviteUsers } from '@/lib/auth/rbac';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail } from 'lucide-react';
import { InviteUserForm } from '@/components/forms/invite-user-form';
import { UsersList } from '@/components/users/users-list';

export default async function UsersPage() {
  const session = await getServerSession();

  if (!session) {
    return null; // Layout will handle redirect
  }

  const canInvite = canInviteUsers(session.role as any);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage team members and their roles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invite Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite User
              </CardTitle>
              <CardDescription>
                Send an invitation to join your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canInvite ? (
                <InviteUserForm />
              ) : (
                <div className="text-center py-4">
                  <Badge variant="secondary" className="mb-2">
                    Insufficient Permissions
                  </Badge>
                  <p className="text-sm text-gray-600">
                    Only administrators and organization leaders can invite users.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Current users in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersList session={session} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}