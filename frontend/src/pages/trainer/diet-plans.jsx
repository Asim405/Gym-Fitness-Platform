import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';

function TrainerDietPlans() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ memberId: '', title: '', calories: '', protein: '', carbs: '', fats: '', notes: '' });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    api
      .get('/diet-plans')
      .then((res) => setPlans(res.data.data || []))
      .catch(() => setError('Failed to load diet plans.'));
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
    <DashboardShell title="Diet plans" subtitle="Create and review diet plans for members">
      <div className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}
        {status && <p className="text-emerald-600">{status}</p>}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Create diet plan</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Member ID</span>
              <input
                type="number"
                value={form.memberId}
                onChange={(e) => setForm((prev) => ({ ...prev, memberId: e.target.value }))}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block lg:col-span-2">
              <span className="text-sm font-medium text-slate-700">Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Calories</span>
              <input
                type="number"
                value={form.calories}
                onChange={(e) => setForm((prev) => ({ ...prev, calories: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Protein</span>
              <input
                type="number"
                value={form.protein}
                onChange={(e) => setForm((prev) => ({ ...prev, protein: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Carbs</span>
              <input
                type="number"
                value={form.carbs}
                onChange={(e) => setForm((prev) => ({ ...prev, carbs: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Fats</span>
              <input
                type="number"
                value={form.fats}
                onChange={(e) => setForm((prev) => ({ ...prev, fats: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block lg:col-span-2">
              <span className="text-sm font-medium text-slate-700">Notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <button className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500" type="submit">
              Save diet plan
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Recent diet plans</h2>
          {plans.length === 0 ? (
            <p className="text-slate-500">No diet plans created yet.</p>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-slate-900">{plan.title}</h3>
                    <span className="text-sm text-slate-500">Member {plan.member_id}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{plan.notes || 'No additional notes.'}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
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

export default function TrainerDietPlansPage() {
  return (
    <ProtectedRoute allowedRoles={['trainer', 'admin']}>
      <TrainerDietPlans />
    </ProtectedRoute>
  );
}
