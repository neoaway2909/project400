'use strict';

const { Router } = require('express');
const repairService = require('../services/repairService');
const {
  createRepairTicketSchema,
  updateRepairStatusSchema,
} = require('../dto/schemas');

const router = Router();

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        error_code: 'VALIDATION_ERROR',
        message: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่',
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }
    req.validatedBody = value;
    return next();
  };
}

function handleError(error, req, res, next) {
  if (!error.statusCode) return next(error);
  return res.status(error.statusCode).json({
    success: false,
    error_code: error.code || 'REPAIR_REQUEST_FAILED',
    message: error.message,
  });
}

router.post('/', validate(createRepairTicketSchema), async (req, res, next) => {
  try {
    const ticket = await repairService.createRepairTicket(req.validatedBody);
    return res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    return handleError(error, req, res, next);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const data = await repairService.listRepairTickets({
      status: req.query.status,
      search: req.query.search,
    });
    return res.json({ success: true, data, total: data.length });
  } catch (error) {
    return handleError(error, req, res, next);
  }
});

router.get('/:ticketId', async (req, res, next) => {
  try {
    const data = await repairService.getRepairTicket(req.params.ticketId);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(error, req, res, next);
  }
});

router.put(
  '/:ticketId/status',
  validate(updateRepairStatusSchema),
  async (req, res, next) => {
    try {
      const result = await repairService.updateRepairStatus(
        req.params.ticketId,
        req.validatedBody
      );
      return res.json({ success: true, ...result });
    } catch (error) {
      return handleError(error, req, res, next);
    }
  }
);

module.exports = router;
