const BASE_URL = 'http://localhost:8000/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
});

export const getProducts = async () => {
  const res = await fetch(`${BASE_URL}/inventory/`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const getLowStock = async () => {
  const res = await fetch(`${BASE_URL}/inventory/low-stock/`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const createProduct = async (data) => {
  const res = await fetch(`${BASE_URL}/inventory/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateProduct = async (id, data) => {
  const res = await fetch(`${BASE_URL}/inventory/${id}/`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteProduct = async (id) => {
  const res = await fetch(`${BASE_URL}/inventory/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.ok;
};