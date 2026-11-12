// src/services/insuranceClient.js
// Uses native Node fetch (Node 18+) for maximum speed and zero external dependencies

class InsuranceClient {
  constructor() {
    this.baseURL = process.env.INSURANCE_API_BASE || 'http://localhost:3001/api/v1';
    this.apiKey = process.env.INSURANCE_API_KEY || 'SHOP-BKK-01-SECRET-KEY-2026';
  }

  async createPolicy(payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`${this.baseURL}/policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detailMsg = Array.isArray(data.details)
          ? data.details.map(d => d.message).join(', ')
          : data.message;
        throw new Error(detailMsg || `Insurance API error (status ${res.status})`);
      }
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = InsuranceClient;
