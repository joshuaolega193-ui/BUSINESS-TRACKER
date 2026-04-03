import axios from 'axios';

// Ensure this matches the dashboard namespace
const API_URL = 'https://oletech-businesstracker.hf.space/api/dashboard';

const getHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getExpenses = async (token) => {
  // Added trailing slash to match Django's requirement
  const response = await axios.get(`${API_URL}/expenses/`, getHeaders(token));
  return response.data;
};

export const createExpense = async (expenseData, token) => {
  const response = await axios.post(`${API_URL}/expenses/`, expenseData, getHeaders(token));
  return response.data;
};

export const updateExpense = async (id, expenseData, token) => {
  const response = await axios.put(`${API_URL}/expenses/${id}/`, expenseData, getHeaders(token));
  return response.data;
};

export const deleteExpense = async (id, token) => {
  const response = await axios.delete(`${API_URL}/expenses/${id}/`, getHeaders(token));
  return response.data;
};