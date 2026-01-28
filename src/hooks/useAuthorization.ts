import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/services/api';

export const useAuthorization = () => {
  const { user } = useAuth();
  
  return {
    // Organization permissions
    canManageAllOrganizations: user?.role === UserRole.SUPER_ADMIN,
    canManageOwnOrganization: user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ORG_ADMIN,
    canViewOrganization: !!user,
    
    // User management permissions
    canManageUsers: user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ORG_ADMIN,
    canCreateSuperAdmin: user?.role === UserRole.SUPER_ADMIN,
    
    // Person/Data permissions
    canManagePersons: !!user,
    canManageProducts: !!user,
    
    // Role checks
    isSuperAdmin: user?.role === UserRole.SUPER_ADMIN,
    isOrgAdmin: user?.role === UserRole.ORG_ADMIN,
    isRegularUser: user?.role === UserRole.USER,
    
    // Combined checks
    hasAdminAccess: user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ORG_ADMIN,
  };
};
