'use strict';
const db = require('../database/db');

// ─────────────────────────────────────────────────────────────
// Repository: device_imeis
// ─────────────────────────────────────────────────────────────

/**
 * Find a single IMEI with full detail (model, brand, lot)
 */
const findImeiByCode = async (imei) => {
  const sql = `
    SELECT
      di.imei,
      di.status,
      di.purchase_price,
      di.note,
      di.received_at,
      di.sold_at,
      di.created_at,
      di.updated_at,
      dm.id            AS model_id,
      dm.model_name,
      dm.storage,
      dm.color,
      dm.selling_price,
      dm.sku,
      dm.image_url,
      b.id             AS brand_id,
      b.name           AS brand_name,
      sl.id            AS lot_id,
      sl.lot_number,
      sl.received_date AS lot_received_date,
      sup.name         AS supplier_name
    FROM device_imeis di
    JOIN device_models dm  ON dm.id  = di.model_id
    JOIN brands        b   ON b.id   = dm.brand_id
    LEFT JOIN stock_lots sl  ON sl.id  = di.lot_id
    LEFT JOIN suppliers  sup ON sup.id = sl.supplier_id
    WHERE di.imei = $1
  `;
  const result = await db.query(sql, [imei]);
  return result.rows[0] || null;
};

/**
 * Get status log history for an IMEI
 */
const findStatusLogs = async (imei) => {
  const sql = `
    SELECT id, old_status, new_status, changed_by, reason, changed_at
    FROM imei_status_logs
    WHERE imei = $1
    ORDER BY changed_at DESC
  `;
  const result = await db.query(sql, [imei]);
  return result.rows;
};

/**
 * Get available stock (IN_STOCK), grouped by model + brand
 */
const getAvailableStock = async (filters = {}) => {
  const conditions = ["di.status = 'IN_STOCK'"];
  const params     = [];
  let   idx        = 1;

  if (filters.brandId) {
    conditions.push(`b.id = $${idx++}`);
    params.push(filters.brandId);
  }
  if (filters.modelId) {
    conditions.push(`dm.id = $${idx++}`);
    params.push(filters.modelId);
  }

  const sql = `
    SELECT
      dm.id            AS model_id,
      dm.model_name,
      dm.storage,
      dm.color,
      dm.selling_price,
      dm.sku,
      dm.image_url,
      b.id             AS brand_id,
      b.name           AS brand_name,
      COUNT(di.imei)::int AS in_stock_count
    FROM device_imeis di
    JOIN device_models dm ON dm.id = di.model_id
    JOIN brands        b  ON b.id  = dm.brand_id
    WHERE ${conditions.join(' AND ')}
    GROUP BY dm.id, dm.model_name, dm.storage, dm.color, dm.selling_price, dm.sku, dm.image_url,
             b.id, b.name
    ORDER BY b.name, dm.model_name, dm.storage
  `;
  const result = await db.query(sql, params);
  return result.rows;
};

/**
 * Get full inventory summary by status
 */
const getInventorySummary = async () => {
  const sql = `
    SELECT
      b.name  AS brand_name,
      dm.model_name,
      dm.storage,
      dm.color,
      dm.selling_price,
      COUNT(*) FILTER (WHERE di.status = 'IN_STOCK')     AS in_stock,
      COUNT(*) FILTER (WHERE di.status = 'RESERVED')     AS reserved,
      COUNT(*) FILTER (WHERE di.status = 'SOLD')         AS sold,
      COUNT(*) FILTER (WHERE di.status = 'CLAIM_REPAIR') AS claim_repair,
      COUNT(*) FILTER (WHERE di.status = 'DEFECTIVE')    AS defective,
      COUNT(*)::int                                       AS total
    FROM device_imeis di
    JOIN device_models dm ON dm.id = di.model_id
    JOIN brands        b  ON b.id  = dm.brand_id
    GROUP BY b.name, dm.model_name, dm.storage, dm.color, dm.selling_price
    ORDER BY b.name, dm.model_name
  `;
  const result = await db.query(sql);
  return result.rows;
};

/**
 * Get dashboard KPI counts
 */
const getDashboardKpis = async () => {
  const sql = `
    SELECT
      COUNT(*) FILTER (WHERE status = 'IN_STOCK')     AS in_stock,
      COUNT(*) FILTER (WHERE status = 'RESERVED')     AS reserved,
      COUNT(*) FILTER (WHERE status = 'SOLD')         AS sold,
      COUNT(*) FILTER (WHERE status = 'CLAIM_REPAIR') AS claim_repair,
      COUNT(*) FILTER (WHERE status = 'DEFECTIVE')    AS defective,
      COUNT(*)::int                                   AS total
    FROM device_imeis
  `;
  const result = await db.query(sql);
  return result.rows[0];
};

/**
 * Insert a single IMEI record
 */
const insertImei = async (client, { imei, modelId, lotId, purchasePrice, note }) => {
  const sql = `
    INSERT INTO device_imeis (imei, model_id, lot_id, purchase_price, note, status)
    VALUES ($1, $2, $3, $4, $5, 'IN_STOCK')
    RETURNING *
  `;
  const result = await (client || db).query(sql, [imei, modelId, lotId, purchasePrice, note]);
  return result.rows[0];
};

/**
 * Update IMEI status and append log
 */
const updateImeiStatus = async (imei, newStatus, changedBy, reason) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Fetch current status
    const current = await client.query(
      'SELECT status FROM device_imeis WHERE imei = $1 FOR UPDATE',
      [imei]
    );
    if (current.rows.length === 0) throw Object.assign(new Error('IMEI not found'), { statusCode: 404 });

    const oldStatus = current.rows[0].status;
    if (oldStatus === newStatus) {
      await client.query('ROLLBACK');
      return { imei, status: newStatus, changed: false };
    }

    // Update status (and sold_at if SOLD)
    const updateSql = newStatus === 'SOLD'
      ? `UPDATE device_imeis SET status = $1, sold_at = NOW(), updated_at = NOW() WHERE imei = $2 RETURNING *`
      : `UPDATE device_imeis SET status = $1, updated_at = NOW() WHERE imei = $2 RETURNING *`;

    const updated = await client.query(updateSql, [newStatus, imei]);

    // Insert manual log (trigger also fires, but we add reason here)
    await client.query(
      `INSERT INTO imei_status_logs(imei, old_status, new_status, changed_by, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [imei, oldStatus, newStatus, changedBy || 'system', reason || null]
    );

    await client.query('COMMIT');
    return { imei, oldStatus, newStatus, changed: true, data: updated.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Upsert a stock lot and increment total_units
 */
const upsertLot = async (client, { lotNumber, supplierId, receivedDate, note, createdBy }) => {
  const existing = await (client || db).query(
    'SELECT id FROM stock_lots WHERE lot_number = $1', [lotNumber]
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const result = await (client || db).query(
    `INSERT INTO stock_lots(lot_number, supplier_id, received_date, note, created_by)
     VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [lotNumber, supplierId, receivedDate, note, createdBy]
  );
  return result.rows[0];
};

/**
 * Increment lot total_units count
 */
const incrementLotUnits = async (client, lotId, count) => {
  await (client || db).query(
    'UPDATE stock_lots SET total_units = total_units + $1 WHERE id = $2',
    [count, lotId]
  );
};

module.exports = {
  findImeiByCode,
  findStatusLogs,
  getAvailableStock,
  getInventorySummary,
  getDashboardKpis,
  insertImei,
  updateImeiStatus,
  upsertLot,
  incrementLotUnits,
};
