import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import api from '../../lib/api';

const STATUS_COLORS = {
  active: '#10b981',
  pending: '#f59e0b',
  expired: '#ef4444',
  cancelled: '#94a3b8',
};

function AdminDashboardContent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/admin')
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load dashboard data.'));
  }, []);

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance trend */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Daily attendance — last 14 days</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.dailyAttendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Membership status breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Membership status breakdown</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.membershipStatusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {data.membershipStatusBreakdown.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#64748b'} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
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
}
