/* ============================================================
   Mock data for development (when backend is not running)
   ============================================================ */

export const mockSummary = {
  kpis: {
    in_stock: 24,
    reserved: 3,
    sold: 8,
    claim_repair: 2,
    defective: 1,
    total: 38,
  },
  breakdown: [
    { brand_name: 'Apple',   model_name: 'iPhone 15 Pro',     storage: '128GB', color: 'Black Titanium',   selling_price: 42900, in_stock: 3, reserved: 1, sold: 1, claim_repair: 0, defective: 0, total: 5 },
    { brand_name: 'Apple',   model_name: 'iPhone 15 Pro',     storage: '256GB', color: 'Natural Titanium', selling_price: 49900, in_stock: 2, reserved: 0, sold: 1, claim_repair: 0, defective: 0, total: 3 },
    { brand_name: 'Apple',   model_name: 'iPhone 15',         storage: '128GB', color: 'Blue',            selling_price: 32900, in_stock: 3, reserved: 0, sold: 0, claim_repair: 1, defective: 0, total: 4 },
    { brand_name: 'Apple',   model_name: 'iPhone 15',         storage: '256GB', color: 'Pink',            selling_price: 37900, in_stock: 2, reserved: 0, sold: 0, claim_repair: 0, defective: 0, total: 2 },
    { brand_name: 'Samsung', model_name: 'Galaxy S24 Ultra',  storage: '256GB', color: 'Titanium Black',  selling_price: 44900, in_stock: 2, reserved: 0, sold: 1, claim_repair: 0, defective: 0, total: 3 },
    { brand_name: 'Samsung', model_name: 'Galaxy S24',        storage: '128GB', color: 'Cobalt Violet',   selling_price: 29900, in_stock: 2, reserved: 0, sold: 0, claim_repair: 0, defective: 1, total: 3 },
    { brand_name: 'Samsung', model_name: 'Galaxy A55',        storage: '128GB', color: 'Awesome Iceblue', selling_price: 14900, in_stock: 2, reserved: 0, sold: 0, claim_repair: 0, defective: 0, total: 2 },
    { brand_name: 'Xiaomi',  model_name: 'Xiaomi 14',         storage: '256GB', color: 'Black',           selling_price: 25900, in_stock: 2, reserved: 0, sold: 1, claim_repair: 0, defective: 0, total: 3 },
    { brand_name: 'Xiaomi',  model_name: 'Redmi Note 13 Pro', storage: '256GB', color: 'Midnight Black',  selling_price:  9990, in_stock: 3, reserved: 1, sold: 1, claim_repair: 0, defective: 0, total: 5 },
    { brand_name: 'OPPO',    model_name: 'OPPO Find X7',      storage: '256GB', color: 'Lunar Grey',      selling_price: 31900, in_stock: 2, reserved: 0, sold: 0, claim_repair: 1, defective: 0, total: 3 },
    { brand_name: 'OPPO',    model_name: 'OPPO Reno 11',      storage: '256GB', color: 'Rock Grey',       selling_price: 14900, in_stock: 2, reserved: 1, sold: 0, claim_repair: 0, defective: 0, total: 3 },
  ],
};

export const mockAvailableStock = [
  { model_id: 1,  brand_name: 'Apple',   model_name: 'iPhone 15 Pro',     storage: '128GB', color: 'Black Titanium',   selling_price: 42900, in_stock_count: 3, available_imeis: ['351234567890001', '351234567890002', '351234567890004'] },
  { model_id: 2,  brand_name: 'Apple',   model_name: 'iPhone 15 Pro',     storage: '256GB', color: 'Natural Titanium', selling_price: 49900, in_stock_count: 2, available_imeis: ['352345678901001', '352345678901003'] },
  { model_id: 3,  brand_name: 'Apple',   model_name: 'iPhone 15',         storage: '128GB', color: 'Blue',            selling_price: 32900, in_stock_count: 3, available_imeis: ['353456789012001', '353456789012002', '353456789012004'] },
  { model_id: 4,  brand_name: 'Apple',   model_name: 'iPhone 15',         storage: '256GB', color: 'Pink',            selling_price: 37900, in_stock_count: 2, available_imeis: ['353456789013001', '353456789013002'] },
  { model_id: 5,  brand_name: 'Samsung', model_name: 'Galaxy S24 Ultra',  storage: '256GB', color: 'Titanium Black',  selling_price: 44900, in_stock_count: 2, available_imeis: ['354567890123001', '354567890123002'] },
  { model_id: 6,  brand_name: 'Samsung', model_name: 'Galaxy S24',        storage: '128GB', color: 'Cobalt Violet',   selling_price: 29900, in_stock_count: 2, available_imeis: ['355678901234001', '355678901234002'] },
  { model_id: 7,  brand_name: 'Samsung', model_name: 'Galaxy A55',        storage: '128GB', color: 'Awesome Iceblue', selling_price: 14900, in_stock_count: 2, available_imeis: ['356789012345001', '356789012345002'] },
  { model_id: 8,  brand_name: 'Xiaomi',  model_name: 'Xiaomi 14',         storage: '256GB', color: 'Black',           selling_price: 25900, in_stock_count: 2, available_imeis: ['357890123456001', '357890123456002'] },
  { model_id: 9,  brand_name: 'Xiaomi',  model_name: 'Redmi Note 13 Pro', storage: '256GB', color: 'Midnight Black',  selling_price:  9990, in_stock_count: 3, available_imeis: ['358901234567001', '358901234567002', '358901234567003'] },
  { model_id: 10, brand_name: 'OPPO',    model_name: 'OPPO Find X7',      storage: '256GB', color: 'Lunar Grey',      selling_price: 31900, in_stock_count: 2, available_imeis: ['359012345678001', '359012345678002'] },
  { model_id: 11, brand_name: 'OPPO',    model_name: 'OPPO Reno 11',      storage: '256GB', color: 'Rock Grey',       selling_price: 14900, in_stock_count: 2, available_imeis: ['360123456789001', '360123456789002'] },
];

export const mockImeiLookup = {
  // iPhone 15 Pro 128GB (Apple)
  '351234567890001': {
    device: {
      imei: '351234567890001', status: 'IN_STOCK', brand_name: 'Apple',
      model_name: 'iPhone 15 Pro', storage: '128GB', color: 'Black Titanium',
      selling_price: 42900, purchase_price: 38000, lot_number: 'LOT-2025-001',
      lot_received_date: '2025-01-10', supplier_name: 'บริษัท ไทยโมบาย จำกัด',
      received_at: '2025-01-10T09:00:00Z', sold_at: null, sku: 'APL-IP15P-128-BLK',
    },
    logs: [
      { id: 1, old_status: null, new_status: 'IN_STOCK', changed_by: 'admin', reason: 'รับเข้าสต็อก LOT-2025-001', changed_at: '2025-01-10T09:00:00Z' },
    ],
  },
  '351234567890002': {
    device: {
      imei: '351234567890002', status: 'IN_STOCK', brand_name: 'Apple',
      model_name: 'iPhone 15 Pro', storage: '128GB', color: 'Black Titanium',
      selling_price: 42900, purchase_price: 38000, lot_number: 'LOT-2025-001',
      lot_received_date: '2025-01-10', supplier_name: 'บริษัท ไทยโมบาย จำกัด',
      received_at: '2025-01-10T09:00:00Z', sold_at: null, sku: 'APL-IP15P-128-BLK',
    },
    logs: [
      { id: 1, old_status: null, new_status: 'IN_STOCK', changed_by: 'admin', reason: 'รับเข้าสต็อก LOT-2025-001', changed_at: '2025-01-10T09:00:00Z' },
    ],
  },
  '351234567890003': {
    device: {
      imei: '351234567890003', status: 'SOLD', brand_name: 'Apple',
      model_name: 'iPhone 15 Pro', storage: '128GB', color: 'Black Titanium',
      selling_price: 42900, purchase_price: 38000, lot_number: 'LOT-2025-001',
      lot_received_date: '2025-01-10', supplier_name: 'บริษัท ไทยโมบาย จำกัด',
      received_at: '2025-01-10T09:00:00Z', sold_at: '2026-10-18T14:00:00Z', sku: 'APL-IP15P-128-BLK',
    },
    logs: [
      { id: 3, old_status: 'IN_STOCK', new_status: 'SOLD', changed_by: 'pos_cashier', reason: 'ขายหน้าร้าน TXN-20261018-001', changed_at: '2026-10-18T14:00:00Z' },
      { id: 2, old_status: null, new_status: 'IN_STOCK', changed_by: 'admin', reason: 'รับเข้าสต็อก LOT-2025-001', changed_at: '2025-01-10T09:00:00Z' },
    ],
  },
  // Galaxy S24 Ultra (Samsung) - NOT the Apple IMEI!
  '354567890123001': {
    device: {
      imei: '354567890123001', status: 'IN_STOCK', brand_name: 'Samsung',
      model_name: 'Galaxy S24 Ultra', storage: '256GB', color: 'Titanium Black',
      selling_price: 44900, purchase_price: 39500, lot_number: 'LOT-2025-002',
      lot_received_date: '2025-02-15', supplier_name: 'บริษัท ซัมซุง เทรดดิ้ง จำกัด',
      received_at: '2025-02-15T10:00:00Z', sold_at: null, sku: 'SS-S24U-256-BLK',
    },
    logs: [
      { id: 1, old_status: null, new_status: 'IN_STOCK', changed_by: 'admin', reason: 'รับเข้าสต็อก LOT-2025-002', changed_at: '2025-02-15T10:00:00Z' },
    ],
  },
  // Xiaomi 14 (Xiaomi)
  '357890123456001': {
    device: {
      imei: '357890123456001', status: 'IN_STOCK', brand_name: 'Xiaomi',
      model_name: 'Xiaomi 14', storage: '256GB', color: 'Black',
      selling_price: 25900, purchase_price: 21000, lot_number: 'LOT-2025-004',
      lot_received_date: '2025-04-20', supplier_name: 'บริษัท เสียวหมี่ คอร์ป จำกัด',
      received_at: '2025-04-20T11:00:00Z', sold_at: null, sku: 'MI-14-256-BLK',
    },
    logs: [
      { id: 1, old_status: null, new_status: 'IN_STOCK', changed_by: 'admin', reason: 'รับเข้าสต็อก LOT-2025-004', changed_at: '2025-04-20T11:00:00Z' },
    ],
  },
  // OPPO Find X7 (OPPO)
  '359012345678001': {
    device: {
      imei: '359012345678001', status: 'IN_STOCK', brand_name: 'OPPO',
      model_name: 'OPPO Find X7', storage: '256GB', color: 'Lunar Grey',
      selling_price: 31900, purchase_price: 27000, lot_number: 'LOT-2025-004',
      lot_received_date: '2025-04-20', supplier_name: 'บริษัท ออปโป้ ดีไวซ์ จำกัด',
      received_at: '2025-04-20T11:00:00Z', sold_at: null, sku: 'OP-FX7-256-GRY',
    },
    logs: [
      { id: 1, old_status: null, new_status: 'IN_STOCK', changed_by: 'admin', reason: 'รับเข้าสต็อก LOT-2025-004', changed_at: '2025-04-20T11:00:00Z' },
    ],
  },
};

export const mockBrands = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Samsung' },
  { id: 3, name: 'Xiaomi' },
  { id: 4, name: 'OPPO' },
  { id: 5, name: 'vivo' },
];

export const mockModels = [
  { id: 1, brand_id: 1, model_name: 'iPhone 15 Pro', storage: '128GB', color: 'Black Titanium',   selling_price: 42900 },
  { id: 2, brand_id: 1, model_name: 'iPhone 15 Pro', storage: '256GB', color: 'Natural Titanium', selling_price: 49900 },
  { id: 3, brand_id: 1, model_name: 'iPhone 15',     storage: '128GB', color: 'Blue',             selling_price: 32900 },
  { id: 4, brand_id: 1, model_name: 'iPhone 15',     storage: '256GB', color: 'Pink',             selling_price: 37900 },
  { id: 5, brand_id: 2, model_name: 'Galaxy S24 Ultra',  storage: '256GB', color: 'Titanium Black',  selling_price: 44900 },
  { id: 6, brand_id: 2, model_name: 'Galaxy S24',        storage: '128GB', color: 'Cobalt Violet',   selling_price: 29900 },
  { id: 7, brand_id: 2, model_name: 'Galaxy A55',        storage: '128GB', color: 'Awesome Iceblue', selling_price: 14900 },
  { id: 8, brand_id: 3, model_name: 'Xiaomi 14',         storage: '256GB', color: 'Black',           selling_price: 25900 },
  { id: 9, brand_id: 3, model_name: 'Redmi Note 13 Pro', storage: '256GB', color: 'Midnight Black',  selling_price:  9990 },
  { id:10, brand_id: 4, model_name: 'OPPO Find X7',      storage: '256GB', color: 'Lunar Grey',      selling_price: 31900 },
  { id:11, brand_id: 4, model_name: 'OPPO Reno 11',      storage: '256GB', color: 'Rock Grey',       selling_price: 14900 },
];
