import axios from 'axios';

const API_URL = 'https://oletech-businesstracker.hf.space/api';

export const loginUser = async (credentials) => {
  const response = await axios.post(`${API_URL}/login/`, credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await axios.post(`${API_URL}/register/`, userData);
  return response.data;
};

// ADD THIS NEW FUNCTION:
export const getProfile = async (token) => {
  const response = await axios.get(`${API_URL}/profile/`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};