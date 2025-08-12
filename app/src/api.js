const API_BASE = 'http://localhost:3001/api';

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

  updateStock: (id, stock) => fetch(`${API_BASE}/products/${id}/stock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock })
  }).then(r => r.json()),

  delete: (id) => fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE'
  }).then(r => r.json()),
};

export const salesAPI = {
  getAll: () => fetch(`${API_BASE}/sales`).then(r => r.json()),

  get: (id) => fetch(`${API_BASE}/sales/${id}`).then(r => r.json()),

  create: (payload) => fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json()),
};
