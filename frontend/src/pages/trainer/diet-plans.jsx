import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';
import { CalendarIcon, UserIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

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
      <div className="space-y-8">
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

        {/* Create Form */}
        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <h2 className="flex items-center gap-2 text-base font-light tracking-tight text-white/90">
            <ClipboardDocumentListIcon className="h-5 w-5 text-emerald-400/60" />
            Create diet plan
          </h2>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="e.g. High‑protein meal plan"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Member ID</label>
              <input
                type="number"
                value={form.memberId}
                onChange={(e) => setForm((prev) => ({ ...prev, memberId: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="Enter member ID"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Calories</label>
              <input
                type="number"
                value={form.calories}
                onChange={(e) => setForm((prev) => ({ ...prev, calories: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="e.g. 2000"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Protein (g)</label>
              <input
                type="number"
                value={form.protein}
                onChange={(e) => setForm((prev) => ({ ...prev, protein: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="e.g. 150"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Carbs (g)</label>
              <input
                type="number"
                value={form.carbs}
                onChange={(e) => setForm((prev) => ({ ...prev, carbs: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="e.g. 250"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Fats (g)</label>
              <input
                type="number"
                value={form.fats}
                onChange={(e) => setForm((prev) => ({ ...prev, fats: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="e.g. 70"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="Additional instructions, meal timing, etc."
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-emerald-500/90 px-8 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                Save diet plan
              </button>
            </div>
          </form>
        </section>

        {/* Recent Plans List */}
        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <h2 className="flex items-center gap-2 text-base font-light tracking-tight text-white/90">
            <CalendarIcon className="h-5 w-5 text-emerald-400/60" />
            Recent diet plans
          </h2>
          {plans.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No diet plans created yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl border border-white/5 bg-[#0c0f12]/50 p-5 transition hover:border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-light tracking-tight text-white/90">{plan.title}</h3>
                    <span className="flex items-center gap-1 rounded-full border border-white/5 bg-white/5 px-2.5 py-0.5 text-xs text-slate-400">
                      <UserIcon className="h-3.5 w-3.5" />
                      {plan.member_id}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{plan.notes || 'No additional notes.'}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-300/70">🔥 {plan.calories ?? '—'}</span>
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-blue-300/70">💪 {plan.protein ?? '—'}g</span>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300/70">🍞 {plan.carbs ?? '—'}g</span>
                    <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-rose-300/70">🥑 {plan.fats ?? '—'}g</span>
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