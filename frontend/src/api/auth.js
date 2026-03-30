const BASE_URL = 'http://localhost:8000/api';

export const registerUser = async (data) => {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const loginUser = async (data) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getProfile = async () => {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE_URL}/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
};