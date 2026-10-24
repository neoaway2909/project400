const express = require('express');
const router = express.Router();
const OrderService = require('../services/orderService');
const WarrantyService = require('../services/warrantyService');

const orderService = new OrderService();
const warrantyService = new WarrantyService();

// POST /api/v1/pos/checkout
router.post('/checkout', async (req, res) => {
  try {
    const checkoutDto = req.body; // expected shape validated elsewhere
    const order = await orderService.createOrder(checkoutDto);
    // Update IMEI status to SOLD (fire‑and‑forget)
    // Assume a separate inventory service; omitted for brevity

    const warrantyResults = await warrantyService.processWarranty(order, checkoutDto);
    res.status(201).json({
      orderId: order.order_id,
      totalAmount: order.total_amount,
      paymentStatus: order.payment_status,
      warranties: warrantyResults,
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message || 'Checkout failed' });
  }
});

module.exports = router;
