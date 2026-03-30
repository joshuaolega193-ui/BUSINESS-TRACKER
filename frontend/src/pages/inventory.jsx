import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/inventory';
import { getProfile } from '../api/auth';
import Toast from '../components/toast';
import useToast from '../hooks/useToast';

const CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_COLORS = {
  electronics: 'bg-blue-100 text-blue-700',
  clothing: 'bg-pink-100 text-pink-700',
  food: 'bg-green-100 text-green-700',
  stationery: 'bg-yellow-100 text-yellow-700',
  furniture: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-600',
};

export default function Inventory() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const { toasts, addToast, removeToast } = useToast();

  const emptyForm = {
    name: '',
    category: 'other',
    description: '',
    quantity: '',
    unit_price: '',
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    Promise.all([getProfile(), getProducts()])
      .then(([userData, productData]) => {
        if (!userData.id) { navigate('/login'); return; }
        setUser(userData);
        setProducts(Array.isArray(productData) ? productData : []);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.quantity || !form.unit_price) {
      setError('Name, quantity and unit price are required');
      return;
    }
    if (editingProduct) {
      const updated = await updateProduct(editingProduct.id, form);
      if (updated.id) {
        setProducts(products.map((p) => p.id === updated.id ? updated : p));
        addToast('Product updated successfully', 'success');
        resetForm();
      } else { setError('Failed to update product'); }
    } else {
      const created = await createProduct(form);
      if (created.id) {
        setProducts([...products, created]);
        addToast('Product added successfully', 'success');
        resetForm();
      } else { setError('Failed to create product'); }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      description: product.description,
      quantity: product.quantity,
      unit_price: product.unit_price,
    });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    const success = await deleteProduct(id);
    if (success) {
      setProducts(products.filter((p) => p.id !== id));
      addToast('Product deleted', 'error');
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingProduct(null);
    setShowForm(false);
    setError('');
  };

  const filtered = products
    .filter((p) => filterCategory === 'all' || p.category === filterCategory)
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const lowStockItems = products.filter((p) => p.is_low_stock);
  const totalValue = products.reduce((sum, p) => sum + parseFloat(p.stock_value), 0);

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
            className="text-sm text-gray-500 hover:text-indigo-600">Expenses</button>
          <button onClick={() => navigate('/invoices')}
            className="text-sm text-gray-500 hover:text-indigo-600">Invoices</button>
          <button onClick={() => navigate('/receipts')}
            className="text-sm text-gray-500 hover:text-indigo-600">Receipts</button>
          
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
        {/* ... Rest of the main content remains unchanged ... */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
            <p className="text-sm text-gray-500 mt-1">
              {products.length} product{products.length !== 1 ? 's' : ''} · Total value:{' '}
              <span className="text-indigo-600 font-semibold">
                {user?.currency} {totalValue.toLocaleString()}
              </span>
            </p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            + Add Product
          </button>
        </div>

        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6">
            <p className="text-red-700 font-semibold text-sm mb-1">
              Low Stock Alert — {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} at or below 50%
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {lowStockItems.map((p) => (
                <span key={p.id} className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium">
                  {p.name} — {p.quantity} left ({Math.round(p.stock_percentage)}%)
                </span>
              ))}
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <h3 className="text-base font-semibold text-gray-700 mb-4">
              {editingProduct ? 'Edit Product' : 'New Product'}
            </h3>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Product name</label>
                  <input name="name" required value={form.name} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Laptop" />
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
                  <label className="text-sm font-medium text-gray-700">Quantity</label>
                  <input name="quantity" type="number" min="0" required value={form.quantity} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Unit price</label>
                  <input name="unit_price" type="number" min="0" required value={form.unit_price} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0" />
                </div>
                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <input name="description" value={form.description} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Optional description" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition">
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
                <button type="button" onClick={resetForm}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-4">
          <input type="text" placeholder="Search products..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" />
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
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No products found. Click "+ Add Product" to get started.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Product</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Category</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Stock</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Unit Price</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Stock Value</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, index) => (
                  <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{product.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[product.category]}`}>
                        {CATEGORIES.find((c) => c.value === product.category)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-700">{product.quantity}</p>
                        <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                          <div className={`h-1.5 rounded-full ${product.is_low_stock ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(product.stock_percentage, 100)}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {Math.round(product.stock_percentage)}% of {product.initial_quantity}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {user?.currency} {Number(product.unit_price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-indigo-600">
                      {user?.currency} {Number(product.stock_value).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {product.is_low_stock ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => handleEdit(product)}
                          className="text-indigo-600 hover:underline text-sm">Edit</button>
                        <button onClick={() => handleDelete(product.id)}
                          className="text-red-500 hover:underline text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}