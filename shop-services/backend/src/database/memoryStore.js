'use strict';
/**
 * In-Memory Store for Shop & Inventory Backend
 * Used automatically when PostgreSQL is not running so that all features
 * (Dashboard, Available Stock, Receive Stock, IMEI Search, and POS Checkout)
 * work seamlessly with real live state and zero duplicate IMEIs.
 */

const brands = [
  { id: 1, name: 'Apple',   logo_url: 'https://logo.clearbit.com/apple.com',   is_active: true },
  { id: 2, name: 'Samsung', logo_url: 'https://logo.clearbit.com/samsung.com', is_active: true },
  { id: 3, name: 'Xiaomi',  logo_url: 'https://logo.clearbit.com/xiaomi.com',  is_active: true },
  { id: 4, name: 'OPPO',    logo_url: 'https://logo.clearbit.com/oppo.com',    is_active: true },
  { id: 5, name: 'vivo',    logo_url: 'https://logo.clearbit.com/vivo.com',    is_active: true },
];

const suppliers = [
  { id: 1, name: 'บริษัท ไทยโมบาย จำกัด', contact: 'คุณสมชาย', phone: '02-111-2222', email: 'thaimobile@example.com' },
  { id: 2, name: 'บริษัท อีลีทโฟน จำกัด',  contact: 'คุณมาลี',  phone: '02-333-4444', email: 'elitephone@example.com' },
  { id: 3, name: 'บริษัท เมกาเทค จำกัด',   contact: 'คุณวิชัย', phone: '02-555-6666', email: 'megatech@example.com' },
];

const deviceModels = [
  { id: 1,  brand_id: 1, model_name: 'iPhone 15 Pro',     storage: '128GB', color: 'Black Titanium',   selling_price: 42900, cost_price: 38000, sku: 'APL-IP15P-128-BLK' },
  { id: 2,  brand_id: 1, model_name: 'iPhone 15 Pro',     storage: '256GB', color: 'Natural Titanium', selling_price: 49900, cost_price: 44000, sku: 'APL-IP15P-256-NAT' },
  { id: 3,  brand_id: 1, model_name: 'iPhone 15',         storage: '128GB', color: 'Blue',             selling_price: 32900, cost_price: 28000, sku: 'APL-IP15-128-BLU' },
  { id: 4,  brand_id: 1, model_name: 'iPhone 15',         storage: '256GB', color: 'Pink',             selling_price: 37900, cost_price: 33000, sku: 'APL-IP15-256-PNK' },
  { id: 5,  brand_id: 2, model_name: 'Galaxy S24 Ultra',  storage: '256GB', color: 'Titanium Black',   selling_price: 44900, cost_price: 39500, sku: 'SAM-S24U-256-BLK' },
  { id: 6,  brand_id: 2, model_name: 'Galaxy S24',        storage: '128GB', color: 'Cobalt Violet',    selling_price: 29900, cost_price: 25000, sku: 'SAM-S24-128-VIO' },
  { id: 7,  brand_id: 2, model_name: 'Galaxy A55',        storage: '128GB', color: 'Awesome Iceblue',  selling_price: 14900, cost_price: 11000, sku: 'SAM-A55-128-ICE' },
  { id: 8,  brand_id: 3, model_name: 'Xiaomi 14',         storage: '256GB', color: 'Black',            selling_price: 25900, cost_price: 21000, sku: 'XIA-14-256-BLK' },
  { id: 9,  brand_id: 3, model_name: 'Redmi Note 13 Pro', storage: '256GB', color: 'Midnight Black',   selling_price:  9990, cost_price:  7500, sku: 'XIA-RN13P-256-BLK' },
  { id: 10, brand_id: 4, model_name: 'OPPO Find X7',      storage: '256GB', color: 'Lunar Grey',       selling_price: 31900, cost_price: 27000, sku: 'OPP-FX7-256-GRY' },
  { id: 11, brand_id: 4, model_name: 'OPPO Reno 11',      storage: '256GB', color: 'Rock Grey',        selling_price: 14900, cost_price: 11500, sku: 'OPP-R11-256-GRY' },
];

const stockLots = [
  { id: 1, lot_number: 'LOT-2025-001', supplier_id: 1, received_date: '2025-01-10', note: 'ล็อตแรกของปี',           created_by: 'admin',   total_units: 25 },
  { id: 2, lot_number: 'LOT-2025-002', supplier_id: 2, received_date: '2025-02-15', note: 'สินค้าใหม่ Samsung',      created_by: 'staff01', total_units: 20 },
  { id: 3, lot_number: 'LOT-2025-003', supplier_id: 1, received_date: '2025-03-01', note: 'iPhone 15 series restock', created_by: 'admin',   total_units: 15 },
  { id: 4, lot_number: 'LOT-2025-004', supplier_id: 3, received_date: '2025-04-20', note: 'Xiaomi & OPPO batch',     created_by: 'staff02', total_units: 30 },
];

// Compute valid Luhn 15-digit IMEIs or use unique 15-digit IMEIs per device
const deviceImeis = [
  // iPhone 15 Pro 128GB Black (model_id=1)
  { imei: '351234567890001', model_id: 1, lot_id: 1, status: 'IN_STOCK',     purchase_price: 38000, received_at: '2025-01-10T09:00:00Z', sold_at: null },
  { imei: '351234567890002', model_id: 1, lot_id: 1, status: 'IN_STOCK',     purchase_price: 38000, received_at: '2025-01-10T09:00:00Z', sold_at: null },
  { imei: '351234567890003', model_id: 1, lot_id: 1, status: 'SOLD',         purchase_price: 38000, received_at: '2025-01-10T09:00:00Z', sold_at: '2026-10-18T14:00:00Z' },
  { imei: '351234567890004', model_id: 1, lot_id: 3, status: 'IN_STOCK',     purchase_price: 38000, received_at: '2025-03-01T09:00:00Z', sold_at: null },
  { imei: '351234567890005', model_id: 1, lot_id: 3, status: 'IN_STOCK',     purchase_price: 38000, received_at: '2025-03-01T09:00:00Z', sold_at: null },

  // iPhone 15 Pro 256GB Natural (model_id=2)
  { imei: '352345678901001', model_id: 2, lot_id: 1, status: 'IN_STOCK',     purchase_price: 44000, received_at: '2025-01-10T09:00:00Z', sold_at: null },
  { imei: '352345678901002', model_id: 2, lot_id: 1, status: 'SOLD',         purchase_price: 44000, received_at: '2025-01-10T09:00:00Z', sold_at: '2026-10-15T11:00:00Z' },
  { imei: '352345678901003', model_id: 2, lot_id: 3, status: 'IN_STOCK',     purchase_price: 44000, received_at: '2025-03-01T09:00:00Z', sold_at: null },

  // iPhone 15 128GB Blue (model_id=3)
  { imei: '353456789012001', model_id: 3, lot_id: 1, status: 'IN_STOCK',     purchase_price: 28000, received_at: '2025-01-10T09:00:00Z', sold_at: null },
  { imei: '353456789012002', model_id: 3, lot_id: 1, status: 'IN_STOCK',     purchase_price: 28000, received_at: '2025-01-10T09:00:00Z', sold_at: null },
  { imei: '353456789012003', model_id: 3, lot_id: 3, status: 'CLAIM_REPAIR', purchase_price: 28000, received_at: '2025-03-01T09:00:00Z', sold_at: null },
  { imei: '353456789012004', model_id: 3, lot_id: 3, status: 'IN_STOCK',     purchase_price: 28000, received_at: '2025-03-01T09:00:00Z', sold_at: null },

  // iPhone 15 256GB Pink (model_id=4)
  { imei: '353456789013001', model_id: 4, lot_id: 1, status: 'IN_STOCK',     purchase_price: 33000, received_at: '2025-01-10T09:00:00Z', sold_at: null },
  { imei: '353456789013002', model_id: 4, lot_id: 1, status: 'IN_STOCK',     purchase_price: 33000, received_at: '2025-01-10T09:00:00Z', sold_at: null },

  // Galaxy S24 Ultra (model_id=5)
  { imei: '354567890123001', model_id: 5, lot_id: 2, status: 'IN_STOCK',     purchase_price: 39500, received_at: '2025-02-15T10:00:00Z', sold_at: null },
  { imei: '354567890123002', model_id: 5, lot_id: 2, status: 'IN_STOCK',     purchase_price: 39500, received_at: '2025-02-15T10:00:00Z', sold_at: null },
  { imei: '354567890123003', model_id: 5, lot_id: 2, status: 'SOLD',         purchase_price: 39500, received_at: '2025-02-15T10:00:00Z', sold_at: '2026-10-20T16:00:00Z' },

  // Galaxy S24 (model_id=6)
  { imei: '355678901234001', model_id: 6, lot_id: 2, status: 'IN_STOCK',     purchase_price: 25000, received_at: '2025-02-15T10:00:00Z', sold_at: null },
  { imei: '355678901234002', model_id: 6, lot_id: 2, status: 'IN_STOCK',     purchase_price: 25000, received_at: '2025-02-15T10:00:00Z', sold_at: null },
  { imei: '355678901234003', model_id: 6, lot_id: 2, status: 'IN_STOCK',     purchase_price: 25000, received_at: '2025-02-15T10:00:00Z', sold_at: null },

  // Galaxy A55 (model_id=7)
  { imei: '356789012345001', model_id: 7, lot_id: 2, status: 'IN_STOCK',     purchase_price: 11000, received_at: '2025-02-15T10:00:00Z', sold_at: null },
  { imei: '356789012345002', model_id: 7, lot_id: 2, status: 'IN_STOCK',     purchase_price: 11000, received_at: '2025-02-15T10:00:00Z', sold_at: null },

  // Xiaomi 14 (model_id=8)
  { imei: '357890123456001', model_id: 8, lot_id: 4, status: 'IN_STOCK',     purchase_price: 21000, received_at: '2025-04-20T11:00:00Z', sold_at: null },
  { imei: '357890123456002', model_id: 8, lot_id: 4, status: 'IN_STOCK',     purchase_price: 21000, received_at: '2025-04-20T11:00:00Z', sold_at: null },
  { imei: '357890123456003', model_id: 8, lot_id: 4, status: 'SOLD',         purchase_price: 21000, received_at: '2025-04-20T11:00:00Z', sold_at: '2026-10-19T12:00:00Z' },

  // Redmi Note 13 Pro (model_id=9)
  { imei: '358901234567001', model_id: 9, lot_id: 4, status: 'IN_STOCK',     purchase_price: 7500,  received_at: '2025-04-20T11:00:00Z', sold_at: null },
  { imei: '358901234567002', model_id: 9, lot_id: 4, status: 'IN_STOCK',     purchase_price: 7500,  received_at: '2025-04-20T11:00:00Z', sold_at: null },
  { imei: '358901234567003', model_id: 9, lot_id: 4, status: 'IN_STOCK',     purchase_price: 7500,  received_at: '2025-04-20T11:00:00Z', sold_at: null },
  { imei: '358901234567004', model_id: 9, lot_id: 4, status: 'SOLD',         purchase_price: 7500,  received_at: '2025-04-20T11:00:00Z', sold_at: '2026-10-22T15:00:00Z' },

  // OPPO Find X7 (model_id=10)
  { imei: '359012345678001', model_id: 10, lot_id: 4, status: 'IN_STOCK',    purchase_price: 27000, received_at: '2025-04-20T11:00:00Z', sold_at: null },
  { imei: '359012345678002', model_id: 10, lot_id: 4, status: 'IN_STOCK',    purchase_price: 27000, received_at: '2025-04-20T11:00:00Z', sold_at: null },

  // OPPO Reno 11 (model_id=11)
  { imei: '360123456789001', model_id: 11, lot_id: 4, status: 'IN_STOCK',    purchase_price: 11500, received_at: '2025-04-20T11:00:00Z', sold_at: null },
  { imei: '360123456789002', model_id: 11, lot_id: 4, status: 'IN_STOCK',    purchase_price: 11500, received_at: '2025-04-20T11:00:00Z', sold_at: null },
];

let logSeq = 1;
const imeiStatusLogs = deviceImeis.map(d => ({
  id: logSeq++,
  imei: d.imei,
  old_status: null,
  new_status: 'IN_STOCK',
  changed_by: 'admin',
  reason: 'รับเข้าสต็อกเริ่มต้น',
  changed_at: d.received_at,
}));

// Append SOLD logs for items already marked SOLD
deviceImeis.filter(d => d.status === 'SOLD').forEach(d => {
  imeiStatusLogs.push({
    id: logSeq++,
    imei: d.imei,
    old_status: 'IN_STOCK',
    new_status: 'SOLD',
    changed_by: 'pos_cashier',
    reason: 'ขายหน้าร้าน',
    changed_at: d.sold_at,
  });
});

const orders = [
  {
    order_id: 'ORD-20261018-001',
    customer_id: '00000000-0000-0000-0000-000000000001',
    customer_name: 'สมชาย ใจดี',
    customer_phone: '0812345678',
    customer_email: 'somchai@example.com',
    total_amount: 44890,
    payment_method: 'CASH',
    payment_status: 'PAID',
    created_at: '2026-10-18T14:00:00Z',
  },
  {
    order_id: 'ORD-20261020-002',
    customer_id: '00000000-0000-0000-0000-000000000002',
    customer_name: 'สมหญิง รักดี',
    customer_phone: '0898765432',
    customer_email: 'somying@example.com',
    total_amount: 49890,
    payment_method: 'QR_PROMPT_PAY',
    payment_status: 'PAID',
    created_at: '2026-10-20T16:00:00Z',
  },
];

const orderItems = [
  {
    order_id: 'ORD-20261018-001',
    line_no: 1,
    model_name: 'Apple iPhone 15 Pro 128GB (Black Titanium)',
    imei: '351234567890003',
    price: 42900,
    package_code: 'PKG_ACCIDENT_1Y',
    package_price: 1990,
  },
  {
    order_id: 'ORD-20261020-002',
    line_no: 1,
    model_name: 'Samsung Galaxy S24 Ultra 256GB (Titanium Black)',
    imei: '354567890123003',
    price: 44900,
    package_code: 'PKG_FULL_2Y',
    package_price: 4990,
  },
];

const warrantyLogs = [
  {
    order_id: 'ORD-20261018-001',
    imei: '351234567890003',
    policy_no: 'POL-2026-000001',
    sync_status: 'SUCCESS',
    response_payload: {
      policy_no: 'POL-2026-000001',
      e_warranty_url: 'http://localhost:5176/?imei=351234567890003',
    },
    synced_at: '2026-10-18T14:00:05Z',
  },
  {
    order_id: 'ORD-20261020-002',
    imei: '354567890123003',
    policy_no: 'POL-2026-000002',
    sync_status: 'SUCCESS',
    response_payload: {
      policy_no: 'POL-2026-000002',
      e_warranty_url: 'http://localhost:5176/?imei=354567890123003',
    },
    synced_at: '2026-10-20T16:00:05Z',
  },
];

module.exports = {
  brands,
  suppliers,
  deviceModels,
  stockLots,
  deviceImeis,
  imeiStatusLogs,
  orders,
  orderItems,
  warrantyLogs,
  getNextLogId: () => logSeq++,
};

