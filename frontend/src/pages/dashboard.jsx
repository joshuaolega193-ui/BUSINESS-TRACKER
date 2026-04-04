import { useEffect, useState, useRef } from 'react';
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
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadDashboardData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

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
        if (error.message === 'UNAUTHORIZED' || error.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        } else {
          addToast('Failed to load dashboard data', 'error');
        }
      }
    };
    loadDashboardData();
  }, [navigate]);

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

  const chartData = {
    labels: summary?.chart?.labels?.length > 0 ? summary.chart.labels : ['No data yet'],
    datasets: [
      {
        label: 'Monthly Sales',
        data: summary?.chart?.data?.length > 0 ? summary.chart.data : [0],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  const stats = [
    { label: 'Total Sales', value: summary?.total_sales || 0, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Expenses', value: summary?.total_expenses || 0, color: 'text-red-500', bg: 'bg-red-50' },
    {
      label: 'Net Profit',
      value: summary?.net_profit || 0,
      color: summary?.net_profit >= 0 ? 'text-indigo-600' : 'text-red-500',
      bg: summary?.net_profit >= 0 ? 'bg-indigo-50' : 'bg-red-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast toasts={toasts} removeToast={removeToast} />
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-indigo-600">Business Tracker</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales')} className="text-sm text-gray-500 hover:text-indigo-600">Sales</button>
          <button onClick={() => navigate('/expenses')} className="text-sm text-gray-500 hover:text-indigo-600">Expenses</button>
          <button onClick={() => navigate('/invoices')} className="text-sm text-gray-500 hover:text-indigo-600">Invoices</button>
          <button onClick={() => navigate('/receipts')} className="text-sm text-gray-500 hover:text-indigo-600">Receipts</button>
          <button onClick={() => navigate('/inventory')} className="text-sm text-gray-500 hover:text-indigo-600">Inventory</button>
          <button onClick={() => navigate('/reports')} className="text-sm text-gray-500 hover:text-indigo-600 font-medium">Reports</button>
          <span className="text-sm text-gray-600">{user?.business_name || user?.name}</span>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome, {user?.name}</h2>
        <p className="text-sm text-gray-500 mb-8">{user?.business_name} · {user?.currency}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {stats.map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl border border-gray-100 p-6`}>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                {user?.currency} {Number(stat.value).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-700 mb-4">Monthly Sales</h3>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </main>
    </div>
  );
}