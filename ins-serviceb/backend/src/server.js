const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const policyController = require('./controllers/policyController');
const repairRoutes = require('./routes/repairs');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// Middleware
// ============================================================
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json());
app.use(morgan('dev'));

// Rate Limiting (ป้องกัน abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, error_code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ============================================================
// Simple API Key Auth Middleware (สำหรับร้านค้า/ศูนย์ซ่อม)
// ============================================================
const VALID_API_KEYS = {
  'SHOP-BKK-01-SECRET-KEY-2026': { client_id: 'SHOP-BKK-01', type: 'SHOP' },
  'CTR-SIAM-01-SECRET-KEY-2026': { client_id: 'CTR-SIAM-01', type: 'REPAIR_CENTER' },
  'ADMIN-MASTER-KEY-2026':       { client_id: 'ADMIN-001',   type: 'ADMIN' }
};

const apiKeyAuth = (req, res, next) => {
  // Skip auth for health check
  if (req.path === '/health') return next();

  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  // Allow all for development
  if (process.env.NODE_ENV === 'development') {
    req.client = { client_id: 'DEV-CLIENT', type: 'ADMIN' };
    return next();
  }

  if (!apiKey || !VALID_API_KEYS[apiKey]) {
    return res.status(401).json({
      success: false,
      error_code: 'UNAUTHORIZED',
      message: 'Invalid or missing API Key',
      timestamp: new Date().toISOString()
    });
  }

  req.client = VALID_API_KEYS[apiKey];
  next();
};

// ============================================================
// Routes
// ============================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Insurance Policy Engine API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.use('/api/v1/policies', apiKeyAuth, policyController);
app.use('/api/v1/repairs', apiKeyAuth, repairRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error_code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error_code: 'INTERNAL_SERVER_ERROR',
    message: 'เกิดข้อผิดพลาดภายในระบบ',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
  console.log(`\n🚀 Insurance Policy Engine API`);
  console.log(`   ✅ Running on: http://localhost:${PORT}`);
  console.log(`   📋 Health:    http://localhost:${PORT}/health`);
  console.log(`   📌 API Base:  http://localhost:${PORT}/api/v1`);
  console.log(`   🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
