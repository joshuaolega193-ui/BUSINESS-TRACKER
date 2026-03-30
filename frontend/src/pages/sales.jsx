import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSales, createSale, updateSale, deleteSale } from '../api/sales';
import { getProfile } from '../api/auth';
import Toast from '../components/toast';
import useToast from '../hooks/useToast';

export default function Sales() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [error, setError] = useState('');
  const { toasts, addToast, removeToast } = useToast();

  const emptyForm = {
    item_name: '',
    quantity: '',
    unit_price: '',
    date: new Date().toISOString().split('T')[0],
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    Promise.all([getProfile(), getSales()])
      .then(([userData, salesData]) => {
        if (!userData.id) { navigate('/login'); return; }
        setUser(userData);
        setSales(Array.isArray(salesData) ? salesData : []);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.item_name || !form.quantity || !form.unit_price || !form.date) {
      setError('All fields are required');
      return;
    }
    if (editingSale) {
      const updated = await updateSale(editingSale.id, form);
      if (updated.id) {
        setSales(sales.map((s) => s.id === updated.id ? updated : s));
        addToast('Sale updated successfully', 'success');
        resetForm();
      } else { setError('Failed to update sale'); }
    } else {
      const newSale = await createSale(form);
      if (newSale.id) {
        setSales([newSale, ...sales]);
        addToast('Sale recorded successfully', 'success');
        resetForm();
      } else { setError('Failed to create sale'); }
    }
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setForm({
      item_name: sale.item_name,
      quantity: sale.quantity,
      unit_price: sale.unit_price,
      date: sale.date,
    });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sale?')) return;
    const success = await deleteSale(id);
    if (success) {
      setSales(sales.filter((s) => s.id !== id));
      addToast('Sale deleted', 'error');
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingSale(null);
    setShowForm(false);
    setError('');
  };

  const grandTotal = sales.reduce((sum, s) => sum + parseFloat(s.total), 0);

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
          <button onClick={() => navigate('/expenses')}
            className="text-sm text-gray-500 hover:text-indigo-600">Expenses</button>
          <button onClick={() => navigate('/invoices')}
            className="text-sm text-gray-500 hover:text-indigo-600">Invoices</button>
          <button onClick={() => navigate('/receipts')}
            className="text-sm text-gray-500 hover:text-indigo-600">Receipts</button>
          <button onClick={() => navigate('/inventory')}
            className="text-sm text-gray-500 hover:text-indigo-600">Inventory</button>
          
          {/* --- ADDED REPORTS BUTTON --- */}
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
            <h2 className="text-2xl font-bold text-gray-800">Sales</h2>
            <p className="text-sm text-gray-500 mt-1">
              {sales.length} record{sales.length !== 1 ? 's' : ''} · Total:{' '}
              <span className="text-green-600 font-semibold">
                {user?.currency} {grandTotal.toLocaleString()}
              </span>
            </p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            + Add Sale
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <h3 className="text-base font-semibold text-gray-700 mb-4">
              {editingSale ? 'Edit Sale' : 'New Sale'}
            </h3>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Item name</label>
                  <input name="item_name" type="text" required value={form.item_name} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Laptop" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Quantity</label>
                  <input name="quantity" type="number" required min="1" value={form.quantity} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Unit price</label>
                  <input name="unit_price" type="number" required min="0" value={form.unit_price} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <input name="date" type="date" required value={form.date} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {form.quantity && form.unit_price && (
                <p className="text-sm text-gray-500 mt-3">
                  Total: <span className="text-indigo-600 font-semibold">
                    {user?.currency} {(form.quantity * form.unit_price).toLocaleString()}
                  </span>
                </p>
              )}

              <div className="flex gap-3 mt-4">
                <button type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition">
                  {editingSale ? 'Update Sale' : 'Save Sale'}
                </button>
                <button type="button" onClick={resetForm}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {sales.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No sales yet. Click "+ Add Sale" to get started.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Item</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Qty</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Unit Price</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Total</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => (
                  <tr key={sale.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 font-medium text-gray-800">{sale.item_name}</td>
                    <td className="px-6 py-4 text-gray-600">{sale.quantity}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {user?.currency} {Number(sale.unit_price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-green-600 font-semibold">
                      {user?.currency} {Number(sale.total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{sale.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => handleEdit(sale)}
                          className="text-indigo-600 hover:underline text-sm">Edit</button>
                        <button onClick={() => handleDelete(sale.id)}
                          className="text-red-500 hover:underline text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-100 bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-gray-500 font-medium text-sm">
                    Grand Total
                  </td>
                  <td className="px-6 py-3 text-green-600 font-bold text-sm">
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