import axios from 'axios';

// 1. Django usually expects the /api prefix if that's how your urls.py is set up
const API_URL = 'https://oletech-businesstracker.hf.space/api'; 

export const loginUser = async (credentials) => {
  // 2. CRITICAL: Django MANDATES the trailing slash (the '/' at the end)
  const response = await axios.post(`${API_URL}/login/`, credentials); 
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await axios.post(`${API_URL}/register/`, userData);
  return response.data;
};

export const getProfile = async (token) => {
  const response = await axios.get(`${API_URL}/profile/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};