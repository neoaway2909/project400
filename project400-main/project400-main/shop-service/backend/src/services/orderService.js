// src/services/orderService.js
const { pool } = require('../database/pgClient');
const { v4: uuidv4 } = require('uuid');

class OrderService {
  async createOrder(dto) {
    const orderId = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const orderQuery = `INSERT INTO orders (order_id, customer_id, total_amount, payment_method, payment_status, created_at)
                         VALUES ($1,$2,$3,$4,$5, NOW())`;
      await client.query(orderQuery, [
        orderId,
        dto.customerId,
        dto.totalAmount,
        dto.paymentMethod,
        dto.paymentStatus || 'PAID'
      ]);

      const itemQuery = `INSERT INTO order_items (order_id, line_no, model_name, imei, price, package_code, package_price)
                         VALUES ($1,$2,$3,$4,$5,$6,$7)`;
      for (let i = 0; i < dto.items.length; i++) {
        const it = dto.items[i];
        await client.query(itemQuery, [
          orderId,
          i + 1,
          it.model_name,
          it.imei,
          it.price,
          it.package_code || null,
          it.package_price || null,
        ]);
      }
      await client.query('COMMIT');
      return { order_id: orderId, total_amount: dto.totalAmount, payment_status: 'PAID', created_at: new Date() };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

module.exports = OrderService;
