import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import api from '../../lib/api';

function TrainerDashboardContent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/trainer')
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load dashboard data.'));
  }, []);

  return (
    <DashboardShell
      title="Trainer overview"
      subtitle="Your members, upcoming classes, and recent workout plans"
    >
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {!data ? (
        <p className="text-slate-400 text-sm">Loading dashboard…</p>
      ) : (
        <div className="space-y-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Assigned members" value={data.assignedMembers.length} accent="emerald" />
            <StatCard label="Upcoming classes" value={data.upcomingClasses.length} accent="sky" />
            <StatCard label="Recent plans" value={data.recentPlans.length} accent="amber" />
          </div>

          {/* Quick Actions – clean card, no gradient */}
          <div className="rounded-xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-light tracking-tight text-white/90">Quick actions</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Create classes, assign plans, and keep your schedule in sync.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/trainer/classes"
                  className="rounded-lg bg-emerald-500/90 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
                >
                  Manage classes
                </Link>
                <Link
                  href="/trainer/diet-plans"
                  className="rounded-lg bg-sky-500/90 px-5 py-2 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
                >
                  Create diet plans
                </Link>
              </div>
            </div>
          </div>

          {/* Two-column panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="Upcoming classes">
              {data.upcomingClasses.length === 0 && <Empty text="No classes scheduled yet." />}
              <ul className="divide-y divide-white/5">
                {data.upcomingClasses.map((c) => (
                  <li key={c.id} className="py-3 flex justify-between text-sm">
                    <span className="font-light text-white/80">{c.title}</span>
                    <span className="text-slate-400">{new Date(c.start_time).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Recently created workout plans">
              {data.recentPlans.length === 0 && <Empty text="No workout plans created yet." />}
              <ul className="divide-y divide-white/5">
                {data.recentPlans.map((p) => (
                  <li key={p.id} className="py-3 text-sm">
                    <span className="font-light text-white/80">{p.title}</span>
                    {p.description && <p className="text-slate-400 mt-0.5 text-xs">{p.description}</p>}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          {/* Assigned members panel */}
          <Panel title="Assigned members">
            {data.assignedMembers.length === 0 && <Empty text="No members assigned yet." />}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.assignedMembers.map((m) => (
                <li
                  key={m.id}
                  className="rounded-lg border border-white/5 bg-[#0c0f12]/50 px-4 py-2.5 text-sm font-light text-white/80"
                >
                  {m.full_name}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </DashboardShell>
  );
}

// Reusable panel component – dark-themed
function Panel({ title, children }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
      <h3 className="text-base font-light tracking-tight text-white/80 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <p className="text-sm text-slate-400 py-4">{text}</p>;
}

export default function TrainerDashboard() {
  return (
    <ProtectedRoute allowedRoles={['trainer', 'admin']}>
      <TrainerDashboardContent />
    </ProtectedRoute>
  );
}