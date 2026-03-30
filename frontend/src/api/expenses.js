const BASE_URL = 'http://localhost:8000/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
});

export const getExpenses = async () => {
  const res = await fetch(`${BASE_URL}/dashboard/expenses/`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const createExpense = async (data) => {
  const res = await fetch(`${BASE_URL}/dashboard/expenses/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateExpense = async (id, data) => {
  const res = await fetch(`${BASE_URL}/dashboard/expenses/${id}/`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteExpense = async (id) => {
  const res = await fetch(`${BASE_URL}/dashboard/expenses/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.ok;
};