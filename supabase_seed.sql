-- ============================================================
-- IMS Refurbish - Real World Data Seed Script
-- Run this in Supabase SQL Editor AFTER the migration script
-- ============================================================

-- NOTE: This script adds realistic data for an Electronics/Hardware distributor.

-- 1. Categories
INSERT INTO categories (name, description) VALUES
('Laptops', 'High-performance and business laptops'),
('Peripherals', 'Keyboards, mice, and external devices'),
('Components', 'Internal computer parts like GPUs, CPUs, RAM'),
('Accessories', 'Cables, cases, stands')
ON CONFLICT (name) DO NOTHING;

-- 2. Suppliers
INSERT INTO suppliers (name, email, phone) VALUES
('TechCorp Distribution', 'sales@techcorp.com', '+1-800-555-0101'),
('Global Components Ltd', 'orders@globalcomp.com', '+1-800-555-0102'),
('Office & Tech Supplies', 'info@officetech.com', '+1-800-555-0103');

-- 3. Warehouses
INSERT INTO warehouses (name, address) VALUES
('Regional Distribution Center', '100 Logistics Blvd, Warehouse District'),
('Downtown Store Front', '500 Commerce St, City Center')
ON CONFLICT (name) DO NOTHING;

-- 4. Locations
DO $$
DECLARE
  wh_dist UUID;
  wh_store UUID;
BEGIN
  SELECT id INTO wh_dist FROM warehouses WHERE name = 'Regional Distribution Center';
  SELECT id INTO wh_store FROM warehouses WHERE name = 'Downtown Store Front';

  -- Locations for Distribution Center
  IF wh_dist IS NOT NULL AND NOT EXISTS (SELECT 1 FROM locations WHERE warehouse_id = wh_dist AND name = 'Docks (Inbound)') THEN
    INSERT INTO locations (warehouse_id, name, type) VALUES
    (wh_dist, 'Docks (Inbound)', 'receive'),
    (wh_dist, 'Aisle A - High Value', 'internal'),
    (wh_dist, 'Aisle B - Bulk', 'internal'),
    (wh_dist, 'Shipping Area', 'ship');
  END IF;

  -- Locations for Store Front
  IF wh_store IS NOT NULL AND NOT EXISTS (SELECT 1 FROM locations WHERE warehouse_id = wh_store AND name = 'Shop Floor Display') THEN
    INSERT INTO locations (warehouse_id, name, type) VALUES
    (wh_store, 'Backroom Receiving', 'receive'),
    (wh_store, 'Shop Floor Display', 'internal'),
    (wh_store, 'Customer Pickup', 'ship');
  END IF;
END $$;

-- 5. Items (Products)
DO $$
DECLARE
  cat_laptops UUID;
  cat_peripherals UUID;
  cat_components UUID;
  cat_accessories UUID;
  sup_techcorp UUID;
  sup_global UUID;
  sup_office UUID;
BEGIN
  SELECT id INTO cat_laptops FROM categories WHERE name = 'Laptops';
  SELECT id INTO cat_peripherals FROM categories WHERE name = 'Peripherals';
  SELECT id INTO cat_components FROM categories WHERE name = 'Components';
  SELECT id INTO cat_accessories FROM categories WHERE name = 'Accessories';
  
  SELECT id INTO sup_techcorp FROM suppliers WHERE name = 'TechCorp Distribution';
  SELECT id INTO sup_global FROM suppliers WHERE name = 'Global Components Ltd';
  SELECT id INTO sup_office FROM suppliers WHERE name = 'Office & Tech Supplies';

  INSERT INTO items (sku, name, description, category_id, supplier_id, min_stock_level, reorder_point, unit_of_measure, price, quantity) VALUES
  ('LAP-PRO-15', 'MacBook Pro 15"', 'M2 Chip, 16GB RAM, 512GB SSD', cat_laptops, sup_techcorp, 10, 15, 'units', 1999.00, 0),
  ('LAP-AIR-13', 'MacBook Air 13"', 'M2 Chip, 8GB RAM, 256GB SSD', cat_laptops, sup_techcorp, 15, 20, 'units', 1199.00, 0),
  ('PER-KB-MEC', 'Mechanical Keyboard', 'RGB, Cherry MX Red', cat_peripherals, sup_global, 20, 25, 'units', 129.99, 0),
  ('PER-MS-WIR', 'Wireless Mouse', 'Ergonomic, 4000 DPI', cat_peripherals, sup_office, 30, 40, 'units', 79.99, 0),
  ('COM-GPU-4090', 'RTX 4090 GPU', '24GB GDDR6X', cat_components, sup_global, 5, 5, 'units', 1599.00, 0),
  ('COM-CPU-9950X', 'Ryzen 9 9950X', '16-Core, 32-Thread Processor', cat_components, sup_global, 10, 15, 'units', 649.00, 0),
  ('ACC-HDMI-2M', 'HDMI Cable 2m', '4K 60Hz Braided', cat_accessories, sup_office, 50, 60, 'units', 14.99, 0),
  ('ACC-USB-C-1M', 'USB-C Charging Cable', '100W PD compatible', cat_accessories, sup_office, 100, 150, 'units', 19.99, 0)
  ON CONFLICT (sku) DO NOTHING;
END $$;

-- 6. Initial Operations (Seed completed receipts to add actual stock quantities)
DO $$
DECLARE
  loc_receive UUID;
  loc_store UUID;
  sup_techcorp UUID;
  sup_global UUID;
  item_macbook UUID;
  item_gpu UUID;
  item_cable UUID;
  op_id UUID;
BEGIN
  -- We'll just run this once so we don't accidentally multiply stock if run repeatedly
  IF NOT EXISTS (SELECT 1 FROM operations WHERE notes = 'Initial System Record - Seed Data Batch 1') THEN

    SELECT id INTO loc_receive FROM locations WHERE name = 'Docks (Inbound)' LIMIT 1;
    SELECT id INTO loc_store FROM locations WHERE name = 'Aisle A - High Value' LIMIT 1;
    SELECT id INTO sup_techcorp FROM suppliers WHERE name = 'TechCorp Distribution' LIMIT 1;
    SELECT id INTO sup_global FROM suppliers WHERE name = 'Global Components Ltd' LIMIT 1;
    
    SELECT id INTO item_macbook FROM items WHERE sku = 'LAP-PRO-15' LIMIT 1;
    SELECT id INTO item_gpu FROM items WHERE sku = 'COM-GPU-4090' LIMIT 1;
    SELECT id INTO item_cable FROM items WHERE sku = 'ACC-USB-C-1M' LIMIT 1;

    -- CREATE RECEIPT 1
    INSERT INTO operations (type, status, source_location_id, destination_location_id, supplier_id, notes, scheduled_date)
    VALUES ('RECEIPT', 'READY', NULL, loc_receive, sup_techcorp, 'Initial System Record - Seed Data Batch 1', CURRENT_DATE)
    RETURNING id INTO op_id;

    -- Add lines for receipt 1 and mark done_qty = expected_qty so the trigger processes it correctly
    INSERT INTO operation_lines (operation_id, item_id, expected_qty, done_qty) VALUES
    (op_id, item_macbook, 50, 50),
    (op_id, item_cable, 200, 200);

    -- Validate receipt 1 to DONE (this triggers stock update to +50 and +200)
    UPDATE operations SET status = 'DONE', done_date = NOW() WHERE id = op_id;


    -- CREATE RECEIPT 2
    INSERT INTO operations (type, status, source_location_id, destination_location_id, supplier_id, notes, scheduled_date)
    VALUES ('RECEIPT', 'READY', NULL, loc_receive, sup_global, 'Initial System Record - Seed Data Batch 2', CURRENT_DATE)
    RETURNING id INTO op_id;

    INSERT INTO operation_lines (operation_id, item_id, expected_qty, done_qty) VALUES
    (op_id, item_gpu, 25, 25);

    UPDATE operations SET status = 'DONE', done_date = NOW() WHERE id = op_id;


    -- CREATE A PENDING DELIVERY ORDER (To show in "Today's Tasks")
    INSERT INTO operations (type, status, source_location_id, destination_location_id, supplier_id, notes, scheduled_date)
    VALUES ('DELIVERY', 'WAITING', loc_store, NULL, NULL, 'Pending B2B Order #8841', CURRENT_DATE + INTERVAL '1 day')
    RETURNING id INTO op_id;

    INSERT INTO operation_lines (operation_id, item_id, expected_qty, done_qty) VALUES
    (op_id, item_macbook, 5, 0);

  END IF;
END $$;
