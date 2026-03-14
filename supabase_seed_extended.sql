-- ============================================================
-- IMS Refurbish - Extended Data Seed Script
-- Run this in Supabase SQL Editor AFTER the first seed script
-- ============================================================

DO $$
DECLARE
  -- Categories
  cat_laptops UUID;
  cat_peripherals UUID;
  cat_components UUID;
  cat_accessories UUID;
  
  -- Suppliers
  sup_techcorp UUID;
  sup_global UUID;
  
  -- Locations
  loc_receive UUID;
  loc_dist_internal_high UUID;
  loc_dist_internal_bulk UUID;
  loc_dist_ship UUID;
  loc_store_internal UUID;
  loc_store_receive UUID;

  -- Items
  item_macbook UUID;
  item_gpu UUID;
  item_mouse UUID;
  item_cable UUID;
  item_new_monitor UUID;
  item_new_ssd UUID;
  
  -- Operations
  op_id UUID;
BEGIN
  -- 1. Get references
  SELECT id INTO cat_laptops FROM categories WHERE name = 'Laptops' LIMIT 1;
  SELECT id INTO cat_peripherals FROM categories WHERE name = 'Peripherals' LIMIT 1;
  SELECT id INTO cat_components FROM categories WHERE name = 'Components' LIMIT 1;
  SELECT id INTO cat_accessories FROM categories WHERE name = 'Accessories' LIMIT 1;
  
  SELECT id INTO sup_techcorp FROM suppliers WHERE name = 'TechCorp Distribution' LIMIT 1;
  SELECT id INTO sup_global FROM suppliers WHERE name = 'Global Components Ltd' LIMIT 1;

  SELECT id INTO loc_receive FROM locations WHERE name = 'Docks (Inbound)' LIMIT 1;
  SELECT id INTO loc_dist_internal_high FROM locations WHERE name = 'Aisle A - High Value' LIMIT 1;
  SELECT id INTO loc_dist_internal_bulk FROM locations WHERE name = 'Aisle B - Bulk' LIMIT 1;
  SELECT id INTO loc_dist_ship FROM locations WHERE name = 'Shipping Area' LIMIT 1;
  
  SELECT id INTO loc_store_receive FROM locations WHERE name = 'Backroom Receiving' LIMIT 1;
  SELECT id INTO loc_store_internal FROM locations WHERE name = 'Shop Floor Display' LIMIT 1;

  -- 2. Add More Products
  INSERT INTO items (sku, name, description, category_id, supplier_id, min_stock_level, reorder_point, unit_of_measure, price, quantity) VALUES
  ('MON-4K-27', '27" 4K Monitor', 'IPS Panel, 144Hz, HDR400', cat_peripherals, sup_techcorp, 10, 15, 'units', 449.99, 0),
  ('MON-UW-34', '34" Ultrawide Monitor', 'Curved, 165Hz, 1ms', cat_peripherals, sup_techcorp, 5, 8, 'units', 699.99, 0),
  ('COM-SSD-2TB', '2TB NVMe SSD', 'PCIe Gen4, 7300MB/s Read', cat_components, sup_global, 30, 40, 'units', 159.99, 0),
  ('COM-RAM-32GB', '32GB DDR5 RAM Kit', '2x16GB, 6000MHz, CL30', cat_components, sup_global, 20, 30, 'units', 119.99, 0)
  ON CONFLICT (sku) DO NOTHING;

  -- Re-fetch item IDs to use in operations
  SELECT id INTO item_macbook FROM items WHERE sku = 'LAP-PRO-15' LIMIT 1;
  SELECT id INTO item_gpu FROM items WHERE sku = 'COM-GPU-4090' LIMIT 1;
  SELECT id INTO item_mouse FROM items WHERE sku = 'PER-MS-WIR' LIMIT 1;
  SELECT id INTO item_cable FROM items WHERE sku = 'ACC-USB-C-1M' LIMIT 1;
  SELECT id INTO item_new_monitor FROM items WHERE sku = 'MON-4K-27' LIMIT 1;
  SELECT id INTO item_new_ssd FROM items WHERE sku = 'COM-SSD-2TB' LIMIT 1;


  -- 3. More Receipts (To establish baseline stock for new items)
  IF NOT EXISTS (SELECT 1 FROM operations WHERE notes = 'Extended Seed - Bulk Monitor Receipt') THEN
    INSERT INTO operations (type, status, source_location_id, destination_location_id, supplier_id, notes, scheduled_date)
    VALUES ('RECEIPT', 'READY', NULL, loc_receive, sup_techcorp, 'Extended Seed - Bulk Monitor Receipt', CURRENT_DATE)
    RETURNING id INTO op_id;
    INSERT INTO operation_lines (operation_id, item_id, expected_qty, done_qty) VALUES
    (op_id, item_new_monitor, 40, 40), (op_id, item_new_ssd, 100, 100), (op_id, item_mouse, 50, 50);
    UPDATE operations SET status = 'DONE', done_date = NOW() WHERE id = op_id;
  END IF;


  -- 4. Internal Transfers (Moving stock from Docks -> Aisle, and Dist Center -> Store Front)
  IF NOT EXISTS (SELECT 1 FROM operations WHERE notes = 'Transfer: Putaway from morning truck') THEN
    -- Putaway from Docks to Bulk Aisle
    INSERT INTO operations (type, status, source_location_id, destination_location_id, supplier_id, notes, scheduled_date)
    VALUES ('INTERNAL', 'READY', loc_receive, loc_dist_internal_high, NULL, 'Transfer: Putaway from morning truck', CURRENT_DATE)
    RETURNING id INTO op_id;
    INSERT INTO operation_lines (operation_id, item_id, expected_qty, done_qty) VALUES (op_id, item_new_ssd, 50, 50), (op_id, item_gpu, 10, 10);
    UPDATE operations SET status = 'DONE', done_date = NOW() - INTERVAL '2 hours' WHERE id = op_id;

    -- Transfer to Downtown Store
    INSERT INTO operations (type, status, source_location_id, destination_location_id, supplier_id, notes, scheduled_date)
    VALUES ('INTERNAL', 'WAITING', loc_dist_internal_high, loc_store_receive, NULL, 'Store Replenishment - TR-9942', CURRENT_DATE + INTERVAL '1 day')
    RETURNING id INTO op_id;
    INSERT INTO operation_lines (operation_id, item_id, expected_qty, done_qty) VALUES (op_id, item_macbook, 5, 0), (op_id, item_new_monitor, 4, 0);
  END IF;


  -- 5. Delivery Orders (Outgoing to customers)
  IF NOT EXISTS (SELECT 1 FROM operations WHERE notes = 'B2B Client Order: Creative Studio LLC') THEN
    -- Completed Delivery
    INSERT INTO operations (type, status, source_location_id, destination_location_id, supplier_id, notes, scheduled_date)
    VALUES ('DELIVERY', 'READY', loc_dist_ship, NULL, NULL, 'B2B Client Order: Creative Studio LLC', CURRENT_DATE)
    RETURNING id INTO op_id;
    INSERT INTO operation_lines (operation_id, item_id, expected_qty, done_qty) VALUES (op_id, item_macbook, 3, 3), (op_id, item_new_monitor, 6, 6);
    UPDATE operations SET status = 'DONE', done_date = NOW() - INTERVAL '1 hour' WHERE id = op_id;

    -- Pending Delivery
    INSERT INTO operations (type, status, source_location_id, destination_location_id, supplier_id, notes, scheduled_date)
    VALUES ('DELIVERY', 'DRAFT', loc_dist_internal_bulk, NULL, NULL, 'E-Commerce Order #94881', CURRENT_DATE + INTERVAL '2 days')
    RETURNING id INTO op_id;
    INSERT INTO operation_lines (operation_id, item_id, expected_qty, done_qty) VALUES (op_id, item_gpu, 1, 0), (op_id, item_new_ssd, 2, 0);
  END IF;


  -- 6. Stock Adjustments (Physical count corrections)
  IF NOT EXISTS (SELECT 1 FROM operations WHERE notes = 'Cycle Count: Missing cables from Aisle B') THEN
    -- A negative adjustment (found fewer items than expected)
    -- NOTE: In this basic data model, we enter negative expected_qty for shrinkage, positive for newly found stock
    INSERT INTO operations (type, status, source_location_id, destination_location_id, supplier_id, notes, scheduled_date)
    VALUES ('ADJUSTMENT', 'READY', loc_dist_internal_bulk, NULL, NULL, 'Cycle Count: Missing cables from Aisle B', CURRENT_DATE)
    RETURNING id INTO op_id;
    INSERT INTO operation_lines (operation_id, item_id, expected_qty, done_qty) VALUES (op_id, item_cable, -5, -5);
    UPDATE operations SET status = 'DONE', done_date = NOW() WHERE id = op_id;

    -- A positive adjustment (found extra items)
    INSERT INTO operations (type, status, source_location_id, destination_location_id, supplier_id, notes, scheduled_date)
    VALUES ('ADJUSTMENT', 'DRAFT', loc_store_internal, NULL, NULL, 'Quarterly audit: Found unaccounted mice in display case', CURRENT_DATE)
    RETURNING id INTO op_id;
    INSERT INTO operation_lines (operation_id, item_id, expected_qty, done_qty) VALUES (op_id, item_mouse, 3, 0);
  END IF;

END $$;
