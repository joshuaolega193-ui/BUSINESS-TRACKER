import axios from 'axios';

const BASE_URL = 'https://oletech-businesstracker.hf.space/api';

// Fixed to be a dynamic function that pulls the latest token
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  };
};

export const getInvoices = async () => {
  // Added trailing slash
  const res = await axios.get(`${BASE_URL}/invoices/`, getAuthHeaders());
  return res.data;
};

export const getInvoice = async (id) => {
  // Added trailing slash
  const res = await axios.get(`${BASE_URL}/invoices/${id}/`, getAuthHeaders());
  return res.data;
};

export const createInvoice = async (data) => {
  // Added trailing slash
  const res = await axios.post(`${BASE_URL}/invoices/`, data, getAuthHeaders());
  return res.data;
};

export const updateInvoice = async (id, data) => {
  // Added trailing slash
  const res = await axios.put(`${BASE_URL}/invoices/${id}/`, data, getAuthHeaders());
  return res.data;
};

export const deleteInvoice = async (id) => {
  // Added trailing slash
  const res = await axios.delete(`${BASE_URL}/invoices/${id}/`, getAuthHeaders());
  return res.status === 204 || res.status === 200;
};