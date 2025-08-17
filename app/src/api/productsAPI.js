import { API_BASE } from "@/lib/api-client";

export const productsAPI = {
  getAll: () => fetch(`${API_BASE}/products`).then(r => r.json()),

  getById: (id) => fetch(`${API_BASE}/products/${id}`).then(r => r.json()),

  create: (data) => fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  update: (id, data) => fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  delete: async (id) => {
    const r = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    if (r.status === 204 || r.status === 404) return null;
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || `Delete failed: ${r.status}`);
    }
    return r.json().catch(() => null);
  },
};
