import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';
import { MagnifyingGlassIcon, UserIcon, EnvelopeIcon, CalendarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

function MembersPage() {
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (search = '') => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', {
        params: { role: 'member', search, limit: 50 },
      });
      setMembers(data.data || []);
    } catch {
      setError('Unable to load members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function toggle(member) {
    try {
      await api.put(`/users/${member.id}`, { isActive: !member.is_active });
      setMembers((all) =>
        all.map((item) =>
          item.id === member.id ? { ...item, is_active: !item.is_active } : item
        )
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update member.');
    }
  }

  return (
    <DashboardShell title="Member management" subtitle="Search members and control account access.">
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Search form */}
        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            load(query);
          }}
        >
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-2.5 h-5 w-5 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-emerald-500/90 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Members table */}
        <section className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="h-5 w-5 text-emerald-400/60" />
            <h2 className="text-base font-light tracking-tight text-white/90">Members</h2>
          </div>

          {loading ? (
            <p className="text-slate-400">Loading members…</p>
          ) : members.length === 0 ? (
            <p className="text-slate-400">No members found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/5 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Member</th>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Contact</th>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Joined</th>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Status</th>
                    <th className="px-4 py-3 font-light uppercase tracking-wider text-xs">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-light text-white/80">
                        {member.full_name}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        <div className="flex items-center gap-1">
                          <EnvelopeIcon className="h-4 w-4 text-slate-500" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {member.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4 text-slate-500" />
                          {new Date(member.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            member.is_active
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300/70'
                              : 'border-rose-500/20 bg-rose-500/10 text-rose-300/70'
                          }`}
                        >
                          {member.is_active ? (
                            <CheckCircleIcon className="h-3 w-3" />
                          ) : (
                            <XCircleIcon className="h-3 w-3" />
                          )}
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggle(member)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            member.is_active
                              ? 'border border-rose-500/20 bg-rose-500/10 text-rose-300/70 hover:bg-rose-500/20'
                              : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300/70 hover:bg-emerald-500/20'
                          }`}
                        >
                          {member.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

export default function AdminMembers() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <MembersPage />
    </ProtectedRoute>
  );
}