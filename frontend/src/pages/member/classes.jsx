import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';

function MemberClassesPage() {
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get('/classes'), api.get('/attendance')])
      .then(([classesRes, attendanceRes]) => {
        setClasses(classesRes.data.data || []);
        const bookingMap = {};
        (attendanceRes.data.data || []).forEach((item) => {
          bookingMap[item.class_schedule_id] = item;
        });
        setAttendance(bookingMap);
      })
      .catch(() => setError('Could not load classes or booking status.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleBook(classId) {
    setBusyId(classId);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post('/classes/book', { classScheduleId: classId });
      setAttendance((prev) => ({ ...prev, [classId]: data }));
      setSuccess('Class booked successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not book class.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(attendanceId, classId) {
    setBusyId(attendanceId);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/classes/book/${attendanceId}/cancel`);
      setAttendance((prev) => {
        const copy = { ...prev };
        delete copy[classId];
        return copy;
      });
      setSuccess('Booking canceled.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not cancel booking.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardShell title="Classes" subtitle="Browse gym classes and book your spot.">
      <div className="space-y-6">
        {error && (
          <div className="rounded-3xl border border-red-700 bg-red-950/80 px-4 py-3 text-sm text-red-200">{error}</div>
        )}
        {success && (
          <div className="rounded-3xl border border-emerald-700 bg-emerald-950/80 px-4 py-3 text-sm text-emerald-200">{success}</div>
        )}

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-xl shadow-slate-950/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Available classes</h2>
              <p className="mt-1 text-sm text-slate-400">Book the classes that fit your schedule and training goals.</p>
            </div>
            <span className="inline-flex rounded-full bg-slate-800 px-3 py-2 text-xs uppercase tracking-[0.25em] text-slate-400">
              {loading ? 'Loading…' : `${classes.length} classes`}
            </span>
          </div>

          {loading ? (
            <div className="mt-8 text-slate-400">Loading classes…</div>
          ) : classes.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-slate-950/80 p-6 text-slate-400">No classes are available at the moment.</div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Trainer</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {classes.map((cls) => {
                    const booked = attendance[cls.id];
                    const isFull = Number(cls.booked_count) >= Number(cls.capacity || 0);
                    return (
                      <tr key={cls.id} className="odd:bg-slate-950 even:bg-slate-900">
                        <td className="px-4 py-4 text-slate-100 font-medium">{cls.title}</td>
                        <td className="px-4 py-4 text-slate-400">{cls.trainer_name || 'TBD'}</td>
                        <td className="px-4 py-4 text-slate-400">{new Date(cls.start_time).toLocaleString()}</td>
                        <td className="px-4 py-4 text-slate-400">{cls.booked_count}/{cls.capacity || '—'}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                            booked ? 'bg-emerald-500/15 text-emerald-200' : isFull ? 'bg-rose-500/15 text-rose-200' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {booked ? 'Booked' : isFull ? 'Full' : 'Open'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {booked ? (
                            <button
                              type="button"
                              disabled={busyId === booked.id}
                              onClick={() => handleCancel(booked.id, cls.id)}
                              className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
                            >
                              {busyId === booked.id ? 'Cancelling…' : 'Cancel'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busyId === cls.id || isFull}
                              onClick={() => handleBook(cls.id)}
                              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                            >
                              {busyId === cls.id ? 'Booking…' : 'Book'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

export default function MemberClasses() {
  return (
    <ProtectedRoute allowedRoles={['member', 'admin']}>
      <MemberClassesPage />
    </ProtectedRoute>
  );
}
