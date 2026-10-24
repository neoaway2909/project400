// src/services/insuranceClient.js
const axios = require('axios');

class InsuranceClient {
  constructor() {
    this.http = axios.create({
      baseURL: process.env.INSURANCE_API_BASE || 'http://localhost:3001/api/v1',
      timeout: 5000,
    });
  }

  async createPolicy(payload) {
    const response = await this.http.post('/policies', payload);
    // Expected: { policy_no, e_warranty_url, ... }
    return response.data;
  }
}

module.exports = InsuranceClient;
