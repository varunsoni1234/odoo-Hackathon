// ============================================================
// Database Types — IMS Refurbish
// ============================================================

export type UserRole = 'manager' | 'staff';

export type UserProfile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type Supplier = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export type Warehouse = {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
};

export type LocationType = 'receive' | 'internal' | 'ship';

export type Location = {
  id: string;
  warehouse_id: string;
  name: string;
  type: LocationType;
  created_at: string;
  warehouses?: Pick<Warehouse, 'name'>;
};

export type Item = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  supplier_id: string | null;
  quantity: number;
  min_stock_level: number;
  reorder_point: number;
  unit_of_measure: string;
  price: number;
  created_at: string;
};

export type OperationType = 'RECEIPT' | 'DELIVERY' | 'INTERNAL' | 'ADJUSTMENT';
export type OperationStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';

export type Operation = {
  id: string;
  reference: string | null;
  type: OperationType;
  status: OperationStatus;
  source_location_id: string | null;
  destination_location_id: string | null;
  supplier_id: string | null;
  notes: string | null;
  scheduled_date: string | null;
  done_date: string | null;
  created_at: string;
};

export type OperationLine = {
  id: string;
  operation_id: string;
  item_id: string;
  expected_qty: number;
  done_qty: number;
  created_at: string;
};

// Legacy types for backward compatibility
export type MovementType = 'IN' | 'OUT' | 'ADJUST';
export type Movement = {
  id: string;
  item_id: string;
  type: MovementType;
  quantity: number;
  reference_note: string | null;
  created_at: string;
};
