import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import api from '../../lib/api';

const STATUS_ACCENT = { active: 'emerald', pending: 'amber', expired: 'rose', cancelled: 'rose' };

function MemberDashboardContent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [progressForm, setProgressForm] = useState({ weightKg: '', bodyFatPct: '', goalNote: '' });
  const [busy, setBusy] = useState(false);

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

  async function handleLogProgress(e) {
    e.preventDefault();
    setFeedback('');
    setError('');
    setBusy(true);

    try {
      await api.post('/progress', {
        weightKg: Number(progressForm.weightKg),
        bodyFatPct: progressForm.bodyFatPct ? Number(progressForm.bodyFatPct) : null,
        goalNote: progressForm.goalNote || null,
        recordedAt: new Date().toISOString().slice(0, 10),
      });
      const { data: refreshed } = await api.get('/dashboard/member');
      setData(refreshed);
      setFeedback('Progress logged successfully.');
      setProgressForm({ weightKg: '', bodyFatPct: '', goalNote: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not log progress.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell title="My dashboard" subtitle="Your membership, workouts, classes, and progress">
      {error && <p className="rounded-3xl border border-red-700 bg-red-950/80 px-4 py-3 text-sm text-red-200">{error}</p>}
      {feedback && <p className="rounded-3xl border border-emerald-700 bg-emerald-950/80 px-4 py-3 text-sm text-emerald-200">{feedback}</p>}

      {!data ? (
        <p className="text-slate-400">Loading dashboard…</p>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-xl shadow-slate-950/40">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                    data.membership?.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : data.membership?.status === 'pending'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-rose-500/15 text-rose-300'
                  }`}
                  >
                    {data.membership?.status || 'No membership'}
                  </span>
                  <h2 className="mt-4 text-3xl font-semibold text-white">{data.membership?.plan_name || 'Find your plan'}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {data.membership
                      ? `Valid through ${new Date(data.membership.end_date).toLocaleDateString()}`
                      : 'Join a membership to unlock workouts, classes and premium support.'}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 px-5 py-4 text-center text-sm font-semibold text-white">
                  <div className="text-sm text-slate-400">Workout plans</div>
                  <div className="mt-2 text-3xl text-emerald-300">{data.workoutPlans.length}</div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-950/80 p-5">
                  <div className="text-sm text-slate-400">Upcoming classes</div>
                  <div className="mt-3 text-3xl font-semibold text-white">{data.upcomingClasses.length}</div>
                </div>
                <div className="rounded-3xl bg-slate-950/80 p-5">
                  <div className="text-sm text-slate-400">Progress entries</div>
                  <div className="mt-3 text-3xl font-semibold text-white">{chartData.length}</div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <h3 className="text-sm uppercase tracking-[0.25em] text-slate-500">Next classes</h3>
                {data.upcomingClasses.length === 0 ? (
                  <p className="text-sm text-slate-400">No classes scheduled in your plan yet.</p>
                ) : (
                  <div className="grid gap-3">
                    {data.upcomingClasses.slice(0, 4).map((cls) => (
                      <div key={cls.id} className="rounded-3xl bg-slate-950/80 p-4 border border-slate-800">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-white">{cls.title}</p>
                            <p className="text-xs text-slate-500">{new Date(cls.start_time).toLocaleString()}</p>
                          </div>
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">{cls.booked_count}/{cls.capacity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-xl shadow-slate-950/40">
                <h3 className="text-xl font-semibold text-white">Quick actions</h3>
                <div className="mt-5 grid gap-3">
                  <Link href="/member/classes" className="rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-4 text-sm font-semibold text-white transition hover:border-emerald-500 hover:text-emerald-300">
                    Browse classes
                  </Link>
                  <Link href="/member/diet-plans" className="rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-4 text-sm font-semibold text-white transition hover:border-sky-500 hover:text-sky-300">
                    View diet plans
                  </Link>
                  <Link href="/member/invoices" className="rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-4 text-sm font-semibold text-white transition hover:border-amber-500 hover:text-amber-300">
                    Check invoices
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-xl shadow-slate-950/40">
                <h3 className="text-xl font-semibold text-white">Your plan at a glance</h3>
                <div className="mt-5 grid gap-3 rounded-3xl bg-slate-950/80 p-5 text-sm text-slate-300">
                  <div className="flex justify-between gap-4">
                    <span>Membership</span>
                    <span>{data.membership?.plan_name || 'None'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Status</span>
                    <span className={data.membership?.status === 'active' ? 'text-emerald-300' : 'text-amber-300'}>{data.membership?.status || 'no plan'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Renewal</span>
                    <span>{data.membership ? new Date(data.membership.end_date).toLocaleDateString() : 'TBD'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-xl shadow-slate-950/40">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Weight progress</h3>
                <span className="text-sm text-slate-400">Tracked over time</span>
              </div>
              {chartData.length === 0 ? (
                <div className="mt-8 rounded-3xl bg-slate-950/80 p-8 text-center text-slate-400">
                  No progress entries yet. Log a new metric to begin tracking weight and BMI.
                </div>
              ) : (
                <div className="mt-6 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                      <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-xl shadow-slate-950/40">
              <h3 className="text-xl font-semibold text-white">Log progress</h3>
              <p className="mt-2 text-sm text-slate-400">Record your metrics after every workout session to stay on track.</p>

              <form onSubmit={handleLogProgress} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={progressForm.weightKg}
                    onChange={(e) => setProgressForm((prev) => ({ ...prev, weightKg: e.target.value }))}
                    className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Body fat (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={progressForm.bodyFatPct}
                    onChange={(e) => setProgressForm((prev) => ({ ...prev, bodyFatPct: e.target.value }))}
                    className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Goal note</label>
                  <textarea
                    value={progressForm.goalNote}
                    onChange={(e) => setProgressForm((prev) => ({ ...prev, goalNote: e.target.value }))}
                    rows={4}
                    className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Today I want to improve my squat form..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busy ? 'Saving…' : 'Save progress entry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function MemberDashboard() {
  return (
    <ProtectedRoute allowedRoles={['member', 'admin']}>
      <MemberDashboardContent />
    </ProtectedRoute>
  );
}
