import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses';
import { getProfile } from '../api/auth';
import Toast from '../components/toast';
import useToast from '../hooks/useToast';

const CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'stock', label: 'Stock' },
  { value: 'transport', label: 'Transport' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_COLORS = {
  rent: 'bg-blue-100 text-blue-700',
  stock: 'bg-green-100 text-green-700',
  transport: 'bg-yellow-100 text-yellow-700',
  utilities: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-600',
};

export default function Expenses() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const { toasts, addToast, removeToast } = useToast();

  const emptyForm = {
    description: '',
    amount: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    Promise.all([getProfile(), getExpenses()])
      .then(([userData, expenseData]) => {
        if (!userData.id) { navigate('/login'); return; }
        setUser(userData);
        setExpenses(Array.isArray(expenseData) ? expenseData : []);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.description || !form.amount || !form.date) {
      setError('All fields are required');
      return;
    }
    if (editingExpense) {
      const updated = await updateExpense(editingExpense.id, form);
      if (updated.id) {
        setExpenses(expenses.map((ex) => ex.id === updated.id ? updated : ex));
        addToast('Expense updated successfully', 'success');
        resetForm();
      } else { setError('Failed to update expense'); }
    } else {
      const newExpense = await createExpense(form);
      if (newExpense.id) {
        setExpenses([newExpense, ...expenses]);
        addToast('Expense recorded successfully', 'success');
        resetForm();
      } else { setError('Failed to create expense'); }
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setForm({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
    });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    const success = await deleteExpense(id);
    if (success) {
      setExpenses(expenses.filter((ex) => ex.id !== id));
      addToast('Expense deleted', 'error');
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingExpense(null);
    setShowForm(false);
    setError('');
  };

  const filteredExpenses = filterCategory === 'all'
    ? expenses
    : expenses.filter((ex) => ex.category === filterCategory);

  const grandTotal = filteredExpenses.reduce(
    (sum, ex) => sum + parseFloat(ex.amount), 0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast toasts={toasts} removeToast={removeToast} />

      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-indigo-600 cursor-pointer"
          onClick={() => navigate('/dashboard')}>
          Business Tracker
        </h1>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 hover:text-indigo-600">Dashboard</button>
          <button onClick={() => navigate('/sales')}
            className="text-sm text-gray-500 hover:text-indigo-600">Sales</button>
          <button onClick={() => navigate('/expenses')}
            className="text-sm font-semibold text-indigo-600">Expenses</button>
          <button onClick={() => navigate('/invoices')}
            className="text-sm text-gray-500 hover:text-indigo-600">Invoices</button>
          <button onClick={() => navigate('/receipts')}
            className="text-sm text-gray-500 hover:text-indigo-600">Receipts</button>
          <button onClick={() => navigate('/inventory')}
            className="text-sm text-gray-500 hover:text-indigo-600">Inventory</button>
          <button onClick={() => navigate('/reports')}
            className="text-sm text-gray-500 hover:text-indigo-600">Reports</button>
          <span className="text-sm text-gray-600">{user?.business_name}</span>
          <button onClick={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            navigate('/login');
          }} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredExpenses.length} record{filteredExpenses.length !== 1 ? 's' : ''} · Total:{' '}
              <span className="text-red-500 font-semibold">
                {user?.currency} {grandTotal.toLocaleString()}
              </span>
            </p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            + Add Expense
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <h3 className="text-base font-semibold text-gray-700 mb-4">
              {editingExpense ? 'Edit Expense' : 'New Expense'}
            </h3>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <input name="description" type="text" required value={form.description} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Office Rent" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Amount</label>
                  <input name="amount" type="number" required min="0" value={form.amount} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <select name="category" value={form.category} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <input name="date" type="date" required value={form.date} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition">
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
                <button type="button" onClick={resetForm}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filterCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}>All</button>
          {CATEGORIES.map((cat) => (
            <button key={cat.value} onClick={() => setFilterCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filterCategory === cat.value ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}>{cat.label}</button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No expenses yet. Click "+ Add Expense" to get started.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Description</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Category</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Amount</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense, index) => (
                  <tr key={expense.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 font-medium text-gray-800">{expense.description}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[expense.category]}`}>
                        {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-red-500 font-semibold">
                      {user?.currency} {Number(expense.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{expense.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => handleEdit(expense)}
                          className="text-indigo-600 hover:underline text-sm">Edit</button>
                        <button onClick={() => handleDelete(expense.id)}
                          className="text-red-500 hover:underline text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-100 bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-6 py-3 text-gray-500 font-medium text-sm">Grand Total</td>
                  <td className="px-6 py-3 text-red-500 font-bold text-sm">
                    {user?.currency} {grandTotal.toLocaleString()}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}