import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';
import {
  PlusCircleIcon,
  CubeIcon,
  TagIcon,
  UserIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

function AdminInventory() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: '',
    category: '',
    quantity: 0,
    minimumStock: 0,
    supplier: '',
    status: 'available',
    notes: '',
  });
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
        minimumStock: Number(form.minimumStock),
        supplier: form.supplier || null,
        status: form.status,
        notes: form.notes || null,
      });
      setItems((prev) => [data, ...prev]);
      setStatus('Inventory item created successfully.');
      setForm({
        name: '',
        category: '',
        quantity: 0,
        minimumStock: 0,
        supplier: '',
        status: 'available',
        notes: '',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create inventory item.');
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      available: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-300/70', icon: CheckCircleIcon },
      maintenance: { border: 'border-amber-500/20', bg: 'bg-amber-500/10', text: 'text-amber-300/70', icon: WrenchScrewdriverIcon },
      out_of_stock: { border: 'border-rose-500/20', bg: 'bg-rose-500/10', text: 'text-rose-300/70', icon: ExclamationTriangleIcon },
    };
    const { border, bg, text, icon: Icon } = config[status] || config.available;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border ${border} ${bg} px-2.5 py-0.5 text-xs font-medium ${text}`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <DashboardShell title="Inventory" subtitle="Manage gym equipment and merchandise stock">
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        {status && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
            {status}
          </div>
        )}

        {/* Add form */}
        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2">
            <PlusCircleIcon className="h-5 w-5 text-emerald-400/60" />
            <h2 className="text-base font-light tracking-tight text-white/90">Add inventory item</h2>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="e.g. Dumbbell set"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="e.g. Weights"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Supplier</label>
              <input
                value={form.supplier}
                onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="Supplier name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Quantity</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Minimum stock</label>
              <input
                type="number"
                min="0"
                value={form.minimumStock}
                onChange={(e) => setForm((prev) => ({ ...prev, minimumStock: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="Additional details"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-emerald-500/90 px-8 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                Add item
              </button>
            </div>
          </form>
        </section>

        {/* Inventory list */}
        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2">
            <CubeIcon className="h-5 w-5 text-emerald-400/60" />
            <h2 className="text-base font-light tracking-tight text-white/90">Inventory items</h2>
          </div>
          {loading ? (
            <p className="mt-4 text-slate-400">Loading inventory…</p>
          ) : items.length === 0 ? (
            <p className="mt-4 text-slate-400">No inventory items yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm divide-y divide-white/5">
                <thead className="text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Name</th>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Category</th>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Qty</th>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Threshold</th>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Status</th>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((item) => {
                    const isLowStock = Number(item.quantity) <= Number(item.minimum_stock);
                    return (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-light text-white/80">{item.name}</td>
                        <td className="px-4 py-3 text-slate-400">{item.category || '—'}</td>
                        <td className={`px-4 py-3 font-light ${isLowStock ? 'text-rose-300' : 'text-white/80'}`}>
                          {item.quantity}
                          {isLowStock && (
                            <ExclamationTriangleIcon className="ml-1 inline h-4 w-4 text-rose-400/70" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{item.minimum_stock ?? 0}</td>
                        <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                        <td className="px-4 py-3 text-slate-400">{item.notes || '—'}</td>
                      </tr>
                    );
                  })}
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