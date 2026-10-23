const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const request = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.message || 'API Error'), { data });
  return data;
};

export const api = {
  // Inventory
  getSummary:       ()           => request('GET',  '/inventory/summary'),
  getAvailableStock:(params = {}) => request('GET',  `/inventory/available-stock?${new URLSearchParams(params)}`),
  getImeiDetail:    (imei)       => request('GET',  `/inventory/imei/${imei}`),
  receiveStock:     (body)       => request('POST', '/inventory/receive', body),
  updateImeiStatus: (imei, body) => request('PUT',  `/inventory/imei/${imei}/status`, body),

  // Brands & Models
  getBrands: ()          => request('GET', '/brands'),
  getModels: (brandId)   => request('GET', `/models${brandId ? `?brandId=${brandId}` : ''}`),
};
