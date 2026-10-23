// Mock API service (ใช้ข้อมูลจำลองในกรณีที่ Backend ยังไม่พร้อม)
const API_BASE = 'http://localhost:3001/api/v1';

// Mock data fallback (เหมือน backend mockStore)
const mockPackages = [
  {
    id: 'pkg-001', package_code: 'PKG_SCREEN_1Y',
    package_name: 'ประกันจอแตก 1 ปี',
    description: 'คุ้มครองหน้าจอแตกร้าวจากอุบัติเหตุ คุ้มครอง 1 ครั้งต่อปี',
    premium_price: 990, coverage_months: 12, max_coverage_amount: 15000, max_claim_count: 1, is_active: true,
    coverage_rules: [
      { rule_name: 'คุ้มครองจอแตก', coverage_type: 'SCREEN_CRACK', max_amount: 15000, max_times: 1, excess_amount: 0 }
    ]
  },
  {
    id: 'pkg-002', package_code: 'PKG_ACCIDENT_1Y',
    package_name: 'ประกันอุบัติเหตุและจอแตก 1 ปี',
    description: 'คุ้มครองอุบัติเหตุรอบด้าน ทั้งจอแตก เครื่องตกน้ำ และความเสียหายจากอุบัติเหตุ คุ้มครองสูงสุด 2 ครั้ง',
    premium_price: 1990, coverage_months: 12, max_coverage_amount: 41900, max_claim_count: 2, is_active: true,
    coverage_rules: [
      { rule_name: 'คุ้มครองจอแตก', coverage_type: 'SCREEN_CRACK', max_amount: 25000, max_times: 1, excess_amount: 0 },
      { rule_name: 'คุ้มครองเครื่องตกน้ำ', coverage_type: 'WATER_DAMAGE', max_amount: 20000, max_times: 1, excess_amount: 500 }
    ]
  },
  {
    id: 'pkg-003', package_code: 'PKG_FULL_2Y',
    package_name: 'ประกันครอบจักรวาล 2 ปี',
    description: 'คุ้มครองครบทุกความเสี่ยง รวมถึงการสูญหาย ตลอด 2 ปี คุ้มครองสูงสุด 3 ครั้ง',
    premium_price: 4990, coverage_months: 24, max_coverage_amount: 50000, max_claim_count: 3, is_active: true,
    coverage_rules: [
      { rule_name: 'คุ้มครองอุบัติเหตุทุกประเภท', coverage_type: 'ACCIDENTAL', max_amount: 50000, max_times: 3, excess_amount: 0 },
      { rule_name: 'คุ้มครองการสูญหาย', coverage_type: 'THEFT', max_amount: 50000, max_times: 1, excess_amount: 1000 }
    ]
  }
];

const mockPolicies = [
  {
    policy_no: 'POL-2026-000001', package_code: 'PKG_ACCIDENT_1Y',
    package_name: 'ประกันอุบัติเหตุและจอแตก 1 ปี',
    store_id: 'SHOP-BKK-01', order_id: 'ORD-20261001-0001',
    imei: '358941091234567', device_model: 'iPhone 15 Pro 256GB Black Titanium', device_price: 41900,
    customer_name: 'สมชาย ใจดี', customer_phone: '0812345678', customer_email: 'somchai@example.com',
    coverage_start: '2026-10-01T10:00:00.000Z', coverage_end: '2027-10-01T23:59:59.000Z',
    max_coverage_amount: 41900, remaining_claim_amount: 41900, claim_count: 0, max_claim_count: 2,
    status: 'ACTIVE', e_warranty_url: 'https://warranty.example.com/card/POL-2026-000001',
    purchased_at: '2026-10-01T10:00:00.000Z', created_at: '2026-10-01T10:00:00.000Z'
  },
  {
    policy_no: 'POL-2026-000002', package_code: 'PKG_FULL_2Y',
    package_name: 'ประกันครอบจักรวาล 2 ปี',
    store_id: 'SHOP-CNX-02', order_id: 'ORD-20261015-0042',
    imei: '490154203237518', device_model: 'Samsung Galaxy S24 Ultra 512GB', device_price: 45900,
    customer_name: 'สมหญิง รักดี', customer_phone: '0898765432', customer_email: 'somying@example.com',
    coverage_start: '2026-10-15T09:00:00.000Z', coverage_end: '2028-10-15T23:59:59.000Z',
    max_coverage_amount: 50000, remaining_claim_amount: 50000, claim_count: 0, max_claim_count: 3,
    status: 'ACTIVE', e_warranty_url: 'https://warranty.example.com/card/POL-2026-000002',
    purchased_at: '2026-10-15T09:00:00.000Z', created_at: '2026-10-15T09:00:00.000Z'
  },
  {
    policy_no: 'POL-2025-009999', package_code: 'PKG_SCREEN_1Y',
    package_name: 'ประกันจอแตก 1 ปี',
    store_id: 'SHOP-BKK-01', order_id: 'ORD-20250901-0088',
    imei: '012345678901234', device_model: 'OPPO Find X7 Ultra', device_price: 28900,
    customer_name: 'วีระ ขยันทำ', customer_phone: '0621234567', customer_email: 'wira@example.com',
    coverage_start: '2025-09-01T09:00:00.000Z', coverage_end: '2026-09-01T23:59:59.000Z',
    max_coverage_amount: 15000, remaining_claim_amount: 15000, claim_count: 0, max_claim_count: 1,
    status: 'EXPIRED', e_warranty_url: 'https://warranty.example.com/card/POL-2025-009999',
    purchased_at: '2025-09-01T09:00:00.000Z', created_at: '2025-09-01T09:00:00.000Z'
  },
  {
    policy_no: 'POL-2026-000003', package_code: 'PKG_ACCIDENT_1Y',
    package_name: 'ประกันอุบัติเหตุและจอแตก 1 ปี',
    store_id: 'SHOP-BKK-01', order_id: 'ORD-20261010-0055',
    imei: '111111111111111', device_model: 'Google Pixel 9 Pro', device_price: 35900,
    customer_name: 'ประยุทธ์ ดีงาม', customer_phone: '0654321098', customer_email: 'prayuth@example.com',
    coverage_start: '2026-10-10T10:00:00.000Z', coverage_end: '2027-10-10T23:59:59.000Z',
    max_coverage_amount: 35900, remaining_claim_amount: 20000, claim_count: 1, max_claim_count: 2,
    status: 'ACTIVE', e_warranty_url: 'https://warranty.example.com/card/POL-2026-000003',
    purchased_at: '2026-10-10T10:00:00.000Z', created_at: '2026-10-10T10:00:00.000Z'
  }
];

// In-memory policy store (เพิ่มได้ผ่าน frontend)
let policyStore = [...mockPolicies];
let pkgStore = [...mockPackages];

// ===== API Functions =====

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'ADMIN-MASTER-KEY-2026',
        ...options.headers
      }
    });
    return await res.json();
  } catch {
    return null; // เมื่อ backend offline ใช้ mock
  }
}

export async function fetchDashboardStats() {
  const res = await apiFetch('/policies/dashboard');
  if (res?.success) return res.data;

  // Mock fallback
  const now = new Date();
  const active = policyStore.filter(p => p.status === 'ACTIVE').length;
  const expired = policyStore.filter(p => p.status === 'EXPIRED').length;
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('th-TH', { month: 'short', year: '2-digit' });
    const count = policyStore.filter(p => {
      const c = new Date(p.created_at);
      return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
    }).length;
    months.push({ month: label, count });
  }
  const deviceCount = {};
  policyStore.forEach(p => {
    const brand = p.device_model.split(' ')[0];
    deviceCount[brand] = (deviceCount[brand] || 0) + 1;
  });
  const pkgCount = {};
  policyStore.forEach(p => {
    pkgCount[p.package_name] = (pkgCount[p.package_name] || 0) + 1;
  });
  return {
    total_policies: policyStore.length,
    active_policies: active,
    expired_policies: expired,
    void_policies: 0,
    claimed_out_policies: 0,
    monthly_data: months,
    top_devices: Object.entries(deviceCount).map(([brand, count]) => ({ brand, count })).sort((a,b)=>b.count-a.count),
    top_packages: Object.entries(pkgCount).map(([name, count]) => ({ name, count })).sort((a,b)=>b.count-a.count)
  };
}

export async function fetchPackages() {
  const res = await apiFetch('/policies/packages');
  if (res?.success) return res.data;
  return pkgStore.filter(p => p.is_active);
}

export async function updatePackage(packageCode, data) {
  const res = await apiFetch(`/policies/packages/${packageCode}`, {
    method: 'PATCH', body: JSON.stringify(data)
  });
  if (res?.success) return res.data;
  // Mock update
  const idx = pkgStore.findIndex(p => p.package_code === packageCode);
  if (idx >= 0) { Object.assign(pkgStore[idx], data); return pkgStore[idx]; }
  return null;
}

export async function fetchPolicies(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await apiFetch(`/policies?${qs}`);
  if (res?.success) return res;

  // Mock filter
  let filtered = [...policyStore];
  if (params.status) filtered = filtered.filter(p => p.status === params.status);
  if (params.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.policy_no.toLowerCase().includes(s) ||
      p.imei.includes(s) ||
      p.customer_name.toLowerCase().includes(s) ||
      p.device_model.toLowerCase().includes(s)
    );
  }
  return { items: filtered, total: filtered.length, page: 1, total_pages: 1 };
}

export async function verifyByImei(imei) {
  const res = await apiFetch(`/policies/verify?imei=${imei}`);
  if (res) return res;

  // Mock verify
  const policy = policyStore
    .filter(p => p.imei === imei)
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];

  if (!policy) {
    return {
      success: false,
      error_code: 'POLICY_NOT_FOUND',
      message: 'ไม่พบข้อมูลกรมธรรม์สำหรับเลขอีมี่นี้ในระบบ',
      timestamp: new Date().toISOString()
    };
  }
  const now = new Date();
  const end = new Date(policy.coverage_end);
  const start = new Date(policy.coverage_start);
  const isInPeriod = end > now && start < now;
  const isValid = policy.status === 'ACTIVE' && isInPeriod && policy.remaining_claim_amount > 0 && policy.claim_count < policy.max_claim_count;
  const pkg = pkgStore.find(p => p.package_code === policy.package_code);

  return {
    success: true,
    is_valid: isValid,
    policy_no: policy.policy_no,
    imei: policy.imei,
    device_model: policy.device_model,
    policy_status: policy.status,
    store_id: policy.store_id,
    customer_name: policy.customer_name,
    coverage_details: {
      package_name: policy.package_name,
      coverage_start: policy.coverage_start,
      expires_at: policy.coverage_end,
      remaining_claim_amount: policy.remaining_claim_amount,
      claim_count: policy.claim_count,
      max_claim_count: policy.max_claim_count,
      claimable_rules: pkg?.coverage_rules || []
    },
    timestamp: new Date().toISOString()
  };
}

export async function createPolicy(data) {
  const res = await apiFetch('/policies', { method: 'POST', body: JSON.stringify(data) });
  if (res?.success) { policyStore.push({ ...res, status: 'ACTIVE', created_at: new Date().toISOString() }); return res; }
  if (res) return res;
  return { success: false, error_code: 'NETWORK_ERROR', message: 'ไม่สามารถเชื่อมต่อ Backend ได้' };
}
