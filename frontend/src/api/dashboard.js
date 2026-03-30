const BASE_URL = 'http://localhost:8000/api';

export const getDashboardSummary = async () => {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE_URL}/dashboard/summary`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
};