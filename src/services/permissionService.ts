import { apiService } from './api';
import type { Permission, RolePermissionsResponse, CheckPermissionResponse } from '../types/permission';

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
    const data = await (apiService as any).handleResponse<{ success: boolean; data: Permission[] }>(response);
    return data.data;
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(role: string): Promise<RolePermissionsResponse> {
    const response = await apiService['fetchWithRetry'](
      `${(apiService as any).baseUrl}/api/permissions/roles/${role}`,
      {
        method: 'GET',
        headers: (apiService as any).getAuthHeaders(),
      }
    );
    const data = await (apiService as any).handleResponse<{ success: boolean; data: RolePermissionsResponse }>(response);
    return data.data;
  }

  /**
   * Update permissions for a specific role
   */
  async updateRolePermissions(role: string, permissionIds: string[]): Promise<void> {
    const response = await apiService['fetchWithRetry'](
      `${(apiService as any).baseUrl}/api/permissions/roles/${role}`,
      {
        method: 'PUT',
        headers: (apiService as any).getAuthHeaders(),
        body: JSON.stringify({ permissionIds }),
      }
    );
    await (apiService as any).handleResponse<{ success: boolean }>(response);
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
    const data = await (apiService as any).handleResponse<{ success: boolean; data: CheckPermissionResponse }>(response);
    return data.data;
  }
}

export const permissionService = new PermissionService();
