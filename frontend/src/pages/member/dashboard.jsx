import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import api from '../../lib/api';
import {
  CalendarIcon,
  ChartBarIcon,
  ClipboardDocumentIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

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
        recordedAt: new Date().toISOString(),
      });
      setFeedback('Progress logged successfully. Refresh the page to view updates.');
      setProgressForm({ weightKg: '', bodyFatPct: '', goalNote: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not log progress.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell title="My dashboard" subtitle="Your membership, workouts, classes, and progress">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      {feedback && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
          {feedback}
        </div>
      )}

      {!data ? (
        <p className="text-slate-400">Loading dashboard…</p>
      ) : (
        <div className="space-y-8">
          {/* Main row: membership card + quick actions + plan glance */}
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
            {/* Membership card */}
            <div className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-light uppercase tracking-wider ${
                      data.membership?.status === 'active'
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300/80'
                        : data.membership?.status === 'pending'
                        ? 'border-amber-400/30 bg-amber-500/10 text-amber-300/80'
                        : 'border-rose-400/30 bg-rose-500/10 text-rose-300/80'
                    }`}
                  >
                    {data.membership?.status || 'No membership'}
                  </span>
                  <h2 className="mt-3 text-2xl font-light tracking-tight text-white/90">
                    {data.membership?.plan_name || 'Find your plan'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {data.membership
                      ? `Valid through ${new Date(data.membership.end_date).toLocaleDateString()}`
                      : 'Join a membership to unlock workouts, classes and premium support.'}
                  </p>
                </div>
                <div className="rounded-lg border border-white/5 bg-[#0c0f12]/50 px-4 py-3 text-center">
                  <div className="text-xs uppercase tracking-wider text-slate-500">Workout plans</div>
                  <div className="mt-1 text-2xl font-light text-emerald-400/80">{data.workoutPlans.length}</div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-white/5 bg-[#0c0f12]/50 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                    <CalendarIcon className="h-4 w-4" />
                    Upcoming classes
                  </div>
                  <div className="mt-1 text-2xl font-light text-white/90">{data.upcomingClasses.length}</div>
                </div>
                <div className="rounded-lg border border-white/5 bg-[#0c0f12]/50 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                    <ChartBarIcon className="h-4 w-4" />
                    Progress entries
                  </div>
                  <div className="mt-1 text-2xl font-light text-white/90">{chartData.length}</div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <h3 className="text-xs font-light uppercase tracking-wider text-slate-500">Next classes</h3>
                {data.upcomingClasses.length === 0 ? (
                  <p className="text-sm text-slate-400">No classes scheduled in your plan yet.</p>
                ) : (
                  <div className="grid gap-2">
                    {data.upcomingClasses.slice(0, 4).map((cls) => (
                      <div key={cls.id} className="rounded-lg border border-white/5 bg-[#0c0f12]/50 p-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-light text-white/90">{cls.title}</p>
                            <p className="text-xs text-slate-400">{new Date(cls.start_time).toLocaleString()}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                            <UserGroupIcon className="h-3 w-3" />
                            {cls.booked_count}/{cls.capacity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right column: Quick actions + Plan at a glance */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
                <h3 className="text-base font-light tracking-tight text-white/90">Quick actions</h3>
                <div className="mt-5 grid gap-2">
                  <Link
                    href="/member/classes"
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0c0f12]/50 px-4 py-3 text-sm font-light text-slate-300 transition hover:border-white/10 hover:text-white"
                  >
                    Browse classes
                    <CalendarIcon className="h-5 w-5 text-slate-500" />
                  </Link>
                  <Link
                    href="/member/diet-plans"
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0c0f12]/50 px-4 py-3 text-sm font-light text-slate-300 transition hover:border-white/10 hover:text-white"
                  >
                    View diet plans
                    <ClipboardDocumentIcon className="h-5 w-5 text-slate-500" />
                  </Link>
                  <Link
                    href="/member/invoices"
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0c0f12]/50 px-4 py-3 text-sm font-light text-slate-300 transition hover:border-white/10 hover:text-white"
                  >
                    Check invoices
                    <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
                <h3 className="text-base font-light tracking-tight text-white/90">Your plan at a glance</h3>
                <div className="mt-4 divide-y divide-white/5 rounded-lg border border-white/5 bg-[#0c0f12]/50 p-4 text-sm">
                  <div className="flex justify-between gap-4 py-2">
                    <span className="text-slate-400">Membership</span>
                    <span className="font-light text-white/80">{data.membership?.plan_name || 'None'}</span>
                  </div>
                  <div className="flex justify-between gap-4 py-2">
                    <span className="text-slate-400">Status</span>
                    <span
                      className={`font-light ${
                        data.membership?.status === 'active' ? 'text-emerald-300/80' : 'text-amber-300/80'
                      }`}
                    >
                      {data.membership?.status || 'no plan'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 py-2">
                    <span className="text-slate-400">Renewal</span>
                    <span className="font-light text-white/80">
                      {data.membership ? new Date(data.membership.end_date).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row: Weight progress + Log progress */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Chart */}
            <div className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-light tracking-tight text-white/90">Weight progress</h3>
                <span className="text-xs text-slate-500">Tracked over time</span>
              </div>
              {chartData.length === 0 ? (
                <div className="mt-8 rounded-lg border border-white/5 bg-[#0c0f12]/50 p-8 text-center text-sm text-slate-400">
                  No progress entries yet. Log a new metric to begin tracking weight and BMI.
                </div>
              ) : (
                <div className="mt-6 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#141a1f', borderColor: '#ffffff20', color: '#e2e8f0' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ r: 2, fill: '#22c55e' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Log progress form */}
            <div className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
              <h3 className="text-base font-light tracking-tight text-white/90">Log progress</h3>
              <p className="mt-1 text-sm text-slate-400">
                Record your metrics after every workout session to stay on track.
              </p>

              <form onSubmit={handleLogProgress} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={progressForm.weightKg}
                    onChange={(e) => setProgressForm((prev) => ({ ...prev, weightKg: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                    placeholder="e.g. 75.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Body fat (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={progressForm.bodyFatPct}
                    onChange={(e) => setProgressForm((prev) => ({ ...prev, bodyFatPct: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                    placeholder="e.g. 18.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Goal note</label>
                  <textarea
                    value={progressForm.goalNote}
                    onChange={(e) => setProgressForm((prev) => ({ ...prev, goalNote: e.target.value }))}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                    placeholder="Today I want to improve my squat form..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-emerald-500/90 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-60"
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