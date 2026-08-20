import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';
import {
  UserPlusIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const blank = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  specialization: '',
  experienceYears: '',
  maxMembers: '20',
  availabilityNote: '',
  personalTrainingCost: '',
};

function TrainersAdminPage() {
  const [trainers, setTrainers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () =>
    Promise.all([api.get('/trainers'), api.get('/trainer-requests')])
      .then(([t, r]) => {
        setTrainers(t.data.data || []);
        setRequests(r.data.data || []);
      })
      .catch(() => setError('Unable to load trainer management data.'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  async function createTrainer(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      const { data } = await api.post('/users', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || null,
        role: 'trainer',
      });
      await api.put(`/trainers/${data.id}/profile`, {
        specialization: form.specialization || null,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
        maxMembers: Number(form.maxMembers),
        availabilityNote: form.availabilityNote || null,
        personalTrainingCost: form.personalTrainingCost ? Number(form.personalTrainingCost) : null,
      });
      setForm(blank);
      setNotice('Trainer created and ready to receive requests.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create trainer.');
    }
  }

  async function approve(id) {
    setError('');
    setNotice('');
    try {
      await api.patch(`/trainer-requests/${id}/approve`);
      setNotice('Trainer request approved and assignment created.');
      load();
    } catch (err) {
      console.error('Approval error:', err);
      setError(err.response?.data?.error || 'Unable to approve request. Check the backend logs.');
    }
  }

  return (
    <DashboardShell
      title="Trainer management"
      subtitle="Create trainers, review capacity, and approve member requests."
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

        {/* Create trainer form */}
        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2">
            <UserPlusIcon className="h-5 w-5 text-emerald-400/60" />
            <h2 className="text-base font-light tracking-tight text-white/90">Create trainer</h2>
          </div>
          <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={createTrainer}>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Full name</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="trainer@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="+92 300 1234567"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Specialization</label>
              <input
                value={form.specialization}
                onChange={(e) => update('specialization', e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="e.g. Strength & Conditioning"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Experience (years)</label>
              <input
                type="number"
                min="0"
                required
                value={form.experienceYears}
                onChange={(e) => update('experienceYears', e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Member capacity</label>
              <input
                type="number"
                min="1"
                required
                value={form.maxMembers}
                onChange={(e) => update('maxMembers', e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Personal training cost</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.personalTrainingCost}
                onChange={(e) => update('personalTrainingCost', e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="e.g. 1500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Availability note</label>
              <input
                value={form.availabilityNote}
                onChange={(e) => update('availabilityNote', e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="e.g. Mon-Fri 9-5"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Temporary password</label>
              <input
                type="password"
                minLength="8"
                required
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-emerald-500/90 px-8 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                Create trainer
              </button>
            </div>
          </form>
        </section>

        {/* Pending requests */}
        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-amber-400/60" />
            <h2 className="text-base font-light tracking-tight text-white/90">Pending requests</h2>
          </div>
          {loading ? (
            <p className="mt-4 text-slate-400">Loading…</p>
          ) : requests.filter((r) => r.status === 'pending').length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No pending trainer requests.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {requests
                .filter((r) => r.status === 'pending')
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col gap-3 rounded-lg border border-white/5 bg-[#0c0f12]/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p className="text-sm text-slate-300">
                      <span className="font-light text-white/80">{r.member_name}</span> requested{' '}
                      <span className="font-light text-white/80">{r.trainer_name}</span>
                    </p>
                    <button
                      onClick={() => approve(r.id)}
                      className="rounded-lg bg-emerald-500/90 px-5 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Trainer workload table */}
        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-emerald-400/60" />
            <h2 className="text-base font-light tracking-tight text-white/90">Trainer workload</h2>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm divide-y divide-white/5">
              <thead className="text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Trainer</th>
                  <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Specialization</th>
                  <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Availability</th>
                  <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trainers.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-light text-white/80">{t.full_name}</td>
                    <td className="px-4 py-3 text-slate-400">{t.specialization || 'General fitness'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          t.is_available
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300/70'
                            : 'border-rose-500/20 bg-rose-500/10 text-rose-300/70'
                        }`}
                      >
                        {t.is_available ? (
                          <CheckCircleIcon className="h-3 w-3" />
                        ) : (
                          <XCircleIcon className="h-3 w-3" />
                        )}
                        {t.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {t.assigned_members}/{t.max_members || 20}
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

export default function AdminTrainers() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <TrainersAdminPage />
    </ProtectedRoute>
  );
}