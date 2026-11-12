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
      { rule_name: 'คุ้มครองจอแตก', coverage_type: 'SCREEN_CRACK', max_amount: 50000, max_times: 3, excess_amount: 0 },
      { rule_name: 'คุ้มครองเครื่องตกน้ำ', coverage_type: 'WATER_DAMAGE', max_amount: 50000, max_times: 3, excess_amount: 0 },
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
    order_id: 'ORD-20261018-001',
    imei: '351234567890003',
    device_model: 'Apple iPhone 15 Pro 128GB (Black Titanium)',
    device_price: 42900.00,
    customer_name: 'สมชาย ใจดี',
    customer_phone: '0812345678',
    customer_email: 'somchai@example.com',
    coverage_start: '2026-10-18T14:00:00.000Z',
    coverage_end: '2027-10-18T23:59:59.000Z',
    max_coverage_amount: 41900.00,
    remaining_claim_amount: 33400.00,
    claim_count: 1,
    max_claim_count: 2,
    status: 'ACTIVE',
    e_warranty_url: 'http://localhost:5176/?imei=351234567890003',
    purchased_at: '2026-10-18T14:00:00.000Z',
    created_at: '2026-10-18T14:00:00.000Z'
  },
  {
    policy_no: 'POL-2026-000002',
    package_id: 'pkg-003',
    package_code: 'PKG_FULL_2Y',
    package_name: 'ประกันครอบจักรวาล 2 ปี',
    store_id: 'SHOP-BKK-01',
    order_id: 'ORD-20261020-002',
    imei: '354567890123003',
    device_model: 'Samsung Galaxy S24 Ultra 256GB (Titanium Black)',
    device_price: 44900.00,
    customer_name: 'สมหญิง รักดี',
    customer_phone: '0898765432',
    customer_email: 'somying@example.com',
    coverage_start: '2026-10-20T16:00:00.000Z',
    coverage_end: '2028-10-20T23:59:59.000Z',
    max_coverage_amount: 50000.00,
    remaining_claim_amount: 50000.00,
    claim_count: 0,
    max_claim_count: 3,
    status: 'ACTIVE',
    e_warranty_url: 'http://localhost:5176/?imei=354567890123003',
    purchased_at: '2026-10-20T16:00:00.000Z',
    created_at: '2026-10-20T16:00:00.000Z'
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
    e_warranty_url: 'http://localhost:5176/?imei=012345678901234',
    purchased_at: '2025-09-01T09:00:00.000Z',
    created_at: '2025-09-01T09:00:00.000Z'
  }
];

// ========== Mock Repair Centers & Technicians ==========
const mockRepairCenters = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    center_code: 'CTR-SIAM-01',
    name: 'ศูนย์บริการพาร์ทเนอร์ สยามพารากอน (iService)',
    zone: 'กรุงเทพฯ ชั้นใน',
    location: 'ชั้น 3 โซนไอที สยามพารากอน ปทุมวัน กรุงเทพฯ',
    phone: '02-123-4567',
    hours: '10:00 - 20:30 น. (ทุกวัน)',
    speed: 'ซ่อมด่วนรอรับได้ 2 ชม.',
    rating: 4.9,
  },
  {
    id: '00000000-0000-4000-8000-000000000011',
    center_code: 'CTR-LADPRAO-02',
    name: 'ศูนย์ซ่อมพาร์ทเนอร์ เซ็นทรัล ลาดพร้าว',
    zone: 'กรุงเทพฯ ตอนเหนือ',
    location: 'ชั้น 2 โซนไอที เซ็นทรัล ลาดพร้าว ถนนพหลโยธิน',
    phone: '02-987-6543',
    hours: '10:30 - 21:00 น. (ทุกวัน)',
    speed: 'มีอะไหล่แท้พร้อมซ่อมทันที',
    rating: 4.8,
  },
  {
    id: '00000000-0000-4000-8000-000000000012',
    center_code: 'CTR-BANGNA-03',
    name: 'ศูนย์บริการมาตรฐาน เมกาบางนา',
    zone: 'สมุทรปราการ / บางนา',
    location: 'ชั้น 1 ฝั่ง Big C Extra ถนนบางนา-ตราด',
    phone: '02-765-4321',
    hours: '10:00 - 21:00 น. (ทุกวัน)',
    speed: 'บริการรับ-ส่งถึงบ้านฟรี',
    rating: 4.9,
  },
];

const mockTechnicians = [
  {
    id: '00000000-0000-4000-8000-000000000002',
    center_id: '00000000-0000-4000-8000-000000000001',
    full_name: 'ช่างสมศักดิ์ ชำนาญการ (Apple/Samsung Certified)',
    email: 'somsak@repair-center.local',
    phone: '081-234-5678',
  },
  {
    id: '00000000-0000-4000-8000-000000000021',
    center_id: '00000000-0000-4000-8000-000000000011',
    full_name: 'ช่างกิตติพงศ์ เทคนิคอาวุโส',
    email: 'kittipong@repair-center.local',
    phone: '089-111-2233',
  },
  {
    id: '00000000-0000-4000-8000-000000000022',
    center_id: '00000000-0000-4000-8000-000000000012',
    full_name: 'ช่างวีรยุทธ ผู้เชี่ยวชาญฮาร์ดแวร์',
    email: 'weerayut@repair-center.local',
    phone: '086-999-8877',
  },
];

// ========== Mock Repair Tickets ==========
const mockRepairTickets = [
  {
    ticket_id: 'REP-2026-1004',
    policy_no: 'POL-2026-000001',
    imei: '351234567890003',
    center_id: '00000000-0000-4000-8000-000000000001',
    technician_id: '00000000-0000-4000-8000-000000000002',
    defect_symptom: 'หน้าจอแตกร้าวจากอุบัติเหตุตกพื้น ทัชสกรีนได้บางจุด',
    repair_status: 'IN_PROGRESS',
    estimated_cost: 8500,
    actual_cost: 8500,
    coverage_limit_at_intake: 25000,
    fixed_excess_at_intake: 0,
    cost_covered_by_insurance: 8500,
    customer_excess_paid: 0,
    repair_summary: 'กำลังดำเนินการเปลี่ยนชุดหน้าจอแท้และซีลกันน้ำมาตรฐานโรงงาน',
    created_at: '2026-10-24T04:30:00.000Z',
    updated_at: '2026-10-24T07:30:00.000Z',
    completed_at: null,
  }
];

const mockRepairStatusLogs = [
  {
    ticket_id: 'REP-2026-1004',
    event_id: uuidv4(),
    event_type: 'RECEIVED',
    details: { source: 'repair_intake', note: 'ศูนย์รับเครื่องเข้าระบบแล้ว' },
    status_updated_at: '2026-10-24T04:30:00.000Z',
  },
  {
    ticket_id: 'REP-2026-1004',
    event_id: uuidv4(),
    event_type: 'DIAGNOSING',
    details: { note: 'ช่างตรวจสอบและยืนยันสิทธิ์เคลม' },
    status_updated_at: '2026-10-24T06:15:00.000Z',
  },
  {
    ticket_id: 'REP-2026-1004',
    event_id: uuidv4(),
    event_type: 'WAITING_PARTS',
    details: { note: 'เบิกชุดหน้าจอแท้สำเร็จ' },
    status_updated_at: '2026-10-24T07:00:00.000Z',
  },
  {
    ticket_id: 'REP-2026-1004',
    event_id: uuidv4(),
    event_type: 'IN_PROGRESS',
    details: { note: 'กำลังดำเนินการเปลี่ยนจอและซีลกันน้ำ' },
    status_updated_at: '2026-10-24T07:30:00.000Z',
  },
];

const mockRepairPhotos = [];
const mockWebhookLogs = [];

// ======= Sequence counters ==========
let policySequence = 3;
let repairTicketSequence = 1004;

function getNextPolicyNo() {
  policySequence++;
  const year = new Date().getFullYear();
  return `POL-${year}-${String(policySequence).padStart(6, '0')}`;
}

function getNextRepairTicketSeq() {
  repairTicketSequence++;
  return repairTicketSequence;
}

module.exports = {
  mockPackages,
  mockPolicies,
  mockRepairCenters,
  mockTechnicians,
  mockRepairTickets,
  mockRepairStatusLogs,
  mockRepairPhotos,
  mockWebhookLogs,
  getNextPolicyNo,
  getNextRepairTicketSeq,
};
