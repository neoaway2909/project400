// src/api/webhookController.js
const express = require('express');
const router = express.Router();
const { pool } = require('../database/pgClient');

/**
 * POST /repairs
 * Expected payload: { imei: string, status: string, notes?: string }
 * Updates device_imeis status and logs the event.
 */
router.post('/repairs', async (req, res) => {
  const { imei, status, notes } = req.body;
  if (!imei || !status) {
    return res.status(400).json({ error: 'imei and status are required' });
  }

  try {
    await pool.query(
      `UPDATE device_imeis SET status=$1, note=$2, updated_at=NOW() WHERE imei=$3`,
      [status, notes || null, imei]
    );
    // In a real product you would push a notification to the POS UI (e.g., via websockets)
    console.log(`🔔 Repair webhook – IMEI ${imei} set to ${status}`);
    res.json({ success: true, imei, newStatus: status });
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

module.exports = router;
