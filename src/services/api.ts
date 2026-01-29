// API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  USER = 'USER'
}

export interface UserPerson {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
}

export interface User {
  id: string;
  email: string;
  role?: UserRole;
  tenantId?: string;
  person?: UserPerson;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any;
}

// Document Types
export interface DocumentType {
  id: string;
  name: string;
  group: string;
  hasAccessKey: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentTypeRequest {
  name: string;
  group: string;
  hasAccessKey: boolean;
}

export interface UpdateDocumentTypeRequest {
  name?: string;
  group?: string;
  hasAccessKey?: boolean;
}

// Person Types
export enum PersonRole {
  CLIENT = 'CLIENT',
  SUPPLIER = 'SUPPLIER',
  WORKER = 'WORKER',
  FARM_OWNER = 'FARM_OWNER',
}

export interface ClientRoleData {
  companyName?: string;
  taxId?: string;
  preferredPaymentMethod?: string;
  creditLimit?: number;
}

export interface SupplierRoleData {
  companyName: string;
  taxId: string;
  supplyCategories?: string;
  paymentTerms?: string;
}

export interface WorkerRoleData {
  position: string;
  hireDate: string | Date;
  hourlyRate?: number;
  employmentType: string;
}

export interface FarmOwnerRoleData {
  farmName: string;
  farmLocation?: string;
  totalArea?: number;
  ownershipType?: string;
}

export type RoleData = ClientRoleData | SupplierRoleData | WorkerRoleData | FarmOwnerRoleData;

export interface RoleAssignment {
  type: PersonRole;
  data: RoleData;
}

export interface CreatePersonRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  userId?: string;
  roles: RoleAssignment[];
}

export interface UpdatePersonRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface Person {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  roles: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  isActive?: boolean;
}

// User Management Types
export interface UserManagement {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
  organizationName?: string;
  person?: UserPerson;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: UserRole;
  tenantId: string;
}

export interface UpdateUserRequest {
  email?: string;
  role?: UserRole;
  password?: string;
}

// Item Types
export enum ItemType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
  ASSET = 'ASSET',
  PAYROLL = 'PAYROLL',
}

export interface ProductDetails {
  sku?: string;
  isStockControlled?: boolean;
  initialStockDate?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  category?: string;
}

export interface Item {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: ItemType;
  price?: number;
  unit?: string;
  isActive: boolean;
  productDetails?: ProductDetails;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemRequest {
  name: string;
  description?: string;
  type: ItemType;
  price?: number;
  unit?: string;
  // Product-specific fields
  sku?: string;
  isStockControlled?: boolean;
  initialStockDate?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  category?: string;
}

export interface UpdateItemRequest {
  name?: string;
  description?: string;
  price?: number;
  unit?: string;
  isActive?: boolean;
  // Product-specific fields
  sku?: string;
  isStockControlled?: boolean;
  initialStockDate?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  category?: string;
}

// Cost Center Types
export enum CostCenterType {
  PRODUCTIVE = 'PRODUCTIVE',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  SHARED = 'SHARED',
}

export interface CostCenter {
  id: string;
  tenantId: string;
  code: string;
  description: string;
  type: CostCenterType;
  categoryId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCostCenterRequest {
  code: string;
  description: string;
  type: CostCenterType;
  categoryId?: string;
}

export interface UpdateCostCenterRequest {
  code?: string;
  description?: string;
  type?: CostCenterType;
  categoryId?: string;
  isActive?: boolean;
}

// Cost Center Categories
export interface CostCenterCategory {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCostCenterCategoryRequest {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateCostCenterCategoryRequest {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Fields (Talhões)
export interface Field {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  areaHectares: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFieldRequest {
  code: string;
  name: string;
  areaHectares: number;
}

export interface UpdateFieldRequest {
  code?: string;
  name?: string;
  areaHectares?: number;
  isActive?: boolean;
}

// Seasons (Safras)
export interface Season {
  id: string;
  tenantId: string;
  name: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSeasonRequest {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateSeasonRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface SeasonFieldLink {
  fieldId: string;
  areaHectares: number;
  costCenterId: string;
}

// Machine Types (tractors, harvesters, seeders...)
export interface MachineType {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMachineTypeRequest {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateMachineTypeRequest {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Management Account Types
export enum AccountType {
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export interface ManagementAccount {
  id: string;
  tenantId: string;
  code: string;
  description: string;
  type: AccountType;
  categoryIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateManagementAccountRequest {
  code: string;
  description: string;
  type: AccountType;
  categoryIds?: string[];
}

export interface UpdateManagementAccountRequest {
  code?: string;
  description?: string;
  type?: AccountType;
  categoryIds?: string[];
  isActive?: boolean;
}

// API Configuration
// In development, default to localhost backend.
// In production (build on Vercel, etc.), default to your public API URL,
// but allow overriding via VITE_API_URL if you prefer.
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://api.protosfarm.com.br' : 'http://localhost:3000');

// API Service
class ApiService {
  private baseUrl: string;
  private onUnauthorized: (() => void) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Register a callback to handle unauthorized errors (token expiration)
  setUnauthorizedCallback(callback: () => void) {
    this.onUnauthorized = callback;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Wrapper around fetch that retries once on network error or 5xx response.
   * This helps hide transient cold-start / connection issues (e.g. serverless + Neon).
   */
  private async fetchWithRetry(
    input: RequestInfo | URL,
    init?: RequestInit,
    retries = 1,
  ): Promise<Response> {
    try {
      const response = await fetch(input, init);
      if (response.ok || retries <= 0 || response.status < 500) {
        return response;
      }
      // Retry once on 5xx
      return await fetch(input, init);
    } catch (err) {
      if (retries <= 0) {
        throw err;
      }
      return await fetch(input, init);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Handle 401 Unauthorized - token expired
      if (response.status === 401) {
        console.warn('Access token expired or invalid. Logging out...');

        // Clear local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Trigger the unauthorized callback (logout and redirect)
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
      }

      const error = await response.json().catch(() => ({
        message: 'Request failed',
      }));

      // Log full error for debugging
      console.error('API Error:', error);

      // Extract detailed error message
      let errorMessage = 'Request failed';
      if (error.error) {
        errorMessage = error.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        // Handle Zod validation errors
        errorMessage = Array.isArray(error.details)
          ? error.details.map((d: any) => d.message).join(', ')
          : error.details;
      }

      throw {
        message: errorMessage,
        statusCode: response.status,
        details: error.details || error,
      } as ApiError;
    }
    // 204 No Content has no body; calling response.json() would throw
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json();
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Login failed. Please check your credentials.',
        }));
        throw {
          message: error.message || 'Login failed',
          statusCode: response.status,
        } as ApiError;
      }

      const data: LoginResponse = await response.json();
      return data;
    } catch (error) {
      if ((error as ApiError).statusCode) {
        throw error;
      }

      console.error('Network error:', error);
      throw {
        message: `Failed to connect to backend at ${this.baseUrl}`,
        statusCode: 0,
      } as ApiError;
    }
  }

  // Person Management APIs
  async getPersons(): Promise<Person[]> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/persons`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      const data = await this.handleResponse<{ success: boolean; data: Person[] }>(response);
      return data.data;
    } catch (error) {
      throw error;
    }
  }

  async getPerson(id: string): Promise<Person> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/persons/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: Person }>(response);
    return data.data;
  }

  async createPerson(person: CreatePersonRequest): Promise<Person> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/persons`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(person),
    });
    const data = await this.handleResponse<{ success: boolean; data: Person }>(response);
    return data.data;
  }

  async updatePerson(id: string, updates: UpdatePersonRequest): Promise<Person> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/persons/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await this.handleResponse<{ success: boolean; data: Person }>(response);
    return data.data;
  }

  async deletePerson(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/persons/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<{ success: boolean }>(response);
  }

  async assignRole(id: string, role: PersonRole, roleData: RoleData): Promise<Person> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/persons/${id}/roles`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ role, roleData }),
    });
    const data = await this.handleResponse<{ success: boolean; data: Person }>(response);
    return data.data;
  }

  async removeRole(id: string, role: PersonRole): Promise<Person> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/persons/${id}/roles/${role}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: Person }>(response);
    return data.data;
  }

  // Organization Management
  async getOrganizations(): Promise<Organization[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/organizations`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: Organization[] }>(response);
    return data.data;
  }

  async getMyOrganization(): Promise<Organization> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/organizations/me`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: Organization }>(response);
    return data.data;
  }

  async getOrganization(id: string): Promise<Organization> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/organizations/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: Organization }>(response);
    return data.data;
  }

  async createOrganization(organization: CreateOrganizationRequest): Promise<Organization> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/organizations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(organization),
    });
    const data = await this.handleResponse<{ success: boolean; data: Organization }>(response);
    return data.data;
  }

  async updateOrganization(id: string, updates: UpdateOrganizationRequest): Promise<Organization> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/organizations/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await this.handleResponse<{ success: boolean; data: Organization }>(response);
    return data.data;
  }

  async deleteOrganization(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/organizations/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<{ success: boolean }>(response);
  }

  // Document Types (Super Admin)
  async getDocumentTypes(): Promise<DocumentType[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/document-types`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: DocumentType[] }>(response);
    return data.data;
  }

  async createDocumentType(payload: CreateDocumentTypeRequest): Promise<DocumentType> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/document-types`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await this.handleResponse<{ success: boolean; data: DocumentType }>(response);
    return data.data;
  }

  async updateDocumentType(id: string, payload: UpdateDocumentTypeRequest): Promise<DocumentType> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/document-types/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await this.handleResponse<{ success: boolean; data: DocumentType }>(response);
    return data.data;
  }

  async deleteDocumentType(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/document-types/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<{ success: boolean }>(response);
  }

  // User Management
  async getUsers(tenantId?: string): Promise<UserManagement[]> {
    const url = tenantId
      ? `${this.baseUrl}/api/users?tenantId=${tenantId}`
      : `${this.baseUrl}/api/users`;

    const response = await this.fetchWithRetry(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: UserManagement[] }>(response);
    return data.data;
  }

  async getUser(id: string): Promise<UserManagement> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/users/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: UserManagement }>(response);
    return data.data;
  }

  async createUser(user: CreateUserRequest): Promise<UserManagement> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/users`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(user),
    });
    const data = await this.handleResponse<{ success: boolean; data: UserManagement }>(response);
    return data.data;
  }

  async updateUser(id: string, updates: UpdateUserRequest): Promise<UserManagement> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/users/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await this.handleResponse<{ success: boolean; data: UserManagement }>(response);
    return data.data;
  }

  async deleteUser(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/users/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<{ success: boolean }>(response);
  }

  // Link person to user
  async linkPersonToUser(userId: string, personId: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/users/${userId}/link-person`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ personId }),
    });
    await this.handleResponse<{ success: boolean }>(response);
  }

  // Unlink person from user
  async unlinkPersonFromUser(userId: string, personId: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/users/${userId}/persons/${personId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<{ success: boolean }>(response);
  }

  // Item Management
  async getItems(type?: ItemType, active?: boolean): Promise<Item[]> {
    let url = `${this.baseUrl}/api/items`;
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (active !== undefined) params.append('active', active.toString());
    if (params.toString()) url += `?${params.toString()}`;

    const response = await this.fetchWithRetry(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: Item[] }>(response);
    return data.data;
  }

  async getItem(id: string): Promise<Item> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/items/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: Item }>(response);
    return data.data;
  }

  async createItem(item: CreateItemRequest): Promise<Item> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/items`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item),
    });
    const data = await this.handleResponse<{ success: boolean; data: Item }>(response);
    return data.data;
  }

  async updateItem(id: string, updates: UpdateItemRequest): Promise<Item> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/items/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await this.handleResponse<{ success: boolean; data: Item }>(response);
    return data.data;
  }

  async deleteItem(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/items/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<{ success: boolean }>(response);
  }

  // Cost Center Management
  async getCostCenters(): Promise<CostCenter[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/cost-centers`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    // The backend returns the array directly, not wrapped in { data: ... }
    return await this.handleResponse<CostCenter[]>(response);
  }

  async getCostCenter(id: string): Promise<CostCenter> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/cost-centers/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<CostCenter>(response);
  }

  async createCostCenter(data: CreateCostCenterRequest): Promise<CostCenter> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/cost-centers`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<CostCenter>(response);
  }

  async updateCostCenter(id: string, data: UpdateCostCenterRequest): Promise<CostCenter> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/cost-centers/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<CostCenter>(response);
  }

  async deleteCostCenter(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/cost-centers/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<void>(response);
  }

  // Cost Center Categories
  async getCostCenterCategories(): Promise<CostCenterCategory[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/cost-center-categories`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: CostCenterCategory[] }>(
      response,
    );
    return data.data;
  }

  async createCostCenterCategory(
    category: CreateCostCenterCategoryRequest,
  ): Promise<CostCenterCategory> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/cost-center-categories`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(category),
    });
    const data = await this.handleResponse<{ success: boolean; data: CostCenterCategory }>(
      response,
    );
    return data.data;
  }

  async updateCostCenterCategory(
    id: string,
    updates: UpdateCostCenterCategoryRequest,
  ): Promise<CostCenterCategory> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/cost-center-categories/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await this.handleResponse<{ success: boolean; data: CostCenterCategory }>(
      response,
    );
    return data.data;
  }

  async deleteCostCenterCategory(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/cost-center-categories/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<void>(response);
  }

  // Fields (Talhões)
  async getFields(): Promise<Field[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/fields`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<Field[]>(response);
  }

  async createField(data: CreateFieldRequest): Promise<Field> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/fields`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<Field>(response);
  }

  async updateField(id: string, data: UpdateFieldRequest): Promise<Field> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/fields/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<Field>(response);
  }

  async deleteField(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/fields/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<void>(response);
  }

  // Seasons (Safras)
  async getSeasons(): Promise<Season[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/seasons`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<Season[]>(response);
  }

  async createSeason(data: CreateSeasonRequest): Promise<Season> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/seasons`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<Season>(response);
  }

  async updateSeason(id: string, data: UpdateSeasonRequest): Promise<Season> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/seasons/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<Season>(response);
  }

  async deleteSeason(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/seasons/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<void>(response);
  }

  async getSeasonFieldLinks(seasonId: string): Promise<SeasonFieldLink[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/seasons/${seasonId}/fields`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: SeasonFieldLink[] }>(
      response,
    );
    return data.data;
  }

  async upsertSeasonFieldLink(
    seasonId: string,
    fieldId: string,
    costCenterId: string,
    areaHectares: number,
  ): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/seasons/${seasonId}/fields`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ fieldId, costCenterId, areaHectares }),
    });
    await this.handleResponse<void>(response);
  }

  async deleteSeasonFieldLink(seasonId: string, fieldId: string): Promise<void> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/seasons/${seasonId}/fields/${fieldId}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      },
    );
    await this.handleResponse<void>(response);
  }

  // Machine Types
  async getMachineTypes(): Promise<MachineType[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/machine-types`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<MachineType[]>(response);
  }

  async getMachineType(id: string): Promise<MachineType> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/machine-types/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<MachineType>(response);
  }

  async createMachineType(data: CreateMachineTypeRequest): Promise<MachineType> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/machine-types`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<MachineType>(response);
  }

  async updateMachineType(id: string, data: UpdateMachineTypeRequest): Promise<MachineType> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/machine-types/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<MachineType>(response);
  }

  async deleteMachineType(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/machine-types/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<void>(response);
  }

  // Management Account (Conta Gerencial)
  async getManagementAccounts(): Promise<ManagementAccount[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/management-accounts`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<ManagementAccount[]>(response);
  }

  async getManagementAccount(id: string): Promise<ManagementAccount> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/management-accounts/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<ManagementAccount>(response);
  }

  async createManagementAccount(data: CreateManagementAccountRequest): Promise<ManagementAccount> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/management-accounts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<ManagementAccount>(response);
  }

  async updateManagementAccount(id: string, data: UpdateManagementAccountRequest): Promise<ManagementAccount> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/management-accounts/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<ManagementAccount>(response);
  }

  async deleteManagementAccount(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/management-accounts/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<void>(response);
  }

  // Note: Management Accounts are no longer linked to Cost Center Types.
}

export const apiService = new ApiService(API_BASE_URL);
