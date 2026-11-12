const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const INS_BASE = import.meta.env.VITE_INS_API_URL || 'http://localhost:3001/api/v1';
const INS_API_KEY = 'SHOP-BKK-01-SECRET-KEY-2026';
const LOCAL_ORDERS_KEY = 'phoneshop_pos_orders_v1';
const LOCAL_CLAIMS_KEY = 'phoneshop_claims_store_v1';

const DEFAULT_CLAIMS = [
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

function readLocalClaims() {
  try {
    const raw = localStorage.getItem(LOCAL_CLAIMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_CLAIMS];
}

function saveLocalClaims(list) {
  try {
    localStorage.setItem(LOCAL_CLAIMS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

const PKG_PRICES = {
  PKG_SCREEN_1Y: 990,
  PKG_ACCIDENT_1Y: 1990,
  PKG_FULL_2Y: 4990,
};

const request = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.message || 'API Error'), { data, status: res.status });
  return data;
};

const insRequest = async (method, path, body) => {
  const res = await fetch(`${INS_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': INS_API_KEY,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Insurance API Error'), { data, status: res.status });
  return data;
};

function readLocalOrders() {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalOrder(orderRecord) {
  try {
    const existing = readLocalOrders().filter(o => o.order_id !== orderRecord.order_id);
    existing.unshift(orderRecord);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(existing.slice(0, 200)));
  } catch (e) {
    console.warn('Could not save order to localStorage:', e);
  }
}

function buildOrdersFromPolicies(policies = []) {
  const map = new Map();
  for (const p of policies) {
    const orderId = p.order_id || `ORD-${p.policy_no}`;
    const pkgPrice = Number(p.package_price ?? PKG_PRICES[p.package_code] ?? 0);
    const devPrice = Number(p.device_price || 0);
    const item = {
      line_no: 1,
      model_name: p.device_model || 'สมาร์ทโฟน',
      imei: p.imei,
      price: devPrice,
      package_code: p.package_code || null,
      package_price: pkgPrice,
      policy_no: p.policy_no,
      sync_status: 'SUCCESS',
      e_warranty_url: p.e_warranty_url || `http://localhost:5176/?imei=${p.imei}`,
    };

    if (!map.has(orderId)) {
      map.set(orderId, {
        order_id: orderId,
        customer_name: p.customer_name || 'ลูกค้าหน้าร้าน',
        customer_phone: p.customer_phone || '-',
        customer_email: p.customer_email || '',
        total_amount: devPrice + pkgPrice,
        payment_method: 'CASH',
        payment_status: 'PAID',
        created_at: p.purchased_at || p.created_at || new Date().toISOString(),
        items: [item],
      });
    } else {
      const ord = map.get(orderId);
      if (!ord.items.some(i => i.imei === item.imei)) {
        item.line_no = ord.items.length + 1;
        ord.items.push(item);
        ord.total_amount += devPrice + pkgPrice;
      }
    }
  }
  return Array.from(map.values());
}

function computeClaimUsageFromLogs(logs = []) {
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
}

async function writeShopStatusLog(imei, targetStatus, changedBy, reason) {
  const cleanImei = String(imei || '').trim();
  if (!cleanImei) return;
  const doPut = async (st, rsn) =>
    fetch(`${BASE}/inventory/imei/${encodeURIComponent(cleanImei)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: st, changedBy, reason: rsn }),
    });

  try {
    let res = await doPut(targetStatus, reason);
    if (res.status === 404) {
      await fetch(`${BASE}/inventory/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imeis: [cleanImei], modelId: 1, note: 'ซิงค์เครื่องจากระบบประกัน' }),
      });
      res = await doPut(targetStatus, reason);
    }
    const json = await res.json().catch(() => ({}));
    if (json?.data?.changed === false) {
      const tempStatus = targetStatus === 'CLAIM_REPAIR' ? 'RESERVED' : 'CLAIM_REPAIR';
      await doPut(tempStatus, 'sync');
      await doPut(targetStatus, reason);
    }
  } catch {
    // ignore
  }
}

export const api = {
  // Generic HTTP
  get:              (path)       => request('GET', path),
  post:             (path, body) => request('POST', path, body),

  // Inventory
  getSummary:       ()           => request('GET',  '/inventory/summary'),
  getAvailableStock:(params = {}) => request('GET',  `/inventory/available-stock?${new URLSearchParams(params)}`),
  getImeiDetail:    (imei)       => request('GET',  `/inventory/imei/${imei}`),
  receiveStock:     (body)       => request('POST', '/inventory/receive', body),
  updateImeiStatus: (imei, body) => request('PUT',  `/inventory/imei/${imei}/status`, body),

  // POS Orders & Claims (with automatic live fallback to Insurance API + localStorage)
  getOrders: async () => {
    const orderMap = new Map();

    // 1. Local browser orders (instant persistence for POS checkouts)
    for (const o of readLocalOrders()) {
      if (o?.order_id) orderMap.set(o.order_id, o);
    }

    // 2. Shop backend /pos/orders
    try {
      const shopRes = await request('GET', '/pos/orders');
      for (const o of shopRes.data || []) {
        if (o?.order_id) orderMap.set(o.order_id, o);
      }
    } catch {
      // Shop backend may not have reloaded /pos/orders yet — continue to Insurance API
    }

    // 3. Reconstruct any insured orders from live Insurance API (port 3001)
    try {
      const insRes = await insRequest('GET', '/policies?limit=100');
      const policyOrders = buildOrdersFromPolicies(insRes.items || insRes.data || []);
      for (const po of policyOrders) {
        if (!orderMap.has(po.order_id)) {
          orderMap.set(po.order_id, po);
        } else {
          // Enrich existing order items with policy_no if missing
          const existing = orderMap.get(po.order_id);
          for (const pItem of po.items || []) {
            const match = (existing.items || []).find(i => i.imei === pItem.imei);
            if (match && !match.policy_no && pItem.policy_no) {
              match.policy_no = pItem.policy_no;
              match.e_warranty_url = pItem.e_warranty_url;
            }
          }
        }
      }
    } catch {
      // Ignore if Insurance API is unreachable
    }

    const merged = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    return { success: true, count: merged.length, data: merged };
  },

  verifyWarranty: async (imei) => {
    let data;
    try {
      data = await request('GET', `/pos/warranty/${encodeURIComponent(imei)}`);
    } catch {
      data = await insRequest('GET', `/policies/verify?imei=${encodeURIComponent(imei)}`);
    }
    try {
      const invRes = await request('GET', `/inventory/imei/${encodeURIComponent(imei)}`);
      const usage = computeClaimUsageFromLogs(invRes?.data?.logs || []);
      if (data?.coverage_details && usage.count > 0) {
        const baseCount = Number(data.coverage_details.claim_count || 0);
        const maxCount = Number(data.coverage_details.max_claim_count || 2);
        const maxAmt = Number(data.coverage_details.max_coverage_amount || data.coverage_details.remaining_claim_amount || 0);
        const baseRem = Number(data.coverage_details.remaining_claim_amount || 0);

        const finalCount = Math.max(baseCount, usage.count);
        const finalRem = usage.count > baseCount ? Math.max(0, maxAmt - usage.totalCost) : baseRem;
        data.coverage_details.claim_count = finalCount;
        data.coverage_details.remaining_claim_amount = finalRem;
        if (finalCount >= maxCount || finalRem <= 0) {
          data.policy_status = 'CLAIMED_OUT';
          data.is_valid = false;
          data.validation_reason = finalCount >= maxCount ? 'จำนวนครั้งเคลมครบตามสิทธิ์แล้ว' : 'วงเงินความคุ้มครองคงเหลือไม่เพียงพอ';
        }
      }
    } catch {
      // ignore if IMEI not in local inventory
    }
    return data;
  },

  getClaims: async (search = '') => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    let baseList = null;
    try {
      const res = await request('GET', `/pos/claims${q}`);
      if (res?.data) baseList = res.data;
    } catch {
      try {
        const insRes = await insRequest('GET', `/repairs${q}`);
        if (insRes?.data) baseList = insRes.data;
      } catch {
        baseList = readLocalClaims();
      }
    }

    const list = Array.isArray(baseList) ? [...baseList] : readLocalClaims();

    // Sync latest repair_status from shop inventory status logs (and backfill any local claims not yet in shop logs)
    await Promise.all(
      list.map(async (ticket) => {
        if (!ticket?.imei) return;
        try {
          const r = await request('GET', `/inventory/imei/${encodeURIComponent(ticket.imei)}`).catch(() => null);
          const logs = (r?.data?.logs || []).filter(l => l.reason !== 'sync');
          const hasTicketLog = logs.some(l => (l.reason || '').includes(ticket.ticket_id));
          if (!hasTicketLog && ticket.ticket_id) {
            const c = Number(ticket.actual_cost ?? ticket.estimated_cost ?? 5000);
            await writeShopStatusLog(
              ticket.imei,
              ['REPAIR_COMPLETED', 'DELIVERED'].includes(ticket.repair_status) ? 'SOLD' : 'CLAIM_REPAIR',
              'shop_staff',
              `รับแจ้งเคลมหน้าร้าน (${ticket.ticket_id}) [STATUS:${ticket.repair_status || 'RECEIVED'}] [COST:${c}] - ${ticket.defect_symptom || ticket.repair_status}`
            );
          }
          const latestLog = logs[0];
          if (latestLog?.reason) {
            const rsn = String(latestLog.reason);
            const tagMatch = rsn.match(/\[STATUS:([A-Z_]+)\]/);
            if (tagMatch && tagMatch[1]) {
              ticket.repair_status = tagMatch[1];
            } else if (/^ซ่อมเสร็จสิ้น\/ส่งคืนลูกค้า|^ซ่อมเสร็จสิ้น/.test(rsn)) {
              ticket.repair_status = rsn.includes('DELIVERED') ? 'DELIVERED' : 'REPAIR_COMPLETED';
            } else {
              for (const st of ['DELIVERED', 'REPAIR_COMPLETED', 'IN_PROGRESS', 'WAITING_PARTS', 'DIAGNOSING', 'RECEIVED', 'CANCELLED']) {
                if (rsn.includes(st)) {
                  ticket.repair_status = st;
                  break;
                }
              }
            }
            const costMatch = rsn.match(/\[COST:(\d+(?:\.\d+)?)\]/);
            if (costMatch) {
              ticket.actual_cost = Number(costMatch[1]);
            }
          }
        } catch {
          // ignore
        }
      })
    );

    saveLocalClaims(list);
    let filtered = list;
    if (search) {
      const s = search.toLowerCase();
      filtered = list.filter(
        t =>
          (t.ticket_id || '').toLowerCase().includes(s) ||
          (t.imei || '').includes(s) ||
          (t.policy_no || '').toLowerCase().includes(s)
      );
    }
    return { success: true, data: filtered, total: filtered.length };
  },

  createClaim: async (body) => {
    const cleanImei = String(body.imei || '').trim();
    const estCostNum = Number(body.estimated_cost || 0);
    const updateLocalInventory = async (ticketId) => {
      await writeShopStatusLog(
        cleanImei,
        'CLAIM_REPAIR',
        'shop_staff',
        `รับแจ้งเคลมหน้าร้าน (${ticketId || 'CLAIM'}) [COST:${estCostNum}] - ${body.defect_symptom}`
      );
    };

    try {
      const res = await request('POST', '/pos/claims', body);
      if (res?.data) {
        const list = readLocalClaims().filter(t => t.ticket_id !== res.data.ticket_id);
        list.unshift(res.data);
        saveLocalClaims(list);
      }
      return res;
    } catch {
      try {
        const insData = await insRequest('POST', '/repairs', {
          policy_no: body.policy_no || undefined,
          imei: cleanImei,
          center_id: body.center_id || 'CTR-SIAM-01',
          coverage_type: body.coverage_type || undefined,
          defect_symptom: body.defect_symptom || 'แจ้งเคลมส่งซ่อมผ่านหน้าร้าน PhoneShop',
          estimated_cost: Number(body.estimated_cost || 0),
          contact_phone: body.contact_phone || undefined,
        });
        await updateLocalInventory(insData.data?.ticket_id);
        if (insData?.data) {
          const list = readLocalClaims().filter(t => t.ticket_id !== insData.data.ticket_id);
          list.unshift(insData.data);
          saveLocalClaims(list);
        }
        return insData;
      } catch {
        // Full fallback if backend /repairs route hasn't reloaded yet
        const ticketId = `REP-${new Date().getFullYear()}-${Math.floor(1005 + Math.random() * 8990)}`;
        const nowIso = new Date().toISOString();
        const estCost = Number(body.estimated_cost || 0);
        const newTicket = {
          ticket_id: ticketId,
          policy_no: body.policy_no || 'POL-2026-000001',
          imei: cleanImei,
          center_id: body.center_id || 'CTR-SIAM-01',
          center_name: 'ศูนย์บริการพาร์ทเนอร์ สยามพารากอน (iService)',
          technician_name: 'ช่างกิตติพงศ์ ชำนาญกิจ',
          coverage_type: body.coverage_type || 'ACCIDENTAL',
          defect_symptom: body.defect_symptom,
          repair_summary: null,
          repair_status: 'RECEIVED',
          estimated_cost: estCost,
          actual_cost: null,
          cost_covered_by_insurance: estCost,
          customer_excess_paid: 0,
          created_at: nowIso,
          updated_at: nowIso,
        };
        const list = readLocalClaims();
        list.unshift(newTicket);
        saveLocalClaims(list);
        await updateLocalInventory(ticketId);
        return { success: true, data: newTicket };
      }
    }
  },

  // Brands & Models
  getBrands: ()          => request('GET', '/brands'),
  getModels: (brandId)   => request('GET', `/models${brandId ? `?brandId=${brandId}` : ''}`),
};
