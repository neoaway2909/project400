-- ============================================================
-- SEED DATA - shop_db (Mock Data for Development & Testing)
-- ============================================================

-- Brands
INSERT INTO brands (name, logo_url) VALUES
    ('Apple',   'https://logo.clearbit.com/apple.com'),
    ('Samsung', 'https://logo.clearbit.com/samsung.com'),
    ('Xiaomi',  'https://logo.clearbit.com/xiaomi.com'),
    ('OPPO',    'https://logo.clearbit.com/oppo.com'),
    ('vivo',    'https://logo.clearbit.com/vivo.com');

-- Suppliers
INSERT INTO suppliers (name, contact, phone, email) VALUES
    ('บริษัท ไทยโมบาย จำกัด',  'คุณสมชาย',  '02-111-2222', 'thaimobile@example.com'),
    ('บริษัท อีลีทโฟน จำกัด',   'คุณมาลี',   '02-333-4444', 'elitephone@example.com'),
    ('บริษัท เมกาเทค จำกัด',    'คุณวิชัย',  '02-555-6666', 'megatech@example.com');

-- Device Models
INSERT INTO device_models (brand_id, model_name, storage, color, selling_price, cost_price, sku) VALUES
    (1, 'iPhone 15 Pro',     '128GB', 'Black Titanium',  42900, 38000, 'APL-IP15P-128-BLK'),
    (1, 'iPhone 15 Pro',     '256GB', 'Natural Titanium', 49900, 44000, 'APL-IP15P-256-NAT'),
    (1, 'iPhone 15',         '128GB', 'Blue',             32900, 28000, 'APL-IP15-128-BLU'),
    (1, 'iPhone 15',         '256GB', 'Pink',             37900, 33000, 'APL-IP15-256-PNK'),
    (2, 'Galaxy S24 Ultra',  '256GB', 'Titanium Black',  44900, 39500, 'SAM-S24U-256-BLK'),
    (2, 'Galaxy S24',        '128GB', 'Cobalt Violet',   29900, 25000, 'SAM-S24-128-VIO'),
    (2, 'Galaxy A55',        '128GB', 'Awesome Iceblue',  14900, 11000, 'SAM-A55-128-ICE'),
    (3, 'Xiaomi 14',         '256GB', 'Black',           25900, 21000, 'XIA-14-256-BLK'),
    (3, 'Redmi Note 13 Pro', '256GB', 'Midnight Black',   9990,  7500, 'XIA-RN13P-256-BLK'),
    (4, 'OPPO Find X7',      '256GB', 'Lunar Grey',      31900, 27000, 'OPP-FX7-256-GRY'),
    (4, 'OPPO Reno 11',      '256GB', 'Rock Grey',       14900, 11500, 'OPP-R11-256-GRY');

-- Stock Lots
INSERT INTO stock_lots (lot_number, supplier_id, received_date, note, created_by, total_units) VALUES
    ('LOT-2025-001', 1, '2025-01-10', 'ล็อตแรกของปี', 'admin', 25),
    ('LOT-2025-002', 2, '2025-02-15', 'สินค้าใหม่ Samsung', 'staff01', 20),
    ('LOT-2025-003', 1, '2025-03-01', 'iPhone 15 series restock', 'admin', 15),
    ('LOT-2025-004', 3, '2025-04-20', 'Xiaomi & OPPO batch', 'staff02', 30);

-- Device IMEIs (ตัวอย่าง - IMEI สมมติ 15 หลัก)
INSERT INTO device_imeis (imei, model_id, lot_id, status, purchase_price) VALUES
    -- iPhone 15 Pro 128GB Black (model_id=1)
    ('351234567890001', 1, 1, 'IN_STOCK',     38000),
    ('351234567890002', 1, 1, 'IN_STOCK',     38000),
    ('351234567890003', 1, 1, 'SOLD',         38000),
    ('351234567890004', 1, 3, 'IN_STOCK',     38000),
    ('351234567890005', 1, 3, 'RESERVED',     38000),

    -- iPhone 15 Pro 256GB Natural (model_id=2)
    ('352345678901001', 2, 1, 'IN_STOCK',     44000),
    ('352345678901002', 2, 1, 'SOLD',         44000),
    ('352345678901003', 2, 3, 'IN_STOCK',     44000),

    -- iPhone 15 128GB Blue (model_id=3)
    ('353456789012001', 3, 1, 'IN_STOCK',     28000),
    ('353456789012002', 3, 1, 'IN_STOCK',     28000),
    ('353456789012003', 3, 3, 'CLAIM_REPAIR', 28000),
    ('353456789012004', 3, 3, 'IN_STOCK',     28000),

    -- Galaxy S24 Ultra (model_id=5)
    ('354567890123001', 5, 2, 'IN_STOCK',     39500),
    ('354567890123002', 5, 2, 'IN_STOCK',     39500),
    ('354567890123003', 5, 2, 'SOLD',         39500),

    -- Galaxy S24 (model_id=6)
    ('355678901234001', 6, 2, 'IN_STOCK',     25000),
    ('355678901234002', 6, 2, 'IN_STOCK',     25000),
    ('355678901234003', 6, 2, 'DEFECTIVE',    25000),

    -- Galaxy A55 (model_id=7)
    ('356789012345001', 7, 2, 'IN_STOCK',     11000),
    ('356789012345002', 7, 2, 'IN_STOCK',     11000),

    -- Xiaomi 14 (model_id=8)
    ('357890123456001', 8, 4, 'IN_STOCK',     21000),
    ('357890123456002', 8, 4, 'IN_STOCK',     21000),
    ('357890123456003', 8, 4, 'SOLD',         21000),

    -- Redmi Note 13 Pro (model_id=9)
    ('358901234567001', 9, 4, 'IN_STOCK',     7500),
    ('358901234567002', 9, 4, 'IN_STOCK',     7500),
    ('358901234567003', 9, 4, 'IN_STOCK',     7500),
    ('358901234567004', 9, 4, 'SOLD',         7500),

    -- OPPO Find X7 (model_id=10)
    ('359012345678001', 10, 4, 'IN_STOCK',    27000),
    ('359012345678002', 10, 4, 'IN_STOCK',    27000),

    -- OPPO Reno 11 (model_id=11)
    ('360123456789001', 11, 4, 'IN_STOCK',    11500),
    ('360123456789002', 11, 4, 'IN_STOCK',    11500);

-- Update sold_at for SOLD items
UPDATE device_imeis SET sold_at = NOW() - INTERVAL '5 days'  WHERE imei = '351234567890003';
UPDATE device_imeis SET sold_at = NOW() - INTERVAL '10 days' WHERE imei = '352345678901002';
UPDATE device_imeis SET sold_at = NOW() - INTERVAL '2 days'  WHERE imei = '354567890123003';
UPDATE device_imeis SET sold_at = NOW() - INTERVAL '7 days'  WHERE imei = '357890123456003';
UPDATE device_imeis SET sold_at = NOW() - INTERVAL '1 day'   WHERE imei = '358901234567004';
