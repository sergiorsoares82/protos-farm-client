import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { roleService } from '@/services/roleService';
import type { Role, CreateRoleRequest, UpdateRoleRequest } from '@/types/role';
import { UserRole } from '@/services/api';
import { Shield, Plus, Edit2, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const RoleManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: '',
    displayName: '',
    description: '',
  });

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isOrgAdmin = user?.role === UserRole.ORG_ADMIN;

  // Only SUPER_ADMIN and ORG_ADMIN can access
  useEffect(() => {
    if (!isSuperAdmin && !isOrgAdmin) {
      window.location.href = '/dashboard';
    }
  }, [user, isSuperAdmin, isOrgAdmin]);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roleService.getAllRoles();
      setRoles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await roleService.createRole(formData);
      
      setSuccess(`Role ${formData.name} created successfully`);
      setShowCreateDialog(false);
      setFormData({ name: '', displayName: '', description: '' });
      
      await loadRoles();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRole) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const request: UpdateRoleRequest = {
        displayName: formData.displayName,
        description: formData.description,
      };
      
      await roleService.updateRole(selectedRole.id, request);
      
      setSuccess(`Role ${selectedRole.name} updated successfully`);
      setShowEditDialog(false);
      setSelectedRole(null);
      setFormData({ name: '', displayName: '', description: '' });
      
      await loadRoles();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await roleService.deleteRole(selectedRole.id);
      
      setSuccess(`Role ${selectedRole.name} deleted successfully`);
      setShowDeleteDialog(false);
      setSelectedRole(null);
      
      await loadRoles();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
    } finally {
      setSaving(false);
    }
  };

  const openCreateDialog = () => {
    setFormData({ name: '', displayName: '', description: '' });
    setShowCreateDialog(true);
  };

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteDialog(true);
  };

  const systemRoles = roles.filter(r => r.isSystem);
  const customRoles = roles.filter(r => !r.isSystem);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading roles...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8" />
              Role Management
            </h1>
            <p className="text-gray-600 mt-1">
              Create and manage user roles in the system
            </p>
          </div>
          <Button onClick={openCreateDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{roles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">System Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{systemRoles.length}</div>
              <p className="text-xs text-gray-500 mt-1">Cannot be deleted</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Custom Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{customRoles.length}</div>
              <p className="text-xs text-gray-500 mt-1">Can be modified/deleted</p>
            </CardContent>
          </Card>
        </div>

        {/* System Roles */}
        <Card>
          <CardHeader>
            <CardTitle>System Roles</CardTitle>
            <CardDescription>
              Built-in roles that cannot be deleted. These roles are essential for system operation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemRoles.map(role => (
                <div
                  key={role.id}
                  className="flex items-start justify-between p-4 border rounded-lg bg-blue-50 border-blue-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{role.displayName}</h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {role.name}
                      </Badge>
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        System
                      </Badge>
                    </div>
                    <p className="text-gray-700 text-sm">{role.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(role)}
                      className="flex items-center gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Roles</CardTitle>
            <CardDescription>
              User-defined roles that can be created, modified, and deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customRoles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No custom roles yet</p>
                <p className="text-sm mt-1">Click "Create Role" to add your first custom role</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customRoles.map(role => (
                  <div
                    key={role.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{role.displayName}</h3>
                        <Badge variant="secondary">{role.name}</Badge>
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          Custom
                        </Badge>
                      </div>
                      <p className="text-gray-700 text-sm">{role.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(role)}
                        className="flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(role)}
                        className="flex items-center gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={!role.canBeDeleted}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Create a custom role with specific permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Role Name (uppercase, underscores only)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  placeholder="CUSTOM_ROLE"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: MANAGER, VIEWER, ACCOUNTANT
                </p>
              </div>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Custom Role"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this role can do..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !formData.name || !formData.displayName}
              >
                {saving ? 'Creating...' : 'Create Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Update role display name and description.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Role Name (cannot be changed)</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  disabled
                  className="mt-1 bg-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="edit-displayName">Display Name</Label>
                <Input
                  id="edit-displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Custom Role"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this role can do..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={saving || !formData.displayName}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Delete Role
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this role? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedRole && (
              <div className="py-4">
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-semibold mb-1">{selectedRole.displayName}</h3>
                  <Badge variant="secondary" className="mb-2">{selectedRole.name}</Badge>
                  <p className="text-sm text-gray-600">{selectedRole.description}</p>
                </div>
                <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    This role can only be deleted if it has no users assigned to it.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Delete Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
