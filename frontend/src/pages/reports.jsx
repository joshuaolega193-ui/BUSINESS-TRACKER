import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../api/auth';
import { getReceipts } from '../api/receipts';
import { getExpenses } from '../api/expenses';
import Toast from '../components/toast';
import useToast from '../hooks/useToast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Reports() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rawData, setRawData] = useState({ receipts: [], expenses: [] });
  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalExpenses: 0,
    netProfit: 0,
    transactionCount: 0
  });
  const [loading, setLoading] = useState(true);
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    Promise.all([getProfile(), getReceipts(), getExpenses()])
      .then(([userData, receiptData, expenseData]) => {
        if (!userData.id) { navigate('/login'); return; }
        setUser(userData);
        setRawData({ receipts: receiptData, expenses: expenseData });
        
        const sales = Array.isArray(receiptData) ? receiptData.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0) : 0;
        const costs = Array.isArray(expenseData) ? expenseData.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) : 0;

        setReportData({
          totalSales: sales,
          totalExpenses: costs,
          netProfit: sales - costs,
          transactionCount: (receiptData?.length || 0) + (expenseData?.length || 0)
        });
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [navigate]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text(`${user?.business_name} - Financial Report`, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date}`, 14, 30);
    doc.text(`Currency: ${user?.currency}`, 14, 35);

    // Summary Table
    doc.autoTable({
      startY: 45,
      head: [['Metric', 'Amount']],
      body: [
        ['Total Revenue', `${user?.currency} ${reportData.totalSales.toLocaleString()}`],
        ['Total Expenses', `${user?.currency} ${reportData.totalExpenses.toLocaleString()}`],
        ['Net Profit', `${user?.currency} ${reportData.netProfit.toLocaleString()}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });

    // Transaction Details Header
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Recent Activity Summary', 14, doc.lastAutoTable.finalY + 15);

    // Activity Table
    const tableRows = [
      ...rawData.receipts.map(r => [r.date, 'Sale/Receipt', r.description || 'N/A', `+${r.total}`]),
      ...rawData.expenses.map(e => [e.date, 'Expense', e.description, `-${e.amount}`])
    ].sort((a, b) => new Date(b[0]) - new Date(a[0]));

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Date', 'Type', 'Description', 'Amount']],
      body: tableRows,
    });

    doc.save(`${user?.business_name}_Report_${date}.pdf`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast toasts={toasts} removeToast={removeToast} />
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-indigo-600 cursor-pointer" onClick={() => navigate('/dashboard')}>Business Tracker</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500">Dashboard</button>
          <button onClick={() => navigate('/reports')} className="text-sm font-semibold text-indigo-600">Reports</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Financial Reports</h2>
            <p className="text-sm text-gray-500">Overview of your business health.</p>
          </div>
          <button 
            onClick={generatePDF}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Download PDF Report
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
            <p className="text-sm text-green-600">Total Revenue</p>
            <h3 className="text-2xl font-bold text-green-700">{user?.currency} {reportData.totalSales.toLocaleString()}</h3>
          </div>
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
            <p className="text-sm text-red-600">Total Expenses</p>
            <h3 className="text-2xl font-bold text-red-700">{user?.currency} {reportData.totalExpenses.toLocaleString()}</h3>
          </div>
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <p className="text-sm text-indigo-600">Net Profit</p>
            <h3 className="text-2xl font-bold text-indigo-700">{user?.currency} {reportData.netProfit.toLocaleString()}</h3>
          </div>
        </div>
      </main>
    </div>
  );
}