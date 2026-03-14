-- ============================================================
-- IMS Full Refurbish Migration (Idempotent)
-- Run this in Supabase SQL Editor AFTER existing schema
-- ============================================================

-- 1. WAREHOUSES
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. LOCATIONS (belong to a warehouse)
DO $$ BEGIN
  CREATE TYPE location_type AS ENUM ('receive', 'internal', 'ship');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type location_type NOT NULL DEFAULT 'internal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Upgrade ITEMS table with new columns
ALTER TABLE items ADD COLUMN IF NOT EXISTS unit_of_measure TEXT NOT NULL DEFAULT 'units';
ALTER TABLE items ADD COLUMN IF NOT EXISTS reorder_point INTEGER NOT NULL DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

-- 5. OPERATION TYPES & STATUS
DO $$ BEGIN
  CREATE TYPE operation_type AS ENUM ('RECEIPT', 'DELIVERY', 'INTERNAL', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE operation_status AS ENUM ('DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 6. OPERATIONS (core table for all stock movements)
CREATE TABLE IF NOT EXISTS operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT,
  type operation_type NOT NULL,
  status operation_status NOT NULL DEFAULT 'DRAFT',
  source_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  destination_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  notes TEXT,
  scheduled_date DATE,
  done_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-generate reference numbers
CREATE OR REPLACE FUNCTION generate_operation_reference()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  seq_num INTEGER;
BEGIN
  CASE NEW.type
    WHEN 'RECEIPT' THEN prefix := 'REC';
    WHEN 'DELIVERY' THEN prefix := 'DEL';
    WHEN 'INTERNAL' THEN prefix := 'INT';
    WHEN 'ADJUSTMENT' THEN prefix := 'ADJ';
    ELSE prefix := 'OP';
  END CASE;

  SELECT COUNT(*) + 1 INTO seq_num FROM operations WHERE type = NEW.type;
  NEW.reference := prefix || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_operation_reference ON operations;
CREATE TRIGGER trg_generate_operation_reference
BEFORE INSERT ON operations
FOR EACH ROW
WHEN (NEW.reference IS NULL)
EXECUTE FUNCTION generate_operation_reference();

-- 7. OPERATION LINES (line items per operation)
CREATE TABLE IF NOT EXISTS operation_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_id UUID REFERENCES operations(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE RESTRICT,
  expected_qty INTEGER NOT NULL DEFAULT 0,
  done_qty INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Trigger: when an operation is set to DONE, update item quantities
CREATE OR REPLACE FUNCTION process_operation_done()
RETURNS TRIGGER AS $$
DECLARE
  line RECORD;
  qty_delta INTEGER;
BEGIN
  -- Only fire when status changes TO 'DONE'
  IF NEW.status = 'DONE' AND OLD.status != 'DONE' THEN
    NEW.done_date := NOW();

    FOR line IN SELECT * FROM operation_lines WHERE operation_id = NEW.id LOOP
      qty_delta := line.done_qty;
      
      IF NEW.type = 'RECEIPT' THEN
        UPDATE items SET quantity = quantity + qty_delta WHERE id = line.item_id;
      ELSIF NEW.type = 'DELIVERY' THEN
        UPDATE items SET quantity = quantity - qty_delta WHERE id = line.item_id;
      ELSIF NEW.type = 'ADJUSTMENT' THEN
        -- done_qty is the absolute new quantity, compute delta
        UPDATE items SET quantity = line.done_qty WHERE id = line.item_id;
      END IF;
      -- INTERNAL transfer: no net quantity change, just location
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_process_operation_done ON operations;
CREATE TRIGGER trg_process_operation_done
BEFORE UPDATE ON operations
FOR EACH ROW
EXECUTE FUNCTION process_operation_done();

-- 9. USER ROLES (for manager vs staff dashboard)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('manager', 'staff');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'staff',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'staff')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 10. RLS for new tables
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read warehouses" ON warehouses FOR SELECT USING (true);
  CREATE POLICY "Public write warehouses" ON warehouses FOR ALL USING (true);
  CREATE POLICY "Public read locations" ON locations FOR SELECT USING (true);
  CREATE POLICY "Public write locations" ON locations FOR ALL USING (true);
  CREATE POLICY "Public read suppliers" ON suppliers FOR SELECT USING (true);
  CREATE POLICY "Public write suppliers" ON suppliers FOR ALL USING (true);
  CREATE POLICY "Public read operations" ON operations FOR SELECT USING (true);
  CREATE POLICY "Public write operations" ON operations FOR ALL USING (true);
  CREATE POLICY "Public read operation_lines" ON operation_lines FOR SELECT USING (true);
  CREATE POLICY "Public write operation_lines" ON operation_lines FOR ALL USING (true);
  CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
  CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 11. Seed a default warehouse and locations
INSERT INTO warehouses (name, address)
SELECT 'Main Warehouse', '123 Industrial Park, City'
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE name = 'Main Warehouse');

DO $$
DECLARE wh_id UUID;
BEGIN
  SELECT id INTO wh_id FROM warehouses WHERE name = 'Main Warehouse';
  
  INSERT INTO locations (warehouse_id, name, type) SELECT wh_id, 'Receiving Dock', 'receive' WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Receiving Dock');
  INSERT INTO locations (warehouse_id, name, type) SELECT wh_id, 'Main Storage', 'internal' WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Main Storage');
  INSERT INTO locations (warehouse_id, name, type) SELECT wh_id, 'Production Floor', 'internal' WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Production Floor');
  INSERT INTO locations (warehouse_id, name, type) SELECT wh_id, 'Shipping Bay', 'ship' WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Shipping Bay');
END $$;
