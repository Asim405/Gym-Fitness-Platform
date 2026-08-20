import { useEffect, useState } from 'react';
import api from '../lib/api';
import {
  PlusCircleIcon,
  PencilIcon,
  XCircleIcon,
  CalendarIcon,
  UserGroupIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const blank = {
  title: '',
  description: '',
  trainerId: '',
  startTime: '',
  endTime: '',
  capacity: '20',
  location: '',
  status: 'scheduled',
};
const localTime = (value) => (value ? new Date(value).toISOString().slice(0, 16) : '');

export default function ClassManagement({ role }) {
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isAdmin = role === 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const calls = [api.get('/classes')];
      if (isAdmin) calls.push(api.get('/trainers'));
      const [classResult, trainerResult] = await Promise.all(calls);
      setClasses(classResult.data.data || []);
      if (trainerResult) setTrainers(trainerResult.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load class data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isAdmin]);

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      };
      if (!isAdmin) delete payload.trainerId;
      if (editingId) {
        await api.put(`/classes/${editingId}`, payload);
      } else {
        await api.post('/classes', payload);
      }
      setNotice(editingId ? 'Class updated.' : 'Class created.');
      setEditingId(null);
      setForm(blank);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save the class.');
    } finally {
      setBusy(false);
    }
  }

  function edit(cls) {
    setEditingId(cls.id);
    setForm({
      title: cls.title,
      description: cls.description || '',
      trainerId: String(cls.trainer_id || ''),
      startTime: localTime(cls.start_time),
      endTime: localTime(cls.end_time),
      capacity: String(cls.capacity),
      location: cls.location || '',
      status: cls.status || 'scheduled',
    });
    setError('');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function cancel(cls) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api.put(`/classes/${cls.id}`, { status: 'cancelled' });
      setNotice('Class cancelled.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not cancel the class.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
          {notice}
        </div>
      )}

      {/* Form Card */}
      <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
        <div className="flex items-center gap-2">
          <PlusCircleIcon className="h-5 w-5 text-emerald-400/60" />
          <h2 className="text-base font-light tracking-tight text-white/90">
            {editingId ? 'Edit class' : 'Create class'}
          </h2>
        </div>
        <form onSubmit={submit} className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Class name</label>
            <input
              required
              value={form.title}
              onChange={(e) => change('title', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
              placeholder="e.g. Morning Yoga"
            />
          </div>

          {isAdmin && (
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Assigned trainer</label>
              <select
                required
                value={form.trainerId}
                onChange={(e) => change('trainerId', e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
              >
                <option value="">Select an active trainer</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Start</label>
            <input
              required
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => change('startTime', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">End</label>
            <input
              required
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => change('endTime', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Capacity</label>
            <input
              required
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => change('capacity', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Location</label>
            <input
              value={form.location}
              onChange={(e) => change('location', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
              placeholder="Studio A"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Status</label>
            <select
              value={form.status}
              onChange={(e) => change('status', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
            >
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => change('description', e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
              placeholder="Optional description"
            />
          </div>

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              disabled={busy}
              className="rounded-lg bg-emerald-500/90 px-8 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-60"
            >
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Create class'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(blank);
                }}
                className="rounded-lg border border-white/10 bg-[#0c0f12]/50 px-8 py-2.5 text-sm font-medium text-slate-300 hover:border-white/20 hover:text-white transition-colors"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Classes List */}
      <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-emerald-400/60" />
            <h2 className="text-base font-light tracking-tight text-white/90">
              {isAdmin ? 'All classes' : 'My classes'}
            </h2>
          </div>
          <span className="text-sm text-slate-400">
            {loading ? 'Loading…' : `${classes.length} classes`}
          </span>
        </div>

        {loading ? (
          <p className="mt-4 text-slate-400">Loading classes…</p>
        ) : classes.length === 0 ? (
          <p className="mt-4 rounded-lg border border-white/5 bg-[#0c0f12]/50 p-6 text-sm text-slate-400">
            No classes yet. Create the first session above.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm divide-y divide-white/5">
              <thead className="text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Class</th>
                  {isAdmin && <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Trainer</th>}
                  <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Start</th>
                  <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Booked</th>
                  <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Status</th>
                  <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-light text-white/80">{cls.title}</p>
                      {cls.location && (
                        <p className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPinIcon className="h-3 w-3" />
                          {cls.location}
                        </p>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-slate-400">{cls.trainer_name}</td>
                    )}
                    <td className="px-4 py-3 text-slate-400">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4 text-slate-500" />
                        {new Date(cls.start_time).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      <span className="flex items-center gap-1">
                        <UserGroupIcon className="h-4 w-4 text-slate-500" />
                        {cls.booked_count}/{cls.capacity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Status value={cls.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => edit(cls)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#0c0f12]/50 px-3 py-1 text-xs font-medium text-slate-300 hover:border-white/20 hover:text-white transition-colors"
                        >
                          <PencilIcon className="h-3 w-3" />
                          Edit
                        </button>
                        {cls.status === 'scheduled' && (
                          <button
                            disabled={busy}
                            onClick={() => cancel(cls)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300/70 hover:bg-rose-500/20 transition-colors disabled:opacity-60"
                          >
                            <XCircleIcon className="h-3 w-3" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// Helper components
function Status({ value }) {
  const config = {
    scheduled: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-300/70', icon: CheckCircleIcon },
    cancelled: { border: 'border-rose-500/20', bg: 'bg-rose-500/10', text: 'text-rose-300/70', icon: XCircleIcon },
    completed: { border: 'border-slate-500/20', bg: 'bg-slate-500/10', text: 'text-slate-300/70', icon: CheckCircleIcon },
  };
  const { border, bg, text, icon: Icon } = config[value] || config.scheduled;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${border} ${bg} px-2.5 py-0.5 text-xs font-medium ${text}`}
    >
      <Icon className="h-3 w-3" />
      {value}
    </span>
  );
}