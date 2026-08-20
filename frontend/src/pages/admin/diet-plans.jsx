import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';

function AdminDietPlans() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    memberId: '',
    title: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  async function loadMembers() {
    try {
      const { data } = await api.get('/users', { params: { role: 'member', limit: 100 } });
      setMembers(data.data || []);
    } catch (err) {
      setError('Failed to load members.');
    }
  }

  async function loadPlans() {
    try {
      const { data } = await api.get('/diet-plans');
      setPlans(data.data || []);
    } catch (err) {
      setError('Failed to load diet plans.');
    }
  }

  useEffect(() => {
    loadMembers();
    loadPlans();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('');

    try {
      const { data } = await api.post('/diet-plans', {
        memberId: Number(form.memberId),
        title: form.title,
        notes: form.notes || null,
        calories: form.calories ? Number(form.calories) : null,
        protein: form.protein ? Number(form.protein) : null,
        carbs: form.carbs ? Number(form.carbs) : null,
        fats: form.fats ? Number(form.fats) : null,
      });

      setPlans((prev) => [data, ...prev]);
      setStatus('Diet plan saved successfully.');
      setForm({ memberId: '', title: '', calories: '', protein: '', carbs: '', fats: '', notes: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save diet plan.');
    }
  }

  return (
    <DashboardShell title="Diet plans" subtitle="Create custom nutrition plans for members across the gym">
      <div className="space-y-6">
        {error && <p className="rounded-2xl border border-red-800 bg-red-950/70 px-4 py-3 text-sm text-red-200">{error}</p>}
        {status && <p className="rounded-2xl border border-emerald-800 bg-emerald-950/70 px-4 py-3 text-sm text-emerald-200">{status}</p>}

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-white">Create custom diet plan</h2>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-300">Member</span>
              <select
                value={form.memberId}
                onChange={(e) => setForm((prev) => ({ ...prev, memberId: e.target.value }))}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
              >
                <option value="">Select a member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name} ({member.email})
                  </option>
                ))}
              </select>
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-300">Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                placeholder="Lean bulk plan"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Calories</span>
              <input
                type="number"
                value={form.calories}
                onChange={(e) => setForm((prev) => ({ ...prev, calories: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                placeholder="2200"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Protein</span>
              <input
                type="number"
                value={form.protein}
                onChange={(e) => setForm((prev) => ({ ...prev, protein: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                placeholder="150"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Carbs</span>
              <input
                type="number"
                value={form.carbs}
                onChange={(e) => setForm((prev) => ({ ...prev, carbs: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                placeholder="200"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Fats</span>
              <input
                type="number"
                value={form.fats}
                onChange={(e) => setForm((prev) => ({ ...prev, fats: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                placeholder="60"
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-300">Notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                placeholder="Add meal timing instructions or custom targets"
              />
            </label>

            <button type="submit" className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 lg:col-span-2">
              Save custom diet plan
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-white">Recent custom plans</h2>
          {plans.length === 0 ? (
            <p className="mt-4 text-slate-400">No diet plans created yet.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-semibold text-white">{plan.title}</h3>
                    <span className="text-sm text-slate-400">Member {plan.member_id}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{plan.notes || 'No additional notes.'}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300">
                    <div>Calories: {plan.calories ?? '—'}</div>
                    <div>Protein: {plan.protein ?? '—'}</div>
                    <div>Carbs: {plan.carbs ?? '—'}</div>
                    <div>Fats: {plan.fats ?? '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

export default function AdminDietPlansPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDietPlans />
    </ProtectedRoute>
  );
}
