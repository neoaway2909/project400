const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const posRouter = require('./api/posController');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, error_code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Simple health check
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'POS Backend', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/v1/pos', posRouter);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error_code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 POS Backend API`);
  console.log(`   ✅ Running on: http://localhost:${PORT}`);
  console.log(`   📋 Health:    http://localhost:${PORT}/health`);
  console.log(`   📌 API Base:  http://localhost:${PORT}/api/v1`);
});

module.exports = app;
