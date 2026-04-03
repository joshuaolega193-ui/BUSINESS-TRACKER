import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getProfile } from '../api/auth';
import { getDashboardSummary } from '../api/dashboard';
import Toast from '../components/toast';
import useToast from '../hooks/useToast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    // We use a helper function to handle the async/await logic properly
    const loadDashboardData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          console.error("No token found, redirecting...");
          navigate('/login');
          return;
        }

        // Fetch both with the token
        const [userData, summaryData] = await Promise.all([
          getProfile(token),
          getDashboardSummary()
        ]);

        setUser(userData);
        setSummary(summaryData);
        setLoading(false);
        addToast('Dashboard loaded successfully', 'success');
        
      } catch (error) {
        console.error("Dashboard Load Error:", error);
        setLoading(false);
        addToast('Session expired or connection error. Please log in again.', 'error');
        
        // If it's a 401, clean up and send them back to login
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      }
    };

    loadDashboardData();
  }, [navigate]); // Added navigate to dependency array

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          Loading dashboard...
        </div>
      </div>
    );
  }

  // ... rest of your chartData, chartOptions, and return (no changes needed below this line)