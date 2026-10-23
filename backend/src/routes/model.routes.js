'use strict';
const { Router } = require('express');
const db         = require('../database/db');

const router = Router();

// GET /api/v1/models?brandId=1
router.get('/', async (req, res, next) => {
  try {
    const { brandId } = req.query;
    let sql    = `SELECT dm.*, b.name AS brand_name FROM device_models dm JOIN brands b ON b.id = dm.brand_id`;
    const params = [];
    if (brandId) { sql += ' WHERE dm.brand_id = $1'; params.push(brandId); }
    sql += ' ORDER BY b.name, dm.model_name, dm.storage';
    const result = await db.query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// GET /api/v1/models/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT dm.*, b.name AS brand_name FROM device_models dm JOIN brands b ON b.id = dm.brand_id WHERE dm.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Model not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

// POST /api/v1/models
router.post('/', async (req, res, next) => {
  try {
    const { brand_id, model_name, storage, color, selling_price, cost_price, sku, description, image_url } = req.body;
    if (!brand_id || !model_name || !storage || !color || !selling_price || !cost_price) {
      return res.status(422).json({ success: false, message: 'brand_id, model_name, storage, color, selling_price, cost_price are required' });
    }
    const result = await db.query(
      `INSERT INTO device_models(brand_id,model_name,storage,color,selling_price,cost_price,sku,description,image_url)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [brand_id, model_name, storage, color, selling_price, cost_price, sku, description, image_url]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
