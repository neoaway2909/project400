'use strict';
const { Router } = require('express');
const db         = require('../database/db');
const store      = require('../database/memoryStore');
const inventoryRepo = require('../repositories/inventory.repository');

const router = Router();

// GET /api/v1/brands
router.get('/', async (_req, res, next) => {
  try {
    if (!(await inventoryRepo.isDbOnline())) {
      return res.json({ success: true, data: store.brands.filter(b => b.is_active) });
    }
    const result = await db.query(
      'SELECT id, name, logo_url, is_active FROM brands WHERE is_active = true ORDER BY name'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// GET /api/v1/brands/:id
router.get('/:id', async (req, res, next) => {
  try {
    if (!(await inventoryRepo.isDbOnline())) {
      const b = store.brands.find(x => x.id === Number(req.params.id));
      if (!b) return res.status(404).json({ success: false, message: 'Brand not found' });
      return res.json({ success: true, data: b });
    }
    const result = await db.query('SELECT * FROM brands WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

// POST /api/v1/brands
router.post('/', async (req, res, next) => {
  try {
    const { name, logo_url } = req.body;
    if (!name) return res.status(422).json({ success: false, message: 'name is required' });
    if (!(await inventoryRepo.isDbOnline())) {
      const nb = { id: store.brands.length + 1, name, logo_url: logo_url || null, is_active: true };
      store.brands.push(nb);
      return res.status(201).json({ success: true, data: nb });
    }
    const result = await db.query(
      'INSERT INTO brands(name, logo_url) VALUES($1,$2) RETURNING *',
      [name, logo_url]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
