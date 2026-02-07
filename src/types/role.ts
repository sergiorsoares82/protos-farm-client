/**
 * Role Types
 */

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  canBeDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleStats {
  roleId: string;
  roleName: string;
  userCount: number;
  canBeDeleted: boolean;
  deletionBlockedReason?: string;
}

export interface CreateRoleRequest {
  name: string;
  displayName: string;
  description: string;
}

export interface UpdateRoleRequest {
  displayName?: string;
  description?: string;
}
