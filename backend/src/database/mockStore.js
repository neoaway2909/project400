/**
 * In-Memory Mock Store (ใช้แทน PostgreSQL เพื่อทดสอบโดยไม่ต้องมี DB)
 * เมื่อเปลี่ยนไปใช้ PostgreSQL จริง ให้ import db.js แทน
 */

const { v4: uuidv4 } = require('uuid');

// ========== Mock Insurance Packages ==========
const mockPackages = [
  {
    id: 'pkg-001',
    package_code: 'PKG_SCREEN_1Y',
    package_name: 'ประกันจอแตก 1 ปี',
    description: 'คุ้มครองหน้าจอแตกร้าวจากอุบัติเหตุ คุ้มครอง 1 ครั้งต่อปี',
    premium_price: 990.00,
    coverage_months: 12,
    max_coverage_amount: 15000.00,
    max_claim_count: 1,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    coverage_rules: [
      { rule_name: 'คุ้มครองจอแตก', coverage_type: 'SCREEN_CRACK', max_amount: 15000, max_times: 1, excess_amount: 0 }
    ]
  },
  {
    id: 'pkg-002',
    package_code: 'PKG_ACCIDENT_1Y',
    package_name: 'ประกันอุบัติเหตุและจอแตก 1 ปี',
    description: 'คุ้มครองอุบัติเหตุรอบด้าน ทั้งจอแตก เครื่องตกน้ำ และความเสียหายจากอุบัติเหตุ คุ้มครองสูงสุด 2 ครั้ง',
    premium_price: 1990.00,
    coverage_months: 12,
    max_coverage_amount: 41900.00,
    max_claim_count: 2,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    coverage_rules: [
      { rule_name: 'คุ้มครองจอแตก', coverage_type: 'SCREEN_CRACK', max_amount: 25000, max_times: 1, excess_amount: 0 },
      { rule_name: 'คุ้มครองเครื่องตกน้ำ', coverage_type: 'WATER_DAMAGE', max_amount: 20000, max_times: 1, excess_amount: 500 }
    ]
  },
  {
    id: 'pkg-003',
    package_code: 'PKG_FULL_2Y',
    package_name: 'ประกันครอบจักรวาล 2 ปี',
    description: 'คุ้มครองครบทุกความเสี่ยง รวมถึงการสูญหาย ตลอด 2 ปี คุ้มครองสูงสุด 3 ครั้ง',
    premium_price: 4990.00,
    coverage_months: 24,
    max_coverage_amount: 50000.00,
    max_claim_count: 3,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    coverage_rules: [
      { rule_name: 'คุ้มครองอุบัติเหตุทุกประเภท', coverage_type: 'ACCIDENTAL', max_amount: 50000, max_times: 3, excess_amount: 0 },
      { rule_name: 'คุ้มครองการสูญหาย', coverage_type: 'THEFT', max_amount: 50000, max_times: 1, excess_amount: 1000 }
    ]
  }
];

// ========== Mock Policies ==========
const mockPolicies = [
  {
    policy_no: 'POL-2026-000001',
    package_id: 'pkg-002',
    package_code: 'PKG_ACCIDENT_1Y',
    package_name: 'ประกันอุบัติเหตุและจอแตก 1 ปี',
    store_id: 'SHOP-BKK-01',
    order_id: 'ORD-20261001-0001',
    imei: '358941091234567',
    device_model: 'iPhone 15 Pro 256GB Black Titanium',
    device_price: 41900.00,
    customer_name: 'สมชาย ใจดี',
    customer_phone: '0812345678',
    customer_email: 'somchai@example.com',
    coverage_start: '2026-10-01T10:00:00.000Z',
    coverage_end: '2027-10-01T23:59:59.000Z',
    max_coverage_amount: 41900.00,
    remaining_claim_amount: 41900.00,
    claim_count: 0,
    max_claim_count: 2,
    status: 'ACTIVE',
    e_warranty_url: 'https://warranty.example.com/card/POL-2026-000001',
    purchased_at: '2026-10-01T10:00:00.000Z',
    created_at: '2026-10-01T10:00:00.000Z'
  },
  {
    policy_no: 'POL-2026-000002',
    package_id: 'pkg-003',
    package_code: 'PKG_FULL_2Y',
    package_name: 'ประกันครอบจักรวาล 2 ปี',
    store_id: 'SHOP-CNX-02',
    order_id: 'ORD-20261015-0042',
    imei: '490154203237518',
    device_model: 'Samsung Galaxy S24 Ultra 512GB',
    device_price: 45900.00,
    customer_name: 'สมหญิง รักดี',
    customer_phone: '0898765432',
    customer_email: 'somying@example.com',
    coverage_start: '2026-10-15T09:00:00.000Z',
    coverage_end: '2028-10-15T23:59:59.000Z',
    max_coverage_amount: 50000.00,
    remaining_claim_amount: 50000.00,
    claim_count: 0,
    max_claim_count: 3,
    status: 'ACTIVE',
    e_warranty_url: 'https://warranty.example.com/card/POL-2026-000002',
    purchased_at: '2026-10-15T09:00:00.000Z',
    created_at: '2026-10-15T09:00:00.000Z'
  },
  {
    policy_no: 'POL-2025-009999',
    package_id: 'pkg-001',
    package_code: 'PKG_SCREEN_1Y',
    package_name: 'ประกันจอแตก 1 ปี',
    store_id: 'SHOP-BKK-01',
    order_id: 'ORD-20250901-0088',
    imei: '012345678901234',
    device_model: 'OPPO Find X7 Ultra',
    device_price: 28900.00,
    customer_name: 'วีระ ขยันทำ',
    customer_phone: '0621234567',
    customer_email: 'wira@example.com',
    coverage_start: '2025-09-01T09:00:00.000Z',
    coverage_end: '2026-09-01T23:59:59.000Z',
    max_coverage_amount: 15000.00,
    remaining_claim_amount: 15000.00,
    claim_count: 0,
    max_claim_count: 1,
    status: 'EXPIRED',
    e_warranty_url: 'https://warranty.example.com/card/POL-2025-009999',
    purchased_at: '2025-09-01T09:00:00.000Z',
    created_at: '2025-09-01T09:00:00.000Z'
  }
];

// ======= Policy sequence counter ==========
let policySequence = 3;

function getNextPolicyNo() {
  policySequence++;
  const year = new Date().getFullYear();
  return `POL-${year}-${String(policySequence).padStart(6, '0')}`;
}

module.exports = { mockPackages, mockPolicies, getNextPolicyNo };
