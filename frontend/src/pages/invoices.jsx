import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from '../api/invoices';
import { getProfile } from '../api/auth';
import Toast from '../components/toast';
import useToast from '../hooks/useToast';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
};

const emptyItem = { description: '', quantity: 1, unit_price: '' };

export default function Invoices() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [error, setError] = useState('');
  const { toasts, addToast, removeToast } = useToast();

  const emptyForm = {
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    client_name: '',
    client_email: '',
    client_address: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_rate: 0,
    status: 'draft',
    notes: '',
    items: [{ ...emptyItem }],
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    Promise.all([getProfile(), getInvoices()])
      .then(([userData, invoiceData]) => {
        if (!userData.id) { navigate('/login'); return; }
        setUser(userData);
        setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
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
    if (!form.client_name || !form.issue_date || !form.due_date) {
      setError('Client name, issue date and due date are required');
      return;
    }
    if (form.items.some((item) => !item.description || !item.unit_price)) {
      setError('All items must have a description and unit price');
      return;
    }
    if (editingInvoice) {
      const updated = await updateInvoice(editingInvoice.id, form);
      if (updated.id) {
        setInvoices(invoices.map((inv) => inv.id === updated.id ? updated : inv));
        addToast('Invoice updated successfully', 'success');
        resetForm();
      } else { setError('Failed to update invoice'); }
    } else {
      const created = await createInvoice(form);
      if (created.id) {
        setInvoices([created, ...invoices]);
        addToast('Invoice created successfully', 'success');
        resetForm();
      } else { setError('Failed to create invoice'); }
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setForm({
      invoice_number: invoice.invoice_number,
      client_name: invoice.client_name,
      client_email: invoice.client_email,
      client_address: invoice.client_address,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      tax_rate: invoice.tax_rate,
      status: invoice.status,
      notes: invoice.notes,
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    const success = await deleteInvoice(id);
    if (success) {
      setInvoices(invoices.filter((inv) => inv.id !== id));
      addToast('Invoice deleted', 'error');
    }
  };

  const resetForm = () => {
    setForm({ ...emptyForm, invoice_number: `INV-${Date.now().toString().slice(-6)}` });
    setEditingInvoice(null);
    setShowForm(false);
    setError('');
  };

  const downloadPDF = (invoice) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text('INVOICE', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(user?.business_name || '', 14, 32);
    doc.text(user?.email || '', 14, 38);
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(`Invoice #: ${invoice.invoice_number}`, 140, 22);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 140, 30);
    doc.text(`Issue Date: ${invoice.issue_date}`, 140, 38);
    doc.text(`Due Date: ${invoice.due_date}`, 140, 46);
    doc.text('Bill To:', 14, 55);
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(invoice.client_name, 14, 63);
    if (invoice.client_email) doc.text(invoice.client_email, 14, 70);
    if (invoice.client_address) doc.text(invoice.client_address, 14, 77);
    autoTable(doc, {
      startY: 90,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: invoice.items.map((item) => [
        item.description, item.quantity,
        `${user?.currency} ${Number(item.unit_price).toLocaleString()}`,
        `${user?.currency} ${Number(item.total).toLocaleString()}`,
      ]),
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 10 },
    });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Subtotal: ${user?.currency} ${Number(invoice.subtotal).toLocaleString()}`, 140, finalY);
    doc.text(`Tax (${invoice.tax_rate}%): ${user?.currency} ${Number(invoice.tax_amount).toLocaleString()}`, 140, finalY + 8);
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text(`Total: ${user?.currency} ${Number(invoice.total).toLocaleString()}`, 140, finalY + 18);
    if (invoice.notes) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Notes: ${invoice.notes}`, 14, finalY + 30);
    }
    addToast('PDF downloaded successfully', 'info');
    doc.save(`invoice-${invoice.invoice_number}.pdf`);
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
            className="text-sm font-semibold text-indigo-600">Invoices</button>
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
            <h2 className="text-2xl font-bold text-gray-800">Invoices</h2>
            <p className="text-sm text-gray-500 mt-1">
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            + New Invoice
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <h3 className="text-base font-semibold text-gray-700 mb-4">
              {editingInvoice ? 'Edit Invoice' : 'New Invoice'}
            </h3>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Invoice number</label>
                  <input name="invoice_number" value={form.invoice_number} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Client name</label>
                  <input name="client_name" required value={form.client_name} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Acme Corp" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Client email</label>
                  <input name="client_email" type="email" value={form.client_email} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="client@example.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Client address</label>
                  <input name="client_address" value={form.client_address} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Kampala, Uganda" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Issue date</label>
                  <input name="issue_date" type="date" required value={form.issue_date} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Due date</label>
                  <input name="due_date" type="date" required value={form.due_date} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tax rate (%)</label>
                  <input name="tax_rate" type="number" min="0" max="100" value={form.tax_rate} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select name="status" value={form.status} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <input name="notes" value={form.notes} onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Payment terms, thank you note..." />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Line Items</h4>
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
                  {editingInvoice ? 'Update Invoice' : 'Save Invoice'}
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
          {invoices.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No invoices yet. Click "+ New Invoice" to create one.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Invoice #</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Client</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Total</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Due Date</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <tr key={invoice.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 font-medium text-indigo-600">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 text-gray-800">{invoice.client_name}</td>
                    <td className="px-6 py-4 font-semibold">
                      {user?.currency} {Number(invoice.total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{invoice.due_date}</td>
                    <td className="px-6 py-4 text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[invoice.status]}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => downloadPDF(invoice)}
                          className="text-gray-500 hover:text-indigo-600 text-sm underline">PDF</button>
                        <button onClick={() => handleEdit(invoice)}
                          className="text-indigo-600 hover:underline text-sm">Edit</button>
                        <button onClick={() => handleDelete(invoice.id)}
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