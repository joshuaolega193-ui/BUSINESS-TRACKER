const BASE_URL = 'http://localhost:8000/api';

// Helper to get auth headers
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
});

// Get all sales
export const getSales = async () => {
  const res = await fetch(`${BASE_URL}/dashboard/sales/`, {
    headers: authHeaders(),
  });
  return res.json();
};

// Add a new sale
export const createSale = async (data) => {
  const res = await fetch(`${BASE_URL}/dashboard/sales/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

// Update an existing sale
export const updateSale = async (id, data) => {
  const res = await fetch(`${BASE_URL}/dashboard/sales/${id}/`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

// Delete a sale
export const deleteSale = async (id) => {
  const res = await fetch(`${BASE_URL}/dashboard/sales/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.ok;
};