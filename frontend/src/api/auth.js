import axios from 'axios';

// FIX: Removed '/api' from the end
const API_URL = 'https://oletech-businesstracker.hf.space';

export const loginUser = async (credentials) => {
  // Resulting URL: https://oletech-businesstracker.hf.space/login
  const response = await axios.post(`${API_URL}/login`, credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  // Resulting URL: https://oletech-businesstracker.hf.space/register
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};

export const getProfile = async (token) => {
  // Resulting URL: https://oletech-businesstracker.hf.space/profile
  const response = await axios.get(`${API_URL}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};