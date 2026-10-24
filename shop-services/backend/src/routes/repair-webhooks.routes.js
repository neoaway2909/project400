'use strict';

const { Router } = require('express');
const { query } = require('../database/db');

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
