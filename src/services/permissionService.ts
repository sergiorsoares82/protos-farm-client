import { apiService } from './api';
import type { Permission, RolePermissionsResponse, CustomRolePermissionsResponse, CheckPermissionResponse } from '../types/permission';

class PermissionService {
  /**
   * Get all available permissions in the system
   */
  async getAllPermissions(): Promise<Permission[]> {
    const response = await apiService['fetchWithRetry'](
      `${(apiService as any).baseUrl}/api/permissions`,
      {
        method: 'GET',
        headers: (apiService as any).getAuthHeaders(),
      }
    );
    const data = (await (apiService as any).handleResponse(response)) as { success: boolean; data: Permission[] };
    return data.data;
  }

  /**
   * Get permissions for a specific role
   * @param role - User role
   * @param tenantId - Optional tenant ID (SUPER_ADMIN only)
   */
  async getRolePermissions(role: string, tenantId?: string): Promise<RolePermissionsResponse> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await apiService['fetchWithRetry'](
      `${(apiService as any).baseUrl}/api/permissions/roles/${role}${params}`,
      {
        method: 'GET',
        headers: (apiService as any).getAuthHeaders(),
      }
    );
    const data = (await (apiService as any).handleResponse(response)) as { success: boolean; data: RolePermissionsResponse };
    return data.data;
  }

  /**
   * Update permissions for a specific role
   * @param role - User role
   * @param permissionIds - Array of permission IDs
   * @param tenantId - Optional tenant ID (SUPER_ADMIN only)
   */
  async updateRolePermissions(role: string, permissionIds: string[], tenantId?: string): Promise<void> {
    const body: any = { permissionIds };
    if (tenantId) {
      body.tenantId = tenantId;
    }
    
    const response = await apiService['fetchWithRetry'](
      `${(apiService as any).baseUrl}/api/permissions/roles/${role}`,
      {
        method: 'PUT',
        headers: (apiService as any).getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    await (apiService as any).handleResponse(response) as { success: boolean };
  }

  /**
   * Get permissions for a custom role (by role entity id)
   */
  async getCustomRolePermissions(roleId: string, tenantId?: string): Promise<CustomRolePermissionsResponse> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await apiService['fetchWithRetry'](
      `${(apiService as any).baseUrl}/api/permissions/roles/custom/${roleId}${params}`,
      {
        method: 'GET',
        headers: (apiService as any).getAuthHeaders(),
      }
    );
    const data = (await (apiService as any).handleResponse(response)) as { success: boolean; data: CustomRolePermissionsResponse };
    return data.data;
  }

  /**
   * Update permissions for a custom role
   */
  async updateCustomRolePermissions(roleId: string, permissionIds: string[], tenantId?: string): Promise<void> {
    const body: any = { permissionIds };
    if (tenantId) {
      body.tenantId = tenantId;
    }
    const response = await apiService['fetchWithRetry'](
      `${(apiService as any).baseUrl}/api/permissions/roles/custom/${roleId}`,
      {
        method: 'PUT',
        headers: (apiService as any).getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    await (apiService as any).handleResponse(response) as { success: boolean };
  }

  /**
   * Check if current user has a specific permission
   */
  async checkPermission(entity: string, action: string): Promise<CheckPermissionResponse> {
    const response = await apiService['fetchWithRetry'](
      `${(apiService as any).baseUrl}/api/permissions/check?entity=${entity}&action=${action}`,
      {
        method: 'GET',
        headers: (apiService as any).getAuthHeaders(),
      }
    );
    const data = (await (apiService as any).handleResponse(response)) as { success: boolean; data: CheckPermissionResponse };
    return data.data;
  }
}

export const permissionService = new PermissionService();
