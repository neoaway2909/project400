const express = require('express');
const router = express.Router();
const policyService = require('../services/policyService');
const { createPolicySchema, updatePackageSchema } = require('../dto/schemas');

// ============================================================
// Middleware: Validate request body with Joi schema
// ============================================================
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      error_code: 'VALIDATION_ERROR',
      message: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่',
      timestamp: new Date().toISOString(),
      details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
    });
  }
  req.validatedBody = value;
  next();
};

// ============================================================
// POST /api/v1/policies
// เปิดกรมธรรม์ใหม่เมื่อร้านค้าส่งข้อมูลการขาย
// ============================================================
router.post('/', validate(createPolicySchema), async (req, res) => {
  try {
    const policy = await policyService.createPolicy(req.validatedBody);

    return res.status(201).json({
      success: true,
      policy_no: policy.policy_no,
      imei: policy.imei,
      status: policy.status,
      coverage_start: policy.coverage_start,
      coverage_end: policy.coverage_end,
      max_coverage_amount: policy.max_coverage_amount,
      e_warranty_url: policy.e_warranty_url,
      message: 'สร้างกรมธรรม์สำเร็จ',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error_code: err.code || 'INTERNAL_ERROR',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================
// GET /api/v1/policies/verify?imei={imei}
// ตรวจสอบสิทธิ์ความคุ้มครองด้วย IMEI (Real-time)
// ============================================================
router.get('/verify', async (req, res) => {
  const { imei } = req.query;

  // Validate IMEI format
  if (!imei || !/^[0-9]{15}$/.test(imei)) {
    return res.status(400).json({
      success: false,
      error_code: 'INVALID_IMEI',
      message: 'IMEI ต้องเป็นตัวเลข 15 หลักเท่านั้น',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const result = await policyService.verifyByImei(imei);
    return res.status(200).json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error_code: err.code || 'INTERNAL_ERROR',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================
// GET /api/v1/policies/packages
// ดึงรายการแพ็กเกจที่เปิดขายอยู่ทั้งหมด
// ============================================================
router.get('/packages', async (req, res) => {
  try {
    const packages = await policyService.getPackages();
    return res.status(200).json({
      success: true,
      data: packages,
      total: packages.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================
// PATCH /api/v1/policies/packages/:packageCode
// อัปเดตแพ็กเกจ (Admin)
// ============================================================
router.patch('/packages/:packageCode', validate(updatePackageSchema), async (req, res) => {
  try {
    const updated = await policyService.updatePackage(req.params.packageCode, req.validatedBody);
    return res.status(200).json({
      success: true,
      data: updated,
      message: 'อัปเดตแพ็กเกจสำเร็จ',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error_code: err.code || 'INTERNAL_ERROR',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================
// GET /api/v1/policies  (Admin: ดูรายการกรมธรรม์ทั้งหมด)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { status, store_id, search, page, limit } = req.query;
    const result = await policyService.getAllPolicies({
      status,
      store_id,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });
    return res.status(200).json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================
// GET /api/v1/policies/dashboard (Admin stats)
// ============================================================
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await policyService.getDashboardStats();
    return res.status(200).json({ success: true, data: stats, timestamp: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
