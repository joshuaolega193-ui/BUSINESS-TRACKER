import axios from 'axios';
const BASE_URL = 'https://oletech-businesstracker.hf.space/api';

export const getDashboardSummary = async (token) => {
  const response = await axios.get(`${BASE_URL}/dashboard/summary/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};