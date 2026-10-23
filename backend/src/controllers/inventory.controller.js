'use strict';
const inventoryService = require('../services/inventory.service');

// ─────────────────────────────────────────────────────────────
// Controller: Inventory
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/inventory/receive
 * Receive new stock (single or batch)
 * Body: { imeis: string[], modelId: number, lotNumber?, supplierId?,
 *         receivedDate?, purchasePrice?, note? }
 */
const receiveStock = async (req, res, next) => {
  try {
    const {
      imeis: rawImeis,
      modelId,
      lotNumber,
      supplierId,
      receivedDate,
      purchasePrice,
      note,
    } = req.body;

    // Accept single IMEI as string or array
    const imeis = Array.isArray(rawImeis) ? rawImeis : [rawImeis].filter(Boolean);

    if (!imeis.length) {
      return res.status(422).json({ success: false, message: 'At least one IMEI is required' });
    }
    if (!modelId) {
      return res.status(422).json({ success: false, message: 'modelId is required' });
    }

    const result = await inventoryService.receiveStock({
      imeis, modelId, lotNumber, supplierId, receivedDate, note, purchasePrice,
      createdBy: req.body.createdBy || 'staff',
    });

    return res.status(201).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        ...(err.details    && { details:    err.details }),
        ...(err.duplicates && { duplicates: err.duplicates }),
      });
    }
    next(err);
  }
};

/**
 * GET /api/v1/inventory/imei/:imei
 * Get IMEI detail + status history
 */
const getImeiDetail = async (req, res, next) => {
  try {
    const { imei } = req.params;
    const result = await inventoryService.getImeiDetail(imei);
    return res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * GET /api/v1/inventory/available-stock
 * Get IN_STOCK devices grouped by model (for POS)
 * Query: brandId?, modelId?
 */
const getAvailableStock = async (req, res, next) => {
  try {
    const { brandId, modelId } = req.query;
    const result = await inventoryService.getAvailableStock({
      brandId: brandId ? parseInt(brandId) : undefined,
      modelId: modelId ? parseInt(modelId) : undefined,
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/inventory/summary
 * Dashboard: all statuses by model + KPI counts
 */
const getSummary = async (req, res, next) => {
  try {
    const result = await inventoryService.getInventorySummary();
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/inventory/imei/:imei/status
 * Update status (SOLD, CLAIM_REPAIR, etc.)
 * Body: { status, changedBy?, reason? }
 */
const updateImeiStatus = async (req, res, next) => {
  try {
    const { imei }       = req.params;
    const { status, changedBy, reason } = req.body;

    if (!status) {
      return res.status(422).json({ success: false, message: 'status is required' });
    }

    const result = await inventoryService.updateImeiStatus(
      imei, status.toUpperCase(), changedBy, reason
    );
    return res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
};

module.exports = { receiveStock, getImeiDetail, getAvailableStock, getSummary, updateImeiStatus };
