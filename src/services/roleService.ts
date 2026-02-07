import { apiService } from './api';
import type { Role, RoleStats, CreateRoleRequest, UpdateRoleRequest } from '@/types/role';

class RoleService {
  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    const response = await apiService['fetchWithRetry'](
      `${(apiService as any).baseUrl}/api/roles`,
      {
        method: 'GET',
        headers: (apiService as any).getAuthHeaders(),
      }
    );
    const data = await (apiService as any).handleResponse<{ success: boolean; data: Role[] }>(response);
    return data.data;
  }

  /**
   * Create a new role
   */
  async createRole(request: CreateRoleRequest): Promise<Role> {
    const response = await apiService['fetchWithRetry'](
      `${(apiService as any).baseUrl}/api/roles`,
      {
        method: 'POST',
        headers: (apiService as any).getAuthHeaders(),
        body: JSON.stringify(request),
      }
    );
    const data = await (apiService as any).handleResponse<{ success: boolean; data: Role }>(response);
    return data.data;
  }

  /**
   * Update a role
   */
  async updateRole(roleId: string, request: UpdateRoleRequest): Promise<Role> {
    const response = await apiService['fetchWithRetry'](
      `${(apiService as any).baseUrl}/api/roles/${roleId}`,
      {
        method: 'PUT',
        headers: (apiService as any).getAuthHeaders(),
        body: JSON.stringify(request),
      }
    );
    const data = await (apiService as any).handleResponse<{ success: boolean; data: Role }>(response);
    return data.data;
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string): Promise<void> {
    const response = await apiService['fetchWithRetry'](
      `${(apiService as any).baseUrl}/api/roles/${roleId}`,
      {
        method: 'DELETE',
        headers: (apiService as any).getAuthHeaders(),
      }
    );
    await (apiService as any).handleResponse<{ success: boolean }>(response);
  }

  /**
   * Get role statistics
   */
  async getRoleStats(roleId: string): Promise<RoleStats> {
    const response = await apiService['fetchWithRetry'](
      `${(apiService as any).baseUrl}/api/roles/${roleId}/stats`,
      {
        method: 'GET',
        headers: (apiService as any).getAuthHeaders(),
      }
    );
    const data = await (apiService as any).handleResponse<{ success: boolean; data: RoleStats }>(response);
    return data.data;
  }
}

export const roleService = new RoleService();
