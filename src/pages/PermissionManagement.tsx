import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { permissionService } from '@/services/permissionService';
import { roleService } from '@/services/roleService';
import { Permission, EntityType, PermissionAction, ENTITY_CATEGORIES } from '@/types/permission';
import type { Role } from '@/types/role';
import { UserRole, Organization, apiService } from '@/services/api';
import { Shield, Search, Save, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Building2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '../components/ui/alert';

interface PermissionMatrix {
  [entityType: string]: {
    [action: string]: Permission | null;
  };
}

export const PermissionManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>({});
  
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('role');
  const roleIdFromUrl = searchParams.get('roleId');
  const isCustomRoleMode = Boolean(roleIdFromUrl);
  const initialRoleFromUrl = Object.values(UserRole).includes(roleFromUrl as UserRole)
    ? (roleFromUrl as UserRole)
    : UserRole.USER;
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRoleFromUrl);
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
  const [initialPermissions, setInitialPermissions] = useState<Set<string>>(new Set());
  
  // Custom role: display name (from roles list)
  const [customRoleInfo, setCustomRoleInfo] = useState<Role | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  
  // Organization selection (for SUPER_ADMIN)
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(ENTITY_CATEGORIES))
  );

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isOrgAdmin = user?.role === UserRole.ORG_ADMIN;

  // Sync selected role from URL when navigating from Role Management ("Editar permissões")
  useEffect(() => {
    if (!isCustomRoleMode && roleFromUrl && Object.values(UserRole).includes(roleFromUrl as UserRole)) {
      setSelectedRole(roleFromUrl as UserRole);
    }
  }, [roleFromUrl, isCustomRoleMode]);

  const handleRoleTabChange = (value: string) => {
    const newRole = value as UserRole;
    setSelectedRole(newRole);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('role', newRole);
      return next;
    });
  };

  // Only SUPER_ADMIN and ORG_ADMIN can access this page
  useEffect(() => {
    if (!isSuperAdmin && !isOrgAdmin) {
      window.location.href = '/dashboard';
    }
  }, [user, isSuperAdmin, isOrgAdmin]);

  useEffect(() => {
    loadPermissions();
    if (isSuperAdmin) {
      loadOrganizations();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isCustomRoleMode && roleIdFromUrl) {
      roleService.getAllRoles().then(setRoles);
    }
  }, [isCustomRoleMode, roleIdFromUrl]);

  useEffect(() => {
    if (allPermissions.length === 0) return;
    if (isCustomRoleMode && roleIdFromUrl) {
      const tenantId = isSuperAdmin ? (selectedTenantId || undefined) : undefined;
      permissionService
        .getCustomRolePermissions(roleIdFromUrl, tenantId)
        .then((res) => {
          const permIds = new Set(res.permissions.map((p) => p.id));
          setRolePermissions(permIds);
          setInitialPermissions(new Set(permIds));
        })
        .catch((err: any) => setError(err.message || 'Failed to load custom role permissions'));
    } else if (!isCustomRoleMode) {
      loadRolePermissions(selectedRole, selectedTenantId || undefined);
    }
  }, [selectedRole, selectedTenantId, allPermissions.length, isCustomRoleMode, roleIdFromUrl, isSuperAdmin]);

  useEffect(() => {
    if (roleIdFromUrl && roles.length > 0) {
      setCustomRoleInfo(roles.find((r) => r.id === roleIdFromUrl) ?? null);
    }
  }, [roleIdFromUrl, roles]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const permissions = await permissionService.getAllPermissions();
      setAllPermissions(permissions);
      
      // Build permission matrix for quick lookup
      const matrix: PermissionMatrix = {};
      permissions.forEach(perm => {
        if (!matrix[perm.entity]) {
          matrix[perm.entity] = {};
        }
        matrix[perm.entity][perm.action] = perm;
      });
      setPermissionMatrix(matrix);
    } catch (err: any) {
      setError(err.message || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const orgs = await apiService.getOrganizations();
      setOrganizations(orgs);
    } catch (err: any) {
      console.error('Failed to load organizations:', err);
    }
  };

  const loadRolePermissions = async (role: UserRole, tenantId?: string) => {
    try {
      setError(null);
      const response = await permissionService.getRolePermissions(role, tenantId);
      const permIds = new Set(response.permissions.map(p => p.id));
      setRolePermissions(permIds);
      setInitialPermissions(new Set(permIds));
    } catch (err: any) {
      setError(err.message || 'Failed to load role permissions');
    }
  };

  const togglePermission = (permissionId: string) => {
    const newPermissions = new Set(rolePermissions);
    if (newPermissions.has(permissionId)) {
      newPermissions.delete(permissionId);
    } else {
      newPermissions.add(permissionId);
    }
    setRolePermissions(newPermissions);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const selectAllInCategory = (category: string, select: boolean) => {
    const entities = ENTITY_CATEGORIES[category as keyof typeof ENTITY_CATEGORIES] || [];
    const newPermissions = new Set(rolePermissions);
    
    entities.forEach(entity => {
      Object.values(PermissionAction).forEach(action => {
        const perm = permissionMatrix[entity]?.[action];
        if (perm) {
          if (select) {
            newPermissions.add(perm.id);
          } else {
            newPermissions.delete(perm.id);
          }
        }
      });
    });
    
    setRolePermissions(newPermissions);
  };

  const selectAllActions = (entity: EntityType, select: boolean) => {
    const newPermissions = new Set(rolePermissions);
    
    Object.values(PermissionAction).forEach(action => {
      const perm = permissionMatrix[entity]?.[action];
      if (perm) {
        if (select) {
          newPermissions.add(perm.id);
        } else {
          newPermissions.delete(perm.id);
        }
      }
    });
    
    setRolePermissions(newPermissions);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      if (isCustomRoleMode && roleIdFromUrl) {
        const tenantId = isSuperAdmin ? (selectedTenantId || undefined) : undefined;
        await permissionService.updateCustomRolePermissions(
          roleIdFromUrl,
          Array.from(rolePermissions),
          tenantId
        );
        setInitialPermissions(new Set(rolePermissions));
        setSuccess(
          `Permissões atualizadas para o role ${customRoleInfo?.displayName ?? roleIdFromUrl}.`
        );
      } else {
        await permissionService.updateRolePermissions(
          selectedRole,
          Array.from(rolePermissions),
          selectedTenantId || undefined
        );
        setInitialPermissions(new Set(rolePermissions));
        const tenantInfo = selectedTenantId
          ? ` for organization ${organizations.find((o) => o.id === selectedTenantId)?.name || selectedTenantId}`
          : ' (system-wide)';
        setSuccess(`Permissions updated successfully for ${selectedRole}${tenantInfo}`);
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setRolePermissions(new Set(initialPermissions));
    setSuccess(null);
    setError(null);
  };

  const hasChanges = () => {
    if (rolePermissions.size !== initialPermissions.size) return true;
    for (const id of rolePermissions) {
      if (!initialPermissions.has(id)) return true;
    }
    return false;
  };

  const getEntityPermissionCount = (entity: EntityType) => {
    let count = 0;
    Object.values(PermissionAction).forEach(action => {
      const perm = permissionMatrix[entity]?.[action];
      if (perm && rolePermissions.has(perm.id)) {
        count++;
      }
    });
    return count;
  };

  const getCategoryPermissionCount = (category: string) => {
    const entities = ENTITY_CATEGORIES[category as keyof typeof ENTITY_CATEGORIES] || [];
    let count = 0;
    let total = 0;
    
    entities.forEach(entity => {
      Object.values(PermissionAction).forEach(action => {
        const perm = permissionMatrix[entity]?.[action];
        if (perm) {
          total++;
          if (rolePermissions.has(perm.id)) {
            count++;
          }
        }
      });
    });
    
    return { count, total };
  };

  const formatEntityName = (entity: string) => {
    return entity
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const filteredCategories = Object.entries(ENTITY_CATEGORIES).filter(([category, entities]) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    if (category.toLowerCase().includes(query)) return true;
    
    return entities.some(entity =>
      formatEntityName(entity).toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-12 w-12 animate-pulse mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading permissions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-4">
            {isCustomRoleMode && (
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link to="/roles" className="flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Link>
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Shield className="h-8 w-8" />
                {isCustomRoleMode ? 'Permissões do role' : 'Permission Management'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isCustomRoleMode ? (
                  <>
                    A configurar permissões para o role{' '}
                    <span className="font-semibold">{customRoleInfo?.displayName ?? roleIdFromUrl}</span>.
                    {' '}
                    <Link to="/roles" className="text-primary font-medium underline hover:no-underline">
                      Ver todos os roles
                    </Link>
                  </>
                ) : (
                  <>
                    Configure as permissões de cada role (Super Admin, Org Admin, User). As alterações afetam todos os utilizadores com o role selecionado. Pode gerir os roles em{' '}
                    <Link to="/roles" className="text-primary font-medium underline hover:no-underline">
                      Gestão de Roles
                    </Link>.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {isCustomRoleMode ? `Permissões: ${customRoleInfo?.displayName ?? roleIdFromUrl}` : 'Role Permissions'}
            </CardTitle>
            <CardDescription>
              {isCustomRoleMode
                ? `Total de permissões disponíveis: ${allPermissions.length}`
                : isSuperAdmin
                  ? 'Select a role and organization to view and edit permissions.'
                  : 'Manage permissions for USER role in your organization.'}
              {!isCustomRoleMode && ` Total permissions: ${allPermissions.length}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Organization Selector (SUPER_ADMIN only, hide in custom role mode) */}
            {isSuperAdmin && !isCustomRoleMode && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Building2 className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-1 block">
                        Organization (Tenant)
                      </label>
                      <Select
                        value={selectedTenantId || 'system'}
                        onValueChange={(value) => setSelectedTenantId(value === 'system' ? null : value)}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select organization..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">
                            🌐 System-wide (All Organizations)
                          </SelectItem>
                          {organizations.map(org => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name} ({org.slug})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 max-w-xs">
                    System-wide permissions apply to all organizations. Organization-specific permissions override system defaults.
                  </div>
                </div>
              </div>
            )}

            <Tabs
              value={isCustomRoleMode ? 'custom' : selectedRole}
              onValueChange={isCustomRoleMode ? undefined : handleRoleTabChange}
            >
              {!isCustomRoleMode && (
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger 
                    value={UserRole.SUPER_ADMIN} 
                    className="flex items-center gap-2"
                    disabled={isOrgAdmin}
                  >
                    <Shield className="h-4 w-4" />
                    Super Admin
                  </TabsTrigger>
                  <TabsTrigger 
                    value={UserRole.ORG_ADMIN} 
                    className="flex items-center gap-2"
                    disabled={isOrgAdmin}
                  >
                    <Shield className="h-4 w-4" />
                    Org Admin
                  </TabsTrigger>
                  <TabsTrigger value={UserRole.USER} className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    User
                  </TabsTrigger>
                </TabsList>
              )}

              <div className="space-y-4">
                {/* Search and Actions */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search entities or categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {hasChanges() && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{rolePermissions.size}</div>
                      <div className="text-sm text-gray-600">Active Permissions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-600">{allPermissions.length}</div>
                      <div className="text-sm text-gray-600">Total Permissions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round((rolePermissions.size / allPermissions.length) * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">Coverage</div>
                    </div>
                  </div>
                  
                  {/* Context Info */}
                  {!isCustomRoleMode && (
                    <div className="mt-4 pt-4 border-t text-center">
                      <div className="text-sm text-gray-600">
                        Managing: <span className="font-semibold">{selectedRole}</span>
                        {isSuperAdmin && (
                          <>
                            {' '} for{' '}
                            <span className="font-semibold">
                              {selectedTenantId 
                                ? organizations.find(o => o.id === selectedTenantId)?.name || 'Selected Org'
                                : 'All Organizations (System-wide)'}
                            </span>
                          </>
                        )}
                        {isOrgAdmin && (
                          <>
                            {' '} for{' '}
                            <span className="font-semibold">Your Organization</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Permission Matrix */}
                <div className="border rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="bg-gray-50 border-b sticky top-0 z-10">
                    <div className="grid grid-cols-[1fr,100px,100px,100px,100px] gap-2 p-3 font-semibold text-sm">
                      <div>Entity</div>
                      <div className="text-center">VIEW</div>
                      <div className="text-center">CREATE</div>
                      <div className="text-center">EDIT</div>
                      <div className="text-center">DELETE</div>
                    </div>
                  </div>

                  {/* Categories and Entities */}
                  <div className="divide-y">
                    {filteredCategories.map(([category, entities]) => {
                      const isExpanded = expandedCategories.has(category);
                      const { count, total } = getCategoryPermissionCount(category);
                      
                      return (
                        <div key={category}>
                          {/* Category Header */}
                          <div className="bg-gray-100 border-b">
                            <div className="grid grid-cols-[1fr,100px,100px,100px,100px] gap-2 p-3">
                              <button
                                onClick={() => toggleCategory(category)}
                                className="flex items-center gap-2 font-semibold text-left hover:text-blue-600"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                {category}
                                <Badge variant="secondary" className="ml-2">
                                  {count}/{total}
                                </Badge>
                              </button>
                              <div className="col-span-4 flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => selectAllInCategory(category, true)}
                                  className="text-xs"
                                >
                                  Select All
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => selectAllInCategory(category, false)}
                                  className="text-xs"
                                >
                                  Clear All
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Entities */}
                          {isExpanded && (
                            <div className="divide-y">
                              {entities.map(entity => {
                                const permCount = getEntityPermissionCount(entity);
                                
                                return (
                                  <div
                                    key={entity}
                                    className="grid grid-cols-[1fr,100px,100px,100px,100px] gap-2 p-3 hover:bg-gray-50"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">{formatEntityName(entity)}</span>
                                      {permCount > 0 && (
                                        <Badge variant="outline" className="text-xs">
                                          {permCount}/4
                                        </Badge>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => selectAllActions(entity, permCount < 4)}
                                        className="text-xs ml-auto"
                                      >
                                        {permCount < 4 ? 'All' : 'None'}
                                      </Button>
                                    </div>
                                    
                                    {Object.values(PermissionAction).map(action => {
                                      const perm = permissionMatrix[entity]?.[action];
                                      if (!perm) return <div key={action} />;
                                      
                                      const isChecked = rolePermissions.has(perm.id);
                                      
                                      return (
                                        <div key={action} className="flex items-center justify-center">
                                          <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={() => togglePermission(perm.id)}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
