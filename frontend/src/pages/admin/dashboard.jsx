import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import api from '../../lib/api';

const STATUS_COLORS = {
  active: '#10b981',
  pending: '#f59e0b',
  expired: '#ef4444',
  cancelled: '#94a3b8',
};

function AdminDashboardContent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [trainerForm, setTrainerForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [createStatus, setCreateStatus] = useState('');
  const [createError, setCreateError] = useState('');
  const [createBusy, setCreateBusy] = useState(false);

  useEffect(() => {
    api
      .get('/dashboard/admin')
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load dashboard data.'));
  }, []);

  async function handleCreateTrainer(e) {
    e.preventDefault();
    setCreateError('');
    setCreateStatus('');
    setCreateBusy(true);

    try {
      const { data: created } = await api.post('/users', {
        fullName: trainerForm.fullName,
        email: trainerForm.email,
        password: trainerForm.password,
        role: 'trainer',
        phone: trainerForm.phone || null,
      });

      setCreateStatus(`Trainer created: ${created.full_name} (${created.email})`);
      setTrainerForm({ fullName: '', email: '', password: '', phone: '' });
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Could not create trainer.');
    } finally {
      setCreateBusy(false);
    }
  }

  return (
    <DashboardShell title="Admin overview" subtitle="System-wide revenue, membership, and attendance analytics">
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!data ? (
        <p className="text-slate-400">Loading dashboard…</p>
      ) : (
        <div className="space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total members" value={data.totalMembers} accent="emerald" />
            <StatCard label="Total revenue" value={`$${Number(data.totalRevenue).toLocaleString()}`} accent="sky" />
            <StatCard
              label="Active memberships"
              value={data.membershipStatusBreakdown.find((s) => s.status === 'active')?.count || 0}
              accent="amber"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-900">Add a new trainer</h3>
                <p className="text-sm text-slate-500">Create trainer credentials from the admin panel so trainers can log in.</p>
              </div>
              <Link href="/admin/inventory" className="text-sm text-emerald-600 hover:text-emerald-500">Manage inventory</Link>
            </div>

            {createError && (
              <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4">
                {createError}
              </div>
            )}
            {createStatus && (
              <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 mb-4">
                {createStatus}
              </div>
            )}

            <form onSubmit={handleCreateTrainer} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full name</label>
                <input
                  value={trainerForm.fullName}
                  onChange={(e) => setTrainerForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="Trainer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={trainerForm.email}
                  onChange={(e) => setTrainerForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="trainer@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  value={trainerForm.password}
                  onChange={(e) => setTrainerForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={8}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone (optional)</label>
                <input
                  value={trainerForm.phone}
                  onChange={(e) => setTrainerForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="+92 300 0000000"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={createBusy}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {createBusy ? 'Creating trainer…' : 'Create trainer account'}
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly revenue */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Monthly revenue</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Peak hours */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Peak gym check-in hours</h3>
              <ul className="space-y-3">
                {data.peakHours.map((hour) => (
                  <li key={hour.hour} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-700">{`${String(hour.hour).padStart(2, '0')}:00`}</span>
                    <span className="text-sm font-semibold text-slate-900">{hour.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Top trainer allocations</h3>
            <div className="grid gap-3">
              {data.trainerAllocation.map((trainer) => (
                <div key={trainer.trainer_id} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{trainer.trainer_name}</div>
                      <div className="text-sm text-slate-500">{trainer.classes_count} classes · {trainer.workout_plans_count} plans</div>
                    </div>
                    <span className="text-sm font-medium text-slate-700">{trainer.classes_count + trainer.workout_plans_count} items</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Revenue & allocation summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total revenue" value={`$${Number(data.totalRevenue).toLocaleString()}`} accent="sky" />
              <StatCard label="Active members" value={data.activeMembers} accent="emerald" />
              <StatCard label="Expired members" value={data.expiredMembers} accent="rose" />
            </div>
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Quick actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/inventory" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">
                Manage inventory
              </Link>
              <Link href="/member/invoices" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">
                View payments
              </Link>
            </div>
          </div>
          
        </div>
        
      )}
    </DashboardShell>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
