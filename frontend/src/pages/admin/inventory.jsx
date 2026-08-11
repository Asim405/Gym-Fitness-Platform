import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';

function AdminInventory() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', category: '', quantity: 0, status: 'available', notes: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    api
      .get('/inventory')
      .then((res) => setItems(res.data.data || []))
      .catch(() => setError('Unable to load inventory.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('');

    try {
      const { data } = await api.post('/inventory', {
        name: form.name,
        category: form.category || null,
        quantity: Number(form.quantity),
        status: form.status,
        notes: form.notes || null,
      });
      setItems((prev) => [data, ...prev]);
      setStatus('Inventory item created successfully.');
      setForm({ name: '', category: '', quantity: 0, status: 'available', notes: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create inventory item.');
    }
  }

  return (
    <DashboardShell title="Inventory" subtitle="Manage gym equipment and merchandise stock">
      <div className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}
        {status && <p className="text-emerald-600">{status}</p>}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Add inventory item</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <input
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Quantity</span>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                rows={3}
              />
            </label>
            <button className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500" type="submit">
              Add item
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Inventory items</h2>
          {loading ? (
            <p className="text-slate-500">Loading inventory…</p>
          ) : items.length === 0 ? (
            <p className="text-slate-500">No inventory items yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="odd:bg-white even:bg-slate-50">
                      <td className="px-4 py-3 text-slate-800">{item.name}</td>
                      <td className="px-4 py-3 text-slate-600">{item.category || '—'}</td>
                      <td className="px-4 py-3 text-slate-800">{item.quantity}</td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{item.status.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-slate-600">{item.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

export default function AdminInventoryPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminInventory />
    </ProtectedRoute>
  );
}
