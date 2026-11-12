// src/services/warrantyService.js
const { pool } = require('../database/pgClient');
const store = require('../database/memoryStore');
const inventoryRepo = require('../repositories/inventory.repository');
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
    const createdAtIso = typeof order.created_at === 'string'
      ? order.created_at
      : new Date(order.created_at || Date.now()).toISOString();

    for (const item of checkoutDto.items) {
      if (!item.package_code) continue; // no warranty selected

      // Strictly follow ins-serviceb createPolicySchema (do NOT send id_card_no)
      const payload = {
        store_id: process.env.STORE_ID || 'SHOP-BKK-01',
        order_id: order.order_id,
        imei: String(item.imei).trim(),
        device_model: item.model_name,
        device_price: Number(item.price) || undefined,
        package_code: item.package_code,
        customer: {
          full_name: checkoutDto.customer.full_name,
          phone_number: String(checkoutDto.customer.phone_number).replace(/\D/g, ''),
          ...(checkoutDto.customer.email ? { email: checkoutDto.customer.email } : {}),
        },
        purchased_at: createdAtIso,
      };

      try {
        const resp = await this.insurance.createPolicy(payload);
        await this._logSuccess(order.order_id, item.imei, resp.policy_no, resp);
        results.push({
          imei: item.imei,
          policy_no: resp.policy_no,
          e_warranty_url: resp.e_warranty_url,
          coverage_start: resp.coverage_start,
          coverage_end: resp.coverage_end,
          max_coverage_amount: resp.max_coverage_amount,
        });
      } catch (err) {
        // network / 4xx / 5xx error – log and report clearly
        await this._logPending(order.order_id, item.imei, err.message);
        results.push({ imei: item.imei, error: err.message });
      }
    }
    return results;
  }

  async _logSuccess(orderId, imei, policyNo, payload) {
    if (!(await inventoryRepo.isDbOnline())) {
      store.warrantyLogs.push({
        order_id: orderId,
        imei,
        policy_no: policyNo,
        sync_status: 'SUCCESS',
        response_payload: payload,
        synced_at: new Date().toISOString(),
      });
      return;
    }
    const q = `INSERT INTO warranty_logs (order_id, imei, policy_no, sync_status, response_payload, synced_at)
               VALUES ($1,$2,$3,'SUCCESS',$4,NOW())`;
    await pool.query(q, [orderId, imei, policyNo, payload]);
  }

  async _logPending(orderId, imei, errorMsg) {
    if (!(await inventoryRepo.isDbOnline())) {
      store.warrantyLogs.push({
        order_id: orderId,
        imei,
        policy_no: null,
        sync_status: 'RETRY_PENDING',
        response_payload: { error: errorMsg },
        synced_at: null,
      });
      return;
    }
    const q = `INSERT INTO warranty_logs (order_id, imei, policy_no, sync_status, response_payload)
               VALUES ($1,$2,NULL,'RETRY_PENDING',$3)`;
    await pool.query(q, [orderId, imei, JSON.stringify({ error: errorMsg })]);
  }
}

module.exports = WarrantyService;
