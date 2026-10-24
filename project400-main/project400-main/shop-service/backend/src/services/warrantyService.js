// src/services/warrantyService.js
const { pool } = require('../database/pgClient');
const InsuranceClient = require('./insuranceClient');

class WarrantyService {
  constructor() {
    this.insurance = new InsuranceClient();
  }

  /**
   * Process warranty for each order item that has a package_code.
   * Returns an array of results for the frontend receipt.
   */
  async processWarranty(order, checkoutDto) {
    const results = [];
    for (const item of checkoutDto.items) {
      if (!item.package_code) continue; // no warranty selected

      const payload = {
        store_id: process.env.STORE_ID || 'STORE-001',
        order_id: order.order_id,
        imei: item.imei,
        device_model: item.model_name,
        package_code: item.package_code,
        customer: {
          full_name: checkoutDto.customer.full_name,
          phone_number: checkoutDto.customer.phone_number,
          email: checkoutDto.customer.email,
          id_card_no: checkoutDto.customer.id_card_no,
        },
        purchased_at: order.created_at,
      };

      try {
        const resp = await this.insurance.createPolicy(payload);
        await this._logSuccess(order.order_id, item.imei, resp.policy_no, resp);
        results.push({ imei: item.imei, policy_no: resp.policy_no, e_warranty_url: resp.e_warranty_url });
      } catch (err) {
        // network / 5xx error – keep for retry
        await this._logPending(order.order_id, item.imei, err.message);
        results.push({ imei: item.imei, error: err.message });
      }
    }
    return results;
  }

  async _logSuccess(orderId, imei, policyNo, payload) {
    const q = `INSERT INTO warranty_logs (order_id, imei, policy_no, sync_status, response_payload, synced_at)
               VALUES ($1,$2,$3,'SUCCESS',$4,NOW())`;
    await pool.query(q, [orderId, imei, policyNo, payload]);
  }

  async _logPending(orderId, imei, errorMsg) {
    const q = `INSERT INTO warranty_logs (order_id, imei, policy_no, sync_status, response_payload)
               VALUES ($1,$2,NULL,'RETRY_PENDING',$3)`;
    await pool.query(q, [orderId, imei, JSON.stringify({ error: errorMsg })]);
  }

  /** Background retry – can be called by a cron job */
  async retryPending() {
    const { rows } = await pool.query(`SELECT * FROM warranty_logs WHERE sync_status = 'RETRY_PENDING'`);
    for (const log of rows) {
      // In a real implementation we would reconstruct the original payload.
      // Here we simply skip because we don't store it; this is a placeholder.
      // You could store the original payload in a JSONB column for full retry.
    }
  }
}

module.exports = WarrantyService;
