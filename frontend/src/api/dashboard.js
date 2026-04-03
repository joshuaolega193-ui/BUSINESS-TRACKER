import axios from 'axios';

const API_URL = 'https://oletech-businesstracker.hf.space/api';

const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  
  // FIX: Guard against missing tokens to prevent 401 errors
  if (!token) {
    console.error("No access token found in localStorage");
    throw new Error("UNAUTHORIZED"); 
  }

  return {
    headers: { 
      'Authorization': `Bearer ${token}`,
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