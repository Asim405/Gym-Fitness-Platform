import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';
import {
  UserIcon,
  BriefcaseIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

function TrainersPage() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api
      .get('/trainers')
      .then(({ data }) => setTrainers(data.data || []))
      .catch(() => setError('Unable to load trainers.'))
      .finally(() => setLoading(false));
  }, []);

  async function requestTrainer(trainerId) {
    setBusyId(trainerId);
    setError('');
    setMessage('');
    try {
      await api.post('/trainer-requests', { trainerId });
      setMessage('Your trainer request was submitted for review.');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to submit request.');
    } finally {
      setBusyId(null);
    }
  }

  const getStatusDetails = (trainer) => {
    const capacity = Number(trainer.max_members || 20);
    const assigned = Number(trainer.assigned_members || 0);
    const acceptingAssignments =
      trainer.is_available === true ||
      trainer.is_available === 1 ||
      trainer.is_available === '1';
    const active =
      trainer.is_active === true ||
      trainer.is_active === 1 ||
      trainer.is_active === '1';
    const fullyBooked = assigned >= capacity;
    const available = active && acceptingAssignments && !fullyBooked;
    let statusLabel, statusColor, icon;
    if (fullyBooked) {
      statusLabel = 'Fully booked';
      statusColor = 'border-amber-500/20 bg-amber-500/10 text-amber-300/70';
      icon = XCircleIcon;
    } else if (!acceptingAssignments) {
      statusLabel = 'Not accepting';
      statusColor = 'border-slate-500/20 bg-slate-500/10 text-slate-400/70';
      icon = XCircleIcon;
    } else {
      statusLabel = 'Available';
      statusColor = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300/70';
      icon = CheckCircleIcon;
    }
    return { available, statusLabel, statusColor, StatusIcon: icon };
  };

  return (
    <DashboardShell
      title="Find a trainer"
      subtitle="Request a trainer; assignments are reviewed before they become active."
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

        {loading ? (
          <p className="text-slate-400">Loading trainers…</p>
        ) : trainers.length === 0 ? (
          <div className="rounded-lg border border-white/5 bg-[#0c0f12]/50 p-6 text-center text-slate-400">
            No trainers are currently available.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trainers.map((trainer) => {
              const { available, statusLabel, statusColor, StatusIcon } =
                getStatusDetails(trainer);
              return (
                <article
                  key={trainer.id}
                  className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30 transition hover:border-white/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-emerald-400/60" />
                        <h2 className="text-lg font-light tracking-tight text-white/90">
                          {trainer.full_name}
                        </h2>
                      </div>
                      <p className="mt-1 text-sm text-emerald-400/60">
                        {trainer.specialization || 'General fitness'}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border ${statusColor} px-2.5 py-0.5 text-xs font-medium`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusLabel}
                    </span>
                  </div>

                  <p className="mt-4 min-h-12 text-sm leading-6 text-slate-300">
                    {trainer.bio ||
                      'Professional coaching tailored to your training goals.'}
                  </p>

                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="flex items-center gap-1 text-slate-400">
                        <BriefcaseIcon className="h-4 w-4" />
                        Experience
                      </dt>
                      <dd className="mt-1 font-light text-white/80">
                        {trainer.experience_years ?? '—'} yrs
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1 text-slate-400">
                        <UserGroupIcon className="h-4 w-4" />
                        Workload
                      </dt>
                      <dd className="mt-1 font-light text-white/80">
                        {Number(trainer.assigned_members || 0)}/
                        {Number(trainer.max_members || 20)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="flex items-center gap-1 text-slate-400">
                        <CalendarIcon className="h-4 w-4" />
                        Availability
                      </dt>
                      <dd className="mt-1 font-light text-white/80">
                        {trainer.availability_note ||
                          'Contact the gym for session times'}
                      </dd>
                    </div>
                  </dl>

                  <button
                    disabled={!available || busyId === trainer.id}
                    onClick={() => requestTrainer(trainer.id)}
                    className="mt-6 w-full rounded-lg bg-emerald-500/90 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                  >
                    {busyId === trainer.id
                      ? 'Requesting…'
                      : available
                      ? 'Request trainer'
                      : statusLabel}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default function MemberTrainers() {
  return (
    <ProtectedRoute allowedRoles={['member']}>
      <TrainersPage />
    </ProtectedRoute>
  );
}