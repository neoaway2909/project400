// src/services/insuranceClient.js
// Uses native Node fetch (Node 18+) for maximum speed and zero external dependencies

class InsuranceClient {
  constructor() {
    this.baseURL = process.env.INSURANCE_API_BASE || 'http://localhost:3001/api/v1';
  }

  async createPolicy(payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`${this.baseURL}/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Insurance API error (status ${res.status})`);
      }
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = InsuranceClient;
