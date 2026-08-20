import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';
import { ClipboardDocumentListIcon, CalendarIcon, FireIcon, BeakerIcon, CubeIcon, SparklesIcon } from '@heroicons/react/24/outline';

function MemberDietPlans() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/diet-plans')
      .then((res) => setPlans(res.data.data || []))
      .catch(() => setError('Could not load your diet plans.'));
  }, []);

  return (
    <DashboardShell title="My diet plans" subtitle="Personalized nutrition plans assigned to you">
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-5 w-5 text-emerald-400/60" />
            <h2 className="text-base font-light tracking-tight text-white/90">Your diet plans</h2>
          </div>

          {plans.length === 0 ? (
            <div className="mt-6 rounded-lg border border-white/5 bg-[#0c0f12]/50 p-8 text-center">
              <div className="flex justify-center">
                <svg className="h-12 w-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mt-3 text-sm text-slate-400">You do not have any active diet plans yet.</p>
              <p className="text-xs text-slate-500">Speak to your trainer to get a personalized plan.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl border border-white/5 bg-[#0c0f12]/50 p-5 transition hover:border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-light tracking-tight text-white/90">{plan.title}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-white/5 px-2.5 py-0.5 text-xs text-slate-400">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {new Date(plan.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{plan.notes || 'No notes provided.'}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-300/70">
                      <FireIcon className="mr-1 inline h-3 w-3" />
                      {plan.calories ?? '—'} cal
                    </span>
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-blue-300/70">
                      <BeakerIcon className="mr-1 inline h-3 w-3" />
                      {plan.protein ?? '—'}g protein
                    </span>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300/70">
                      <CubeIcon className="mr-1 inline h-3 w-3" />
                      {plan.carbs ?? '—'}g carbs
                    </span>
                    <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-rose-300/70">
                      <SparklesIcon className="mr-1 inline h-3 w-3" />
                      {plan.fats ?? '—'}g fats
                    </span>
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

export default function MemberDietPlansPage() {
  return (
    <ProtectedRoute allowedRoles={['member', 'admin']}>
      <MemberDietPlans />
    </ProtectedRoute>
  );
}