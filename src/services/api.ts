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
  nome: string;
  personType: string;
  cpfCnpj?: string;
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
  tenantId: string | null;
  name: string;
  group: string;
  hasAccessKey: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentTypeRequest {
  name: string;
  group: string;
  hasAccessKey: boolean;
  tenantId?: string | null;
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
  clientCategories?: string;
}

export interface SupplierRoleData {
  supplyCategories?: string;
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

export enum PersonType {
  FISICA = 'FISICA',
  JURIDICA = 'JURIDICA',
}

export interface CreatePersonRequest {
  nome: string;
  personType: PersonType;
  cpfCnpj?: string;
  email: string;
  phone?: string;
  userId?: string;
  roles: RoleAssignment[];
}

export interface UpdatePersonRequest {
  nome?: string;
  personType?: PersonType;
  cpfCnpj?: string | null;
  email?: string;
  phone?: string;
}

export interface Person {
  id: string;
  userId?: string;
  nome: string;
  personType: PersonType;
  cpfCnpj?: string;
  email: string;
  phone?: string;
  roles: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Farm (Fazenda) Types
export interface FarmOwnerItem {
  personId: string;
  personName: string;
  ownershipType?: string;
}

export interface Farm {
  id: string;
  tenantId: string;
  name: string;
  location?: string;
  totalArea?: number;
  owners: FarmOwnerItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFarmRequest {
  name: string;
  location?: string;
  totalArea?: number;
  ownerIds: string[];
  ownershipTypeByPersonId?: Record<string, string>;
}

export interface UpdateFarmRequest {
  name?: string;
  location?: string;
  totalArea?: number;
  ownerIds?: string[];
  ownershipTypeByPersonId?: Record<string, string>;
}

// Fundiário – Imóvel, Matrícula, Propriedade

export interface RuralProperty {
  id: string;
  tenantId: string;
  codigoSncr?: string | null;
  nirf?: string | null;
  nomeImovelIncra: string;
  municipio?: string | null;
  uf?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRuralPropertyRequest {
  nomeImovelIncra: string;
  codigoSncr?: string;
  nirf?: string;
  municipio?: string;
  uf?: string;
}

export interface LandRegistry {
  id: string;
  tenantId: string;
  ruralPropertyId?: string | null;
  numeroMatricula: string;
  cartorio: string;
  dataRegistro?: string | null;
  registro?: string | null;
  livroOuFicha?: string | null;
  areaHa?: number | null;
  municipio?: string | null;
  uf?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLandRegistryRequest {
  ruralPropertyId?: string;
  numeroMatricula: string;
  cartorio: string;
  dataRegistro?: string;
  registro?: string;
  livroOuFicha?: string;
  areaHa?: number;
  municipio?: string;
  uf?: string;
}

export interface PropertyOwnership {
  id: string;
  tenantId: string;
  landRegistryId: string;
  personId: string;
  percentualPosse?: number | null;
  dataAquisicao?: string | null;
  dataBaixa?: string | null;
  tipoAquisicao?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertLandRegistryOwnersRequest {
  owners: {
    personId: string;
    percentualPosse?: number;
    dataAquisicao?: string;
    tipoAquisicao?: string;
  }[];
}

// IE e Blocos de Produção

export interface StateRegistration {
  id: string;
  tenantId: string;
  personId: string;
  numeroIe: string;
  uf: string;
  situacao: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStateRegistrationRequest {
  personId: string;
  numeroIe: string;
  uf: string;
  situacao?: string;
}

export interface ProductionSite {
  id: string;
  tenantId: string;
  farmId: string;
  nomeBloco: string;
  descricao?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductionSiteRequest {
  farmId: string;
  nomeBloco: string;
  descricao?: string;
}

export interface ProductionSiteParcel {
  id: string;
  tenantId: string;
  productionSiteId: string;
  landRegistryId: string;
  areaHa?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertProductionSiteParcelsRequest {
  parcels: {
    landRegistryId: string;
    areaHa?: number;
  }[];
}

export interface ProductionSiteStateRegistration {
  id: string;
  tenantId: string;
  productionSiteId: string;
  stateRegistrationId: string;
  dataInicioVigencia: string;
  dataFimVigencia?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkProductionSiteStateRegistrationRequest {
  stateRegistrationId: string;
  dataInicioVigencia: string;
  dataFimVigencia?: string;
}

// Contratos de Exploração

export type ExplorationContractType =
  | 'ARRENDAMENTO'
  | 'PARCERIA'
  | 'PROPRIO'
  | 'COMODATO';

export interface ExplorationContract {
  id: string;
  tenantId: string;
  farmId: string;
  productionSiteId?: string | null;
  explorerId: string;
  landOwnerId?: string | null;
  stateRegistrationId?: string | null;
  tipoContrato: ExplorationContractType;
  dataInicio: string;
  dataFim?: string | null;
  valorContrato?: number | null;
  observacoes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExplorationContractRequest {
  farmId: string;
  productionSiteId?: string;
  explorerId: string;
  landOwnerId?: string;
  stateRegistrationId?: string;
  tipoContrato: ExplorationContractType;
  dataInicio: string;
  dataFim?: string;
  valorContrato?: number;
  observacoes?: string;
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
  /** Código da unidade de medida (obrigatório). */
  unit: string;
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

// Invoice (Nota Fiscal) Types
export enum InvoiceType {
  RECEITA = 'RECEITA',
  DESPESA = 'DESPESA',
}

export enum InvoiceFinancialStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export interface InvoiceItemDTO {
  id?: string;
  itemId: string;
  description?: string;
  itemType: ItemType;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineOrder: number;
  costCenterId?: string | null;
  managementAccountId?: string | null;
  seasonId?: string | null;
  goesToStock?: boolean;
  /** Se true, ao salvar recebe o produto no estoque (quantidade da nota, data de emissão) */
  received?: boolean;
  /** Para receitas: se true, ao salvar registra saída imediata (quantidade da nota, data de emissão) */
  shipped?: boolean;
}

export interface InvoiceFinancialDTO {
  id?: string;
  dueDate: string;
  amount: number;
  paidAt?: string;
  clearedAt?: string;
  penalty?: number;
  interest?: number;
  bankAccountId?: string | null;
  invoiceFinancialsTypeId?: string | null;
  status?: InvoiceFinancialStatus;
}

export interface Invoice {
  id: string;
  tenantId: string;
  number: string;
  series?: string;
  issueDate: string;
  supplierId: string;
  documentTypeId?: string;
  documentType?: DocumentType;
  notes?: string;
  type: InvoiceType;
  items: (InvoiceItemDTO & { id: string; invoiceId: string; totalPrice?: number; quantityReceivedTotal?: number })[];
  financials: (InvoiceFinancialDTO & { id: string; invoiceId: string })[];
  itemsTotal?: number;
  financialsTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceReceiptItemDTO {
  id: string;
  invoiceItemId: string;
  quantityReceived: number;
}

export interface InvoiceReceiptDTO {
  id: string;
  invoiceId: string;
  receiptDate: string;
  notes?: string | null;
  items: InvoiceReceiptItemDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceReceiptRequest {
  receiptDate: string;
  notes?: string | null;
  items: { invoiceItemId: string; quantityReceived: number }[];
}

export interface InvoiceShipmentItemDTO {
  id: string;
  invoiceItemId: string;
  quantityShipped: number;
}

export interface InvoiceShipmentDTO {
  id: string;
  invoiceId: string;
  shipmentDate: string;
  notes?: string | null;
  items: InvoiceShipmentItemDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceShipmentRequest {
  shipmentDate: string;
  notes?: string | null;
  items: { invoiceItemId: string; quantityShipped: number }[];
}

export interface CreateInvoiceRequest {
  number: string;
  series?: string;
  issueDate: string;
  supplierId: string;
  documentTypeId?: string;
  notes?: string;
  type: InvoiceType;
  items: InvoiceItemDTO[];
  financials: InvoiceFinancialDTO[];
}

export interface UpdateInvoiceRequest {
  number?: string;
  series?: string;
  issueDate?: string;
  supplierId?: string;
  documentTypeId?: string;
  notes?: string;
  type?: InvoiceType;
  items?: InvoiceItemDTO[];
  financials?: InvoiceFinancialDTO[];
}

export interface Supplier {
  id: string;
  personId: string;
  supplyCategories?: string | null;
  person: {
    id: string;
    nome: string;
    personType: string;
    cpfCnpj?: string | null;
    email: string;
  } | null;
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
  assetId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCostCenterRequest {
  code: string;
  description: string;
  type: CostCenterType;
  categoryId?: string;
  assetId?: string;
}

export interface UpdateCostCenterRequest {
  code?: string;
  description?: string;
  type?: CostCenterType;
  categoryId?: string;
  assetId?: string;
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

// Work location type (user-managed entity; only SuperAdmin and OrgAdmin can manage)
export interface WorkLocationType {
  id: string;
  /** Null for system types (e.g. Talhão) available to all organizations. */
  tenantId: string | null;
  code: string;
  name: string;
  isTalhao: boolean;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkLocationTypeRequest {
  code: string;
  name: string;
  isTalhao: boolean;
}

export interface UpdateWorkLocationTypeRequest {
  code?: string;
  name?: string;
  isActive?: boolean;
}

// Invoice financial (payment) type – Super admin can edit system types; Org admin can view system and create org types
export interface InvoiceFinancialsType {
  id: string;
  tenantId: string | null;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceFinancialsTypeRequest {
  name: string;
  /** Super admin only: null = system type, uuid = for that org. Omit for current tenant. */
  tenantId?: string | null;
}

export interface UpdateInvoiceFinancialsTypeRequest {
  name?: string;
  isActive?: boolean;
}

// Unit of measure (unidade de medida: system + per-org; SuperAdmin/OrgAdmin)
export interface UnitOfMeasure {
  id: string;
  tenantId: string | null;
  code: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitOfMeasureRequest {
  code: string;
  name: string;
  /** SuperAdmin only: create system-wide unit for all organizations. */
  isSystem?: boolean;
  /** SuperAdmin only: create for specific org; omit for current tenant. */
  tenantId?: string | null;
}

export interface UpdateUnitOfMeasureRequest {
  code?: string;
  name?: string;
  isActive?: boolean;
}

// Unit of measure conversion (ex.: 1 T = 1000 KG; same access rules as unit of measure)
export interface UnitOfMeasureConversion {
  id: string;
  tenantId: string | null;
  fromUnitId: string;
  toUnitId: string;
  factor: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitOfMeasureConversionRequest {
  fromUnitId: string;
  toUnitId: string;
  /** 1 fromUnit = factor * toUnit */
  factor: number;
  /** SuperAdmin only: system-wide conversion for all organizations. */
  isSystem?: boolean;
  tenantId?: string | null;
}

export interface UpdateUnitOfMeasureConversionRequest {
  factor?: number;
}

// Stock movement type (tipo de movimento de estoque; only SuperAdmin can manage in UI)
export enum StockMovementDirection {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
}

export interface StockMovementType {
  id: string;
  tenantId: string | null;
  code: string;
  name: string;
  direction: StockMovementDirection;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockMovementTypeRequest {
  code: string;
  name: string;
  direction: StockMovementDirection;
}

export interface UpdateStockMovementTypeRequest {
  code?: string;
  name?: string;
  direction?: StockMovementDirection;
  isActive?: boolean;
}

// Stock movement (movimento de estoque)
export interface StockMovement {
  id: string;
  tenantId: string;
  movementDate: string; // ISO date
  stockMovementTypeId: string;
  itemId: string;
  unit: string;
  quantity: number;
  workLocationId: string | null;
  seasonId: string | null;
  costCenterId: string | null;
  managementAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockMovementRequest {
  movementDate: string;
  stockMovementTypeId: string;
  itemId: string;
  unit: string;
  quantity: number;
  workLocationId?: string | null;
  seasonId?: string | null;
  costCenterId?: string | null;
  managementAccountId?: string | null;
}

export interface UpdateStockMovementRequest {
  movementDate?: string;
  stockMovementTypeId?: string;
  itemId?: string;
  unit?: string;
  quantity?: number;
  workLocationId?: string | null;
  seasonId?: string | null;
  costCenterId?: string | null;
  managementAccountId?: string | null;
}

export interface WorkLocation {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  typeId: string;
  typeCode: string;
  isTalhao: boolean;
  areaHectares: number | null;
  costCenterId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkLocationRequest {
  code: string;
  name: string;
  typeId: string;
  areaHectares?: number | null;
  costCenterId?: string | null;
}

export interface UpdateWorkLocationRequest {
  code?: string;
  name?: string;
  typeId?: string;
  areaHectares?: number | null;
  costCenterId?: string | null;
  isActive?: boolean;
}

/** @deprecated Use WorkLocation. Kept for Seasons page (fieldId in SeasonFieldLink = work location id for talhão). */
export type Field = WorkLocation;

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

// Machines (cadastro de máquinas)
export interface MachineItem {
  id: string;
  tenantId: string;
  name: string;
  machineTypeId: string;
  assetId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMachineRequest {
  name: string;
  machineTypeId: string;
  assetId?: string;
}

export interface UpdateMachineRequest {
  name?: string;
  machineTypeId?: string;
  assetId?: string;
  isActive?: boolean;
}

// Assets (patrimônio: máquinas, implementos, equipamentos, benfeitorias)
export enum AssetKind {
  MACHINE = 'MACHINE',
  IMPLEMENT = 'IMPLEMENT',
  EQUIPMENT = 'EQUIPMENT',
  IMPROVEMENT = 'IMPROVEMENT',
}

export interface Asset {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  assetKind: AssetKind;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetRequest {
  name: string;
  code?: string;
  assetKind: AssetKind;
}

export interface UpdateAssetRequest {
  name?: string;
  code?: string;
  assetKind?: AssetKind;
  isActive?: boolean;
}

/** Creates Asset + Machine + CostCenter in one call. */
export interface CreateFullMachineRequest {
  name: string;
  code?: string;
  machineTypeId: string;
  costCenterCode?: string;
  costCenterDescription?: string;
  costCenterType: string; // PRODUCTIVE | ADMINISTRATIVE | SHARED
  costCenterCategoryId?: string;
}

export interface CreateFullMachineResponse {
  asset: Asset;
  machine: MachineItem;
  costCenter: { id: string; code: string; description: string; type: string; assetId?: string; [key: string]: unknown };
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

// Bank Account Types
export interface BankAccount {
  id: string;
  tenantId: string;
  name: string;
  bankName: string | null;
  agency: string | null;
  accountNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankAccountRequest {
  name: string;
  bankName?: string | null;
  agency?: string | null;
  accountNumber?: string | null;
}

export interface UpdateBankAccountRequest {
  name?: string;
  bankName?: string | null;
  agency?: string | null;
  accountNumber?: string | null;
  isActive?: boolean;
}

// API Configuration
// In development, requests go directly to the backend (default http://localhost:3000).
// Override with VITE_API_URL if your backend runs on another host/port.
// In production, use your public API URL.
const API_BASE_URL =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.PROD ? 'https://api.protosfarm.com.br' : 'http://localhost:3000');

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

  // Farm (Fazenda) APIs
  async getFarms(): Promise<Farm[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/farms`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: Farm[] }>(response);
    return data.data;
  }

  async getFarm(id: string): Promise<Farm> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/farms/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: Farm }>(response);
    return data.data;
  }

  async createFarm(body: CreateFarmRequest): Promise<Farm> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/farms`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await this.handleResponse<{ success: boolean; data: Farm }>(response);
    return data.data;
  }

  async updateFarm(id: string, body: UpdateFarmRequest): Promise<Farm> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/farms/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await this.handleResponse<{ success: boolean; data: Farm }>(response);
    return data.data;
  }

  async deleteFarm(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/farms/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<{ success: boolean }>(response);
  }

  // Fundiário: Imóveis & Matrículas

  async getRuralProperties(): Promise<RuralProperty[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/rural-properties`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: RuralProperty[] }>(response);
    return data.data;
  }

  async createRuralProperty(body: CreateRuralPropertyRequest): Promise<RuralProperty> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/rural-properties`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await this.handleResponse<{ success: boolean; data: RuralProperty }>(response);
    return data.data;
  }

  async getLandRegistries(): Promise<LandRegistry[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/land-registries`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: LandRegistry[] }>(response);
    return data.data;
  }

  async createLandRegistry(body: CreateLandRegistryRequest): Promise<LandRegistry> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/land-registries`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await this.handleResponse<{ success: boolean; data: LandRegistry }>(response);
    return data.data;
  }

  async upsertLandRegistryOwners(
    landRegistryId: string,
    body: UpsertLandRegistryOwnersRequest,
  ): Promise<PropertyOwnership[]> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/land-registries/${landRegistryId}/owners`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body),
      },
    );
    const data = await this.handleResponse<{ success: boolean; data: PropertyOwnership[] }>(
      response,
    );
    return data.data;
  }

  // IE & Blocos de Produção

  async getStateRegistrations(): Promise<StateRegistration[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/state-registrations`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: StateRegistration[] }>(
      response,
    );
    return data.data;
  }

  async createStateRegistration(
    body: CreateStateRegistrationRequest,
  ): Promise<StateRegistration> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/state-registrations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await this.handleResponse<{ success: boolean; data: StateRegistration }>(
      response,
    );
    return data.data;
  }

  async getProductionSitesByFarm(farmId: string): Promise<ProductionSite[]> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/farms/${farmId}/production-sites`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    );
    const data = await this.handleResponse<{ success: boolean; data: ProductionSite[] }>(
      response,
    );
    return data.data;
  }

  async createProductionSite(body: CreateProductionSiteRequest): Promise<ProductionSite> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/production-sites`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await this.handleResponse<{ success: boolean; data: ProductionSite }>(response);
    return data.data;
  }

  async upsertProductionSiteParcels(
    productionSiteId: string,
    body: UpsertProductionSiteParcelsRequest,
  ): Promise<ProductionSiteParcel[]> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/production-sites/${productionSiteId}/parcels`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body),
      },
    );
    const data = await this.handleResponse<{ success: boolean; data: ProductionSiteParcel[] }>(
      response,
    );
    return data.data;
  }

  async linkProductionSiteStateRegistration(
    productionSiteId: string,
    body: LinkProductionSiteStateRegistrationRequest,
  ): Promise<ProductionSiteStateRegistration> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/production-sites/${productionSiteId}/state-registrations`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body),
      },
    );
    const data = await this.handleResponse<{
      success: boolean;
      data: ProductionSiteStateRegistration;
    }>(response);
    return data.data;
  }

  // Contratos de Exploração

  async getExplorationContractsByFarm(farmId: string): Promise<ExplorationContract[]> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/farms/${farmId}/exploration-contracts`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    );
    const data = await this.handleResponse<{ success: boolean; data: ExplorationContract[] }>(
      response,
    );
    return data.data;
  }

  async createExplorationContract(
    body: CreateExplorationContractRequest,
  ): Promise<ExplorationContract> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/exploration-contracts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await this.handleResponse<{ success: boolean; data: ExplorationContract }>(
      response,
    );
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

  // Invoice (Nota Fiscal) Management
  async getInvoices(options?: {
    pendingReceipt?: boolean;
    withReceipts?: boolean;
    pendingShipment?: boolean;
    withShipments?: boolean;
  }): Promise<Invoice[]> {
    const params = new URLSearchParams();
    if (options?.pendingReceipt) params.set('pendingReceipt', 'true');
    if (options?.withReceipts) params.set('withReceipts', 'true');
    if (options?.pendingShipment) params.set('pendingShipment', 'true');
    if (options?.withShipments) params.set('withShipments', 'true');
    const url = params.toString() ? `${this.baseUrl}/api/invoices?${params}` : `${this.baseUrl}/api/invoices`;
    const response = await this.fetchWithRetry(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: Invoice[] }>(response);
    return data.data;
  }

  async getInvoice(id: string): Promise<Invoice> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/invoices/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: Invoice }>(response);
    return data.data;
  }

  async createInvoice(payload: CreateInvoiceRequest): Promise<Invoice> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/invoices`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await this.handleResponse<{ success: boolean; data: Invoice }>(response);
    return data.data;
  }

  async updateInvoice(id: string, payload: UpdateInvoiceRequest): Promise<Invoice> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/invoices/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await this.handleResponse<{ success: boolean; data: Invoice }>(response);
    return data.data;
  }

  async deleteInvoice(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/invoices/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<{ success: boolean }>(response);
  }

  async markInvoiceFinancialAsPaid(invoiceId: string, financialId: string, paidAt?: string): Promise<Invoice> {
    const url = `${this.baseUrl}/api/invoices/${invoiceId}/financials/${financialId}/mark-paid`;
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(paidAt ? { paidAt } : {}),
    });
    const data = await this.handleResponse<{ success: boolean; data: Invoice }>(response);
    return data.data;
  }

  async getInvoiceReceipts(invoiceId: string): Promise<InvoiceReceiptDTO[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/invoices/${invoiceId}/receipts`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: InvoiceReceiptDTO[] }>(response);
    return data.data;
  }

  async createInvoiceReceipt(invoiceId: string, payload: CreateInvoiceReceiptRequest): Promise<InvoiceReceiptDTO> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/invoices/${invoiceId}/receipts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await this.handleResponse<{ success: boolean; data: InvoiceReceiptDTO }>(response);
    return data.data;
  }

  async deleteInvoiceReceipt(invoiceId: string, receiptId: string): Promise<void> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/invoices/${invoiceId}/receipts/${receiptId}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      }
    );
    await this.handleResponse<{ success: boolean }>(response);
  }

  async getInvoiceShipments(invoiceId: string): Promise<InvoiceShipmentDTO[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/invoices/${invoiceId}/shipments`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: InvoiceShipmentDTO[] }>(response);
    return data.data;
  }

  async createInvoiceShipment(
    invoiceId: string,
    payload: CreateInvoiceShipmentRequest,
  ): Promise<InvoiceShipmentDTO> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/invoices/${invoiceId}/shipments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await this.handleResponse<{ success: boolean; data: InvoiceShipmentDTO }>(response);
    return data.data;
  }

  async deleteInvoiceShipment(invoiceId: string, shipmentId: string): Promise<void> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/invoices/${invoiceId}/shipments/${shipmentId}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      }
    );
    await this.handleResponse<{ success: boolean }>(response);
  }

  async getSuppliers(): Promise<Supplier[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/suppliers`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ success: boolean; data: Supplier[] }>(response);
    return data.data;
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

  // Work locations (Locais de Trabalho: talhões, galpões, ordenha, fábrica de ração, etc.)
  async getWorkLocations(): Promise<WorkLocation[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/work-locations`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<WorkLocation[]>(response);
  }

  async createWorkLocation(data: CreateWorkLocationRequest): Promise<WorkLocation> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/work-locations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<WorkLocation>(response);
  }

  async updateWorkLocation(
    id: string,
    data: UpdateWorkLocationRequest,
  ): Promise<WorkLocation> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/work-locations/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<WorkLocation>(response);
  }

  async deleteWorkLocation(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/work-locations/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<void>(response);
  }

  // Work location types (only SuperAdmin and OrgAdmin can create/update/delete)
  async getWorkLocationTypes(): Promise<WorkLocationType[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/work-location-types`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<WorkLocationType[]>(response);
  }

  async createWorkLocationType(data: CreateWorkLocationTypeRequest): Promise<WorkLocationType> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/work-location-types`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<WorkLocationType>(response);
  }

  async updateWorkLocationType(
    id: string,
    data: UpdateWorkLocationTypeRequest,
  ): Promise<WorkLocationType> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/work-location-types/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<WorkLocationType>(response);
  }

  async deleteWorkLocationType(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/work-location-types/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<void>(response);
  }

  // Invoice financial (payment) types – Super admin can edit system; Org admin can view system and create org types
  async getInvoiceFinancialsTypes(): Promise<InvoiceFinancialsType[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/invoice-financials-types`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<InvoiceFinancialsType[]>(response);
  }

  async createInvoiceFinancialsType(data: CreateInvoiceFinancialsTypeRequest): Promise<InvoiceFinancialsType> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/invoice-financials-types`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<InvoiceFinancialsType>(response);
  }

  async updateInvoiceFinancialsType(
    id: string,
    data: UpdateInvoiceFinancialsTypeRequest,
  ): Promise<InvoiceFinancialsType> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/invoice-financials-types/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<InvoiceFinancialsType>(response);
  }

  async deleteInvoiceFinancialsType(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/invoice-financials-types/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<void>(response);
  }

  // Unit of measure (unidade de medida)
  async getUnitOfMeasures(): Promise<UnitOfMeasure[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/unit-of-measures`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<UnitOfMeasure[]>(response);
  }

  async createUnitOfMeasure(data: CreateUnitOfMeasureRequest): Promise<UnitOfMeasure> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/unit-of-measures`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<UnitOfMeasure>(response);
  }

  async updateUnitOfMeasure(
    id: string,
    data: UpdateUnitOfMeasureRequest,
  ): Promise<UnitOfMeasure> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/unit-of-measures/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<UnitOfMeasure>(response);
  }

  async deleteUnitOfMeasure(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/unit-of-measures/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<void>(response);
  }

  // Unit of measure conversions (mesmas regras de acesso que unidades de medida)
  async getUnitOfMeasureConversions(): Promise<UnitOfMeasureConversion[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/unit-of-measure-conversions`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<UnitOfMeasureConversion[]>(response);
  }

  async createUnitOfMeasureConversion(
    data: CreateUnitOfMeasureConversionRequest,
  ): Promise<UnitOfMeasureConversion> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/unit-of-measure-conversions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<UnitOfMeasureConversion>(response);
  }

  async updateUnitOfMeasureConversion(
    id: string,
    data: UpdateUnitOfMeasureConversionRequest,
  ): Promise<UnitOfMeasureConversion> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/unit-of-measure-conversions/${id}`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );
    return await this.handleResponse<UnitOfMeasureConversion>(response);
  }

  async deleteUnitOfMeasureConversion(id: string): Promise<void> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/unit-of-measure-conversions/${id}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      },
    );
    await this.handleResponse<void>(response);
  }

  // Stock movement types (tipos de movimento de estoque; only SuperAdmin can access in UI)
  async getStockMovementTypes(): Promise<StockMovementType[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/stock-movement-types`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<StockMovementType[]>(response);
  }

  async createStockMovementType(data: CreateStockMovementTypeRequest): Promise<StockMovementType> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/stock-movement-types`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<StockMovementType>(response);
  }

  async updateStockMovementType(
    id: string,
    data: UpdateStockMovementTypeRequest,
  ): Promise<StockMovementType> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/stock-movement-types/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<StockMovementType>(response);
  }

  async deleteStockMovementType(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/stock-movement-types/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<void>(response);
  }

  // Stock movements (movimentos de estoque)
  async getStockMovements(): Promise<StockMovement[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/stock-movements`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<StockMovement[]>(response);
  }

  async getStockMovement(id: string): Promise<StockMovement> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/stock-movements/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<StockMovement>(response);
  }

  async createStockMovement(data: CreateStockMovementRequest): Promise<StockMovement> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/stock-movements`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<StockMovement>(response);
  }

  async updateStockMovement(
    id: string,
    data: UpdateStockMovementRequest,
  ): Promise<StockMovement> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/stock-movements/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<StockMovement>(response);
  }

  async deleteStockMovement(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/stock-movements/${id}`, {
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

  // Machines (cadastro de máquinas)
  async getMachines(): Promise<MachineItem[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/machines`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<MachineItem[]>(response);
  }

  async getMachine(id: string): Promise<MachineItem> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/machines/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<MachineItem>(response);
  }

  async createMachine(data: CreateMachineRequest): Promise<MachineItem> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/machines`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<MachineItem>(response);
  }

  async updateMachine(id: string, data: UpdateMachineRequest): Promise<MachineItem> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/machines/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<MachineItem>(response);
  }

  async deleteMachine(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/machines/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<void>(response);
  }

  // Assets (patrimônio)
  async getAssets(): Promise<Asset[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/assets`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<Asset[]>(response);
  }

  async getAsset(id: string): Promise<Asset> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/assets/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<Asset>(response);
  }

  async createAsset(data: CreateAssetRequest): Promise<Asset> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/assets`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<Asset>(response);
  }

  async updateAsset(id: string, data: UpdateAssetRequest): Promise<Asset> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/assets/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<Asset>(response);
  }

  async deleteAsset(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/assets/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<void>(response);
  }

  /** Create Asset + Machine + CostCenter in one call (e.g. "Trator 01"). */
  async createFullMachine(data: CreateFullMachineRequest): Promise<CreateFullMachineResponse> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/assets/full-machine`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<CreateFullMachineResponse>(response);
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

  // Bank accounts (contas bancárias)
  async getBankAccounts(): Promise<BankAccount[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/bank-accounts`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<BankAccount[]>(response);
  }

  async getBankAccount(id: string): Promise<BankAccount> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/bank-accounts/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<BankAccount>(response);
  }

  async createBankAccount(data: CreateBankAccountRequest): Promise<BankAccount> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/bank-accounts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<BankAccount>(response);
  }

  async updateBankAccount(id: string, data: UpdateBankAccountRequest): Promise<BankAccount> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/bank-accounts/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await this.handleResponse<BankAccount>(response);
  }

  async deleteBankAccount(id: string): Promise<void> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/bank-accounts/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<void>(response);
  }
}

export const apiService = new ApiService(API_BASE_URL);
