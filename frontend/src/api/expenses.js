import axios from 'axios';

const API_URL = 'https://oletech-businesstracker.hf.space/api';

// Helper to get headers
const getHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getExpenses = async (token) => {
  const response = await axios.get(`${API_URL}/expenses/`, getHeaders(token));
  return response.data;
};

export const createExpense = async (expenseData, token) => {
  const response = await axios.post(`${API_URL}/expenses/`, expenseData, getHeaders(token));
  return response.data;
};

// ENSURE THIS NAME MATCHES EXACTLY:
export const updateExpense = async (id, expenseData, token) => {
  const response = await axios.put(`${API_URL}/expenses/${id}/`, expenseData, getHeaders(token));
  return response.data;
};

export const deleteExpense = async (id, token) => {
  const response = await axios.delete(`${API_URL}/expenses/${id}/`, getHeaders(token));
  return response.data;
};