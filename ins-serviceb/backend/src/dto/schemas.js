const Joi = require('joi');

// ============================================================
// DTO: CreatePolicyRequest (ตาม JSON Schema ที่กำหนด)
// ============================================================
const createPolicySchema = Joi.object({
  store_id: Joi.string().required().messages({
    'any.required': 'store_id is required',
    'string.empty': 'store_id cannot be empty'
  }),
  order_id: Joi.string().required(),
  imei: Joi.string().pattern(/^[0-9]{15}$/).required().messages({
    'string.pattern.base': 'IMEI must be exactly 15 digits (numbers only)',
    'any.required': 'IMEI is required'
  }),
  device_model: Joi.string().required(),
  device_price: Joi.number().min(0).optional(),
  package_code: Joi.string().valid('PKG_SCREEN_1Y', 'PKG_ACCIDENT_1Y', 'PKG_FULL_2Y').required().messages({
    'any.only': 'package_code must be one of: PKG_SCREEN_1Y, PKG_ACCIDENT_1Y, PKG_FULL_2Y'
  }),
  customer: Joi.object({
    full_name: Joi.string().required(),
    phone_number: Joi.string().pattern(/^0[0-9]{9}$/).required().messages({
      'string.pattern.base': 'phone_number must be a 10-digit Thai mobile number starting with 0'
    }),
    email: Joi.string().email().optional()
  }).required(),
  purchased_at: Joi.string().isoDate().required()
});

// ============================================================
// DTO: CreateRepairTicketRequest
// ============================================================
const createRepairTicketSchema = Joi.object({
  policy_no: Joi.string().optional(),
  imei: Joi.string().pattern(/^[0-9]{15}$/).required(),
  center_id: Joi.string().guid().required(),
  technician_id: Joi.string().guid().optional(),
  coverage_type: Joi.string().valid('SCREEN_CRACK', 'WATER_DAMAGE', 'ACCIDENTAL', 'FULL_COVERAGE', 'THEFT').optional(),
  defect_symptom: Joi.string().trim().min(1).required(),
  estimated_cost: Joi.number().min(0).required(),
  photos: Joi.array().items(Joi.object({
    photo_url: Joi.string().uri().required(),
    photo_type: Joi.string().valid('BEFORE', 'AFTER', 'DAMAGED_PART').required()
  })).optional()
});

const updateRepairStatusSchema = Joi.object({
  status: Joi.string().valid(
    'RECEIVED', 'DIAGNOSING', 'WAITING_PARTS', 'IN_PROGRESS',
    'REPAIR_COMPLETED', 'DELIVERED', 'CANCELLED'
  ).required(),
  actual_cost: Joi.number().min(0).optional(),
  repair_summary: Joi.string().trim().allow('').optional()
});

// ============================================================
// DTO: RepairStatusWebhookPayload
// ============================================================
const repairWebhookSchema = Joi.object({
  event_id: Joi.string().guid().required(),
  event_type: Joi.string().valid('REPAIR_COMPLETED', 'DELIVERED').required(),
  ticket_id: Joi.string().required(),
  policy_no: Joi.string().required(),
  imei: Joi.string().pattern(/^[0-9]{15}$/).required(),
  center_name: Joi.string().required(),
  status_updated_at: Joi.string().isoDate().required(),
  details: Joi.object({
    repair_summary: Joi.string().optional(),
    estimated_cost: Joi.number().min(0).optional(),
    actual_cost: Joi.number().min(0).allow(null).optional(),
    cost_covered_by_insurance: Joi.number().min(0).optional(),
    customer_excess_paid: Joi.number().min(0).optional()
  }).required()
});

// ============================================================
// DTO: Update Package
// ============================================================
const updatePackageSchema = Joi.object({
  package_name: Joi.string().optional(),
  description: Joi.string().optional(),
  premium_price: Joi.number().min(0).optional(),
  coverage_months: Joi.number().integer().min(1).optional(),
  max_coverage_amount: Joi.number().min(0).optional(),
  max_claim_count: Joi.number().integer().min(1).optional(),
  is_active: Joi.boolean().optional()
});

module.exports = {
  createPolicySchema,
  createRepairTicketSchema,
  updateRepairStatusSchema,
  repairWebhookSchema,
  updatePackageSchema
};
