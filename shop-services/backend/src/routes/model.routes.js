'use strict';
const { Router } = require('express');
const db         = require('../database/db');
const store      = require('../database/memoryStore');
const inventoryRepo = require('../repositories/inventory.repository');

const router = Router();

// GET /api/v1/models?brandId=1
router.get('/', async (req, res, next) => {
  try {
    const { brandId } = req.query;
    if (!(await inventoryRepo.isDbOnline())) {
      let list = store.deviceModels.map(dm => {
        const b = store.brands.find(x => x.id === dm.brand_id) || {};
        return { ...dm, brand_name: b.name };
      });
      if (brandId) list = list.filter(m => m.brand_id === Number(brandId));
      return res.json({ success: true, data: list });
    }
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
    if (!(await inventoryRepo.isDbOnline())) {
      const dm = store.deviceModels.find(x => x.id === Number(req.params.id));
      if (!dm) return res.status(404).json({ success: false, message: 'Model not found' });
      const b = store.brands.find(x => x.id === dm.brand_id) || {};
      return res.json({ success: true, data: { ...dm, brand_name: b.name } });
    }
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
    if (!(await inventoryRepo.isDbOnline())) {
      const b = store.brands.find(x => x.id === Number(brand_id)) || {};
      const nm = {
        id: store.deviceModels.length + 1,
        brand_id: Number(brand_id),
        brand_name: b.name || '',
        model_name,
        storage,
        color,
        selling_price: Number(selling_price),
        cost_price: Number(cost_price || selling_price),
        sku: sku || null,
      };
      store.deviceModels.push(nm);
      return res.status(201).json({ success: true, data: nm });
    }
    const result = await db.query(
      `INSERT INTO device_models(brand_id,model_name,storage,color,selling_price,cost_price,sku,description,image_url)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [brand_id, model_name, storage, color, selling_price, cost_price, sku, description, image_url]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

// PUT / PATCH /api/v1/models/:id
async function handleUpdateModel(req, res, next) {
  try {
    const modelId = Number(req.params.id);
    const { selling_price, cost_price, model_name, storage, color } = req.body || {};
    if (!(await inventoryRepo.isDbOnline())) {
      const dm = store.deviceModels.find(x => x.id === modelId);
      if (!dm) return res.status(404).json({ success: false, message: 'Model not found' });
      if (selling_price !== undefined) dm.selling_price = Number(selling_price);
      if (cost_price !== undefined) dm.cost_price = Number(cost_price);
      if (model_name !== undefined) dm.model_name = String(model_name).trim();
      if (storage !== undefined) dm.storage = String(storage).trim();
      if (color !== undefined) dm.color = String(color).trim();
      const b = store.brands.find(x => x.id === dm.brand_id) || {};
      return res.json({ success: true, data: { ...dm, brand_name: b.name } });
    }
    const result = await db.query(
      `UPDATE device_models
          SET selling_price = COALESCE($2, selling_price),
              cost_price = COALESCE($3, cost_price),
              model_name = COALESCE($4, model_name),
              storage = COALESCE($5, storage),
              color = COALESCE($6, color)
        WHERE id = $1
        RETURNING *`,
      [modelId, selling_price ?? null, cost_price ?? null, model_name ?? null, storage ?? null, color ?? null]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Model not found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

router.put('/:id', handleUpdateModel);
router.patch('/:id', handleUpdateModel);

module.exports = router;
