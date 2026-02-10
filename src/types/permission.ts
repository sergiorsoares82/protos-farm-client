export enum PermissionAction {
  VIEW = 'VIEW',
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  DELETE = 'DELETE'
}

export enum EntityType {
  // Core
  ORGANIZATION = 'ORGANIZATION',
  USER = 'USER',
  
  // Person/Party
  PERSON = 'PERSON',
  CLIENT = 'CLIENT',
  SUPPLIER = 'SUPPLIER',
  WORKER = 'WORKER',
  FARM_OWNER = 'FARM_OWNER',
  
  // Farm/Property
  FARM = 'FARM',
  RURAL_PROPERTY = 'RURAL_PROPERTY',
  FARM_RURAL_PROPERTY = 'FARM_RURAL_PROPERTY',
  LAND_REGISTRY = 'LAND_REGISTRY',
  PROPERTY_OWNERSHIP = 'PROPERTY_OWNERSHIP',
  STATE_REGISTRATION = 'STATE_REGISTRATION',
  STATE_REGISTRATION_PARTICIPANT = 'STATE_REGISTRATION_PARTICIPANT',
  STATE_REGISTRATION_LAND_REGISTRY = 'STATE_REGISTRATION_LAND_REGISTRY',
  
  // Field/Season
  FIELD = 'FIELD',
  FIELD_SEASON = 'FIELD_SEASON',
  SEASON = 'SEASON',
  WORK_LOCATION_TYPE = 'WORK_LOCATION_TYPE',
  
  // Financial/Accounting
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  COST_CENTER = 'COST_CENTER',
  COST_CENTER_CATEGORY = 'COST_CENTER_CATEGORY',
  MANAGEMENT_ACCOUNT = 'MANAGEMENT_ACCOUNT',
  MANAGEMENT_ACCOUNT_COST_CENTER_TYPE = 'MANAGEMENT_ACCOUNT_COST_CENTER_TYPE',
  
  // Invoice
  INVOICE = 'INVOICE',
  INVOICE_ITEM = 'INVOICE_ITEM',
  INVOICE_FINANCIAL = 'INVOICE_FINANCIAL',
  INVOICE_FINANCIALS_TYPE = 'INVOICE_FINANCIALS_TYPE',
  INVOICE_RECEIPT = 'INVOICE_RECEIPT',
  INVOICE_RECEIPT_ITEM = 'INVOICE_RECEIPT_ITEM',
  INVOICE_SHIPMENT = 'INVOICE_SHIPMENT',
  INVOICE_SHIPMENT_ITEM = 'INVOICE_SHIPMENT_ITEM',
  DOCUMENT_TYPE = 'DOCUMENT_TYPE',
  
  // Asset/Machine
  ASSET = 'ASSET',
  MACHINE = 'MACHINE',
  MACHINE_TYPE = 'MACHINE_TYPE',
  
  // Inventory/Product
  ITEM = 'ITEM',
  PRODUCT = 'PRODUCT',
  STOCK_MOVEMENT = 'STOCK_MOVEMENT',
  STOCK_MOVEMENT_TYPE = 'STOCK_MOVEMENT_TYPE',
  
  // Reference/Configuration
  ACTIVITY_TYPE = 'ACTIVITY_TYPE',
  OPERATION = 'OPERATION',
  UNIT_OF_MEASURE = 'UNIT_OF_MEASURE',
  UNIT_OF_MEASURE_CONVERSION = 'UNIT_OF_MEASURE_CONVERSION',
}

export interface Permission {
  id: string;
  entity: EntityType;
  action: PermissionAction;
  description: string;
  key: string;
  createdAt: string;
  updatedAt: string;
}

export interface RolePermissionsResponse {
  role: string;
  permissions: Permission[];
}

export interface CustomRolePermissionsResponse {
  roleId: string;
  tenantId: string | null;
  permissions: Permission[];
}

export interface CheckPermissionResponse {
  hasPermission: boolean;
  role: string;
  entity: EntityType;
  action: PermissionAction;
}

export const ENTITY_CATEGORIES = {
  'Core': [EntityType.ORGANIZATION, EntityType.USER],
  'Person/Party': [
    EntityType.PERSON,
    EntityType.CLIENT,
    EntityType.SUPPLIER,
    EntityType.WORKER,
    EntityType.FARM_OWNER,
  ],
  'Farm/Property': [
    EntityType.FARM,
    EntityType.RURAL_PROPERTY,
    EntityType.FARM_RURAL_PROPERTY,
    EntityType.LAND_REGISTRY,
    EntityType.PROPERTY_OWNERSHIP,
    EntityType.STATE_REGISTRATION,
    EntityType.STATE_REGISTRATION_PARTICIPANT,
    EntityType.STATE_REGISTRATION_LAND_REGISTRY,
  ],
  'Field/Season': [
    EntityType.FIELD,
    EntityType.FIELD_SEASON,
    EntityType.SEASON,
    EntityType.WORK_LOCATION_TYPE,
  ],
  'Financial/Accounting': [
    EntityType.BANK_ACCOUNT,
    EntityType.COST_CENTER,
    EntityType.COST_CENTER_CATEGORY,
    EntityType.MANAGEMENT_ACCOUNT,
    EntityType.MANAGEMENT_ACCOUNT_COST_CENTER_TYPE,
  ],
  'Invoice': [
    EntityType.INVOICE,
    EntityType.INVOICE_ITEM,
    EntityType.INVOICE_FINANCIAL,
    EntityType.INVOICE_FINANCIALS_TYPE,
    EntityType.INVOICE_RECEIPT,
    EntityType.INVOICE_RECEIPT_ITEM,
    EntityType.INVOICE_SHIPMENT,
    EntityType.INVOICE_SHIPMENT_ITEM,
    EntityType.DOCUMENT_TYPE,
  ],
  'Asset/Machine': [
    EntityType.ASSET,
    EntityType.MACHINE,
    EntityType.MACHINE_TYPE,
  ],
  'Inventory/Product': [
    EntityType.ITEM,
    EntityType.PRODUCT,
    EntityType.STOCK_MOVEMENT,
    EntityType.STOCK_MOVEMENT_TYPE,
  ],
  'Reference/Configuration': [
    EntityType.ACTIVITY_TYPE,
    EntityType.OPERATION,
    EntityType.UNIT_OF_MEASURE,
    EntityType.UNIT_OF_MEASURE_CONVERSION,
  ],
};
