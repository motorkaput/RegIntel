import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Trash2, KeyRound, Copy, RefreshCw, Building2, Plus, Users, ArrowLeft, Shield, Database, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RegTechLayout from "./layout";

const ROLE_OPTIONS = [
  { value: "cco", label: "Chief Compliance Officer (CCO)" },
  { value: "mlro", label: "MLRO" },
  { value: "financial_crime_head", label: "Financial Crime Head" },
  { value: "aml_ops", label: "AML Ops / Case Manager" },
  { value: "compliance_analyst", label: "Compliance Analyst" },
  { value: "business_analyst", label: "Business Analyst" },
];

const INDUSTRY_OPTIONS = [
  { value: "banking", label: "Banking" },
  { value: "insurance", label: "Insurance" },
  { value: "securities", label: "Securities" },
  { value: "fintech", label: "Fintech" },
  { value: "crypto", label: "Crypto / VASP" },
];

const generateSecurePassword = () => {
  const length = 12;
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const allChars = lowercase + uppercase + numbers + special;
  
  const getSecureRandom = (max: number) => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  };
  
  let password = "";
  password += lowercase[getSecureRandom(lowercase.length)];
  password += uppercase[getSecureRandom(uppercase.length)];
  password += numbers[getSecureRandom(numbers.length)];
  password += special[getSecureRandom(special.length)];
  
  for (let i = password.length; i < length; i++) {
    password += allChars[getSecureRandom(allChars.length)];
  }
  
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = getSecureRandom(i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }
  
  return passwordArray.join('');
};

export default function RegtechAdmin() {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: generateSecurePassword(),
    firstName: "",
    lastName: "",
    role: "",
    organizationId: ""
  });
  const [isCreateOrgDialogOpen, setIsCreateOrgDialogOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", industry: "", domain: "" });
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: currentUser, isLoading: loadingUser } = useQuery<{ id: string; email: string; isAdmin?: boolean; role?: string }>({
    queryKey: ['/api/auth/me'],
  });

  const { data: users, isLoading: loadingUsers } = useQuery<any[]>({
    queryKey: ['/api/regtech/admin/users'],
    enabled: currentUser?.isAdmin,
  });

  const { data: organizations, isLoading: loadingOrgs } = useQuery<any[]>({
    queryKey: ['/api/regtech/admin/organizations'],
    enabled: currentUser?.isAdmin,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const response = await apiRequest('/api/regtech/admin/users', 'POST', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/admin/users'] });
      setIsCreateDialogOpen(false);
      setNewUser({ email: "", password: generateSecurePassword(), firstName: "", lastName: "", role: "", organizationId: "" });
      toast({ title: "Success", description: "User created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create user", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(`/api/regtech/admin/users/${userId}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/admin/users'] });
      setDeleteUserId(null);
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete user", variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const response = await apiRequest(`/api/regtech/admin/users/${userId}/reset-password`, 'POST', { newPassword });
      return response.json();
    },
    onSuccess: () => {
      setResetPasswordUserId(null);
      setNewPassword("");
      toast({ title: "Success", description: "Password reset successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to reset password", variant: "destructive" });
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: async (orgData: typeof newOrg) => {
      const response = await apiRequest('/api/regtech/admin/organizations', 'POST', orgData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/admin/organizations'] });
      setIsCreateOrgDialogOpen(false);
      setNewOrg({ name: "", industry: "", domain: "" });
      toast({ title: "Success", description: "Organization created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create organization", variant: "destructive" });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const response = await apiRequest(`/api/regtech/admin/organizations/${orgId}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/admin/organizations'] });
      setDeleteOrgId(null);
      toast({ title: "Success", description: "Organization deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete organization", variant: "destructive" });
    },
  });

  const seedDocumentsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/regtech/admin/seed-documents', 'POST');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/documents'] });
      toast({ 
        title: "Success", 
        description: data.message || "Sample documents seeded successfully" 
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to seed documents", variant: "destructive" });
    },
  });

  if (loadingUser) {
    return (
      <RegTechLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-600">Loading...</p>
        </div>
      </RegTechLayout>
    );
  }

  if (!currentUser?.isAdmin) {
    return (
      <RegTechLayout>
        <div className="flex items-center justify-center h-64">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center max-w-md">
            <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-6">You need administrator privileges to access this page.</p>
            <Button onClick={() => setLocation("/regtech/console")} className="bg-slate-900 hover:bg-slate-800">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </RegTechLayout>
    );
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(newUser);
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    createOrgMutation.mutate(newOrg);
  };

  return (
    <RegTechLayout>
      <div className="space-y-6 page-enter">
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/regtech/console")}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Admin Panel</h1>
                <p className="text-slate-600 mt-1 text-sm">Manage users and organizations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="rounded-xl border-slate-200"
                onClick={() => seedDocumentsMutation.mutate()}
                disabled={seedDocumentsMutation.isPending}
              >
                {seedDocumentsMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Seed Sample Documents
              </Button>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100">
              <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="organizations" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Building2 className="h-4 w-4" />
                Organizations
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users" className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
                  <p className="text-sm text-slate-500">Create and manage user accounts</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                  setIsCreateDialogOpen(open);
                  if (open) setNewUser(prev => ({ ...prev, password: generateSecurePassword() }));
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-slate-900 hover:bg-slate-800">
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={newUser.firstName}
                            onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                            placeholder="John"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={newUser.lastName}
                            onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                            placeholder="Doe"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          placeholder="user@company.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="organization">Organization</Label>
                        <Select value={newUser.organizationId} onValueChange={(value) => setNewUser({ ...newUser, organizationId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations?.map((org: any) => (
                              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="password">Generated Password</Label>
                        <div className="flex gap-2">
                          <Input id="password" value={newUser.password} readOnly className="font-mono" />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={async () => {
                              await navigator.clipboard.writeText(newUser.password);
                              toast({ title: "Copied", description: "Password copied to clipboard" });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setNewUser({ ...newUser, password: generateSecurePassword() })}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Copy this password to share with the user.</p>
                      </div>
                      <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {loadingUsers ? (
                <div className="p-8 text-center text-slate-600">Loading users...</div>
              ) : users && users.length > 0 ? (
                <div className="rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-slate-600">Name</TableHead>
                        <TableHead className="text-slate-600">Email</TableHead>
                        <TableHead className="text-slate-600">Organization</TableHead>
                        <TableHead className="text-slate-600">Role</TableHead>
                        <TableHead className="text-slate-600">Plan</TableHead>
                        <TableHead className="text-slate-600">Status</TableHead>
                        <TableHead className="text-slate-600">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium text-slate-900">
                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '-'}
                          </TableCell>
                          <TableCell className="text-slate-600">{user.email}</TableCell>
                          <TableCell>
                            {user.organizationId ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {organizations?.find((o: any) => o.id === user.organizationId)?.name || 'Unknown'}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.isAdmin ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
                                Admin
                              </span>
                            ) : user.role ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                User
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.subscriptionStatus || 'trial'}
                              onValueChange={async (value) => {
                                try {
                                  await apiRequest(`/api/regtech/admin/users/${user.id}/update-plan`, 'POST', { subscriptionStatus: value });
                                  queryClient.invalidateQueries({ queryKey: ['/api/regtech/admin/users'] });
                                  toast({ title: "Updated", description: `Plan set to ${value}` });
                                } catch (e: any) {
                                  toast({ title: "Error", description: e.message, variant: "destructive" });
                                }
                              }}
                            >
                              <SelectTrigger className="h-7 text-xs w-[110px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="trial">Trial</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive !== false ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {user.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setResetPasswordUserId(user.id);
                                  setNewPassword(generateSecurePassword());
                                }}
                                title="Reset Password"
                                className="h-8 w-8 p-0"
                              >
                                <KeyRound className="h-4 w-4 text-slate-500" />
                              </Button>
                              {!user.isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteUserId(user.id)}
                                  title="Delete User"
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-600 bg-slate-50 rounded-xl border border-slate-200">
                  <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No users found. Create your first user to get started.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="organizations" className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Organizations</h2>
                  <p className="text-sm text-slate-500">Manage tenant organizations</p>
                </div>
                <Dialog open={isCreateOrgDialogOpen} onOpenChange={setIsCreateOrgDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-slate-900 hover:bg-slate-800">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Organization
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Organization</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateOrg} className="space-y-4">
                      <div>
                        <Label htmlFor="orgName">Organization Name</Label>
                        <Input
                          id="orgName"
                          value={newOrg.name}
                          onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                          placeholder="Acme Corp"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Select value={newOrg.industry} onValueChange={(value) => setNewOrg({ ...newOrg, industry: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDUSTRY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="domain">Domain (optional)</Label>
                        <Input
                          id="domain"
                          value={newOrg.domain}
                          onChange={(e) => setNewOrg({ ...newOrg, domain: e.target.value })}
                          placeholder="acme.com"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={createOrgMutation.isPending}>
                        {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {loadingOrgs ? (
                <div className="p-8 text-center text-slate-600">Loading organizations...</div>
              ) : organizations && organizations.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {organizations.map((org: any) => (
                    <div key={org.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteOrgId(org.id)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <h3 className="font-semibold text-slate-900">{org.name}</h3>
                      {org.industry && (
                        <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          {INDUSTRY_OPTIONS.find(i => i.value === org.industry)?.label || org.industry}
                        </span>
                      )}
                      {org.domain && (
                        <p className="text-xs text-slate-500 mt-2">{org.domain}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        Created {new Date(org.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-600 bg-slate-50 rounded-xl border border-slate-200">
                  <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No organizations found. Create your first organization.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteUserMutation.mutate(deleteUserId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteOrgId} onOpenChange={(open) => !open && setDeleteOrgId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this organization? All associated users will be unlinked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrgId && deleteOrgMutation.mutate(deleteOrgId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!resetPasswordUserId} onOpenChange={(open) => !open && setResetPasswordUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Password</Label>
              <div className="flex gap-2">
                <Input value={newPassword} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    await navigator.clipboard.writeText(newPassword);
                    toast({ title: "Copied", description: "Password copied to clipboard" });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNewPassword(generateSecurePassword())}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              className="w-full bg-slate-900 hover:bg-slate-800"
              onClick={() => resetPasswordUserId && resetPasswordMutation.mutate({ userId: resetPasswordUserId, newPassword })}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </RegTechLayout>
  );
}
