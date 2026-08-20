import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';
import { UserIcon, BriefcaseIcon, CalendarIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

function MyTrainerPage() {
  const [assignment, setAssignment] = useState(undefined);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/trainer-assignments/me'), api.get('/trainer-requests')])
      .then(([a, r]) => {
        setAssignment(a.data);
        setRequests(r.data.data || []);
      })
      .catch(() => setError('Unable to load trainer details.'));
  }, []);

  const getStatusBadge = (status) => {
    const config = {
      approved: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-300/70', icon: CheckCircleIcon },
      pending: { border: 'border-amber-500/20', bg: 'bg-amber-500/10', text: 'text-amber-300/70', icon: ClockIcon },
      rejected: { border: 'border-rose-500/20', bg: 'bg-rose-500/10', text: 'text-rose-300/70', icon: XCircleIcon },
      cancelled: { border: 'border-slate-500/20', bg: 'bg-slate-500/10', text: 'text-slate-400/70', icon: XCircleIcon },
    };
    const { border, bg, text, icon: Icon } = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border ${border} ${bg} px-2.5 py-0.5 text-xs font-medium ${text}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  return (
    <DashboardShell title="My trainer" subtitle="Your approved coaching relationship and request history.">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {assignment === undefined ? (
        <p className="text-slate-400">Loading trainer details…</p>
      ) : (
        <div className="space-y-6">
          {/* Active trainer card */}
          <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
            {assignment ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 p-2">
                    <UserIcon className="h-6 w-6 text-emerald-400/60" />
                  </div>
                  <div>
                    <p className="text-xs font-light uppercase tracking-wider text-emerald-400/60">Active trainer</p>
                    <h2 className="text-2xl font-light tracking-tight text-white/90">{assignment.full_name}</h2>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <BriefcaseIcon className="h-4 w-4" />
                    {assignment.specialization || 'General fitness'}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    {assignment.experience_years ?? '—'} years experience
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {assignment.bio || 'Your trainer will build plans and help track your progress.'}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-white/5 bg-[#0c0f12]/50 p-2">
                    <UserIcon className="h-6 w-6 text-slate-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-light tracking-tight text-white/90">You don't have a trainer assigned yet.</h2>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  Browse available trainers and submit a request for approval.
                </p>
              </>
            )}
          </section>

          {/* Request history */}
          <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
            <h2 className="text-base font-light tracking-tight text-white/90">Request history</h2>
            {requests.length ? (
              <ul className="mt-4 divide-y divide-white/5">
                {requests.map((request) => (
                  <li key={request.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-light text-white/80">{request.trainer_name}</span>
                    {getStatusBadge(request.status)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-400">No trainer requests yet.</p>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

export default function MemberMyTrainer() {
  return (
    <ProtectedRoute allowedRoles={['member']}>
      <MyTrainerPage />
    </ProtectedRoute>
  );
}