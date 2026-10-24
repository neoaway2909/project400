const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:pwd@localhost:5432/shop_db',
});

module.exports = { pool };
