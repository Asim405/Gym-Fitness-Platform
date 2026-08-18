import { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import api from '../../lib/api';

const colors = { active: '#10b981', pending: '#f59e0b', expired: '#ef4444', cancelled: '#64748b' };
const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

function AdminDashboardContent() {
<<<<<<< Updated upstream
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [trainerForm, setTrainerForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [createStatus, setCreateStatus] = useState('');
  const [createError, setCreateError] = useState('');
  const [createBusy, setCreateBusy] = useState(false);

  useEffect(() => {
    api
      .get('/dashboard/admin')
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load dashboard data.'));
  }, []);

  async function handleCreateTrainer(e) {
    e.preventDefault();
    setCreateError('');
    setCreateStatus('');
    setCreateBusy(true);

    try {
      const { data: created } = await api.post('/users', {
        fullName: trainerForm.fullName,
        email: trainerForm.email,
        password: trainerForm.password,
        role: 'trainer',
        phone: trainerForm.phone || null,
      });

      setCreateStatus(`Trainer created: ${created.full_name} (${created.email})`);
      setTrainerForm({ fullName: '', email: '', password: '', phone: '' });
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Could not create trainer.');
    } finally {
      setCreateBusy(false);
    }
  }

  return (
    <DashboardShell title="Admin overview" subtitle="System-wide revenue, membership, and attendance analytics">
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!data ? (
        <p className="text-slate-400">Loading dashboard…</p>
      ) : (
        <div className="space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total members" value={data.totalMembers} accent="emerald" />
            <StatCard label="Total revenue" value={`$${Number(data.totalRevenue).toLocaleString()}`} accent="sky" />
            <StatCard
              label="Active memberships"
              value={data.membershipStatusBreakdown.find((s) => s.status === 'active')?.count || 0}
              accent="amber"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-900">Add a new trainer</h3>
                <p className="text-sm text-slate-500">Create trainer credentials from the admin panel so trainers can log in.</p>
              </div>
              <Link href="/admin/inventory" className="text-sm text-emerald-600 hover:text-emerald-500">Manage inventory</Link>
            </div>

            {createError && (
              <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4">
                {createError}
              </div>
            )}
            {createStatus && (
              <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 mb-4">
                {createStatus}
              </div>
            )}

            <form onSubmit={handleCreateTrainer} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full name</label>
                <input
                  value={trainerForm.fullName}
                  onChange={(e) => setTrainerForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="Trainer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={trainerForm.email}
                  onChange={(e) => setTrainerForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="trainer@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  value={trainerForm.password}
                  onChange={(e) => setTrainerForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={8}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone (optional)</label>
                <input
                  value={trainerForm.phone}
                  onChange={(e) => setTrainerForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="+92 300 0000000"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={createBusy}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {createBusy ? 'Creating trainer…' : 'Create trainer account'}
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly revenue */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Monthly revenue</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Peak hours */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Peak gym check-in hours</h3>
              <ul className="space-y-3">
                {data.peakHours.map((hour) => (
                  <li key={hour.hour} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-700">{`${String(hour.hour).padStart(2, '0')}:00`}</span>
                    <span className="text-sm font-semibold text-slate-900">{hour.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Top trainer allocations</h3>
            <div className="grid gap-3">
              {data.trainerAllocation.map((trainer) => (
                <div key={trainer.trainer_id} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{trainer.trainer_name}</div>
                      <div className="text-sm text-slate-500">{trainer.classes_count} classes · {trainer.workout_plans_count} plans</div>
                    </div>
                    <span className="text-sm font-medium text-slate-700">{trainer.classes_count + trainer.workout_plans_count} items</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Revenue & allocation summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total revenue" value={`$${Number(data.totalRevenue).toLocaleString()}`} accent="sky" />
              <StatCard label="Active members" value={data.activeMembers} accent="emerald" />
              <StatCard label="Expired members" value={data.expiredMembers} accent="rose" />
            </div>
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Quick actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/inventory" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">
                Manage inventory
              </Link>
              <Link href="/member/invoices" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">
                View payments
              </Link>
            </div>
          </div>
          
        </div>
        
      )}
    </DashboardShell>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
=======
  const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(''); try { const result = await api.get('/dashboard/admin'); setData(result.data); } catch (err) { setError(err.response?.data?.error || 'Could not load the dashboard. Please try again.'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  if (!data) return <DashboardShell title="Admin overview" subtitle="Live gym operations and financial performance.">{loading ? <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 text-slate-400">Loading live gym data…</div> : <div className="rounded-[2rem] border border-red-800 bg-red-950/50 p-8"><h2 className="text-xl font-semibold text-white">Dashboard unavailable</h2><p className="mt-2 text-sm text-red-200">{error}</p><button onClick={load} className="mt-5 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Try again</button></div>}</DashboardShell>;
  const statuses = data.membershipStatusBreakdown || []; const attendance = data.dailyAttendanceTrend || []; const revenue = data.monthlyRevenue || []; const registrations = data.memberRegistrations || []; const workload = data.trainerAllocation || [];
  return <DashboardShell title="Admin overview" subtitle="Live gym operations and financial performance."><div className="space-y-6">
    <div className="flex flex-col gap-4 rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-emerald-300">Gym command center</p><h2 className="mt-1 text-2xl font-semibold text-white">Today’s operational snapshot</h2><p className="mt-2 text-sm text-slate-400">Live totals update whenever you refresh the dashboard.</p></div><button onClick={load} disabled={loading} className="rounded-2xl border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50">{loading ? 'Refreshing…' : 'Refresh data'}</button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Total members" value={data.totalMembers || 0} accent="emerald" /><StatCard label="Active trainers" value={data.totalTrainers || 0} accent="sky" /><StatCard label="Active memberships" value={data.activeMembers || 0} accent="amber" /><StatCard label="Membership revenue" value={money(data.totalRevenue)} accent="emerald" /></div>
    <div className="grid gap-6 xl:grid-cols-2"><ChartCard title="Membership distribution" subtitle="Current membership statuses."><Donut data={statuses} /></ChartCard><ChartCard title="Revenue over time" subtitle="Membership revenue by month."><AreaGraph data={revenue} dataKey="total" format={money} /></ChartCard><ChartCard title="Member registrations" subtitle="New member accounts by month."><AreaGraph data={registrations} dataKey="count" /></ChartCard><ChartCard title="Attendance trend" subtitle="Checked-in class attendees over the last 14 days."><AreaGraph data={attendance} dataKey="count" xKey="day" /></ChartCard></div>
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><ChartCard title="Trainer workload" subtitle="Active assignments and scheduled classes."><Workload data={workload} /></ChartCard><section className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6"><h2 className="text-xl font-semibold text-white">Operational alerts</h2><List title="Low stock" items={data.lowStockItems} render={(item) => `${item.name} · ${item.quantity}/${item.minimum_stock}`} empty="No low-stock inventory items." /><List title="Upcoming classes" items={data.upcomingClasses} render={(item) => `${item.title} · ${new Date(item.start_time).toLocaleDateString()}`} empty="No upcoming classes." /></section></div>
  </div></DashboardShell>;
>>>>>>> Stashed changes
}
function ChartCard({ title, subtitle, children }) { return <section className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6"><h2 className="text-xl font-semibold text-white">{title}</h2><p className="mt-1 text-sm text-slate-400">{subtitle}</p><div className="mt-5 h-72">{children}</div></section>; }
function Empty({ text }) { return <div className="flex h-full items-center justify-center rounded-2xl bg-slate-950/70 p-6 text-center text-sm text-slate-400">{text}</div>; }
function Donut({ data }) { if (!data.length) return <Empty text="No membership records yet." />; return <ResponsiveContainer><PieChart><Pie data={data} dataKey="count" nameKey="status" innerRadius={58} outerRadius={92} paddingAngle={3}>{data.map((item) => <Cell key={item.status} fill={colors[item.status] || '#64748b'} />)}</Pie><Tooltip formatter={(value, name) => [value, name]} /><Legend /></PieChart></ResponsiveContainer>; }
function AreaGraph({ data, dataKey, xKey = 'month', format }) { if (!data.length) return <Empty text="No data available yet." />; return <ResponsiveContainer><AreaChart data={data}><XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155' }} formatter={(value) => format ? format(value) : value} /><Area type="monotone" dataKey={dataKey} stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} /></AreaChart></ResponsiveContainer>; }
function Workload({ data }) { if (!data.length) return <Empty text="No trainer workload data yet." />; return <ResponsiveContainer><BarChart data={data}><XAxis dataKey="trainer_name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155' }} /><Legend /><Bar dataKey="assigned_members" fill="#10b981" name="Assigned members" radius={[6, 6, 0, 0]} /><Bar dataKey="classes_count" fill="#38bdf8" name="Classes" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>; }
function List({ title, items = [], render, empty }) { return <div className="mt-6"><h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h3>{items.length ? <ul className="mt-3 space-y-2">{items.slice(0, 5).map((item) => <li key={item.id} className="rounded-2xl bg-slate-950/70 px-4 py-3 text-sm text-slate-300">{render(item)}</li>)}</ul> : <p className="mt-3 text-sm text-slate-400">{empty}</p>}</div>; }
export default function AdminDashboard() { return <ProtectedRoute allowedRoles={['admin']}><AdminDashboardContent /></ProtectedRoute>; }
