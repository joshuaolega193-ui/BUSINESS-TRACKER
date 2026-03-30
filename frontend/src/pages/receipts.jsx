import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getReceipts, createReceipt, updateReceipt, deleteReceipt } from '../api/receipts';
import { getProfile } from '../api/auth';
import Toast from '../components/toast';
import useToast from '../hooks/useToast';

const emptyItem = { description: '', quantity: 1, unit_price: 0 };

export default function Receipts() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [error, setError] = useState('');
  const { toasts, addToast, removeToast } = useToast();

  const emptyForm = {
    receipt_number: `RCP-${Date.now().toString().slice(-6)}`,
    customer_name: '',
    customer_email: '',
    date: new Date().toISOString().split('T')[0],
    tax_rate: 0,
    notes: '',
    items: [{ ...emptyItem }],
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    Promise.all([getProfile(), getReceipts()])
      .then(([userData, receiptData]) => {
        if (!userData.id) { navigate('/login'); return; }
        setUser(userData);
        setReceipts(Array.isArray(receiptData) ? receiptData : []);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleItemChange = (index, e) => {
    const updated = form.items.map((item, i) =>
      i === index ? { ...item, [e.target.name]: e.target.value } : item
    );
    setForm({ ...form, items: updated });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });

  const removeItem = (index) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const calcSubtotal = () =>
    form.items.reduce((sum, item) =>
      sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0);

  const calcTax = () => calcSubtotal() * ((parseFloat(form.tax_rate) || 0) / 100);
  const calcTotal = () => calcSubtotal() + calcTax();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.customer_name || !form.date) {
      setError('Customer name and date are required');
      return;
    }
    if (form.items.some((item) => !item.description || !item.unit_price)) {
      setError('All items must have a description and unit price');
      return;
    }
    if (editingReceipt) {
      const updated = await updateReceipt(editingReceipt.id, form);
      if (updated.id) {
        setReceipts(receipts.map((r) => r.id === updated.id ? updated : r));
        addToast('Receipt updated successfully', 'success');
        resetForm();
      } else { setError('Failed to update receipt'); }
    } else {
      const created = await createReceipt(form);
      if (created.id) {
        setReceipts([created, ...receipts]);
        addToast('Receipt created successfully', 'success');
        resetForm();
      } else { setError('Failed to create receipt'); }
    }
  };

  const handleEdit = (receipt) => {
    setEditingReceipt(receipt);
    setForm({
      receipt_number: receipt.receipt_number,
      customer_name: receipt.customer_name,
      customer_email: receipt.customer_email,
      date: receipt.date,
      tax_rate: receipt.tax_rate,
      notes: receipt.notes,
      items: receipt.items,
    });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this receipt?')) return;
    const success = await deleteReceipt(id);
    if (success) {
      setReceipts(receipts.filter((r) => r.id !== id));
      addToast('Receipt deleted', 'error');
    }
  };

  const resetForm = () => {
    setForm({ ...emptyForm, receipt_number: `RCP-${Date.now().toString().slice(-6)}` });
    setEditingReceipt(null);
    setShowForm(false);
    setError('');
  };

  const downloadPDF = (receipt) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text('RECEIPT', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(user?.business_name || '', 14, 32);
    doc.text(user?.email || '', 14, 38);
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(`Receipt #: ${receipt.receipt_number}`, 140, 22);
    doc.text(`Date: ${receipt.date}`, 140, 30);
    doc.text('Received From:', 14, 50);
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(receipt.customer_name, 14, 58);
    if (receipt.customer_email) doc.text(receipt.customer_email, 14, 65);
    autoTable(doc, {
      startY: 75,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: receipt.items.map((item) => [
        item.description,
        item.quantity,
        `${user?.currency} ${Number(item.unit_price).toLocaleString()}`,
        `${user?.currency} ${(parseFloat(item.quantity) * parseFloat(item.unit_price)).toLocaleString()}`,
      ]),
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 10 },
    });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Subtotal: ${user?.currency} ${Number(receipt.subtotal).toLocaleString()}`, 140, finalY);
    doc.text(`Tax (${receipt.tax_rate}%): ${user?.currency} ${Number(receipt.tax_amount).toLocaleString()}`, 140, finalY + 8);
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text(`Total: ${user?.currency} ${Number(receipt.total).toLocaleString()}`, 140, finalY + 18);
    if (receipt.notes) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Notes: ${receipt.notes}`, 14, finalY + 30);
    }
    addToast('PDF downloaded successfully', 'info');
    doc.save(`receipt-${receipt.receipt_number}.pdf`);
  };

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
          <button onClick={() => navigate('/inventory')}
            className="text-sm text-gray-500 hover:text-indigo-600">Inventory</button>
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
            <h2 className="text-2xl font-bold text-gray-800">Receipts</h2>
            <p className="text-sm text-gray-500 mt-1">
              {receipts.length} receipt{receipts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            + New Receipt
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <h3 className="text-base font-semibold text-gray-700 mb-4">
              {editingReceipt ? 'Edit Receipt' : 'New Receipt'}
            </h3>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Receipt number</label>
                  <input name="receipt_number" value={form.receipt_number} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Customer name</label>
                  <input name="customer_name" required value={form.customer_name} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Customer email</label>
                  <input name="customer_email" type="email" value={form.customer_email} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="customer@example.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <input name="date" type="date" required value={form.date} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tax rate (%)</label>
                  <input name="tax_rate" type="number" min="0" max="100" value={form.tax_rate} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <input name="notes" value={form.notes} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Thank you for your business!" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Items</h4>
                  <button type="button" onClick={addItem}
                    className="text-sm text-indigo-600 hover:underline">+ Add Item</button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-5">
                        {index === 0 && <label className="text-xs text-gray-500 mb-1 block">Description</label>}
                        <input name="description" value={item.description}
                          onChange={(e) => handleItemChange(index, e)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Item description" />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && <label className="text-xs text-gray-500 mb-1 block">Qty</label>}
                        <input name="quantity" type="number" min="1" value={item.quantity}
                          onChange={(e) => handleItemChange(index, e)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="col-span-3">
                        {index === 0 && <label className="text-xs text-gray-500 mb-1 block">Unit Price</label>}
                        <input name="unit_price" type="number" min="0" value={item.unit_price}
                          onChange={(e) => handleItemChange(index, e)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="0" />
                      </div>
                      <div className="col-span-1">
                        {index === 0 && <label className="text-xs text-gray-500 mb-1 block">Total</label>}
                        <p className="text-sm font-medium text-gray-700 py-2">
                          {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-1">
                        <button type="button" onClick={() => removeItem(index)}
                          className="text-red-400 hover:text-red-600 text-lg font-bold py-1">x</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 text-right space-y-1">
                  <p className="text-sm text-gray-500">
                    Subtotal: <span className="font-medium text-gray-700">
                      {user?.currency} {calcSubtotal().toLocaleString()}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Tax ({form.tax_rate}%): <span className="font-medium text-gray-700">
                      {user?.currency} {calcTax().toLocaleString()}
                    </span>
                  </p>
                  <p className="text-base font-bold text-indigo-600">
                    Total: {user?.currency} {calcTotal().toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition">
                  {editingReceipt ? 'Update Receipt' : 'Save Receipt'}
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
          {receipts.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No receipts yet. Click "+ New Receipt" to create one.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Receipt #</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Customer</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Total</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt, index) => (
                  <tr key={receipt.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 font-medium text-indigo-600">{receipt.receipt_number}</td>
                    <td className="px-6 py-4 text-gray-800">{receipt.customer_name}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {user?.currency} {Number(receipt.total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{receipt.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => handleEdit(receipt)}
                          className="text-indigo-600 hover:underline text-sm">Edit</button>
                        <button onClick={() => downloadPDF(receipt)}
                          className="text-green-600 hover:underline text-sm">PDF</button>
                        <button onClick={() => handleDelete(receipt.id)}
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