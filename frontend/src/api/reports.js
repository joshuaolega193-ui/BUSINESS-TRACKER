const BASE_URL = 'http://localhost:8000/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
});

export const getReportSummary = async (startDate, endDate) => {
  const res = await fetch(
    `${BASE_URL}/reports/summary/?start=${startDate}&end=${endDate}`,
    { headers: authHeaders() }
  );
  return res.json();
};

export const exportReportCSV = (startDate, endDate) => {
  const token = localStorage.getItem('access_token');
  const url = `${BASE_URL}/reports/export/?start=${startDate}&end=${endDate}`;

  // Create a temporary link to trigger download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `report_${startDate}_to_${endDate}.csv`);

  // Add auth header via fetch then download
  fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    .then((res) => res.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    });
};