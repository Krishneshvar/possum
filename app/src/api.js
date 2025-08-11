const API_BASE = import.meta.env.VITE_API_URL;

const productsAPI = {
  getAll: () => fetch(`${API_BASE}/products`).then(res => res.json()),
  get: (id) => fetch(`${API_BASE}/products/${id}`).then(res => res.json()),
  create: (data) =>
    fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.json()),
  updateStock: (id, stock) =>
    fetch(`${API_BASE}/products/${id}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock }),
    }).then(res => res.json()),
  delete: (id) =>
    fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' }).then(res => res.json()),
};

const salesAPI = {
  getAll: () => fetch(`${API_BASE}/sales`).then(res => res.json()),
  create: (data) =>
    fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.json()),
};

export { productsAPI, salesAPI }
