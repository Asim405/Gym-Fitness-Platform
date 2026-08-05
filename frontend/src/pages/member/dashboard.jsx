import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import api from '../../lib/api';

const STATUS_ACCENT = { active: 'emerald', pending: 'amber', expired: 'rose', cancelled: 'rose' };

function MemberDashboardContent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/member')
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load dashboard data.'));
  }, []);

  const chartData = (data?.progressHistory || []).map((p) => ({
    date: new Date(p.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: Number(p.weight_kg),
    bmi: Number(p.bmi),
  }));

  return (
    <DashboardShell title="My dashboard" subtitle="Your membership, workouts, classes, and progress">
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!data ? (
        <p className="text-slate-400">Loading dashboard…</p>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Membership status"
              value={data.membership ? data.membership.status : 'None'}
              accent={STATUS_ACCENT[data.membership?.status] || 'sky'}
            />
            <StatCard label="Active workout plans" value={data.workoutPlans.length} accent="sky" />
            <StatCard label="Upcoming classes" value={data.upcomingClasses.length} accent="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Weight progress</h3>
              {chartData.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">
                  No progress logged yet — add an entry below to start tracking.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#059669" strokeWidth={2} name="Weight (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <BmiCalculator />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900 mb-3">My workout plans</h3>
            {data.workoutPlans.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No workout plans assigned yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.workoutPlans.map((p) => (
                  <li key={p.id} className="py-3 text-sm">
                    <span className="font-medium text-slate-800">{p.title}</span>
                    {p.description && <p className="text-slate-500 mt-0.5">{p.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function BmiCalculator() {
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleCalculate(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/progress/bmi', {
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
      });
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900 mb-4">BMI calculator</h3>
      <form onSubmit={handleCalculate} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              required
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Height (cm)</label>
            <input
              type="number"
              step="0.1"
              required
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 transition-colors"
        >
          {busy ? 'Calculating…' : 'Calculate BMI'}
        </button>
      </form>

      {result && (
        <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
          <div className="text-2xl font-semibold text-emerald-700">{result.bmi}</div>
          <div className="text-sm text-emerald-600">{result.category}</div>
        </div>
      )}
    </div>
  );
}

export default function MemberDashboard() {
  return (
    <ProtectedRoute allowedRoles={['member', 'admin']}>
      <MemberDashboardContent />
    </ProtectedRoute>
  );
}
