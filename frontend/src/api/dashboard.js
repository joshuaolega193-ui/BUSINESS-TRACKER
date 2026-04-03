import axios from 'axios';

const API_URL = 'https://oletech-businesstracker.hf.space/api';

const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  
  // FIX: If no token, log it so we can see it in the console
  if (!token) {
    console.error("DEBUG: No access token found in LocalStorage!");
    throw new Error("UNAUTHORIZED");
  }

  return {
    headers: { 
      'Authorization': `Bearer ${token}`, // Double-check the space after Bearer
      'Content-Type': 'application/json'
    }
  };
};

export const getDashboardSummary = async () => {
  const response = await axios.get(`${API_URL}/dashboard/summary/`, getHeaders());
  return response.data;
};

export const getUserProfile = async () => {
  const response = await axios.get(`${API_URL}/profile/`, getHeaders());
  return response.data;
};