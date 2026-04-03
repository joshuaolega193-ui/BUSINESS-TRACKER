import axios from 'axios';

const API_URL = 'https://oletech-businesstracker.hf.space/api'; 

export const loginUser = async (credentials) => {
  const response = await axios.post(`${API_URL}/login/`, credentials);
  
  // FIX: Save the token immediately upon successful login
  // Django SimpleJWT usually returns the token in a field called 'access'
  if (response.data && response.data.access) {
    localStorage.setItem('access_token', response.data.access);
    // If your backend also sends a refresh token, save it too:
    if (response.data.refresh) {
      localStorage.setItem('refresh_token', response.data.refresh);
    }
  }
  
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