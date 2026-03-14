export type Category = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type Item = {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  quantity: number;
  min_stock_level: number;
  price: number;
  created_at: string;
};

export type MovementType = 'IN' | 'OUT' | 'ADJUST';

export type Movement = {
  id: string;
  item_id: string;
  type: MovementType;
  quantity: number;
  reference_note: string | null;
  created_at: string;
};
