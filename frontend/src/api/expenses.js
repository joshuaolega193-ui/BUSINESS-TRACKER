import axios from 'axios';

const BASE_URL = 'https://oletech-businesstracker.hf.space/api';

export const getExpenses = async (token) => {
  const response = await axios.get(`${BASE_URL}/expenses/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const addExpense = async (expenseData, token) => {
  const response = await axios.post(`${BASE_URL}/expenses/`, expenseData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};