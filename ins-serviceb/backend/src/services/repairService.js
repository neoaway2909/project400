'use strict';

const { v4: uuidv4 } = require('uuid');
const pool = require('../database/db');
const mockStore = require('../database/mockStore');
const policyService = require('./policyService');
const {
  REPAIR_STATUSES,
  calculateRepairCosts,
  getCoverageLimit,
  inferCoverageType,
  resolveCoverageRule,
  canTransition,
} = require('./repairCalculations');

let useMemory = process.env.USE_MEMORY_DB === 'true' || false;

async function isDbOnline() {
  if (useMemory) return false;
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    useMemory = true;
    console.log('[RepairService] PostgreSQL unreachable – switching to In-Memory Store');
    return false;
  }
}

function httpError(message, statusCode, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function mapTicketId(sequence) {
  return `REP-${new Date().getFullYear()}-${String(sequence).padStart(4, '0')}`;
}

function findCenterInMemory(centerIdOrCode) {
  if (!centerIdOrCode) return mockStore.mockRepairCenters[0];
  return (
    mockStore.mockRepairCenters.find(
      c => c.id === centerIdOrCode || c.center_code === centerIdOrCode
    ) || mockStore.mockRepairCenters[0]
  );
}

function findTechnicianInMemory(technicianId, centerId) {
  if (technicianId) {
    return mockStore.mockTechnicians.find(t => t.id === technicianId) || null;
  }
  return mockStore.mockTechnicians.find(t => t.center_id === centerId) || mockStore.mockTechnicians[0] || null;
}

async function createRepairTicket(data) {
  const policy = await policyService.verifyByImei(data.imei);
  if (!policy.is_valid) {
    throw httpError(
      policy.validation_reason || 'กรมธรรม์หมดอายุหรือไม่สามารถเคลมได้',
      409,
      'POLICY_NOT_CLAIMABLE'
    );
  }
  if (data.policy_no && data.policy_no !== policy.policy_no) {
    throw httpError('เลขกรมธรรม์ไม่ตรงกับ IMEI ที่ตรวจสอบ', 409, 'POLICY_IMEI_MISMATCH');
  }

  const claimableRules = policy.coverage_details.claimable_rules || [];
  const coverageType = data.coverage_type || inferCoverageType(data.defect_symptom);
  let coverageRule = resolveCoverageRule(
    claimableRules,
    coverageType,
    data.defect_symptom
  );
  // If user selected general symptom or rule covers ACCIDENTAL/all, fallback to first available rule
  if (!coverageRule && claimableRules.length > 0) {
    coverageRule = claimableRules.find(r => r.coverage_type === 'ACCIDENTAL') || claimableRules[0];
  }
  if (!coverageRule) {
    throw httpError('กรมธรรม์นี้ไม่มีความคุ้มครองประเภทที่ระบุ', 409, 'COVERAGE_TYPE_NOT_COVERED');
  }

  const coverageLimit = getCoverageLimit(
    policy.coverage_details.remaining_claim_amount,
    coverageRule
  );
  const fixedExcess = Number(coverageRule?.excess_amount || 0);
  const estimatedCosts = calculateRepairCosts(data.estimated_cost, coverageLimit, fixedExcess);

  // In-memory execution when PostgreSQL is offline
  if (!(await isDbOnline())) {
    const center = findCenterInMemory(data.center_id);
    if (!center) {
      throw httpError('ไม่พบศูนย์ซ่อมที่ระบุ', 404, 'REPAIR_CENTER_NOT_FOUND');
    }
    const technician = findTechnicianInMemory(data.technician_id, center.id);
    const ticketId = mapTicketId(mockStore.getNextRepairTicketSeq());
    const nowIso = new Date().toISOString();

    const newTicket = {
      ticket_id: ticketId,
      policy_no: policy.policy_no,
      imei: data.imei,
      center_id: center.id,
      technician_id: technician ? technician.id : null,
      defect_symptom: data.defect_symptom,
      repair_status: 'RECEIVED',
      estimated_cost: Number(data.estimated_cost),
      actual_cost: null,
      coverage_limit_at_intake: coverageLimit,
      fixed_excess_at_intake: fixedExcess,
      cost_covered_by_insurance: estimatedCosts.cost_covered_by_insurance,
      customer_excess_paid: estimatedCosts.customer_excess_paid,
      repair_summary: null,
      created_at: nowIso,
      updated_at: nowIso,
      completed_at: null,
    };

    mockStore.mockRepairTickets.unshift(newTicket);
    await policyService.recordClaimUsage(policy.policy_no, estimatedCosts.cost_covered_by_insurance);
    newTicket.claim_deducted = true;

    for (const photo of data.photos || []) {
      mockStore.mockRepairPhotos.push({
        id: uuidv4(),
        ticket_id: ticketId,
        photo_url: photo.photo_url,
        photo_type: photo.photo_type,
        created_at: nowIso,
      });
    }

    mockStore.mockRepairStatusLogs.push({
      ticket_id: ticketId,
      event_id: uuidv4(),
      event_type: 'RECEIVED',
      details: { source: 'repair_intake', note: 'ศูนย์บริการรับเรื่องแจ้งเคลมเข้าระบบแล้ว' },
      status_updated_at: nowIso,
    });

    return {
      ...newTicket,
      center_name: center.name,
      center_phone: center.phone,
      center_address: center.location,
      technician_name: technician ? technician.full_name : null,
      coverage_details: policy.coverage_details,
    };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const centerResult = await client.query(
      'SELECT id, name FROM repair_centers WHERE id = $1',
      [data.center_id]
    );
    if (!centerResult.rowCount) {
      throw httpError('ไม่พบศูนย์ซ่อมที่ระบุ', 404, 'REPAIR_CENTER_NOT_FOUND');
    }

    if (data.technician_id) {
      const technicianResult = await client.query(
        'SELECT id FROM technicians WHERE id = $1 AND center_id = $2',
        [data.technician_id, data.center_id]
      );
      if (!technicianResult.rowCount) {
        throw httpError('ช่างไม่สังกัดศูนย์ซ่อมที่ระบุ', 400, 'TECHNICIAN_CENTER_MISMATCH');
      }
    }

    const sequenceResult = await client.query("SELECT nextval('repair_ticket_seq') AS value");
    const ticketId = mapTicketId(sequenceResult.rows[0].value);
    const ticketResult = await client.query(
      `INSERT INTO repair_tickets (
        ticket_id, policy_no, imei, center_id, technician_id, defect_symptom,
        estimated_cost, coverage_limit_at_intake, fixed_excess_at_intake, cost_covered_by_insurance,
        customer_excess_paid
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        ticketId,
        policy.policy_no,
        data.imei,
        data.center_id,
        data.technician_id || null,
        data.defect_symptom,
        data.estimated_cost,
        coverageLimit,
        fixedExcess,
        estimatedCosts.cost_covered_by_insurance,
        estimatedCosts.customer_excess_paid,
      ]
    );

    for (const photo of data.photos || []) {
      await client.query(
        'INSERT INTO repair_photos (ticket_id, photo_url, photo_type) VALUES ($1, $2, $3)',
        [ticketId, photo.photo_url, photo.photo_type]
      );
    }

    await client.query(
      `INSERT INTO repair_status_logs (ticket_id, event_id, event_type, details, status_updated_at)
       VALUES ($1, $2, 'RECEIVED', $3, NOW())`,
      [ticketId, uuidv4(), JSON.stringify({ source: 'repair_intake' })]
    );
    await client.query('COMMIT');

    return {
      ...ticketResult.rows[0],
      center_name: centerResult.rows[0].name,
      coverage_details: policy.coverage_details,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function listRepairTickets({ status, search }) {
  if (status && !REPAIR_STATUSES.includes(status)) {
    throw httpError('สถานะงานซ่อมไม่ถูกต้อง', 400, 'INVALID_REPAIR_STATUS');
  }

  if (!(await isDbOnline())) {
    let list = mockStore.mockRepairTickets.map(t => {
      const center = findCenterInMemory(t.center_id);
      const tech = findTechnicianInMemory(t.technician_id, t.center_id);
      const logs = mockStore.mockRepairStatusLogs
        .filter(l => l.ticket_id === t.ticket_id)
        .sort((a, b) => new Date(a.status_updated_at) - new Date(b.status_updated_at));
      return {
        ...t,
        center_name: center ? center.name : 'ศูนย์บริการมาตรฐาน',
        center_phone: center ? center.phone : '02-123-4567',
        center_address: center ? center.location : '',
        technician_name: tech ? tech.full_name : null,
        status_history: logs,
      };
    });

    if (status) {
      list = list.filter(t => t.repair_status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        t =>
          t.ticket_id.toLowerCase().includes(s) ||
          t.imei.includes(s) ||
          (t.policy_no && t.policy_no.toLowerCase().includes(s))
      );
    }
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const searchValue = search ? `%${search}%` : null;
  const result = await pool.query(
    `SELECT t.ticket_id, t.policy_no, t.imei, t.defect_symptom, t.repair_status,
            t.estimated_cost, t.actual_cost, t.cost_covered_by_insurance,
            t.customer_excess_paid, t.created_at, t.completed_at,
            c.name AS center_name, tech.full_name AS technician_name
       FROM repair_tickets t
       JOIN repair_centers c ON c.id = t.center_id
       LEFT JOIN technicians tech ON tech.id = t.technician_id
      WHERE ($1::text IS NULL OR t.repair_status::text = $1)
        AND ($2::text IS NULL OR t.ticket_id ILIKE $2 OR t.imei ILIKE $2)
      ORDER BY t.created_at DESC`,
    [status || null, searchValue]
  );
  return result.rows;
}

async function getRepairTicket(ticketId) {
  if (!(await isDbOnline())) {
    const ticket = mockStore.mockRepairTickets.find(t => t.ticket_id === ticketId);
    if (!ticket) {
      throw httpError('ไม่พบตั๋วงานซ่อม', 404, 'REPAIR_TICKET_NOT_FOUND');
    }
    const center = findCenterInMemory(ticket.center_id);
    const tech = findTechnicianInMemory(ticket.technician_id, ticket.center_id);
    const photos = mockStore.mockRepairPhotos.filter(p => p.ticket_id === ticketId);
    const logs = mockStore.mockRepairStatusLogs
      .filter(l => l.ticket_id === ticketId)
      .sort((a, b) => new Date(a.status_updated_at) - new Date(b.status_updated_at));
    const webhooks = mockStore.mockWebhookLogs
      .filter(w => w.ticket_id === ticketId)
      .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));

    return {
      ...ticket,
      center_name: center ? center.name : 'ศูนย์บริการมาตรฐาน',
      center_code: center ? center.center_code : 'CTR-SIAM-01',
      center_phone: center ? center.phone : '02-123-4567',
      center_address: center ? center.location : '',
      technician_name: tech ? tech.full_name : null,
      technician_email: tech ? tech.email : null,
      photos,
      parts: [],
      status_history: logs,
      webhook_logs: webhooks,
    };
  }

  const ticketResult = await pool.query(
    `SELECT t.*, c.name AS center_name, c.center_code,
            tech.full_name AS technician_name, tech.email AS technician_email
       FROM repair_tickets t
       JOIN repair_centers c ON c.id = t.center_id
       LEFT JOIN technicians tech ON tech.id = t.technician_id
      WHERE t.ticket_id = $1`,
    [ticketId]
  );
  if (!ticketResult.rowCount) {
    throw httpError('ไม่พบตั๋วงานซ่อม', 404, 'REPAIR_TICKET_NOT_FOUND');
  }

  const [photosResult, partsResult, logsResult, webhookResult] = await Promise.all([
    pool.query(
      'SELECT id, photo_url, photo_type, created_at FROM repair_photos WHERE ticket_id = $1 ORDER BY created_at',
      [ticketId]
    ),
    pool.query(
      `SELECT p.id, p.part_code, p.part_name, tp.quantity, tp.unit_price
         FROM ticket_parts tp JOIN spare_parts p ON p.id = tp.part_id
        WHERE tp.ticket_id = $1 ORDER BY p.part_name`,
      [ticketId]
    ),
    pool.query(
      `SELECT event_id, event_type, details, status_updated_at
         FROM repair_status_logs WHERE ticket_id = $1 ORDER BY status_updated_at`,
      [ticketId]
    ),
    pool.query(
      `SELECT event_type, target_url, response_status, error_message, sent_at
         FROM webhook_logs WHERE ticket_id = $1 ORDER BY sent_at DESC`,
      [ticketId]
    ),
  ]);

  return {
    ...ticketResult.rows[0],
    photos: photosResult.rows,
    parts: partsResult.rows,
    status_history: logsResult.rows,
    webhook_logs: webhookResult.rows,
  };
}

async function sendCompletionWebhook(ticket, status) {
  const targetUrl = process.env.REPAIR_WEBHOOK_URL
    || 'http://localhost:4000/api/v1/pos/webhooks/repairs';
  const payload = {
    event_id: uuidv4(),
    event_type: status,
    ticket_id: ticket.ticket_id,
    policy_no: ticket.policy_no,
    imei: ticket.imei,
    center_name: ticket.center_name,
    status_updated_at: typeof ticket.updated_at === 'string'
      ? ticket.updated_at
      : new Date(ticket.updated_at || Date.now()).toISOString(),
    details: {
      repair_summary: ticket.repair_summary,
      estimated_cost: Number(ticket.estimated_cost),
      actual_cost: ticket.actual_cost === null ? null : Number(ticket.actual_cost),
      cost_covered_by_insurance: Number(ticket.cost_covered_by_insurance),
      customer_excess_paid: Number(ticket.customer_excess_paid),
    },
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  let responseStatus = null;
  let errorMessage = null;

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    responseStatus = response.status;
    if (!response.ok) errorMessage = `Webhook returned HTTP ${response.status}`;
  } catch (error) {
    errorMessage = error.name === 'AbortError' ? 'Webhook request timed out' : error.message;
  } finally {
    clearTimeout(timeout);
  }

  if (!(await isDbOnline())) {
    mockStore.mockWebhookLogs.push({
      id: uuidv4(),
      ticket_id: ticket.ticket_id,
      event_type: status,
      target_url: targetUrl,
      payload,
      response_status: responseStatus,
      error_message: errorMessage,
      sent_at: new Date().toISOString(),
    });
  } else {
    await pool.query(
      `INSERT INTO webhook_logs (
        ticket_id, event_type, target_url, payload, response_status, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [ticket.ticket_id, status, targetUrl, JSON.stringify(payload), responseStatus, errorMessage]
    );
  }

  return {
    delivered: responseStatus !== null && responseStatus >= 200 && responseStatus < 300,
    response_status: responseStatus,
    error: errorMessage,
  };
}

async function updateRepairStatus(ticketId, data) {
  if (!REPAIR_STATUSES.includes(data.status)) {
    throw httpError('สถานะงานซ่อมไม่ถูกต้อง', 400, 'INVALID_REPAIR_STATUS');
  }

  if (!(await isDbOnline())) {
    const ticket = mockStore.mockRepairTickets.find(t => t.ticket_id === ticketId);
    if (!ticket) {
      throw httpError('ไม่พบตั๋วงานซ่อม', 404, 'REPAIR_TICKET_NOT_FOUND');
    }
    if (!canTransition(ticket.repair_status, data.status)) {
      throw httpError(
        `ไม่สามารถเปลี่ยนสถานะจาก ${ticket.repair_status} เป็น ${data.status}`,
        409,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const actualCost = data.actual_cost === undefined ? ticket.actual_cost : Number(data.actual_cost);
    const costs = actualCost === null || actualCost === undefined
      ? {
        cost_covered_by_insurance: ticket.cost_covered_by_insurance,
        customer_excess_paid: ticket.customer_excess_paid,
      }
      : calculateRepairCosts(
        actualCost,
        ticket.coverage_limit_at_intake,
        ticket.fixed_excess_at_intake
      );

    const nowIso = new Date().toISOString();
    ticket.repair_status = data.status;
    ticket.actual_cost = actualCost;
    if (data.repair_summary !== undefined) {
      ticket.repair_summary = data.repair_summary;
    }
    ticket.cost_covered_by_insurance = costs.cost_covered_by_insurance;
    ticket.customer_excess_paid = costs.customer_excess_paid;
    if (data.status === 'REPAIR_COMPLETED') {
      ticket.completed_at = nowIso;
      if (!ticket.claim_deducted) {
        await policyService.recordClaimUsage(ticket.policy_no, costs.cost_covered_by_insurance);
        ticket.claim_deducted = true;
      }
    }
    ticket.updated_at = nowIso;

    const center = findCenterInMemory(ticket.center_id);
    const updatedTicket = {
      ...ticket,
      center_name: center ? center.name : 'ศูนย์บริการมาตรฐาน',
    };

    mockStore.mockRepairStatusLogs.push({
      ticket_id: ticketId,
      event_id: uuidv4(),
      event_type: data.status,
      details: data,
      status_updated_at: nowIso,
    });

    const webhook = ['REPAIR_COMPLETED', 'DELIVERED'].includes(data.status)
      ? await sendCompletionWebhook(updatedTicket, data.status)
      : null;

    return { ticket: updatedTicket, webhook };
  }

  const client = await pool.connect();
  let updatedTicket;

  try {
    await client.query('BEGIN');
    const currentResult = await client.query(
      `SELECT t.*, c.name AS center_name
         FROM repair_tickets t JOIN repair_centers c ON c.id = t.center_id
        WHERE t.ticket_id = $1 FOR UPDATE OF t`,
      [ticketId]
    );
    if (!currentResult.rowCount) {
      throw httpError('ไม่พบตั๋วงานซ่อม', 404, 'REPAIR_TICKET_NOT_FOUND');
    }
    const current = currentResult.rows[0];
    if (!canTransition(current.repair_status, data.status)) {
      throw httpError(
        `ไม่สามารถเปลี่ยนสถานะจาก ${current.repair_status} เป็น ${data.status}`,
        409,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const actualCost = data.actual_cost === undefined ? current.actual_cost : data.actual_cost;
    const costs = actualCost === null || actualCost === undefined
      ? {
        cost_covered_by_insurance: current.cost_covered_by_insurance,
        customer_excess_paid: current.customer_excess_paid,
      }
      : calculateRepairCosts(
        actualCost,
        current.coverage_limit_at_intake,
        current.fixed_excess_at_intake
      );

    const result = await client.query(
      `UPDATE repair_tickets
          SET repair_status = $2,
              actual_cost = $3,
              repair_summary = COALESCE($4, repair_summary),
              cost_covered_by_insurance = $5,
              customer_excess_paid = $6,
              completed_at = CASE WHEN $2 = 'REPAIR_COMPLETED' THEN NOW() ELSE completed_at END,
              updated_at = NOW()
        WHERE ticket_id = $1
        RETURNING *`,
      [
        ticketId,
        data.status,
        actualCost,
        data.repair_summary === undefined ? null : data.repair_summary,
        costs.cost_covered_by_insurance,
        costs.customer_excess_paid,
      ]
    );
    updatedTicket = { ...result.rows[0], center_name: current.center_name };
    await client.query(
      `INSERT INTO repair_status_logs (ticket_id, event_id, event_type, details, status_updated_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [ticketId, uuidv4(), data.status, JSON.stringify(data)]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  if (data.status === 'REPAIR_COMPLETED') {
    await policyService.recordClaimUsage(updatedTicket.policy_no, updatedTicket.cost_covered_by_insurance);
  }

  const webhook = ['REPAIR_COMPLETED', 'DELIVERED'].includes(data.status)
    ? await sendCompletionWebhook(updatedTicket, data.status)
    : null;
  return { ticket: updatedTicket, webhook };
}

module.exports = {
  createRepairTicket,
  listRepairTickets,
  getRepairTicket,
  updateRepairStatus,
};
