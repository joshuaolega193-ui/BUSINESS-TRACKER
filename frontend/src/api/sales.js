import axios from 'axios';

const BASE_URL = 'https://oletech-businesstracker.hf.space/api';

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

export const getSales = async () => {
  const res = await axios.get(`${BASE_URL}/dashboard/sales/`, getAuthHeaders());
  return res.data;
};

export const createSale = async (data) => {
  const res = await axios.post(`${BASE_URL}/dashboard/sales/`, data, getAuthHeaders());
  return res.data;
};

export const updateSale = async (id, data) => {
  const res = await axios.put(`${BASE_URL}/dashboard/sales/${id}/`, data, getAuthHeaders());
  return res.data;
};

export const deleteSale = async (id) => {
  const res = await axios.delete(`${BASE_URL}/dashboard/sales/${id}/`, getAuthHeaders());
  return res.status === 204 || res.status === 200;
};