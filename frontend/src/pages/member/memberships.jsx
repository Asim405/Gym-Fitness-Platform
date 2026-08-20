import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';
import { CheckCircleIcon, CurrencyRupeeIcon, CalendarIcon } from '@heroicons/react/24/outline';

// Helper component to render features from a JSON string or array
function Features({ value }) {
  const features = Array.isArray(value)
    ? value
    : typeof value === 'string'
    ? (() => {
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      })()
    : [];
  if (!features.length) return null;
  return (
    <ul className="mt-4 space-y-1.5 text-sm text-slate-400">
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-center gap-2">
          <CheckCircleIcon className="h-4 w-4 text-emerald-400/60" />
          {feature}
        </li>
      ))}
    </ul>
  );
}

function Memberships() {
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([api.get('/memberships/plans'), api.get('/memberships')])
      .then(([p, h]) => {
        setPlans(p.data.data || []);
        setHistory(h.data.data || []);
      })
      .catch(() => setError('Unable to load membership details.'));

  useEffect(() => {
    load();
  }, []);

  async function subscribe(id) {
    setError('');
    try {
      await api.post('/memberships/subscribe', { membershipPlanId: id });
      setMessage(
        'Subscription request submitted. It will remain pending until the gym confirms payment.'
      );
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to submit subscription request.');
    }
  }

  return (
    <DashboardShell
      title="My membership"
      subtitle="Compare available plans and request a subscription."
    >
      <div className="space-y-6">
        {message && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Plans grid */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30 transition hover:border-white/10"
            >
              <h2 className="text-xl font-light tracking-tight text-white/90">{plan.name}</h2>
              <p className="mt-3 flex items-center gap-1 text-3xl font-light text-emerald-400/80">
                <CurrencyRupeeIcon className="h-6 w-6" />
                {Number(plan.price).toLocaleString()}
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-400">
                <CalendarIcon className="h-4 w-4" />
                {plan.duration_days} days
              </p>
              <p className="mt-4 text-sm text-slate-400">{plan.description}</p>
              <Features value={plan.features} />
              <button
                onClick={() => subscribe(plan.id)}
                className="mt-6 w-full rounded-lg bg-emerald-500/90 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                Request subscription
              </button>
            </article>
          ))}
        </div>

        {/* History section */}
        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <h2 className="text-base font-light tracking-tight text-white/90">Membership history</h2>
          {history.length ? (
            <ul className="mt-4 divide-y divide-white/5">
              {history.map((item) => (
                <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-light text-white/80">{item.plan_name}</span>
                  <span className="flex items-center gap-2 text-sm">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        item.status === 'active'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300/70'
                          : item.status === 'pending'
                          ? 'border-amber-500/20 bg-amber-500/10 text-amber-300/70'
                          : 'border-rose-500/20 bg-rose-500/10 text-rose-300/70'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-slate-400">
                      ends {new Date(item.end_date).toLocaleDateString()}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No membership history yet.</p>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

export default function MemberMemberships() {
  return (
    <ProtectedRoute allowedRoles={['member']}>
      <Memberships />
    </ProtectedRoute>
  );
}