// src/api.js - Customer Portal API Service & Shared Store Synchronizer

const BASE_URL_INSURANCE = 'http://localhost:3001/api/v1';

// Exact synchronization with Insurance Database (mockStore.js)
export const MOCK_DATABASE = {
  // 1. OPPO Find X7 Ultra - EXPIRED Policy (POL-2025-009999)
  '012345678901234': {
    is_valid: false,
    policy_no: 'POL-2025-009999',
    imei: '012345678901234',
    device_model: 'OPPO Find X7 Ultra',
    customer_name: 'วีระ ขยันทำ',
    customer_phone: '0621234567',
    customer_email: 'wira@example.com',
    policy_status: 'EXPIRED',
    coverage_start: '2025-09-01T09:00:00.000Z',
    coverage_end: '2026-09-01T23:59:59.000Z',
    max_coverage_amount: 15000,
    remaining_claim_amount: 15000,
    claim_count: 0,
    max_claim_count: 1,
    package_name: 'ประกันจอแตก 1 ปี',
    benefits: [
      { name: 'ประกันเปลี่ยนหน้าจอแท้ (หมดอายุสัญญา)', status: 'สิ้นสุดความคุ้มครองแล้ว' },
      { name: 'ระยะเวลาคุ้มครอง 1 ปี (สิ้นสุด 1 ก.ย. 2026)', status: 'EXPIRED' }
    ],
    active_repair: null
  },

  // 2. iPhone 15 Pro - ACTIVE Policy with Active Repair Job (POL-2026-000001)
  '358941091234567': {
    is_valid: true,
    policy_no: 'POL-2026-000001',
    imei: '358941091234567',
    device_model: 'iPhone 15 Pro 256GB Black Titanium',
    customer_name: 'สมชาย ใจดี',
    customer_phone: '0812345678',
    customer_email: 'somchai@example.com',
    policy_status: 'ACTIVE',
    coverage_start: '2026-10-01T10:00:00.000Z',
    coverage_end: '2027-10-01T23:59:59.000Z',
    max_coverage_amount: 41900,
    remaining_claim_amount: 33400,
    claim_count: 1,
    max_claim_count: 2,
    package_name: 'ประกันอุบัติเหตุและจอแตก 1 ปี',
    benefits: [
      { name: 'ประกันจอแตกแท้ 100%', status: 'เคลมแล้ว 1 ครั้ง (เหลือ 1 ครั้ง)' },
      { name: 'ประกันอุบัติเหตุตกน้ำ / ของเหลวเข้า', status: 'คุ้มครองเต็มวงเงิน' },
      { name: 'บริการรับ-ส่งเครื่องซ่อมฟรีถึงบ้าน', status: 'สิทธิ์ใช้งานได้' }
    ],
    active_repair: {
      ticket_id: 'REP-2026-1004',
      status: 'IN_PROGRESS',
      center_name: 'ศูนย์บริการพาร์ทเนอร์ สยามพารากอน (iService)',
      center_phone: '02-123-4567',
      center_address: 'ชั้น 3 โซนไอที สยามพารากอน ปทุมวัน กรุงเทพฯ',
      technician_name: 'ช่างสมศักดิ์ ชำนาญการ (Apple Certified)',
      defect_symptom: 'หน้าจอแตกร้าวจากอุบัติเหตุตกพื้น ทัชสกรีนได้บางจุด',
      estimated_pickup: '25 ต.ค. 2026 เวลา 17:00 น.',
      actual_cost: 8500,
      covered_by_insurance: 8500,
      customer_excess: 0,
      timeline: [
        { status: 'RECEIVED', title: 'ศูนย์รับเครื่องเข้าระบบแล้ว', time: '24 ต.ค. 2026, 11:30 น.', completed: true },
        { status: 'DIAGNOSING', title: 'ช่างตรวจสอบและยืนยันสิทธิ์เคลม', time: '24 ต.ค. 2026, 13:15 น.', completed: true },
        { status: 'WAITING_PARTS', title: 'เบิกชุดหน้าจอแท้สำเร็จ', time: '24 ต.ค. 2026, 14:00 น.', completed: true },
        { status: 'IN_PROGRESS', title: 'กำลังดำเนินการเปลี่ยนจอและซีลกันน้ำ', time: 'กำลังดำเนินการ...', active: true },
        { status: 'REPAIR_COMPLETED', title: 'ซ่อมเสร็จเรียบร้อยและผ่าน QC', time: 'คาดการณ์ 17:00 น.', completed: false }
      ]
    }
  },

  // 3. Samsung Galaxy S24 Ultra - ACTIVE 2-Year Diamond Policy (POL-2026-000002)
  '490154203237518': {
    is_valid: true,
    policy_no: 'POL-2026-000002',
    imei: '490154203237518',
    device_model: 'Samsung Galaxy S24 Ultra 512GB',
    customer_name: 'สมหญิง รักดี',
    customer_phone: '0898765432',
    customer_email: 'somying@example.com',
    policy_status: 'ACTIVE',
    coverage_start: '2026-10-15T09:00:00.000Z',
    coverage_end: '2028-10-15T23:59:59.000Z',
    max_coverage_amount: 50000,
    remaining_claim_amount: 50000,
    claim_count: 0,
    max_claim_count: 3,
    package_name: 'ประกันครอบจักรวาล 2 ปี',
    benefits: [
      { name: 'ประกันเปลี่ยนเครื่องใหม่ทันทีใน 30 วัน', status: 'พร้อมใช้งาน' },
      { name: 'ประกันจอแตกไม่จำกัดจำนวนครั้ง', status: 'พร้อมใช้งาน' },
      { name: 'ประกันครอบจักรวาลและคุ้มครองเครื่องหาย', status: 'พร้อมใช้งาน' }
    ],
    active_repair: null
  }
};

export const PARTNER_CENTERS = [
  {
    id: 'CTR-001',
    name: 'CareShield Express สาขาสยามพารากอน',
    zone: 'กรุงเทพฯ ชั้นใน',
    address: 'ชั้น 3 โซนเทคโนโลยี สยามพารากอน เขตปทุมวัน',
    tel: '02-123-4567',
    hours: '10:00 - 20:30 น. (ทุกวัน)',
    speed: 'ซ่อมด่วนรอรับได้ 2 ชม.',
    rating: 4.9
  },
  {
    id: 'CTR-002',
    name: 'ศูนย์ซ่อมพาร์ทเนอร์ เซ็นทรัล ลาดพร้าว',
    zone: 'กรุงเทพฯ ตอนเหนือ',
    address: 'ชั้น 2 โซนไอที เซ็นทรัล ลาดพร้าว ถนนพหลโยธิน',
    tel: '02-987-6543',
    hours: '10:30 - 21:00 น. (ทุกวัน)',
    speed: 'มีอะไหล่แท้พร้อมซ่อมทันที',
    rating: 4.8
  },
  {
    id: 'CTR-003',
    name: 'ศูนย์บริการมาตรฐาน เมกาบางนา',
    zone: 'สมุทรปราการ / บางนา',
    address: 'ชั้น 1 ฝั่ง Big C Extra ถนนบางนา-ตราด',
    tel: '02-765-4321',
    hours: '10:00 - 21:00 น. (ทุกวัน)',
    speed: 'บริการรับ-ส่งถึงบ้านฟรี',
    rating: 4.9
  }
];

/**
 * Fetch and normalize policy data by IMEI, Policy No, or Model Name
 */
export async function fetchCustomerDevice(searchQuery) {
  const query = String(searchQuery || '').trim();
  if (!query) return null;

  // 1. If 15 digits, try live Insurance backend API first
  if (/^[0-9]{15}$/.test(query)) {
    try {
      const res = await fetch(`${BASE_URL_INSURANCE}/policies/verify?imei=${query}`);
      if (res.ok) {
        const live = await res.json();
        if (live && live.imei) {
          return {
            is_valid: live.is_valid,
            policy_no: live.policy_no,
            imei: live.imei,
            device_model: live.device_model,
            customer_name: live.customer_name || 'ลูกค้าคนพิเศษ',
            customer_phone: live.customer_phone || '08X-XXX-XXXX',
            policy_status: live.policy_status,
            coverage_start: live.coverage_details?.coverage_start || new Date().toISOString(),
            coverage_end: live.coverage_details?.expires_at,
            max_coverage_amount: live.coverage_details?.remaining_claim_amount || 0,
            remaining_claim_amount: live.coverage_details?.remaining_claim_amount || 0,
            claim_count: live.coverage_details?.claim_count || 0,
            max_claim_count: live.coverage_details?.max_claim_count || 2,
            package_name: live.coverage_details?.package_name || 'ประกันคุ้มครองโทรศัพท์',
            benefits: (live.coverage_details?.claimable_rules || []).map(r => ({
              name: r.rule_name || r.coverage_type,
              status: `วงเงินไม่เกิน ฿${Number(r.max_amount || 0).toLocaleString()}`
            })),
            active_repair: null
          };
        }
      }
    } catch (err) {
      // Backend offline or networking error, fallback to synchronized database
      console.log('Live Insurance API offline, using local database:', err.message);
    }
  }

  // 2. Direct lookup in synchronized MOCK_DATABASE by exact IMEI
  if (MOCK_DATABASE[query]) {
    return MOCK_DATABASE[query];
  }

  // 3. Smart Search: Search by Policy No (e.g. POL-2025-009999) or Model Name (e.g. OPPO, Find X7, iPhone, Samsung)
  const lowerQuery = query.toLowerCase();
  const allDevices = Object.values(MOCK_DATABASE);
  const matchedDevice = allDevices.find(d => 
    d.policy_no.toLowerCase().includes(lowerQuery) ||
    d.device_model.toLowerCase().includes(lowerQuery) ||
    d.imei.includes(query) ||
    (d.customer_name && d.customer_name.toLowerCase().includes(lowerQuery))
  );

  if (matchedDevice) {
    return matchedDevice;
  }

  // 4. Query not found in database or live API
  return null;
}
