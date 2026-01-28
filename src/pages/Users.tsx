import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiService, UserManagement, CreateUserRequest, UserRole, Organization } from '@/services/api';
import { Search, Plus, Trash2, UserCog, Shield, User as UserIcon } from 'lucide-react';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useAuth } from '@/contexts/AuthContext';

export const Users = () => {
  const { canManageUsers, isSuperAdmin } = useAuthorization();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('');
  
  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    email: '',
    password: '',
    role: UserRole.USER,
    tenantId: currentUser?.tenantId || '',
  });

  useEffect(() => {
    if (canManageUsers) {
      loadUsers();
      if (isSuperAdmin) {
        loadOrganizations();
      }
    }
  }, [canManageUsers, isSuperAdmin]);

  const loadUsers = async (tenantId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getUsers(tenantId);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const data = await apiService.getOrganizations();
      setOrganizations(data);
    } catch (err: any) {
      console.error('Failed to load organizations:', err);
    }
  };

  const handleCreateUser = async () => {
    try {
      await apiService.createUser(newUser);
      setShowCreateModal(false);
      setNewUser({
        email: '',
        password: '',
        role: UserRole.USER,
        tenantId: currentUser?.role === UserRole.ORG_ADMIN ? currentUser.tenantId || '' : '',
      });
      await loadUsers(selectedTenantFilter === 'all' ? undefined : selectedTenantFilter || undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      await apiService.deleteUser(id);
      await loadUsers(selectedTenantFilter === 'all' ? undefined : selectedTenantFilter || undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleTenantFilterChange = (value: string) => {
    setSelectedTenantFilter(value);
    // If "all" is selected, pass undefined to load all users
    loadUsers(value === 'all' ? undefined : value);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return <Shield className="h-4 w-4 text-purple-600" />;
      case UserRole.ORG_ADMIN:
        return <UserCog className="h-4 w-4 text-blue-600" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.ORG_ADMIN:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!canManageUsers) {
    return (
      <Layout>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Manage users in your organization</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
              <p className="text-red-800">{error}</p>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                ×
              </button>
            </div>
          )}

          {/* Users Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>View and manage user accounts</CardDescription>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search users by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {isSuperAdmin && organizations.length > 0 && (
                  <Select value={selectedTenantFilter || 'all'} onValueChange={handleTenantFilterChange}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="All Organizations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Organizations</SelectItem>
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Users List */}
              {loading ? (
                <p className="text-center py-8 text-gray-500">Loading users...</p>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UserCog className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-600">No users found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {getRoleIcon(user.role)}
                          <div className="flex-1">
                            <p className="font-medium">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded ${getRoleBadgeClass(user.role)}`}>
                                {user.role.replace('_', ' ')}
                              </span>
                              {user.organizationName && (
                                <span className="text-xs text-gray-500">
                                  {user.organizationName}
                                </span>
                              )}
                              {user.person && (
                                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 flex items-center gap-1">
                                  <UserIcon className="h-3 w-3" />
                                  {user.person.fullName}
                                </span>
                              )}
                            </div>
                            {user.person && (
                              <div className="mt-2 text-xs text-gray-600">
                                Person: {user.person.email}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create User Modal */}
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the platform
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-password">Password</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min 8 characters"
                  />
                  <p className="text-sm text-gray-500">
                    Must contain uppercase, lowercase, number, and special character
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-role">Role</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger id="user-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.USER}>User</SelectItem>
                      <SelectItem value={UserRole.ORG_ADMIN}>Organization Admin</SelectItem>
                      {isSuperAdmin && (
                        <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {isSuperAdmin && organizations.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="user-org">Organization</Label>
                    <Select 
                      value={newUser.tenantId} 
                      onValueChange={(value) => setNewUser({ ...newUser, tenantId: value })}
                    >
                      <SelectTrigger id="user-org">
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map(org => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowCreateModal(false);
                  setNewUser({
                    email: '',
                    password: '',
                    role: UserRole.USER,
                    tenantId: currentUser?.role === UserRole.ORG_ADMIN ? currentUser.tenantId || '' : '',
                  });
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateUser}
                  disabled={!newUser.email || !newUser.password || !newUser.tenantId}
                >
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>
    </Layout>
  );
};
