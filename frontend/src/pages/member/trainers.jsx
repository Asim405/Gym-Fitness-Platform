import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';

function TrainersPage() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api.get('/trainers').then(({ data }) => setTrainers(data.data || [])).catch(() => setError('Unable to load trainers.')).finally(() => setLoading(false));
  }, []);

  async function requestTrainer(trainerId) {
    setBusyId(trainerId); setError(''); setMessage('');
    try {
      await api.post('/trainer-requests', { trainerId });
      setMessage('Your trainer request was submitted for review.');
    } catch (err) { setError(err.response?.data?.error || 'Unable to submit request.'); }
    finally { setBusyId(null); }
  }

  return <DashboardShell title="Find a trainer" subtitle="Request a trainer; assignments are reviewed before they become active.">
    <div className="space-y-6">
      {message && <p className="rounded-3xl border border-emerald-700 bg-emerald-950/80 px-4 py-3 text-sm text-emerald-200">{message}</p>}
      {error && <p className="rounded-3xl border border-red-700 bg-red-950/80 px-4 py-3 text-sm text-red-200">{error}</p>}
      {loading ? <p className="text-slate-400">Loading trainers…</p> : trainers.length === 0 ? <div className="rounded-3xl bg-slate-900 p-6 text-slate-400">No trainers are currently available.</div> :
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{trainers.map((trainer) => {
          const capacity = Number(trainer.max_members || 20); const assigned = Number(trainer.assigned_members || 0); const available = trainer.is_available && assigned < capacity;
          return <article key={trainer.id} className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-xl shadow-slate-950/30">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-white">{trainer.full_name}</h2><p className="mt-1 text-sm text-emerald-300">{trainer.specialization || 'General fitness'}</p></div><span className={`rounded-full px-3 py-1 text-xs ${available ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>{available ? 'Available' : 'At capacity'}</span></div>
            <p className="mt-5 min-h-12 text-sm leading-6 text-slate-400">{trainer.bio || 'Professional coaching tailored to your training goals.'}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Experience</dt><dd className="mt-1 text-white">{trainer.experience_years ?? '—'} yrs</dd></div><div><dt className="text-slate-500">Workload</dt><dd className="mt-1 text-white">{assigned}/{capacity}</dd></div><div className="col-span-2"><dt className="text-slate-500">Availability</dt><dd className="mt-1 text-white">{trainer.availability_note || 'Contact the gym for session times'}</dd></div></dl>
            <button disabled={!available || busyId === trainer.id} onClick={() => requestTrainer(trainer.id)} className="mt-6 w-full rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">{busyId === trainer.id ? 'Requesting…' : available ? 'Request trainer' : 'Unavailable'}</button>
          </article>;
        })}</div>}
    </div>
  </DashboardShell>;
}

export default function MemberTrainers() { return <ProtectedRoute allowedRoles={['member']}><TrainersPage /></ProtectedRoute>; }
