import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';
import { CalendarIcon, UserIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';

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
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
            {success}
          </div>
        )}

        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-light tracking-tight text-white/90">Available classes</h2>
              <p className="mt-1 text-sm text-slate-400">Book the classes that fit your schedule and training goals.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              <CalendarIcon className="h-4 w-4" />
              {loading ? 'Loading…' : `${classes.length} classes`}
            </span>
          </div>

          {loading ? (
            <div className="mt-8 text-sm text-slate-400">Loading classes…</div>
          ) : classes.length === 0 ? (
            <div className="mt-8 rounded-lg border border-white/5 bg-[#0c0f12]/50 p-6 text-center text-sm text-slate-400">
              No classes are available at the moment.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls) => {
                const booked = attendance[cls.id];
                const isFull = Number(cls.booked_count) >= Number(cls.capacity || 0);
                return (
                  <div
                    key={cls.id}
                    className="rounded-xl border border-white/5 bg-[#0c0f12]/50 p-5 transition hover:border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-base font-light tracking-tight text-white/90">{cls.title}</h3>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          booked
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300/70'
                            : isFull
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-300/70'
                            : 'border-sky-500/30 bg-sky-500/10 text-sky-300/70'
                        }`}
                      >
                        {booked ? 'Booked' : isFull ? 'Full' : 'Open'}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-sm text-slate-400">
                      <p className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-slate-500" />
                        {cls.trainer_name || 'TBD'}
                      </p>
                      <p className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-slate-500" />
                        {new Date(cls.start_time).toLocaleString()}
                      </p>
                      <p className="flex items-center gap-2">
                        <UserGroupIcon className="h-4 w-4 text-slate-500" />
                        {cls.booked_count}/{cls.capacity || '—'} booked
                      </p>
                    </div>

                    <div className="mt-4">
                      {booked ? (
                        <button
                          type="button"
                          disabled={busyId === booked.id}
                          onClick={() => handleCancel(booked.id, cls.id)}
                          className="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-sm font-medium text-rose-300/70 hover:bg-rose-500/20 hover:border-rose-500/50 transition-colors disabled:opacity-50"
                        >
                          {busyId === booked.id ? 'Cancelling…' : 'Cancel booking'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === cls.id || isFull}
                          onClick={() => handleBook(cls.id)}
                          className="w-full rounded-lg bg-emerald-500/90 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                        >
                          {busyId === cls.id ? 'Booking…' : 'Book now'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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