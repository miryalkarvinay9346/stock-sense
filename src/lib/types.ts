export type UserRole = "INVENTORY_MANAGER" | "WAREHOUSE_STAFF";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
}

export interface Location {
  id: string;
  warehouseId: string;
  name: string;
  code: string;
  type: "internal" | "vendor" | "customer" | "inventory_loss";
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  uom: string; // e.g. "kg", "units", "meters", "boxes"
  minStockAlert: number;
}

export interface LocationStock {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
}

export type OperationType = "RECEIPT" | "DELIVERY" | "INTERNAL" | "ADJUSTMENT";
export type OperationStatus = "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELED";

export interface OperationLineItem {
  productId: string;
  quantity: number;
  productName?: string;
  sku?: string;
  uom?: string;
}

export interface StockOperation {
  id: string;
  reference: string; // e.g. "WH/IN/0001", "WH/OUT/0001", "WH/INT/0001", "WH/ADJ/0001"
  type: OperationType;
  status: OperationStatus;
  partnerName?: string; // Supplier for Receipt, Customer for Delivery
  sourceLocationId: string;
  destLocationId: string;
  lines: OperationLineItem[];
  date: string;
  notes?: string;
  createdBy: string;
}

export interface StockMoveLedger {
  id: string;
  date: string;
  reference: string;
  operationType: OperationType;
  productId: string;
  productName: string;
  sku: string;
  fromLocationName: string;
  toLocationName: string;
  quantity: number;
  uom: string;
  resultingBalance: number;
  createdBy: string;
}
