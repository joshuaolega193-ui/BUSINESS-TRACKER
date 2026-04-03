import axios from 'axios';

// FIX 1: Removed '/api' to match your backend root
const API_URL = 'https://oletech-businesstracker.hf.space';

const getHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getExpenses = async (token) => {
  // FIX 2: Removed trailing slash after 'expenses'
  const response = await axios.get(`${API_URL}/expenses`, getHeaders(token));
  return response.data;
};

export const createExpense = async (expenseData, token) => {
  // FIX 3: Removed trailing slash
  const response = await axios.post(`${API_URL}/expenses`, expenseData, getHeaders(token));
  return response.data;
};

export const updateExpense = async (id, expenseData, token) => {
  // FIX 4: Removed trailing slash after the ID
  const response = await axios.put(`${API_URL}/expenses/${id}`, expenseData, getHeaders(token));
  return response.data;
};

export const deleteExpense = async (id, token) => {
  // FIX 5: Removed trailing slash
  const response = await axios.delete(`${API_URL}/expenses/${id}`, getHeaders(token));
  return response.data;
};