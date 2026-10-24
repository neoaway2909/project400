'use strict';
const { validateImei, validateImeiBatch } = require('../utils/imei.validator');
const inventoryRepo = require('../repositories/inventory.repository');
const db            = require('../database/db');

const VALID_STATUSES = ['IN_STOCK', 'RESERVED', 'SOLD', 'CLAIM_REPAIR', 'DEFECTIVE'];

// ─────────────────────────────────────────────────────────────
// Service: Inventory (Business Logic Layer)
// ─────────────────────────────────────────────────────────────

/**
 * Receive stock - single or batch IMEI
 * POST /api/v1/inventory/receive
 */
const receiveStock = async ({
  imeis,       // string[] - required
  modelId,     // number   - required
  lotNumber,   // string   - optional
  supplierId,  // number   - optional
  receivedDate,// string   - optional
  note,        // string   - optional
  purchasePrice, // number - optional
  createdBy,   // string   - optional
}) => {
  // 1. Validate all IMEIs
  const validationResults = validateImeiBatch(imeis, false); // strict Luhn: off by default
  const invalid = validationResults.filter(r => !r.valid);
  if (invalid.length > 0) {
    const err = new Error('One or more IMEIs failed validation');
    err.statusCode = 422;
    err.details = invalid;
    throw err;
  }

  // 2. Check for duplicate IMEIs in the payload itself
  const uniqueImeis = [...new Set(imeis.map(i => i.trim()))];
  if (uniqueImeis.length !== imeis.length) {
    const err = new Error('Duplicate IMEIs found in request');
    err.statusCode = 422;
    throw err;
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 3. Ensure/create lot
    let lotId = null;
    if (lotNumber) {
      const lot = await inventoryRepo.upsertLot(client, {
        lotNumber, supplierId, receivedDate: receivedDate || new Date().toISOString().slice(0, 10),
        note, createdBy,
      });
      lotId = lot.id;
    }

    // 4. Check DB duplicates
    const placeholders = uniqueImeis.map((_, i) => `$${i + 1}`).join(',');
    const existing = await client.query(
      `SELECT imei FROM device_imeis WHERE imei IN (${placeholders})`,
      uniqueImeis
    );
    if (existing.rows.length > 0) {
      const dupes = existing.rows.map(r => r.imei);
      const err = new Error(`IMEIs already exist in database: ${dupes.join(', ')}`);
      err.statusCode = 409;
      err.duplicates = dupes;
      throw err;
    }

    // 5. Insert all
    const inserted = [];
    for (const imei of uniqueImeis) {
      const row = await inventoryRepo.insertImei(client, { imei, modelId, lotId, purchasePrice, note });
      inserted.push(row);
    }

    // 6. Update lot total_units
    if (lotId) {
      await inventoryRepo.incrementLotUnits(client, lotId, inserted.length);
    }

    await client.query('COMMIT');
    return {
      success: true,
      inserted: inserted.length,
      lotId,
      data: inserted,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Get IMEI details + status log
 * GET /api/v1/inventory/imei/:imei
 */
const getImeiDetail = async (imei) => {
  const { valid, errors } = validateImei(imei);
  if (!valid) {
    const err = new Error(errors[0]);
    err.statusCode = 422;
    throw err;
  }

  const device = await inventoryRepo.findImeiByCode(imei);
  if (!device) {
    const err = new Error(`IMEI ${imei} not found in system`);
    err.statusCode = 404;
    throw err;
  }

  const logs = await inventoryRepo.findStatusLogs(imei);
  return { device, logs };
};

/**
 * Get available stock for POS
 * GET /api/v1/inventory/available-stock
 */
const getAvailableStock = async (filters) => {
  const rows = await inventoryRepo.getAvailableStock(filters);
  return {
    count: rows.length,
    data: rows,
  };
};

/**
 * Get inventory summary (all statuses by model)
 * GET /api/v1/inventory/summary
 */
const getInventorySummary = async () => {
  const [summary, kpis] = await Promise.all([
    inventoryRepo.getInventorySummary(),
    inventoryRepo.getDashboardKpis(),
  ]);
  return { kpis, breakdown: summary };
};

/**
 * Update IMEI status
 * PUT /api/v1/inventory/imei/:imei/status
 */
const updateImeiStatus = async (imei, newStatus, changedBy, reason) => {
  const { valid, errors } = validateImei(imei);
  if (!valid) {
    const err = new Error(errors[0]);
    err.statusCode = 422;
    throw err;
  }
  if (!VALID_STATUSES.includes(newStatus)) {
    const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    err.statusCode = 422;
    throw err;
  }
  return inventoryRepo.updateImeiStatus(imei, newStatus, changedBy, reason);
};

module.exports = { receiveStock, getImeiDetail, getAvailableStock, getInventorySummary, updateImeiStatus };
