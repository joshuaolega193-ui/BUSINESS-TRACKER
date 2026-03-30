const BASE_URL = 'http://localhost:8000/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
});

export const getInvoices = async () => {
  const res = await fetch(`${BASE_URL}/invoices/`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const getInvoice = async (id) => {
  const res = await fetch(`${BASE_URL}/invoices/${id}/`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const createInvoice = async (data) => {
  const res = await fetch(`${BASE_URL}/invoices/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateInvoice = async (id, data) => {
  const res = await fetch(`${BASE_URL}/invoices/${id}/`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteInvoice = async (id) => {
  const res = await fetch(`${BASE_URL}/invoices/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.ok;
};