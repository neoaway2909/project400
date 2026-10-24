const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const API_KEY = import.meta.env.VITE_API_KEY;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
      ...options.headers,
    },
  });
  const responseBody = await response.text();
  let data = {};
  if (responseBody) {
    try {
      data = JSON.parse(responseBody);
    } catch {
      throw new Error(
        response.ok
          ? 'Repair API returned an invalid response'
          : `Repair API request failed (${response.status}); check that the backend is running`,
      );
    }
  }
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

export const repairApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    const query = params.toString();
    return request(`/repairs${query ? `?${query}` : ''}`);
  },
  get: (ticketId) => request(`/repairs/${encodeURIComponent(ticketId)}`),
  updateStatus: (ticketId, body) => request(
    `/repairs/${encodeURIComponent(ticketId)}/status`,
    { method: 'PUT', body: JSON.stringify(body) },
  ),
};
