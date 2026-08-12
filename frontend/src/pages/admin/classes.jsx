import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';

function AdminClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/classes')
      .then((res) => setClasses(res.data.data || []))
      .catch(() => setError('Could not load classes.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell title="Class management" subtitle="View all scheduled sessions across the gym.">
      <div className="space-y-6">
        {error && <div className="rounded-3xl border border-red-700 bg-red-950/80 px-4 py-3 text-sm text-red-200">{error}</div>}

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-xl shadow-slate-950/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">All class schedules</h2>
              <p className="mt-1 text-sm text-slate-400">Monitor what classes are happening and how many members are signed up.</p>
            </div>
            <span className="inline-flex rounded-full bg-slate-800 px-3 py-2 text-xs uppercase tracking-[0.25em] text-slate-400">
              {loading ? 'Loading…' : `${classes.length} classes`}
            </span>
          </div>

          {loading ? (
            <div className="mt-8 text-slate-400">Loading class listings…</div>
          ) : classes.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-slate-950/80 p-6 text-slate-400">No classes found yet.</div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Trainer</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">Booked</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {classes.map((cls) => (
                    <tr key={cls.id} className="odd:bg-slate-950 even:bg-slate-900">
                      <td className="px-4 py-4 font-medium text-slate-100">{cls.title}</td>
                      <td className="px-4 py-4 text-slate-400">{cls.trainer_name || 'TBD'}</td>
                      <td className="px-4 py-4 text-slate-400">{new Date(cls.start_time).toLocaleString()}</td>
                      <td className="px-4 py-4 text-slate-400">{cls.booked_count}</td>
                      <td className="px-4 py-4 text-slate-400">{cls.capacity || '—'}</td>
                      <td className="px-4 py-4 text-slate-400">{cls.location || 'Gym floor'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

export default function AdminClasses() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminClassesPage />
    </ProtectedRoute>
  );
}
