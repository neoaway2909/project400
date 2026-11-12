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

async function fetchClaimUsageForImei(imei) {
  try {
    const r = await fetch(`http://localhost:4000/api/v1/inventory/imei/${encodeURIComponent(imei)}`);
    if (!r.ok) return { count: 0, totalCost: 0 };
    const j = await r.json();
    const logs = j?.data?.logs || [];
    const claimsMap = new Map();
    for (const l of [...logs].reverse()) {
      const reason = l.reason || '';
      const ticketMatch = reason.match(/REP-\d{4}-\d+/);
      let key = ticketMatch ? ticketMatch[0] : null;
      if (!key && l.new_status === 'CLAIM_REPAIR' && !/กำลังดำเนินการซ่อม|อัปเดตสถานะงานซ่อม/.test(reason)) {
        key = `CLAIM-${l.id || l.changed_at}`;
      }
      if (!key) continue;
      if (reason.includes('CANCELLED')) {
        claimsMap.delete(key);
        continue;
      }
      const costMatch = reason.match(/\[COST:(\d+(?:\.\d+)?)\]/);
      let cost = costMatch ? Number(costMatch[1]) : null;
      if (cost == null) {
        if (claimsMap.has(key)) {
          cost = claimsMap.get(key);
        } else if (/ตกน้ำ|ความชื้น|WATER/i.test(reason)) {
          cost = 8000;
        } else if (/หน้าจอ|จอ|SCREEN/i.test(reason)) {
          cost = 6500;
        } else if (/แบตเตอรี่|ระบบไฟ|BATTERY/i.test(reason)) {
          cost = 3500;
        } else {
          cost = 5000;
        }
      }
      claimsMap.set(key, cost);
    }
    const totalCost = Array.from(claimsMap.values()).reduce((sum, v) => sum + v, 0);
    return { count: claimsMap.size, totalCost };
  } catch {
    return { count: 0, totalCost: 0 };
  }
}

export async function fetchPolicies(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await apiFetch(`/policies?${qs}`);
  let baseItems = res?.success ? [...(res.items || [])] : [...policyStore];

  await Promise.all(
    baseItems.map(async (p) => {
      if (!p?.imei) return;
      const usage = await fetchClaimUsageForImei(p.imei);
      if (usage.count > 0) {
        const baseCount = Number(p.claim_count || 0);
        const maxCount = Number(p.max_claim_count || 2);
        const maxAmt = Number(p.max_coverage_amount || p.remaining_claim_amount || 0);
        const finalCount = Math.max(baseCount, usage.count);
        const finalRem = usage.count > baseCount ? Math.max(0, maxAmt - usage.totalCost) : Number(p.remaining_claim_amount || 0);
        p.claim_count = finalCount;
        p.remaining_claim_amount = finalRem;
        if ((finalCount >= maxCount || finalRem <= 0) && p.status === 'ACTIVE') {
          p.status = 'CLAIMED_OUT';
        }
      }
    })
  );

  let filtered = baseItems;
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
  const [res, usage] = await Promise.all([
    apiFetch(`/policies/verify?imei=${imei}`),
    fetchClaimUsageForImei(imei),
  ]);
  if (res) {
    if (res.coverage_details && usage.count > 0) {
      const baseCount = Number(res.coverage_details.claim_count || 0);
      const maxCount = Number(res.coverage_details.max_claim_count || 2);
      const maxAmt = Number(res.coverage_details.max_coverage_amount || res.coverage_details.remaining_claim_amount || 0);
      const finalCount = Math.max(baseCount, usage.count);
      const finalRem = usage.count > baseCount ? Math.max(0, maxAmt - usage.totalCost) : Number(res.coverage_details.remaining_claim_amount || 0);
      res.coverage_details.claim_count = finalCount;
      res.coverage_details.remaining_claim_amount = finalRem;
      if (finalCount >= maxCount || finalRem <= 0) {
        res.policy_status = 'CLAIMED_OUT';
        res.is_valid = false;
        res.validation_reason = finalCount >= maxCount ? 'ใช้สิทธิ์จำนวนครั้งเคลมครบแล้ว' : 'วงเงินความคุ้มครองหมดแล้ว';
      }
    }
    return res;
  }

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

// ============================================================
// Repair / Claim Management API (พร้อม Fallback อัตโนมัติ)
// ============================================================
const SHOP_API_BASE = 'http://localhost:4000/api/v1';
const LOCAL_REPAIRS_KEY = 'careshield_repairs_store_v1';

const defaultRepairs = [
  {
    ticket_id: 'REP-2026-1004',
    policy_no: 'POL-2026-000001',
    imei: '351234567890003',
    center_id: 'CTR-SIAM-01',
    center_name: 'ศูนย์บริการพาร์ทเนอร์ สยามพารากอน (iService)',
    technician_name: 'ช่างกิตติพงศ์ ชำนาญกิจ',
    coverage_type: 'SCREEN_CRACK',
    defect_symptom: 'หน้าจอแตกร้าวบริเวณมุมขวาบนจากการตกกระแทก ระบบสัมผัสยังทำงานได้',
    repair_summary: 'กำลังดำเนินการเปลี่ยนชุดหน้าจอ OLED แท้ศูนย์ พร้อมซีลกันน้ำใหม่',
    repair_status: 'IN_PROGRESS',
    estimated_cost: 8500,
    actual_cost: null,
    cost_covered_by_insurance: 8500,
    customer_excess_paid: 0,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

function loadLocalRepairs() {
  try {
    const raw = localStorage.getItem(LOCAL_REPAIRS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [...defaultRepairs];
}

function saveLocalRepairs(list) {
  try {
    localStorage.setItem(LOCAL_REPAIRS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function cleanRepairSummary(text) {
  if (!text) return '';
  let s = String(text).trim();
  s = s
    .replace(/^ซ่อมเสร็จสิ้น\/ส่งคืนลูกค้า\s*\([^)]*\)\s*/g, '')
    .replace(/^ซ่อมเสร็จสิ้น\s*\([^)]*\)\s*/g, '')
    .replace(/^อัปเดตสถานะงานซ่อม\s*\([^)]*\)\s*/g, '')
    .replace(/^กำลังดำเนินการซ่อม\s*\([^)]*\)\s*/g, '')
    .replace(/^รับแจ้งเคลมหน้าร้าน\s*\([^)]*\)\s*/g, '')
    .replace(/\[(?:COST|STATUS):[^\]]*\]/g, '')
    .replace(/^[-:]+\s*/, '')
    .trim();
  // Strip repeated nested system prefixes if any
  s = s
    .replace(/^(?:ซ่อมเสร็จสิ้น\/ส่งคืนลูกค้า|ซ่อมเสร็จสิ้น|อัปเดตสถานะงานซ่อม|กำลังดำเนินการซ่อม|รับแจ้งเคลมหน้าร้าน)\s*\([^)]*\)\s*/g, '')
    .replace(/\[(?:COST|STATUS):[^\]]*\]/g, '')
    .replace(/^[-:]+\s*/, '')
    .trim();
  if (/^(RECEIVED|DIAGNOSING|WAITING_PARTS|IN_PROGRESS|REPAIR_COMPLETED|DELIVERED|CANCELLED)$/.test(s)) {
    return '';
  }
  return s;
}

function parseStatusFromReason(reason, deviceStatus) {
  const r = String(reason || '');
  const tagMatch = r.match(/\[STATUS:([A-Z_]+)\]/);
  if (tagMatch && tagMatch[1]) return tagMatch[1];

  if (/^ซ่อมเสร็จสิ้น\/ส่งคืนลูกค้า|^ซ่อมเสร็จสิ้น/.test(r)) {
    return r.includes('DELIVERED') ? 'DELIVERED' : 'REPAIR_COMPLETED';
  }

  const endMatch = r.match(/[:\-]\s*(DELIVERED|REPAIR_COMPLETED|IN_PROGRESS|WAITING_PARTS|DIAGNOSING|RECEIVED|CANCELLED)\s*$/);
  if (endMatch && endMatch[1]) return endMatch[1];

  for (const st of ['DELIVERED', 'REPAIR_COMPLETED', 'IN_PROGRESS', 'WAITING_PARTS', 'DIAGNOSING', 'RECEIVED', 'CANCELLED']) {
    if (r.includes(st)) return st;
  }
  return deviceStatus === 'SOLD' ? 'REPAIR_COMPLETED' : 'RECEIVED';
}

async function syncShopInventoryStatus(imei, repairStatus, ticketId, summary, cost) {
  const cleanImei = String(imei || '').trim();
  if (!cleanImei) return false;
  const isDone = ['REPAIR_COMPLETED', 'DELIVERED'].includes(repairStatus);
  const newDeviceStatus = isDone ? 'SOLD' : 'CLAIM_REPAIR';
  const statusTag = ` [STATUS:${repairStatus}]`;
  const costTag = cost != null && cost !== '' && !isNaN(Number(cost)) ? ` [COST:${Number(cost)}]` : '';
  const cleanSum = cleanRepairSummary(summary);
  const reason = isDone
    ? `ซ่อมเสร็จสิ้น/ส่งคืนลูกค้า (${ticketId})${statusTag}${costTag} - ${cleanSum || repairStatus}`
    : `อัปเดตสถานะงานซ่อม (${ticketId})${statusTag}${costTag}: ${cleanSum ? `${cleanSum} (${repairStatus})` : repairStatus}`;

  const doPut = (st, rsn) =>
    fetch(`${SHOP_API_BASE}/inventory/imei/${encodeURIComponent(cleanImei)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: st, changedBy: 'insurance_admin', reason: rsn }),
    });

  try {
    let res = await doPut(newDeviceStatus, reason);
    if (res.status === 404) {
      await fetch(`${SHOP_API_BASE}/inventory/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imeis: [cleanImei], modelId: 1, note: 'ซิงค์เครื่องจากระบบประกัน' }),
      });
      res = await doPut(newDeviceStatus, reason);
    }
    const json = await res.json().catch(() => ({}));
    if (json?.data?.changed === false) {
      const tempStatus = newDeviceStatus === 'CLAIM_REPAIR' ? 'RESERVED' : 'CLAIM_REPAIR';
      await doPut(tempStatus, 'sync');
      res = await doPut(newDeviceStatus, reason);
    }
    return res.ok;
  } catch {
    return false;
  }
}

async function discoverRepairsFromShopInventory() {
  const discovered = [];
  try {
    const polRes = await apiFetch('/policies?limit=100');
    const policies = polRes?.items || policyStore || [];
    await Promise.all(
      policies.map(async (pol) => {
        if (!pol?.imei) return;
        try {
          const r = await fetch(`${SHOP_API_BASE}/inventory/imei/${encodeURIComponent(pol.imei)}`);
          if (!r.ok) return;
          const j = await r.json();
          const dev = j?.data?.device;
          const logs = (j?.data?.logs || []).filter(l => l.reason !== 'sync');
          const claimLog = [...logs].reverse().find(
            l => l.new_status === 'CLAIM_REPAIR' || /REP-\d{4}-\d+|แจ้งเคลม|งานซ่อม/.test(l.reason || '')
          ) || logs.find(
            l => l.new_status === 'CLAIM_REPAIR' || /REP-\d{4}-\d+|แจ้งเคลม|งานซ่อม/.test(l.reason || '')
          );
          if (!claimLog && dev?.status !== 'CLAIM_REPAIR') return;

          const latestLog = logs[0] || claimLog;
          const allReasons = logs.map(l => l.reason || '').join(' | ');
          const ticketMatch = allReasons.match(/REP-\d{4}-\d+/);
          const ticketId = ticketMatch ? ticketMatch[0] : `REP-2026-${pol.imei.slice(-4)}`;

          const repairStatus = parseStatusFromReason(latestLog?.reason, dev?.status);
          const claimCostMatch = (claimLog?.reason || '').match(/\[COST:(\d+(?:\.\d+)?)\]/);
          const latestCostMatch = (latestLog?.reason || '').match(/\[COST:(\d+(?:\.\d+)?)\]/);
          const estCost = claimCostMatch ? Number(claimCostMatch[1]) : (latestCostMatch ? Number(latestCostMatch[1]) : 4500);
          const actCost = latestCostMatch
            ? Number(latestCostMatch[1])
            : (repairStatus === 'REPAIR_COMPLETED' || repairStatus === 'DELIVERED' ? estCost : null);
          const cleanedSymptom = cleanRepairSummary(claimLog?.reason) || 'แจ้งเคลมส่งซ่อมผ่านหน้าร้าน';
          const cleanedSummary = latestLog !== claimLog ? (cleanRepairSummary(latestLog?.reason) || null) : null;

          discovered.push({
            ticket_id: ticketId,
            policy_no: pol.policy_no,
            imei: pol.imei,
            center_id: 'CTR-SIAM-01',
            center_name: 'ศูนย์บริการพาร์ทเนอร์ สยามพารากอน (iService)',
            technician_name: 'ช่างกิตติพงศ์ ชำนาญกิจ',
            coverage_type: 'ACCIDENTAL',
            defect_symptom: cleanedSymptom,
            repair_summary: cleanedSummary,
            repair_status: repairStatus,
            estimated_cost: estCost,
            actual_cost: actCost,
            cost_covered_by_insurance: actCost ?? estCost,
            customer_excess_paid: 0,
            created_at: claimLog?.changed_at || pol.created_at || new Date().toISOString(),
            updated_at: latestLog?.changed_at || new Date().toISOString(),
          });
        } catch {
          // ignore per-IMEI error
        }
      })
    );
  } catch {
    // ignore
  }
  return discovered;
}

export async function fetchRepairs(params = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  const query = qs.toString();

  const [res, shopDiscovered] = await Promise.all([
    apiFetch(`/repairs${query ? `?${query}` : ''}`),
    discoverRepairsFromShopInventory(),
  ]);

  const map = new Map();
  const discoveredIds = new Set(shopDiscovered.map(d => d.ticket_id));
  for (const rawItem of loadLocalRepairs()) {
    const item = {
      ...rawItem,
      defect_symptom: cleanRepairSummary(rawItem.defect_symptom) || rawItem.defect_symptom,
      repair_summary: cleanRepairSummary(rawItem.repair_summary) || null,
    };
    map.set(item.ticket_id, item);
    if (item?.imei && item?.ticket_id && !discoveredIds.has(item.ticket_id)) {
      const c = item.actual_cost ?? item.estimated_cost ?? 4500;
      syncShopInventoryStatus(item.imei, item.repair_status || 'IN_PROGRESS', item.ticket_id, item.repair_summary || item.defect_symptom, c);
    }
  }
  for (const item of shopDiscovered) {
    if (!map.has(item.ticket_id)) {
      map.set(item.ticket_id, item);
    } else {
      const existing = map.get(item.ticket_id);
      if (new Date(item.updated_at || 0) >= new Date(existing.updated_at || 0)) {
        map.set(item.ticket_id, {
          ...existing,
          ...item,
          estimated_cost: existing.estimated_cost ?? item.estimated_cost,
          actual_cost: item.actual_cost ?? existing.actual_cost,
          repair_summary: item.repair_summary || existing.repair_summary || null,
        });
      }
    }
  }
  if (res?.success && Array.isArray(res.data)) {
    for (const item of res.data) {
      if (!map.has(item.ticket_id)) {
        map.set(item.ticket_id, item);
      } else {
        const existing = map.get(item.ticket_id);
        if (new Date(item.updated_at || item.created_at || 0) > new Date(existing.updated_at || existing.created_at || 0)) {
          map.set(item.ticket_id, { ...existing, ...item });
        }
      }
    }
  }

  let list = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  saveLocalRepairs(list);

  if (params.status) list = list.filter(t => t.repair_status === params.status);
  if (params.search) {
    const s = params.search.toLowerCase();
    list = list.filter(
      t =>
        (t.ticket_id || '').toLowerCase().includes(s) ||
        (t.imei || '').includes(s) ||
        (t.policy_no || '').toLowerCase().includes(s)
    );
  }
  return { success: true, data: list, total: list.length };
}

export async function updateRepairStatus(ticketId, body) {
  const cleanedSummary = body.repair_summary !== undefined
    ? (cleanRepairSummary(body.repair_summary) || undefined)
    : undefined;
  const payload = {
    ...body,
    repair_summary: cleanedSummary,
  };

  let res = await apiFetch(`/repairs/${encodeURIComponent(ticketId)}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!res?.success && res?.error_code === 'INVALID_STATUS_TRANSITION') {
    for (const stepStatus of ['DIAGNOSING', 'IN_PROGRESS', 'REPAIR_COMPLETED']) {
      if (stepStatus === payload.status) break;
      await apiFetch(`/repairs/${encodeURIComponent(ticketId)}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: stepStatus }),
      });
    }
    res = await apiFetch(`/repairs/${encodeURIComponent(ticketId)}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Always update local store as well
  const list = loadLocalRepairs();
  const idx = list.findIndex(t => t.ticket_id === ticketId);
  const nowIso = new Date().toISOString();

  if (res?.success && res.ticket) {
    const cleanTicket = {
      ...res.ticket,
      repair_summary: cleanRepairSummary(res.ticket.repair_summary) || null,
      updated_at: nowIso,
    };
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...cleanTicket };
    } else {
      list.unshift(cleanTicket);
    }
    saveLocalRepairs(list);
    await syncShopInventoryStatus(res.ticket.imei, payload.status, ticketId, cleanedSummary, payload.actual_cost ?? res.ticket.actual_cost ?? res.ticket.estimated_cost);
    return { ...res, ticket: cleanTicket };
  }

  // Fallback update when backend route is not reloaded yet
  if (idx >= 0) {
    const ticket = list[idx];
    const actualCost = payload.actual_cost !== undefined && payload.actual_cost !== ''
      ? Number(payload.actual_cost)
      : ticket.actual_cost;
    const finalCost = actualCost ?? Number(ticket.estimated_cost || 0);
    const updated = {
      ...ticket,
      repair_status: payload.status,
      actual_cost: actualCost,
      repair_summary: cleanedSummary !== undefined ? cleanedSummary : (cleanRepairSummary(ticket.repair_summary) || null),
      cost_covered_by_insurance: finalCost,
      customer_excess_paid: 0,
      completed_at: payload.status === 'REPAIR_COMPLETED' ? nowIso : ticket.completed_at,
      updated_at: nowIso,
    };
    list[idx] = updated;
    saveLocalRepairs(list);
    const synced = await syncShopInventoryStatus(updated.imei, payload.status, ticketId, updated.repair_summary, finalCost);
    return {
      success: true,
      ticket: updated,
      webhook: { delivered: synced },
    };
  }

  return res || { success: false, message: 'ไม่พบตั๋วงานซ่อมที่ต้องการอัปเดต' };
}

export async function createRepairTicket(body) {
  const res = await apiFetch('/repairs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const list = loadLocalRepairs();
  if (res?.success && res.data) {
    const exists = list.some(t => t.ticket_id === res.data.ticket_id);
    if (!exists) {
      list.unshift({
        ...res.data,
        center_name: res.data.center_name || 'ศูนย์บริการพาร์ทเนอร์ สยามพารากอน (iService)',
        technician_name: res.data.technician_name || 'ช่างกิตติพงศ์ ชำนาญกิจ',
      });
      saveLocalRepairs(list);
    }
    await syncShopInventoryStatus(body.imei, 'RECEIVED', res.data.ticket_id, body.defect_symptom);
    return res;
  }

  // Fallback ticket creation
  const verifyRes = await verifyByImei(body.imei);
  if (!verifyRes?.is_valid) {
    return {
      success: false,
      message: verifyRes?.validation_reason || verifyRes?.message || 'กรมธรรม์ไม่สามารถใช้เคลมได้',
    };
  }
  const ticketId = `REP-${new Date().getFullYear()}-${Math.floor(1005 + Math.random() * 8990)}`;
  const nowIso = new Date().toISOString();
  const newTicket = {
    ticket_id: ticketId,
    policy_no: verifyRes.policy_no,
    imei: body.imei,
    center_id: body.center_id || 'CTR-SIAM-01',
    center_name: 'ศูนย์บริการพาร์ทเนอร์ สยามพารากอน (iService)',
    technician_name: 'ช่างกิตติพงศ์ ชำนาญกิจ',
    coverage_type: body.coverage_type || 'ACCIDENTAL',
    defect_symptom: body.defect_symptom,
    repair_summary: null,
    repair_status: 'RECEIVED',
    estimated_cost: Number(body.estimated_cost || 0),
    actual_cost: null,
    cost_covered_by_insurance: Number(body.estimated_cost || 0),
    customer_excess_paid: 0,
    created_at: nowIso,
    updated_at: nowIso,
  };
  list.unshift(newTicket);
  saveLocalRepairs(list);
  await syncShopInventoryStatus(body.imei, 'RECEIVED', ticketId, body.defect_symptom);
  return { success: true, data: newTicket };
}
