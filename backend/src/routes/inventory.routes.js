'use strict';
const { Router } = require('express');
const ctrl       = require('../controllers/inventory.controller');

const router = Router();

// POST   /api/v1/inventory/receive            - รับเครื่องเข้าสต็อก (single/batch)
router.post('/receive', ctrl.receiveStock);

// GET    /api/v1/inventory/summary            - Dashboard KPI + breakdown
router.get('/summary', ctrl.getSummary);

// GET    /api/v1/inventory/available-stock    - เครื่อง IN_STOCK สำหรับ POS
router.get('/available-stock', ctrl.getAvailableStock);

// GET    /api/v1/inventory/imei/:imei         - ค้นหา IMEI + ประวัติ
router.get('/imei/:imei', ctrl.getImeiDetail);

// PUT    /api/v1/inventory/imei/:imei/status  - อัปเดตสถานะ IMEI
router.put('/imei/:imei/status', ctrl.updateImeiStatus);

module.exports = router;
