// src/services/orderService.js
const { pool } = require('../database/pgClient');
const store = require('../database/memoryStore');
const inventoryRepo = require('../repositories/inventory.repository');

class OrderService {
  async createOrder(dto) {
    const orderId = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
    const createdAt = new Date().toISOString();

    if (!(await inventoryRepo.isDbOnline())) {
      const orderRecord = {
        order_id: orderId,
        customer_id: dto.customerId,
        customer_name: dto.customer?.full_name || 'ลูกค้าหน้าร้าน',
        customer_phone: dto.customer?.phone_number || '-',
        customer_email: dto.customer?.email || '',
        total_amount: dto.totalAmount,
        payment_method: dto.paymentMethod || 'CASH',
        payment_status: dto.paymentStatus || 'PAID',
        created_at: createdAt,
      };
      store.orders.unshift(orderRecord);
      for (let i = 0; i < (dto.items || []).length; i++) {
        const it = dto.items[i];
        store.orderItems.push({
          order_id: orderId,
          line_no: i + 1,
          model_name: it.model_name,
          imei: it.imei,
          price: it.price,
          package_code: it.package_code || null,
          package_price: it.package_price || null,
        });
      }
      return orderRecord;
    }

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
      return {
        order_id: orderId,
        customer_name: dto.customer?.full_name || 'ลูกค้าหน้าร้าน',
        customer_phone: dto.customer?.phone_number || '-',
        total_amount: dto.totalAmount,
        payment_status: 'PAID',
        created_at: createdAt
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async listOrders() {
    if (!(await inventoryRepo.isDbOnline())) {
      const sortedOrders = [...store.orders].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      return sortedOrders.map(ord => {
        const items = store.orderItems
          .filter(it => it.order_id === ord.order_id)
          .map(it => {
            const wLog = store.warrantyLogs.find(
              w => w.order_id === ord.order_id && w.imei === it.imei
            );
            return {
              ...it,
              policy_no: wLog?.policy_no || null,
              sync_status: wLog?.sync_status || null,
              e_warranty_url: wLog?.response_payload?.e_warranty_url || (wLog?.policy_no ? `http://localhost:5176/?imei=${it.imei}` : null),
            };
          });
        return {
          ...ord,
          items,
        };
      });
    }

    const ordersRes = await pool.query(`SELECT * FROM orders ORDER BY created_at DESC`);
    const itemsRes = await pool.query(`SELECT * FROM order_items ORDER BY order_id, line_no`);
    const logsRes = await pool.query(`SELECT * FROM warranty_logs`);

    return ordersRes.rows.map(ord => {
      const items = itemsRes.rows
        .filter(it => it.order_id === ord.order_id)
        .map(it => {
          const wLog = logsRes.rows.find(w => w.order_id === ord.order_id && w.imei === it.imei);
          return {
            ...it,
            policy_no: wLog?.policy_no || null,
            sync_status: wLog?.sync_status || null,
            e_warranty_url: wLog?.response_payload?.e_warranty_url || (wLog?.policy_no ? `http://localhost:5176/?imei=${it.imei}` : null),
          };
        });
      return {
        ...ord,
        customer_name: ord.customer_name || 'ลูกค้าหน้าร้าน',
        customer_phone: ord.customer_phone || '-',
        items,
      };
    });
  }
}

module.exports = OrderService;
