import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { UserCircleIcon, UserGroupIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const { login, homeForRole } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      router.push(homeForRole(user.role));
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen relative bg-[#0c0f12] text-slate-200 font-sans antialiased flex items-center justify-center px-4 py-12">
      {/* Very subtle animated gradient background – no orbs */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#0c0f12] via-[#141a1f] to-[#1a232b] animate-gradient-subtle" />

      {/* Main card – minimal, with soft border and shadow */}
      <div className="w-full max-w-5xl rounded-2xl border border-white/5 bg-[#141a1f]/80 shadow-2xl shadow-black/40 backdrop-blur-sm overflow-hidden md:grid md:grid-cols-2">
        {/* LEFT – Brand / Value proposition */}
        <div className="flex flex-col justify-center p-8 md:p-12 bg-[#0c0f12]/50">
          <div className="mb-6">
            <span className="text-2xl font-light tracking-wider text-white/90">
              Pulse<span className="font-medium text-emerald-400">Fit</span>
            </span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-white/90 leading-tight">
            Your fitness journey <br /> starts here.
          </h1>
          <p className="mt-4 max-w-sm text-slate-400 text-sm leading-relaxed">
            Track workouts, monitor progress, and connect with trainers – all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-light text-slate-300">
              🏋️ Workouts
            </span>
            <span className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-light text-slate-300">
              📊 Analytics
            </span>
            <span className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-light text-slate-300">
              🧘 Community
            </span>
          </div>
        </div>

        {/* RIGHT – Login Form */}
        <div className="p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-light tracking-tight text-white/90">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-400">Sign in to continue your fitness journey.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-emerald-500/90 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-60"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Role selector – subtle pill toggle */}
          <div className="mt-8">
            <p className="text-center text-xs text-slate-500 uppercase tracking-wider">I am a</p>
            <div className="mt-3 flex justify-center gap-2">
              {[
                { role: 'member', label: 'Member', icon: UserCircleIcon },
                { role: 'trainer', label: 'Trainer', icon: UserGroupIcon },
                { role: 'admin', label: 'Admin', icon: ShieldCheckIcon },
              ].map(({ role, label, icon: Icon }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedRole === role
                      ? 'border-emerald-400/50 bg-emerald-500/10 text-white'
                      : 'border-white/10 bg-transparent text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Custom keyframe for subtle gradient animation */}
      <style jsx>{`
        @keyframes gradient-subtle {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-subtle {
          background-size: 300% 300%;
          animation: gradient-subtle 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}