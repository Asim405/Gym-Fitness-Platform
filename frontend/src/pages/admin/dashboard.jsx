import { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import api from '../../lib/api';

const colors = { active: '#10b981', pending: '#f59e0b', expired: '#ef4444', cancelled: '#64748b' };
const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

function AdminDashboardContent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.get('/dashboard/admin');
      setData(result.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load the dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <DashboardShell title="Admin overview" subtitle="Live gym operations and financial performance.">
        {loading ? (
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 text-slate-400">
            Loading live gym data…
          </div>
        ) : (
          <div className="rounded-[2rem] border border-red-800 bg-red-950/50 p-8">
            <h2 className="text-xl font-semibold text-white">Dashboard unavailable</h2>
            <p className="mt-2 text-sm text-red-200">{error}</p>
            <button
              onClick={load}
              className="mt-5 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        )}
      </DashboardShell>
    );
  }

  const statuses = data.membershipStatusBreakdown || [];
  const attendance = data.dailyAttendanceTrend || [];
  const revenue = data.monthlyRevenue || [];
  const registrations = data.memberRegistrations || [];
  const workload = data.trainerAllocation || [];

  return (
    <DashboardShell title="Admin overview" subtitle="Live gym operations and financial performance.">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">Gym command center</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Today’s operational snapshot</h2>
            <p className="mt-2 text-sm text-slate-400">
              Live totals update whenever you refresh the dashboard.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-2xl border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50"
          >
            {loading ? 'Refreshing…' : 'Refresh data'}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total members" value={data.totalMembers || 0} accent="emerald" />
          <StatCard label="Active trainers" value={data.totalTrainers || 0} accent="sky" />
          <StatCard label="Active memberships" value={data.activeMembers || 0} accent="amber" />
          <StatCard label="Membership revenue" value={money(data.totalRevenue)} accent="emerald" />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard title="Membership distribution" subtitle="Current membership statuses.">
            <Donut data={statuses} />
          </ChartCard>
          <ChartCard title="Revenue over time" subtitle="Membership revenue by month.">
            <AreaGraph data={revenue} dataKey="total" format={money} />
          </ChartCard>
          <ChartCard title="Member registrations" subtitle="New member accounts by month.">
            <AreaGraph data={registrations} dataKey="count" />
          </ChartCard>
          <ChartCard title="Attendance trend" subtitle="Checked-in class attendees over the last 14 days.">
            <AreaGraph data={attendance} dataKey="count" xKey="day" />
          </ChartCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <ChartCard title="Trainer workload" subtitle="Active assignments and scheduled classes.">
            <Workload data={workload} />
          </ChartCard>
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6">
            <h2 className="text-xl font-semibold text-white">Operational alerts</h2>
            <List
              title="Low stock"
              items={data.lowStockItems}
              render={(item) => `${item.name} · ${item.quantity}/${item.minimum_stock}`}
              empty="No low-stock inventory items."
            />
            <List
              title="Upcoming classes"
              items={data.upcomingClasses}
              render={(item) => `${item.title} · ${new Date(item.start_time).toLocaleDateString()}`}
              empty="No upcoming classes."
            />
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      <div className="mt-5 h-72">{children}</div>
    </section>
  );
}

function Empty({ text }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl bg-slate-950/70 p-6 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

function Donut({ data }) {
  if (!data.length) return <Empty text="No membership records yet." />;
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          innerRadius={58}
          outerRadius={92}
          paddingAngle={3}
        >
          {data.map((item) => (
            <Cell key={item.status} fill={colors[item.status] || '#64748b'} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [value, name]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function AreaGraph({ data, dataKey, xKey = 'month', format }) {
  if (!data.length) return <Empty text="No data available yet." />;
  return (
    <ResponsiveContainer>
      <AreaChart data={data}>
        <XAxis
          dataKey={xKey}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ background: '#0f172a', borderColor: '#334155' }}
          formatter={(value) => (format ? format(value) : value)}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Workload({ data }) {
  if (!data.length) return <Empty text="No trainer workload data yet." />;
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <XAxis
          dataKey="trainer_name"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155' }} />
        <Legend />
        <Bar
          dataKey="assigned_members"
          fill="#10b981"
          name="Assigned members"
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey="classes_count"
          fill="#38bdf8"
          name="Classes"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function List({ title, items = [], render, empty }) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      {items.length ? (
        <ul className="mt-3 space-y-2">
          {items.slice(0, 5).map((item) => (
            <li key={item.id} className="rounded-2xl bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
              {render(item)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-400">{empty}</p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}