import axios from 'axios';

const BASE_URL = 'https://oletech-businesstracker.hf.space/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  };
};

export const getReportSummary = async (startDate, endDate) => {
  // Added trailing slash BEFORE the query parameters
  const res = await axios.get(
    `${BASE_URL}/reports/summary/?start=${startDate}&end=${endDate}`,
    getAuthHeaders()
  );
  return res.data;
};

export const exportReportCSV = (startDate, endDate) => {
  const token = localStorage.getItem('access_token');
  // Added trailing slash BEFORE the query parameters
  const url = `${BASE_URL}/reports/export/?start=${startDate}&end=${endDate}`;

  // Fetch with auth header, convert to blob, and trigger download
  fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    .then((res) => res.blob())
    .then((blob) => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    })
    .catch((err) => console.error('Export failed:', err));
};