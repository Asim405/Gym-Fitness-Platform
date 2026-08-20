import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';
import {
  PlusCircleIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

function AdminMemberships() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    durationDays: '',
    features: '',
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () =>
    api
      .get('/memberships/plans')
      .then(({ data }) => setPlans(data.data || []))
      .catch(() => setError('Unable to load plans.'));

  useEffect(() => {
    load();
  }, []);

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function create(event) {
    event.preventDefault();
    setError('');
    try {
      await api.post('/memberships/plans', {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        features: form.features
          .split('\n')
          .map((value) => value.trim())
          .filter(Boolean),
      });
      setForm({
        name: '',
        description: '',
        price: '',
        durationDays: '',
        features: '',
      });
      setNotice('Membership plan created.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create membership plan.');
    }
  }

  async function toggle(plan) {
    try {
      await api.put(`/memberships/plans/${plan.id}`, {
        status: plan.status === 'active' ? 'inactive' : 'active',
      });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update plan.');
    }
  }

  return (
    <DashboardShell
      title="Membership management"
      subtitle="Configure the plans members can request."
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
            {notice}
          </div>
        )}

        {/* Create plan form */}
        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2">
            <PlusCircleIcon className="h-5 w-5 text-emerald-400/60" />
            <h2 className="text-base font-light tracking-tight text-white/90">Create plan</h2>
          </div>
          <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={create}>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Plan name</label>
              <input
                required
                placeholder="e.g. Monthly Premium"
                value={form.name}
                onChange={(e) => change('name', e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Price (Rs.)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="1500"
                value={form.price}
                onChange={(e) => change('price', e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Duration (days)</label>
              <input
                required
                type="number"
                min="1"
                placeholder="30"
                value={form.durationDays}
                onChange={(e) => change('durationDays', e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Description</label>
              <textarea
                placeholder="Brief description"
                value={form.description}
                onChange={(e) => change('description', e.target.value)}
                rows={1}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                Features (one per line)
              </label>
              <textarea
                placeholder="Unlimited classes&#10;Free gym access&#10;Discount on supplements"
                value={form.features}
                onChange={(e) => change('features', e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-emerald-500/90 px-8 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                Create membership plan
              </button>
            </div>
          </form>
        </section>

        {/* Plans list */}
        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2">
            <ListBulletIcon className="h-5 w-5 text-emerald-400/60" />
            <h2 className="text-base font-light tracking-tight text-white/90">Plans</h2>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm divide-y divide-white/5">
              <thead className="text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Name</th>
                  <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Price</th>
                  <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Duration</th>
                  <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Status</th>
                  <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-light text-white/80">{plan.name}</td>
                    <td className="px-4 py-3 text-slate-400">
                      <span className="flex items-center gap-1">
                        <CurrencyRupeeIcon className="h-4 w-4 text-slate-500" />
                        {Number(plan.price).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4 text-slate-500" />
                        {plan.duration_days} days
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          plan.status === 'active'
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300/70'
                            : 'border-rose-500/20 bg-rose-500/10 text-rose-300/70'
                        }`}
                      >
                        {plan.status === 'active' ? (
                          <CheckCircleIcon className="h-3 w-3" />
                        ) : (
                          <XCircleIcon className="h-3 w-3" />
                        )}
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggle(plan)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          plan.status === 'active'
                            ? 'border border-rose-500/20 bg-rose-500/10 text-rose-300/70 hover:bg-rose-500/20'
                            : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300/70 hover:bg-emerald-500/20'
                        }`}
                      >
                        {plan.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

export default function AdminMembershipPlans() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminMemberships />
    </ProtectedRoute>
  );
}