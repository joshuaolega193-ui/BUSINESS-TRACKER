import axios from 'axios';

const API_URL = 'https://oletech-businesstracker.hf.space/api';

export const loginUser = async (credentials) => {
  // Removed the slash after login
  const response = await axios.post(`${API_URL}/login`, credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  // Removed the slash after register
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};

export const getProfile = async (token) => {
  // Removed the slash after profile
  const response = await axios.get(`${API_URL}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};