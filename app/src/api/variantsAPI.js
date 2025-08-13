const API_BASE = 'http://localhost:3001/api';

export const variantsAPI = {
  getAllForProduct: (productId) => fetch(`${API_BASE}/variants/products/${productId}`).then(r => r.json()),

  getById: (id) => fetch(`${API_BASE}/variants/${id}`).then(r => r.json()),

  create: (data) => fetch(`${API_BASE}/variants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  update: (id, data) => fetch(`${API_BASE}/variants/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  delete: (id) => fetch(`${API_BASE}/variants/${id}`, {
    method: 'DELETE'
  }).then(r => r.json()),
};
