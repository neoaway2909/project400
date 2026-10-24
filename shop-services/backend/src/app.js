'use strict';
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

const inventoryRoutes = require('./routes/inventory.routes');
const brandRoutes     = require('./routes/brand.routes');
const modelRoutes     = require('./routes/model.routes');
const repairWebhookRoutes = require('./routes/repair-webhooks.routes');

const app = express();

// ─── Security & Middleware ────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

// ─── API Routes ───────────────────────────────────────────
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/brands',    brandRoutes);
app.use('/api/v1/models',    modelRoutes);
app.use('/api/v1/pos/webhooks/repairs', repairWebhookRoutes);

// ─── 404 Handler ──────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

// ─── Global Error Handler ─────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
