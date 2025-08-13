const API_BASE = 'http://localhost:3001/api';

export const categoriesAPI = {
  getAll: () => fetch(`${API_BASE}/categories`).then(r => r.json()),

  getById: (id) => fetch(`${API_BASE}/categories/${id}`).then(r => r.json()),

  create: (data) => fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  update: (id, data) => fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  delete: (id) => fetch(`${API_BASE}/categories/${id}`, {
    method: 'DELETE'
  }).then(r => r.json()),
};
