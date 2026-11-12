'use strict';

const { Router } = require('express');
const { query } = require('../database/db');
const store = require('../database/memoryStore');
const inventoryRepo = require('../repositories/inventory.repository');

const router = Router();
const ALLOWED_EVENTS = new Set(['REPAIR_COMPLETED', 'DELIVERED']);

router.post('/', async (req, res, next) => {
  const {
    event_id: eventId,
    event_type: eventType,
    ticket_id: ticketId,
    policy_no: policyNo,
    imei,
    center_name: centerName,
    status_updated_at: statusUpdatedAt,
    details,
  } = req.body || {};

  if (
    typeof eventId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)
    || !ALLOWED_EVENTS.has(eventType)
    || typeof ticketId !== 'string'
    || !ticketId.trim()
    || typeof policyNo !== 'string'
    || !policyNo.trim()
    || typeof imei !== 'string'
    || !/^[0-9]{15}$/.test(imei)
    || typeof centerName !== 'string'
    || !centerName.trim()
    || typeof statusUpdatedAt !== 'string'
    || Number.isNaN(Date.parse(statusUpdatedAt))
    || details === null
    || typeof details !== 'object'
    || Array.isArray(details)
  ) {
    return res.status(400).json({
      success: false,
      error_code: 'INVALID_REPAIR_WEBHOOK',
      message: 'Repair webhook payload is invalid',
    });
  }

  try {
    if (!(await inventoryRepo.isDbOnline())) {
      store.repairWebhookEvents = store.repairWebhookEvents || [];
      if (store.repairWebhookEvents.some(e => e.event_id === eventId)) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          event_id: eventId,
        });
      }
      store.repairWebhookEvents.push({
        event_id: eventId,
        event_type: eventType,
        ticket_id: ticketId,
        policy_no: policyNo,
        imei,
        center_name: centerName,
        status_updated_at: statusUpdatedAt,
        details: details || {},
        received_at: new Date().toISOString(),
      });

      // Append repair status update to IMEI status logs if device is in shop inventory
      const device = store.deviceImeis.find(d => d.imei === imei);
      if (device) {
        const oldSt = device.status;
        if (eventType === 'REPAIR_COMPLETED' || eventType === 'DELIVERED') {
          device.status = 'SOLD';
        }
        store.imeiStatusLogs.push({
          id: store.getNextLogId(),
          imei,
          old_status: oldSt,
          new_status: device.status,
          changed_by: centerName || 'repair_center',
          reason: `อัปเดตงานซ่อม ${ticketId}: ${eventType}${details?.repair_summary ? ` (${details.repair_summary})` : ''}`,
          changed_at: statusUpdatedAt,
        });
      }

      return res.status(202).json({
        success: true,
        accepted: true,
        event_id: eventId,
      });
    }

    const result = await query(
      `INSERT INTO repair_webhook_events (
        event_id, event_type, ticket_id, policy_no, imei, center_name,
        status_updated_at, details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id`,
      [
        eventId,
        eventType,
        ticketId,
        policyNo,
        imei,
        centerName || null,
        statusUpdatedAt,
        JSON.stringify(details || {}),
      ]
    );

    if (!result.rowCount) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        event_id: eventId,
      });
    }

    return res.status(202).json({
      success: true,
      accepted: true,
      event_id: eventId,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
