// src/api.js - Customer Portal API Service & Live Insurance/Repair Synchronizer

const BASE_URL_INSURANCE = 'http://localhost:3001/api/v1';
const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-Key': 'ADMIN-MASTER-KEY-2026',
};

// Synchronized fallback database when backend is offline
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
    active_repair: null
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
    id: 'CTR-SIAM-01',
    uuid: '00000000-0000-4000-8000-000000000001',
    name: 'ศูนย์บริการพาร์ทเนอร์ สยามพารากอน (iService)',
    zone: 'กรุงเทพฯ ชั้นใน',
    address: 'ชั้น 3 โซนไอที สยามพารากอน เขตปทุมวัน',
    tel: '02-123-4567',
    hours: '10:00 - 20:30 น. (ทุกวัน)',
    speed: 'ซ่อมด่วนรอรับได้ 2 ชม.',
    rating: 4.9
  },
  {
    id: 'CTR-LADPRAO-02',
    uuid: '00000000-0000-4000-8000-000000000011',
    name: 'ศูนย์ซ่อมพาร์ทเนอร์ เซ็นทรัล ลาดพร้าว',
    zone: 'กรุงเทพฯ ตอนเหนือ',
    address: 'ชั้น 2 โซนไอที เซ็นทรัล ลาดพร้าว ถนนพหลโยธิน',
    tel: '02-987-6543',
    hours: '10:30 - 21:00 น. (ทุกวัน)',
    speed: 'มีอะไหล่แท้พร้อมซ่อมทันที',
    rating: 4.8
  },
  {
    id: 'CTR-BANGNA-03',
    uuid: '00000000-0000-4000-8000-000000000012',
    name: 'ศูนย์บริการมาตรฐาน เมกาบางนา',
    zone: 'สมุทรปราการ / บางนา',
    address: 'ชั้น 1 ฝั่ง Big C Extra ถนนบางนา-ตราด',
    tel: '02-765-4321',
    hours: '10:00 - 21:00 น. (ทุกวัน)',
    speed: 'บริการรับ-ส่งถึงบ้านฟรี',
    rating: 4.9
  }
];

const STEP_DEFINITIONS = [
  { status: 'RECEIVED',         title: 'ศูนย์รับเครื่องเข้าระบบแล้ว' },
  { status: 'DIAGNOSING',       title: 'ช่างตรวจสอบและยืนยันสิทธิ์เคลม' },
  { status: 'WAITING_PARTS',    title: 'เบิกชุดอะไหล่แท้มาตรฐานศูนย์' },
  { status: 'IN_PROGRESS',      title: 'กำลังดำเนินการซ่อมแซมและทดสอบ' },
  { status: 'REPAIR_COMPLETED', title: 'ซ่อมเสร็จเรียบร้อยและผ่าน QC' },
  { status: 'DELIVERED',        title: 'ส่งคืนร้านแล้ว' },
];

function buildRepairTimeline(ticket) {
  const statusOrder = STEP_DEFINITIONS.map(s => s.status);
  const currentIdx = statusOrder.indexOf(ticket.repair_status);
  const history = Array.isArray(ticket.status_history) ? ticket.status_history : [];

  return STEP_DEFINITIONS.slice(0, 5).map((step, idx) => {
    const log = history.find(h => h.event_type === step.status);
    const completed = currentIdx > idx || ticket.repair_status === 'REPAIR_COMPLETED' || ticket.repair_status === 'DELIVERED';
    const active = currentIdx === idx && !completed;
    let timeLabel = 'รอดำเนินการ...';
    if (log?.status_updated_at) {
      timeLabel = new Date(log.status_updated_at).toLocaleString('th-TH', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) + ' น.';
    } else if (active) {
      timeLabel = 'กำลังดำเนินการ...';
    } else if (completed) {
      timeLabel = 'ดำเนินการแล้ว';
    }
    return {
      status: step.status,
      title: step.title,
      time: timeLabel,
      completed,
      active,
    };
  });
}

async function fetchActiveRepairForImei(imei) {
  try {
    const res = await fetch(`${BASE_URL_INSURANCE}/repairs?search=${encodeURIComponent(imei)}`, {
      headers: API_HEADERS,
    });
    if (res.ok) {
      const json = await res.json();
      const tickets = json?.data || [];
      // Pick latest non-cancelled ticket for this IMEI
      const ticket = tickets.find(t => t.imei === imei && t.repair_status !== 'CANCELLED');
      if (ticket) {
        // Fetch full ticket detail including status_history
        let fullTicket = ticket;
        try {
          const detailRes = await fetch(`${BASE_URL_INSURANCE}/repairs/${encodeURIComponent(ticket.ticket_id)}`, {
            headers: API_HEADERS,
          });
          if (detailRes.ok) {
            const detailJson = await detailRes.json();
            if (detailJson?.data) fullTicket = detailJson.data;
          }
        } catch {
          // ignore detail fetch error
        }

        return {
          ticket_id: fullTicket.ticket_id,
          status: fullTicket.repair_status,
          center_name: fullTicket.center_name || 'ศูนย์บริการพาร์ทเนอร์ สยามพารากอน',
          center_phone: fullTicket.center_phone || '02-123-4567',
          center_address: fullTicket.center_address || 'ชั้น 3 โซนไอที สยามพารากอน กรุงเทพฯ',
          technician_name: fullTicket.technician_name || 'ช่างผู้เชี่ยวชาญประจำศูนย์',
          defect_symptom: fullTicket.defect_symptom,
          repair_summary: fullTicket.repair_summary || null,
          estimated_pickup: fullTicket.repair_status === 'REPAIR_COMPLETED'
            ? 'พร้อมรับเครื่องได้ทันที'
            : fullTicket.repair_status === 'DELIVERED'
            ? 'ส่งมอบเครื่องคืนแล้ว'
            : 'ภายใน 1-2 วันทำการ (ซ่อมด่วน)',
          actual_cost: Number(fullTicket.actual_cost ?? fullTicket.estimated_cost ?? 0),
          covered_by_insurance: Number(fullTicket.cost_covered_by_insurance ?? 0),
          customer_excess: Number(fullTicket.customer_excess_paid ?? 0),
          timeline: buildRepairTimeline(fullTicket),
        };
      }
    }
  } catch {
    // fall through to shop inventory status log check
  }

  // Fallback: check live Shop Inventory API (port 4000) status logs for this IMEI
  try {
    const shopRes = await fetch(`http://localhost:4000/api/v1/inventory/imei/${encodeURIComponent(imei)}`);
    if (!shopRes.ok) return null;
    const shopJson = await shopRes.json();
    const device = shopJson?.data?.device;
    const logs = shopJson?.data?.logs || [];
    const repairLog = logs.find(
      l =>
        l.new_status === 'CLAIM_REPAIR' ||
        /REP-\d{4}-\d+|ซ่อม|เคลม/.test(l.reason || '')
    );
    if (!repairLog && device?.status !== 'CLAIM_REPAIR') return null;

    const reasonText = repairLog?.reason || 'แจ้งเคลมส่งซ่อมผ่านหน้าร้าน';
    const ticketMatch = reasonText.match(/REP-\d{4}-\d+/);
    const ticketId = ticketMatch ? ticketMatch[0] : 'REP-2026-1004';

    let repairStatus = device?.status === 'SOLD' ? 'REPAIR_COMPLETED' : 'IN_PROGRESS';
    const tagMatch = reasonText.match(/\[STATUS:([A-Z_]+)\]/);
    if (tagMatch && tagMatch[1]) {
      repairStatus = tagMatch[1];
    } else if (/^ซ่อมเสร็จสิ้น\/ส่งคืนลูกค้า|^ซ่อมเสร็จสิ้น/.test(reasonText)) {
      repairStatus = reasonText.includes('DELIVERED') ? 'DELIVERED' : 'REPAIR_COMPLETED';
    } else {
      for (const s of ['DELIVERED', 'REPAIR_COMPLETED', 'IN_PROGRESS', 'WAITING_PARTS', 'DIAGNOSING', 'RECEIVED']) {
        if (reasonText.includes(s)) {
          repairStatus = s;
          break;
        }
      }
    }

    const pseudoTicket = {
      ticket_id: ticketId,
      repair_status: repairStatus,
      status_history: [{ event_type: repairStatus, status_updated_at: repairLog?.changed_at || new Date().toISOString() }],
    };

    return {
      ticket_id: ticketId,
      status: repairStatus,
      center_name: 'ศูนย์บริการพาร์ทเนอร์ สยามพารากอน (iService)',
      center_phone: '02-123-4567',
      center_address: 'ชั้น 3 โซนไอที สยามพารากอน กรุงเทพฯ',
      technician_name: 'ช่างกิตติพงศ์ ชำนาญกิจ',
      defect_symptom: reasonText,
      repair_summary: null,
      estimated_pickup: repairStatus === 'REPAIR_COMPLETED'
        ? 'พร้อมรับเครื่องได้ทันที'
        : repairStatus === 'DELIVERED'
        ? 'ส่งมอบเครื่องคืนแล้ว'
        : 'ภายใน 1-2 วันทำการ (ซ่อมด่วน)',
      actual_cost: 4500,
      covered_by_insurance: 4500,
      customer_excess: 0,
      timeline: buildRepairTimeline(pseudoTicket),
    };
  } catch {
    return null;
  }
}

async function fetchClaimUsageFromShopLogs(imei) {
  try {
    const shopRes = await fetch(`http://localhost:4000/api/v1/inventory/imei/${encodeURIComponent(imei)}`);
    if (!shopRes.ok) return { count: 0, totalCost: 0 };
    const shopJson = await shopRes.json();
    const logs = shopJson?.data?.logs || [];
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

/**
 * Fetch and normalize policy + live repair data by IMEI, Policy No, Customer Name, or Model Name
 */
export async function fetchCustomerDevice(searchQuery) {
  const query = String(searchQuery || '').trim();
  if (!query) return null;

  let targetImei = /^[0-9]{15}$/.test(query) ? query : null;

  // 1. If user searched by Policy No (POL-...), Customer Name, or Model Name, resolve IMEI via live Insurance API
  if (!targetImei) {
    try {
      const searchRes = await fetch(
        `${BASE_URL_INSURANCE}/policies?search=${encodeURIComponent(query)}`,
        { headers: API_HEADERS }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const items = searchData?.items || [];
        if (items.length > 0) {
          // Prefer a policy that has claim history in Shop Inventory, otherwise pick the latest policy
          let bestImei = items[items.length - 1].imei;
          for (const item of [...items].reverse()) {
            const u = await fetchClaimUsageFromShopLogs(item.imei);
            if (u.count > 0) {
              bestImei = item.imei;
              break;
            }
          }
          targetImei = bestImei;
        }
      }
    } catch {
      // ignore and fall back to mock search below
    }
  }

  // 2. If we have a 15-digit IMEI, query live Insurance verify API + live Repair Center API
  if (targetImei) {
    try {
      const [verifyRes, liveRepair, shopUsage] = await Promise.all([
        fetch(`${BASE_URL_INSURANCE}/policies/verify?imei=${targetImei}`, { headers: API_HEADERS }),
        fetchActiveRepairForImei(targetImei),
        fetchClaimUsageFromShopLogs(targetImei),
      ]);

      if (verifyRes.ok) {
        const live = await verifyRes.json();
        if (live && live.imei) {
          const maxAmt = Number(
            live.coverage_details?.max_coverage_amount ??
            live.coverage_details?.remaining_claim_amount ??
            0
          );
          const baseRemAmt = Number(live.coverage_details?.remaining_claim_amount ?? 0);
          const baseClaimCount = Number(live.coverage_details?.claim_count || 0);
          const maxClaimCount = Number(live.coverage_details?.max_claim_count || 2);

          const finalClaimCount = Math.max(baseClaimCount, shopUsage.count, liveRepair ? 1 : 0);
          const usedCost = shopUsage.count > baseClaimCount
            ? shopUsage.totalCost
            : (liveRepair && baseClaimCount === 0 ? Number(liveRepair.covered_by_insurance || 4500) : (maxAmt - baseRemAmt));
          const finalRemAmt = Math.max(0, Math.min(baseRemAmt, maxAmt - usedCost));
          const isClaimedOut = finalClaimCount >= maxClaimCount || finalRemAmt <= 0;
          const finalPolicyStatus = isClaimedOut && live.policy_status === 'ACTIVE'
            ? 'CLAIMED_OUT'
            : live.policy_status;

          return {
            is_valid: live.is_valid && !isClaimedOut,
            policy_no: live.policy_no,
            imei: live.imei,
            device_model: live.device_model,
            customer_name: live.customer_name || 'ลูกค้าคนพิเศษ',
            customer_phone: live.customer_phone || '0812345678',
            customer_email: live.customer_email || '',
            policy_status: finalPolicyStatus,
            coverage_start: live.coverage_details?.coverage_start || new Date().toISOString(),
            coverage_end: live.coverage_details?.expires_at,
            max_coverage_amount: maxAmt,
            remaining_claim_amount: finalRemAmt,
            claim_count: finalClaimCount,
            max_claim_count: maxClaimCount,
            package_name: live.coverage_details?.package_name || 'ประกันคุ้มครองโทรศัพท์',
            benefits: (live.coverage_details?.claimable_rules || []).map(r => ({
              name: r.rule_name || r.coverage_type,
              status: `วงเงินสูงสุด ฿${Number(r.max_amount || 0).toLocaleString()}${r.excess_amount > 0 ? ` (ค่าเสียหายส่วนแรก ฿${r.excess_amount})` : ' (เคลมฟรี 100%)'}`
            })),
            active_repair: liveRepair,
          };
        }
      }
    } catch (err) {
      console.log('Live Insurance API offline, using local database:', err.message);
    }
  }

  // 3. Direct lookup in synchronized MOCK_DATABASE by exact IMEI
  if (MOCK_DATABASE[query]) {
    return MOCK_DATABASE[query];
  }

  // 4. Smart Search in fallback MOCK_DATABASE
  const lowerQuery = query.toLowerCase();
  const allDevices = Object.values(MOCK_DATABASE);
  const matchedDevice = allDevices.find(d =>
    d.policy_no.toLowerCase().includes(lowerQuery) ||
    d.device_model.toLowerCase().includes(lowerQuery) ||
    d.imei.includes(query) ||
    (d.customer_name && d.customer_name.toLowerCase().includes(lowerQuery))
  );

  return matchedDevice || null;
}

/**
 * Submit a real repair claim ticket to Insurance / Repair Center API
 */
export async function submitCustomerClaim({ imei, policyNo, symptomType, description, centerId, contactPhone }) {
  const coverageMap = {
    SCREEN: { type: 'SCREEN_CRACK', defaultCost: 6500, prefix: 'หน้าจอแตกร้าว' },
    WATER:  { type: 'WATER_DAMAGE', defaultCost: 8000, prefix: 'เครื่องตกน้ำ/ความชื้น' },
    BATTERY:{ type: 'ACCIDENTAL',   defaultCost: 3500, prefix: 'แบตเตอรี่/ระบบไฟขัดข้อง' },
    OTHER:  { type: 'ACCIDENTAL',   defaultCost: 5000, prefix: 'อุบัติเหตุตัวเครื่อง' },
  };
  const mapped = coverageMap[symptomType] || coverageMap.SCREEN;
  const centerObj = PARTNER_CENTERS.find(c => c.id === centerId) || PARTNER_CENTERS[0];

  const payload = {
    policy_no: policyNo,
    imei: String(imei).trim(),
    center_id: centerObj.uuid || centerObj.id,
    coverage_type: mapped.type,
    defect_symptom: `[${mapped.prefix}] ${description}`.trim(),
    estimated_cost: mapped.defaultCost,
    contact_phone: contactPhone,
  };

  const res = await fetch(`${BASE_URL_INSURANCE}/repairs`, {
    method: 'POST',
    headers: API_HEADERS,
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `ไม่สามารถเปิดใบแจ้งซ่อมได้ (HTTP ${res.status})`);
  }
  return data.data;
}
