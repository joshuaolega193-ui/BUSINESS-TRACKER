import axios from 'axios';

// FIX 1: Removed '/api' to match the root of your Hugging Face Space
const BASE_URL = 'https://oletech-businesstracker.hf.space';

// Helper function to always get the freshest token
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  };
};

// Get all sales
export const getSales = async () => {
  // FIX 2: Removed trailing slash
  const res = await axios.get(`${BASE_URL}/dashboard/sales`, getAuthHeaders());
  return res.data;
};

// Add a new sale
export const createSale = async (data) => {
  // FIX 3: Removed trailing slash
  const res = await axios.post(`${BASE_URL}/dashboard/sales`, data, getAuthHeaders());
  return res.data;
};

// Update an existing sale
export const updateSale = async (id, data) => {
  // FIX 4: Removed trailing slash after the ID
  const res = await axios.put(`${BASE_URL}/dashboard/sales/${id}`, data, getAuthHeaders());
  return res.data;
};

// Delete a sale
export const deleteSale = async (id) => {
  // FIX 5: Removed trailing slash
  const res = await axios.delete(`${BASE_URL}/dashboard/sales/${id}`, getAuthHeaders());
  return res.status === 204 || res.status === 200;
};