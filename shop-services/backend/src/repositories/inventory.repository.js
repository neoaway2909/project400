'use strict';
const db = require('../database/db');
const store = require('../database/memoryStore');

// Helper: test if PostgreSQL is reachable (cached after first failure)
let useMemory = process.env.USE_MEMORY_DB === 'true' || false;

async function isDbOnline() {
  if (useMemory) return false;
  try {
    await db.query('SELECT 1');
    return true;
  } catch {
    useMemory = true;
    console.log('[InventoryRepo] PostgreSQL unreachable – switching to In-Memory Store');
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Repository: device_imeis
// ─────────────────────────────────────────────────────────────

/**
 * Find a single IMEI with full detail (model, brand, lot)
 */
const findImeiByCode = async (imei) => {
  if (!(await isDbOnline())) {
    const di = store.deviceImeis.find(d => d.imei === imei);
    if (!di) return null;
    const dm = store.deviceModels.find(m => m.id === di.model_id) || {};
    const b  = store.brands.find(br => br.id === dm.brand_id) || {};
    const sl = store.stockLots.find(l => l.id === di.lot_id) || {};
    const sup = store.suppliers.find(s => s.id === sl.supplier_id) || {};
    return {
      imei: di.imei,
      status: di.status,
      purchase_price: di.purchase_price,
      note: di.note || null,
      received_at: di.received_at,
      sold_at: di.sold_at,
      created_at: di.received_at,
      updated_at: di.sold_at || di.received_at,
      model_id: dm.id,
      model_name: dm.model_name,
      storage: dm.storage,
      color: dm.color,
      selling_price: dm.selling_price,
      sku: dm.sku,
      image_url: dm.image_url || null,
      brand_id: b.id,
      brand_name: b.name,
      lot_id: sl.id || null,
      lot_number: sl.lot_number || null,
      lot_received_date: sl.received_date || null,
      supplier_name: sup.name || null,
    };
  }

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
  if (!(await isDbOnline())) {
    return store.imeiStatusLogs
      .filter(l => l.imei === imei)
      .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
  }

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
  if (!(await isDbOnline())) {
    const grouped = [];
    for (const dm of store.deviceModels) {
      const b = store.brands.find(br => br.id === dm.brand_id);
      if (!b) continue;
      if (filters.brandId && b.id !== filters.brandId) continue;
      if (filters.modelId && dm.id !== filters.modelId) continue;

      const availableImeis = store.deviceImeis
        .filter(di => di.model_id === dm.id && di.status === 'IN_STOCK')
        .map(di => di.imei)
        .sort();

      if (availableImeis.length > 0) {
        grouped.push({
          model_id: dm.id,
          model_name: dm.model_name,
          storage: dm.storage,
          color: dm.color,
          selling_price: dm.selling_price,
          sku: dm.sku,
          image_url: dm.image_url || null,
          brand_id: b.id,
          brand_name: b.name,
          in_stock_count: availableImeis.length,
          available_imeis: availableImeis,
        });
      }
    }
    return grouped;
  }

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
      COUNT(di.imei)::int AS in_stock_count,
      ARRAY_AGG(di.imei ORDER BY di.imei) AS available_imeis
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
  if (!(await isDbOnline())) {
    return store.deviceModels.map(dm => {
      const b = store.brands.find(br => br.id === dm.brand_id) || {};
      const items = store.deviceImeis.filter(di => di.model_id === dm.id);
      return {
        brand_name: b.name,
        model_name: dm.model_name,
        storage: dm.storage,
        color: dm.color,
        selling_price: dm.selling_price,
        in_stock: items.filter(i => i.status === 'IN_STOCK').length,
        reserved: items.filter(i => i.status === 'RESERVED').length,
        sold: items.filter(i => i.status === 'SOLD').length,
        claim_repair: items.filter(i => i.status === 'CLAIM_REPAIR').length,
        defective: items.filter(i => i.status === 'DEFECTIVE').length,
        total: items.length,
      };
    });
  }

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
  if (!(await isDbOnline())) {
    const items = store.deviceImeis;
    return {
      in_stock: items.filter(i => i.status === 'IN_STOCK').length,
      reserved: items.filter(i => i.status === 'RESERVED').length,
      sold: items.filter(i => i.status === 'SOLD').length,
      claim_repair: items.filter(i => i.status === 'CLAIM_REPAIR').length,
      defective: items.filter(i => i.status === 'DEFECTIVE').length,
      total: items.length,
    };
  }

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
  if (!client || useMemory) {
    const existing = store.deviceImeis.find(d => d.imei === imei);
    if (existing) {
      const err = new Error(`IMEIs already exist in database: ${imei}`);
      err.statusCode = 409;
      err.duplicates = [imei];
      throw err;
    }
    const row = {
      imei,
      model_id: Number(modelId),
      lot_id: lotId || null,
      status: 'IN_STOCK',
      purchase_price: purchasePrice || null,
      note: note || null,
      received_at: new Date().toISOString(),
      sold_at: null,
    };
    store.deviceImeis.push(row);
    store.imeiStatusLogs.push({
      id: store.getNextLogId(),
      imei,
      old_status: null,
      new_status: 'IN_STOCK',
      changed_by: 'staff',
      reason: note || 'รับเข้าสต็อก',
      changed_at: row.received_at,
    });
    return row;
  }

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
  if (!(await isDbOnline())) {
    let item = store.deviceImeis.find(d => d.imei === imei);
    if (!item) {
      item = {
        imei,
        model_id: 1,
        lot_id: 1,
        status: 'SOLD',
        purchase_price: 34000,
        note: 'ซิงค์จากระบบประกันภัย',
        received_at: new Date().toISOString(),
        sold_at: new Date().toISOString(),
      };
      store.deviceImeis.push(item);
    }
    const oldStatus = item.status;
    item.status = newStatus;
    if (newStatus === 'SOLD' && !item.sold_at) {
      item.sold_at = new Date().toISOString();
    }
    store.imeiStatusLogs.push({
      id: store.getNextLogId(),
      imei,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: changedBy || 'system',
      reason: reason || null,
      changed_at: new Date().toISOString(),
    });
    return { imei, oldStatus, newStatus, changed: true, data: item };
  }

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
  if (!client || useMemory) {
    const existing = store.stockLots.find(l => l.lot_number === lotNumber);
    if (existing) return existing;
    const newLot = {
      id: store.stockLots.length + 1,
      lot_number: lotNumber,
      supplier_id: supplierId || 1,
      received_date: receivedDate,
      note: note || null,
      created_by: createdBy || 'staff',
      total_units: 0,
    };
    store.stockLots.push(newLot);
    return newLot;
  }

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
  if (!client || useMemory) {
    const lot = store.stockLots.find(l => l.id === lotId);
    if (lot) lot.total_units += count;
    return;
  }

  await (client || db).query(
    'UPDATE stock_lots SET total_units = total_units + $1 WHERE id = $2',
    [count, lotId]
  );
};

module.exports = {
  isDbOnline,
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
