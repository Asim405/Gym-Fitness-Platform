import { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import api from '../../lib/api';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

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
          <div className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-8 text-slate-400 shadow-2xl shadow-black/30">
            Loading live gym data…
          </div>
        ) : (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8">
            <h2 className="text-xl font-light tracking-tight text-white/90">Dashboard unavailable</h2>
            <p className="mt-2 text-sm text-red-300">{error}</p>
            <button
              onClick={load}
              className="mt-5 rounded-lg bg-emerald-500/90 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
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
        {/* Header bar */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-light uppercase tracking-wider text-emerald-400/60">Gym command center</p>
            <h2 className="mt-1 text-2xl font-light tracking-tight text-white/90">Today's operational snapshot</h2>
            <p className="mt-2 text-sm text-slate-400">
              Live totals update whenever you refresh the dashboard.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2 text-sm font-medium text-slate-300 hover:border-white/20 hover:text-white transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing…' : 'Refresh data'}
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total members" value={data.totalMembers || 0} accent="emerald" />
          <StatCard label="Active trainers" value={data.totalTrainers || 0} accent="sky" />
          <StatCard label="Active memberships" value={data.activeMembers || 0} accent="amber" />
          <StatCard label="Membership revenue" value={money(data.totalRevenue)} accent="emerald" />
        </div>

        {/* Charts grid */}
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

        {/* Bottom row: Trainer workload + Operational alerts */}
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <ChartCard title="Trainer workload" subtitle="Active assignments and scheduled classes.">
            <Workload data={workload} />
          </ChartCard>
          <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
            <h2 className="text-base font-light tracking-tight text-white/90">Operational alerts</h2>
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

// Helper components
function ChartCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
      <h2 className="text-base font-light tracking-tight text-white/90">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      <div className="mt-5 h-72">{children}</div>
    </section>
  );
}

function Empty({ text }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-white/5 bg-[#0c0f12]/50 p-6 text-center text-sm text-slate-400">
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
        <Tooltip
          formatter={(value, name) => [value, name]}
          contentStyle={{ backgroundColor: '#141a1f', borderColor: '#ffffff20', color: '#e2e8f0' }}
        />
        <Legend
          wrapperStyle={{ color: '#94a3b8' }}
        />
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
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#141a1f', borderColor: '#ffffff20', color: '#e2e8f0' }}
          labelStyle={{ color: '#e2e8f0' }}
          formatter={(value) => (format ? format(value) : value)}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="#22c55e"
          fill="#22c55e"
          fillOpacity={0.15}
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
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#141a1f', borderColor: '#ffffff20', color: '#e2e8f0' }}
        />
        <Legend
          wrapperStyle={{ color: '#94a3b8' }}
        />
        <Bar
          dataKey="assigned_members"
          fill="#22c55e"
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
      <h3 className="text-xs font-light uppercase tracking-wider text-slate-500">{title}</h3>
      {items.length ? (
        <ul className="mt-2 space-y-1.5">
          {items.slice(0, 5).map((item) => (
            <li key={item.id} className="rounded-lg border border-white/5 bg-[#0c0f12]/50 px-3 py-2 text-sm text-slate-300">
              {render(item)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-400">{empty}</p>
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