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

  delete: (id) => fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE'
  }).then(r => {
    if (r.status === 204) {
      return null;
    }
    return r.json();
  }),
};
