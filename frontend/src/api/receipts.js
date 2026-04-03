
import axios from 'axios';
const BASE_URL = 'https://oletech-businesstracker.hf.space/api';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
});

export const getReceipts = async () => {
  const res = await fetch(`${BASE_URL}/receipts/`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const createReceipt = async (data) => {
  const res = await fetch(`${BASE_URL}/receipts/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateReceipt = async (id, data) => {
  const res = await fetch(`${BASE_URL}/receipts/${id}/`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteReceipt = async (id) => {
  const res = await fetch(`${BASE_URL}/receipts/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.ok;
};