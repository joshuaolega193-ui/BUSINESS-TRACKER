import axios from 'axios';

const BASE_URL = 'https://oletech-businesstracker.hf.space/api';

// Dynamic function to ensure we always grab the latest token
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  };
};

export const getReceipts = async () => {
  // Added trailing slash
  const res = await axios.get(`${BASE_URL}/receipts/`, getAuthHeaders());
  return res.data;
};

export const createReceipt = async (data) => {
  // Added trailing slash
  const res = await axios.post(`${BASE_URL}/receipts/`, data, getAuthHeaders());
  return res.data;
};

export const updateReceipt = async (id, data) => {
  // Added trailing slash
  const res = await axios.put(`${BASE_URL}/receipts/${id}/`, data, getAuthHeaders());
  return res.data;
};

export const deleteReceipt = async (id) => {
  // Added trailing slash
  const res = await axios.delete(`${BASE_URL}/receipts/${id}/`, getAuthHeaders());
  return res.status === 204 || res.status === 200;
};