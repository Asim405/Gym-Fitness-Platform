import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';

function MyTrainerPage() {
  const [assignment, setAssignment] = useState(undefined); const [requests, setRequests] = useState([]); const [error, setError] = useState('');
  useEffect(() => { Promise.all([api.get('/trainer-assignments/me'), api.get('/trainer-requests')]).then(([a, r]) => { setAssignment(a.data); setRequests(r.data.data || []); }).catch(() => setError('Unable to load trainer details.')); }, []);
  return <DashboardShell title="My trainer" subtitle="Your approved coaching relationship and request history.">
    {error && <p className="rounded-3xl border border-red-700 bg-red-950/80 px-4 py-3 text-sm text-red-200">{error}</p>}
    {assignment === undefined ? <p className="text-slate-400">Loading trainer details…</p> : <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6">{assignment ? <><p className="text-sm text-emerald-300">Active trainer</p><h2 className="mt-2 text-2xl font-semibold text-white">{assignment.full_name}</h2><p className="mt-2 text-slate-400">{assignment.specialization || 'General fitness'} · {assignment.experience_years ?? '—'} years experience</p><p className="mt-5 text-sm leading-6 text-slate-300">{assignment.bio || 'Your trainer will build plans and help track your progress.'}</p></> : <><h2 className="text-xl font-semibold text-white">You don’t have a trainer assigned yet.</h2><p className="mt-2 text-sm text-slate-400">Browse available trainers and submit a request for approval.</p></>}</section>
      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6"><h2 className="text-lg font-semibold text-white">Request history</h2>{requests.length ? <ul className="mt-4 divide-y divide-slate-800">{requests.map((request) => <li className="flex items-center justify-between py-3 text-sm" key={request.id}><span className="text-slate-200">{request.trainer_name}</span><span className="capitalize text-slate-400">{request.status}</span></li>)}</ul> : <p className="mt-4 text-sm text-slate-400">No trainer requests yet.</p>}</section>
    </div>}
  </DashboardShell>;
}
export default function MemberMyTrainer() { return <ProtectedRoute allowedRoles={['member']}><MyTrainerPage /></ProtectedRoute>; }
