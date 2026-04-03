import axios from 'axios';

// RE-ADDED: '/api' and ensure no trailing slash here
const API_URL = 'https://oletech-businesstracker.hf.space/api';

const getHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getExpenses = async (token) => {
  // RE-ADDED: Trailing slash after 'expenses/'
  const response = await axios.get(`${API_URL}/expenses/`, getHeaders(token));
  return response.data;
};

export const createExpense = async (expenseData, token) => {
  // RE-ADDED: Trailing slash
  const response = await axios.post(`${API_URL}/expenses/`, expenseData, getHeaders(token));
  return response.data;
};

export const updateExpense = async (id, expenseData, token) => {
  // RE-ADDED: Trailing slash after the ID
  const response = await axios.put(`${API_URL}/expenses/${id}/`, expenseData, getHeaders(token));
  return response.data;
};

export const deleteExpense = async (id, token) => {
  // RE-ADDED: Trailing slash
  const response = await axios.delete(`${API_URL}/expenses/${id}/`, getHeaders(token));
  return response.data;
};