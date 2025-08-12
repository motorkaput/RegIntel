import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, MoreVertical, Mail, Key, Ban } from "lucide-react";

export default function UsersManagement() {
  // Mock data for demonstration
  const users = [
    {
      id: 1,
      name: "Admin User",
      email: "admin@democo.com",
      role: "admin",
      status: "active",
      lastLogin: "2024-08-12",
    },
    {
      id: 2,
      name: "John Smith",
      email: "john@democo.com",
      role: "project_lead",
      status: "invited",
      lastLogin: null,
    },
    {
      id: 3,
      name: "Jane Doe",
      email: "jane@democo.com",
      role: "team_member",
      status: "pending",
      lastLogin: "2024-08-10",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-900 text-green-300">Active</Badge>;
      case "invited":
        return <Badge className="bg-blue-900 text-blue-300">Invited</Badge>;
      case "pending":
        return <Badge className="bg-yellow-900 text-yellow-300">Pending</Badge>;
      default:
        return <Badge className="bg-slate-900 text-slate-300">Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: "bg-red-900 text-red-300",
      project_lead: "bg-purple-900 text-purple-300",
      team_member: "bg-blue-900 text-blue-300",
      org_leader: "bg-orange-900 text-orange-300",
    };
    
    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || "bg-slate-900 text-slate-300"}>
        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Users & Permissions</h1>
            <p className="text-slate-400">Manage team members, roles, and access permissions</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-invite-user">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Users
          </Button>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Team Members</CardTitle>
            <CardDescription className="text-slate-400">
              Manage user access, roles, and permissions for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Name</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Role</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Last Login</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-slate-700">
                    <TableCell className="text-white font-medium">{user.name}</TableCell>
                    <TableCell className="text-slate-300">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-slate-300">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                          data-testid={`button-resend-invite-${user.id}`}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                          data-testid={`button-generate-password-${user.id}`}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                          data-testid={`button-revoke-access-${user.id}`}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                          data-testid={`button-more-actions-${user.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Additional Cards for Bulk Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Bulk Invitations</CardTitle>
              <CardDescription className="text-slate-400">
                Upload a CSV file to invite multiple users at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="border-slate-600 text-slate-300" data-testid="button-bulk-invite">
                Upload CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Access Controls</CardTitle>
              <CardDescription className="text-slate-400">
                Configure role permissions and access policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="border-slate-600 text-slate-300" data-testid="button-configure-roles">
                Configure Roles
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}