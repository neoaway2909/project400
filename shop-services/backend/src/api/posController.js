// src/api/posController.js
const express = require('express');
const router = express.Router();
const OrderService = require('../services/orderService');
const WarrantyService = require('../services/warrantyService');
const inventoryService = require('../services/inventory.service');
const inventoryRepo = require('../repositories/inventory.repository');

const orderService = new OrderService();
const warrantyService = new WarrantyService();
const INSURANCE_API_BASE = process.env.INSURANCE_API_BASE || 'http://localhost:3001/api/v1';
const INSURANCE_API_KEY = process.env.INSURANCE_API_KEY || 'SHOP-BKK-01-SECRET-KEY-2026';

// GET /api/v1/pos/orders - ประวัติการซื้อขายหน้าร้านทั้งหมด
router.get('/orders', async (_req, res) => {
  try {
    const orders = await orderService.listOrders();
    return res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    console.error('List orders error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch orders',
    });
  }
});

// POST /api/v1/pos/checkout
router.post('/checkout', async (req, res) => {
  try {
    const checkoutDto = req.body;
    if (!checkoutDto?.items || !checkoutDto.items.length) {
      return res.status(422).json({ success: false, message: 'ไม่มีรายการสินค้าในตะกร้า' });
    }

    // 1. ตรวจสอบว่าทุก IMEI มีอยู่ในระบบและมีสถานะ IN_STOCK (ป้องกันการขาย IMEI ซ้ำ)
    const seenImeis = new Set();
    for (const item of checkoutDto.items) {
      const imei = String(item.imei || '').trim();
      if (!imei) {
        return res.status(422).json({ success: false, message: 'กรุณาระบุเลข IMEI ของสินค้า' });
      }
      if (seenImeis.has(imei)) {
        return res.status(409).json({
          success: false,
          message: `ไม่สามารถขายเลข IMEI ซ้ำกันในออเดอร์เดียวได้ (${imei})`,
        });
      }
      seenImeis.add(imei);

      const device = await inventoryRepo.findImeiByCode(imei);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: `ไม่พบเลข IMEI ${imei} ในระบบคลังสินค้า`,
        });
      }
      if (device.status !== 'IN_STOCK') {
        return res.status(409).json({
          success: false,
          message: `เครื่องเลข IMEI ${imei} ไม่อยู่ในสถานะพร้อมขาย (สถานะปัจจุบัน: ${device.status})`,
        });
      }
    }

    // 2. บันทึกคำสั่งซื้อ
    const order = await orderService.createOrder(checkoutDto);

    // 3. อัปเดตสถานะ IMEI เป็น SOLD ทันทีเพื่อตัดสต็อกหน้าร้าน
    for (const item of checkoutDto.items) {
      await inventoryService.updateImeiStatus(
        String(item.imei).trim(),
        'SOLD',
        'pos_cashier',
        `ขายหน้าร้าน POS (${order.order_id})`
      );
    }

    // 4. ส่งข้อมูลเปิดกรมธรรม์ไปยังระบบประกัน (Insurance Service) แบบ Real-time
    const warrantyResults = await warrantyService.processWarranty(order, checkoutDto);

    return res.status(201).json({
      success: true,
      orderId: order.order_id,
      totalAmount: order.total_amount,
      paymentStatus: order.payment_status,
      warranties: warrantyResults,
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Checkout failed',
    });
  }
});

// GET /api/v1/pos/warranty/:imei - ตรวจสอบสิทธิ์ประกันของลูกค้าจากหน้าร้าน
router.get('/warranty/:imei', async (req, res) => {
  try {
    const imei = String(req.params.imei || '').trim();
    const response = await fetch(`${INSURANCE_API_BASE}/policies/verify?imei=${encodeURIComponent(imei)}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': INSURANCE_API_KEY,
      },
    });
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: `ไม่สามารถเชื่อมต่อระบบประกันได้: ${err.message}`,
    });
  }
});

// GET /api/v1/pos/claims - ดึงรายการงานเคลม/ส่งซ่อมทั้งหมด
router.get('/claims', async (req, res) => {
  try {
    const search = req.query.search ? `?search=${encodeURIComponent(req.query.search)}` : '';
    const response = await fetch(`${INSURANCE_API_BASE}/repairs${search}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': INSURANCE_API_KEY,
      },
    });
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: `ไม่สามารถดึงรายการงานซ่อมได้: ${err.message}`,
    });
  }
});

// POST /api/v1/pos/claims - เปิดใบแจ้งเคลมส่งซ่อมจากหน้าร้าน PhoneShop และอัปเดตสถานะเครื่องเป็น CLAIM_REPAIR
router.post('/claims', async (req, res) => {
  try {
    const {
      imei,
      policy_no,
      center_id,
      coverage_type,
      defect_symptom,
      estimated_cost,
      contact_phone,
    } = req.body || {};

    const cleanImei = String(imei || '').trim();
    if (!/^[0-9]{15}$/.test(cleanImei)) {
      return res.status(422).json({ success: false, message: 'กรุณาระบุเลข IMEI 15 หลักให้ถูกต้อง' });
    }

    // 1. ส่งคำขอเปิดตั๋วงานซ่อมไปยังระบบประกัน/ศูนย์ซ่อม
    const insRes = await fetch(`${INSURANCE_API_BASE}/repairs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': INSURANCE_API_KEY,
      },
      body: JSON.stringify({
        policy_no: policy_no || undefined,
        imei: cleanImei,
        center_id: center_id || 'CTR-SIAM-01',
        coverage_type: coverage_type || undefined,
        defect_symptom: defect_symptom || 'แจ้งเคลมส่งซ่อมผ่านหน้าร้าน PhoneShop',
        estimated_cost: Number(estimated_cost || 0),
        contact_phone: contact_phone || undefined,
      }),
    });

    const insData = await insRes.json().catch(() => ({}));
    if (!insRes.ok) {
      return res.status(insRes.status).json({
        success: false,
        message: insData.message || 'ไม่สามารถเปิดใบงานเคลมกับระบบประกันได้',
        details: insData.details,
      });
    }

    // 2. อัปเดตสถานะ IMEI ในคลังร้านค้าเป็น CLAIM_REPAIR (หากมีเครื่องในระบบร้านค้า)
    const device = await inventoryRepo.findImeiByCode(cleanImei);
    if (device && device.status !== 'CLAIM_REPAIR') {
      await inventoryService.updateImeiStatus(
        cleanImei,
        'CLAIM_REPAIR',
        'shop_staff',
        `รับแจ้งเคลมหน้าร้าน (${insData.data?.ticket_id || 'CLAIM'}) - ${defect_symptom}`
      );
    }

    return res.status(201).json({
      success: true,
      data: insData.data,
    });
  } catch (err) {
    console.error('Create claim error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'เกิดข้อผิดพลาดในการเปิดใบเคลม',
    });
  }
});

module.exports = router;
