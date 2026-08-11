import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';

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
        {error && <p className="text-red-600">{error}</p>}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          {plans.length === 0 ? (
            <p className="text-slate-500">You do not have any active diet plans yet.</p>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{plan.title}</h3>
                      <p className="text-sm text-slate-600">{plan.notes || 'No notes provided.'}</p>
                    </div>
                    <div className="text-sm text-slate-500">Created {new Date(plan.created_at).toLocaleDateString()}</div>
                  </div>
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

export default function MemberDietPlansPage() {
  return (
    <ProtectedRoute allowedRoles={['member', 'admin']}>
      <MemberDietPlans />
    </ProtectedRoute>
  );
}
