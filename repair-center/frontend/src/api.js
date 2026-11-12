const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const API_KEY = import.meta.env.VITE_API_KEY || 'CTR-SIAM-01-SECRET-KEY-2026';
const SHOP_API_BASE = 'http://localhost:4000/api/v1';
const LOCAL_REPAIRS_KEY = 'repair_center_tickets_v1';

const defaultTickets = [
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
    photos: [],
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

function loadFallbackTickets() {
  try {
    const raw = localStorage.getItem(LOCAL_REPAIRS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [...defaultTickets];
}

function saveFallbackTickets(list) {
  try {
    localStorage.setItem(LOCAL_REPAIRS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function parseStatusFromReason(reason, deviceStatus) {
  const r = String(reason || '');
  const tagMatch = r.match(/\[STATUS:([A-Z_]+)\]/);
  if (tagMatch && tagMatch[1]) return tagMatch[1];

  if (/^ซ่อมเสร็จสิ้น\/ส่งคืนลูกค้า|^ซ่อมเสร็จสิ้น/.test(r)) {
    return r.includes('DELIVERED') ? 'DELIVERED' : 'REPAIR_COMPLETED';
  }

  for (const st of ['DELIVERED', 'REPAIR_COMPLETED', 'IN_PROGRESS', 'WAITING_PARTS', 'DIAGNOSING', 'RECEIVED', 'CANCELLED']) {
    if (r.includes(st)) return st;
  }
  return deviceStatus === 'SOLD' ? 'REPAIR_COMPLETED' : 'RECEIVED';
}

async function syncShopImeiStatus(imei, repairStatus, ticketId, summary, cost) {
  const cleanImei = String(imei || '').trim();
  if (!cleanImei) return false;
  const isCompleted = ['REPAIR_COMPLETED', 'DELIVERED'].includes(repairStatus);
  const newStatus = isCompleted ? 'SOLD' : 'CLAIM_REPAIR';
  const statusTag = ` [STATUS:${repairStatus}]`;
  const costTag = cost != null && cost !== '' && !isNaN(Number(cost)) ? ` [COST:${Number(cost)}]` : '';
  const reason = isCompleted
    ? `ซ่อมเสร็จสิ้น (${ticketId})${statusTag}${costTag} - ${summary || repairStatus}`
    : `กำลังดำเนินการซ่อม (${ticketId})${statusTag}${costTag} - ${repairStatus}`;

  const doPut = (st, rsn) =>
    fetch(`${SHOP_API_BASE}/inventory/imei/${encodeURIComponent(cleanImei)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: st, changedBy: 'repair_center', reason: rsn }),
    });

  try {
    let res = await doPut(newStatus, reason);
    if (res.status === 404) {
      await fetch(`${SHOP_API_BASE}/inventory/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imeis: [cleanImei], modelId: 1, note: 'ซิงค์เครื่องจากศูนย์ซ่อม' }),
      });
      res = await doPut(newStatus, reason);
    }
    const json = await res.json().catch(() => ({}));
    if (json?.data?.changed === false) {
      const tempStatus = newStatus === 'RESERVED' ? 'IN_STOCK' : 'RESERVED';
      await doPut(tempStatus, 'sync');
      res = await doPut(newStatus, reason);
    }
    return res.ok;
  } catch {
    return false;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
      ...options.headers,
    },
  });
  const responseBody = await response.text();
  let data = {};
  if (responseBody) {
    try {
      data = JSON.parse(responseBody);
    } catch {
      throw new Error(
        response.ok
          ? 'Repair API returned an invalid response'
          : `Repair API request failed (${response.status}); check that the backend is running`,
      );
    }
  }
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

async function discoverFromShopAndInsurance() {
  const discovered = [];
  try {
    const polRes = await fetch(`${API_BASE}/policies?limit=100`, {
      headers: { 'Content-Type': 'application/json', 'X-API-Key': 'ADMIN-MASTER-KEY-2026' },
    });
    if (!polRes.ok) return discovered;
    const polJson = await polRes.json();
    const policies = polJson?.items || [];
    await Promise.all(
      policies.map(async (pol) => {
        if (!pol?.imei) return;
        try {
          const r = await fetch(`${SHOP_API_BASE}/inventory/imei/${encodeURIComponent(pol.imei)}`);
          if (!r.ok) return;
          const j = await r.json();
          const dev = j?.data?.device;
          const logs = j?.data?.logs || [];
          const claimLog = logs.find(
            l => l.new_status === 'CLAIM_REPAIR' || /REP-\d{4}-\d+|แจ้งเคลม|งานซ่อม/.test(l.reason || '')
          );
          if (!claimLog && dev?.status !== 'CLAIM_REPAIR') return;

          const latestLog = logs[0] || claimLog;
          const allReasons = logs.map(l => l.reason || '').join(' | ');
          const ticketMatch = allReasons.match(/REP-\d{4}-\d+/);
          const ticketId = ticketMatch ? ticketMatch[0] : `REP-2026-${pol.imei.slice(-4)}`;

          const repairStatus = parseStatusFromReason(latestLog?.reason, dev?.status);

          discovered.push({
            ticket_id: ticketId,
            policy_no: pol.policy_no,
            imei: pol.imei,
            center_id: 'CTR-SIAM-01',
            center_name: 'ศูนย์บริการพาร์ทเนอร์ สยามพารากอน (iService)',
            technician_name: 'ช่างกิตติพงศ์ ชำนาญกิจ',
            coverage_type: 'ACCIDENTAL',
            defect_symptom: (claimLog?.reason || 'แจ้งเคลมส่งซ่อมผ่านหน้าร้าน').replace(/^รับแจ้งเคลมหน้าร้าน\s*\([^)]*\)\s*-\s*/, ''),
            repair_summary: latestLog !== claimLog ? latestLog?.reason : null,
            repair_status: repairStatus,
            estimated_cost: 4500,
            actual_cost: repairStatus === 'REPAIR_COMPLETED' || repairStatus === 'DELIVERED' ? 4500 : null,
            cost_covered_by_insurance: 4500,
            customer_excess_paid: 0,
            photos: [],
            created_at: claimLog?.changed_at || pol.created_at || new Date().toISOString(),
            updated_at: latestLog?.changed_at || new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      })
    );
  } catch {
    // ignore
  }
  return discovered;
}

export const repairApi = {
  list: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    const query = params.toString();

    const map = new Map();
    for (const t of loadFallbackTickets()) map.set(t.ticket_id, t);

    const discovered = await discoverFromShopAndInsurance();
    for (const d of discovered) {
      if (!map.has(d.ticket_id)) {
        map.set(d.ticket_id, d);
      } else {
        const cur = map.get(d.ticket_id);
        if (new Date(d.updated_at || 0) >= new Date(cur.updated_at || 0)) {
          map.set(d.ticket_id, { ...cur, ...d });
        }
      }
    }

    try {
      const res = await request(`/repairs${query ? `?${query}` : ''}`);
      if (res?.data) {
        for (const item of res.data) map.set(item.ticket_id, item);
      }
    } catch {
      // use merged map
    }

    let list = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    saveFallbackTickets(list);

    if (filters.status) list = list.filter(t => t.repair_status === filters.status);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(
        t =>
          (t.ticket_id || '').toLowerCase().includes(s) ||
          (t.imei || '').includes(s) ||
          (t.policy_no || '').toLowerCase().includes(s)
      );
    }
    return { success: true, data: list, total: list.length };
  },
  get: async (ticketId) => {
    try {
      return await request(`/repairs/${encodeURIComponent(ticketId)}`);
    } catch {
      const list = loadFallbackTickets();
      const found = list.find(t => t.ticket_id === ticketId) || list[0];
      return { success: true, data: found };
    }
  },
  updateStatus: async (ticketId, body) => {
    try {
      const res = await request(
        `/repairs/${encodeURIComponent(ticketId)}/status`,
        { method: 'PUT', body: JSON.stringify(body) },
      );
      if (res?.ticket) {
        const list = loadFallbackTickets();
        const idx = list.findIndex(t => t.ticket_id === ticketId);
        if (idx >= 0) list[idx] = { ...list[idx], ...res.ticket };
        saveFallbackTickets(list);
        await syncShopImeiStatus(res.ticket.imei, body.status, ticketId, body.repair_summary, body.actual_cost);
      }
      return res;
    } catch {
      const list = loadFallbackTickets();
      const idx = list.findIndex(t => t.ticket_id === ticketId);
      const nowIso = new Date().toISOString();
      if (idx >= 0) {
        const cur = list[idx];
        const actual = body.actual_cost !== undefined ? Number(body.actual_cost) : cur.actual_cost;
        const updated = {
          ...cur,
          repair_status: body.status,
          actual_cost: actual,
          repair_summary: body.repair_summary || cur.repair_summary,
          cost_covered_by_insurance: actual ?? cur.estimated_cost,
          customer_excess_paid: 0,
          updated_at: nowIso,
        };
        list[idx] = updated;
        saveFallbackTickets(list);
        const delivered = await syncShopImeiStatus(updated.imei, body.status, ticketId, body.repair_summary, actual ?? cur.estimated_cost);
        return {
          success: true,
          ticket: updated,
          webhook: ['REPAIR_COMPLETED', 'DELIVERED'].includes(body.status) ? { delivered } : null,
        };
      }
      throw new Error('ไม่พบตั๋วงานซ่อมในระบบ');
    }
  },
};
