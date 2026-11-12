// shop-services/backend/src/seed.js
// Seed the database with mockAvailableStock data so that POS and Shop front use the same IMEI list.
// This script runs automatically when the server starts.

const db = require('./database/db');
const inventoryRepo = require('../repositories/inventory.repository');
// Import mock data from the frontend project (relative path from backend folder)
const { mockAvailableStock } = require('../../shop-service/frontend/src/data/mockData');

async function seed() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Ensure device_imeis table exists with a unique constraint on imei.
    await client.query(`
      CREATE TABLE IF NOT EXISTS device_imeis (
        imei VARCHAR(20) PRIMARY KEY,
        model_id INTEGER NOT NULL,
        lot_id INTEGER,
        status VARCHAR(20) NOT NULL DEFAULT 'IN_STOCK'
      );
    `);
    // Add unique constraint if not present (idempotent)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uniq_device_imei') THEN
          ALTER TABLE device_imeis ADD CONSTRAINT uniq_device_imei UNIQUE (imei);
        END IF;
      END$$;
    `);

    // Insert mock IMEIs if they don't already exist
    for (const sku of mockAvailableStock) {
      const { model_id, available_imeis } = sku;
      for (const imei of available_imeis) {
        await client.query(
          `INSERT INTO device_imeis (imei, model_id, status)
           SELECT $1, $2, 'IN_STOCK'
           WHERE NOT EXISTS (SELECT 1 FROM device_imeis WHERE imei = $1)`,
          [imei, model_id]
        );
      }
    }

    await client.query('COMMIT');
    console.log('✅ Seed completed – mock stock loaded into DB');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed', e);
    throw e;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  // Allow manual run: node src/seed.js
  seed().catch(() => process.exit(1));
}

module.exports = { seed };

