-- Phase 2: Core IMS Schema Initialization

-- 1. Create Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Items Table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Movements Table
CREATE TYPE movement_type AS ENUM ('IN', 'OUT', 'ADJUST');

CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  type movement_type NOT NULL,
  quantity INTEGER NOT NULL, -- Positive for IN/ADJUST (if adding), Negative for OUT/ADJUST (if removing)
  reference_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create trigger to automatically update `items` quantity when a `movement` occurs
CREATE OR REPLACE FUNCTION update_item_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE items
    SET quantity = quantity + NEW.quantity
    WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_item_quantity
AFTER INSERT ON movements
FOR EACH ROW
EXECUTE FUNCTION update_item_quantity();

-- 5. Row Level Security Setup (basic open policy for MVP purposes, tighten in production)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON categories FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON items FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON movements FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON movements FOR UPDATE USING (true);
