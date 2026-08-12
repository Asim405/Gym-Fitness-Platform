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
    <DashboardShell title="Trainer overview" subtitle="Your members, upcoming classes, and recent workout plans">
      {error && <p className="rounded-3xl border border-red-700 bg-red-950/80 px-4 py-3 text-sm text-red-200">{error}</p>}

      {!data ? (
        <p className="text-slate-400">Loading dashboard…</p>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Assigned members" value={data.assignedMembers.length} accent="emerald" />
            <StatCard label="Upcoming classes" value={data.upcomingClasses.length} accent="sky" />
            <StatCard label="Recent plans" value={data.recentPlans.length} accent="amber" />
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-xl shadow-slate-950/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Quick actions</h2>
                <p className="mt-2 text-sm text-slate-400">Create classes, assign plans, and keep your schedule in sync.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/trainer/classes"
                  className="rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Manage classes
                </Link>
                <Link
                  href="/trainer/diet-plans"
                  className="rounded-3xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
                >
                  Create diet plans
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="Upcoming classes">
              {data.upcomingClasses.length === 0 && <Empty text="No classes scheduled yet." />}
              <ul className="divide-y divide-slate-100">
                {data.upcomingClasses.map((c) => (
                  <li key={c.id} className="py-3 flex justify-between text-sm">
                    <span className="font-medium text-slate-200">{c.title}</span>
                    <span className="text-slate-400">{new Date(c.start_time).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Recently created workout plans">
              {data.recentPlans.length === 0 && <Empty text="No workout plans created yet." />}
              <ul className="divide-y divide-slate-100">
                {data.recentPlans.map((p) => (
                  <li key={p.id} className="py-3 text-sm">
                    <span className="font-medium text-slate-200">{p.title}</span>
                    {p.description && <p className="text-slate-400 mt-0.5">{p.description}</p>}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel title="Assigned members">
            {data.assignedMembers.length === 0 && <Empty text="No members assigned yet." />}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.assignedMembers.map((m) => (
                <li key={m.id} className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm font-medium text-white">
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

function Panel({ title, children }) {
  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-5 shadow-sm">
      <h3 className="font-semibold text-white mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <p className="text-sm text-slate-500 py-4">{text}</p>;
}

export default function TrainerDashboard() {
  return (
    <ProtectedRoute allowedRoles={['trainer', 'admin']}>
      <TrainerDashboardContent />
    </ProtectedRoute>
  );
}
