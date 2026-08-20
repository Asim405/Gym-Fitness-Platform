import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { UserPlusIcon, ChartBarIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

export default function Register() {
  const { register, homeForRole } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await register(fullName, email, password);
      router.push(homeForRole(user.role));
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Registration failed.';
      setError(message);
      console.error('Registration error:', err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen relative bg-[#0c0f12] text-slate-200 font-sans antialiased flex items-center justify-center px-4 py-12">
      {/* Very subtle animated gradient background */}
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
            Start your fitness <br /> transformation today.
          </h1>
          <p className="mt-4 max-w-sm text-slate-400 text-sm leading-relaxed">
            Join thousands of members who track workouts, book classes, and achieve their goals.
          </p>
          <div className="mt-8 space-y-2">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <UserPlusIcon className="h-5 w-5 text-emerald-400/60" />
              <span className="font-light">Free sign‑up for members</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <ChartBarIcon className="h-5 w-5 text-emerald-400/60" />
              <span className="font-light">Track progress &amp; analytics</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CalendarDaysIcon className="h-5 w-5 text-emerald-400/60" />
              <span className="font-light">Book classes &amp; manage schedules</span>
            </div>
          </div>
        </div>

        {/* RIGHT – Registration Form */}
        <div className="p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-light tracking-tight text-white/90">Create account</h2>
            <p className="mt-1 text-sm text-slate-400">Join PulseFit and start your fitness journey.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Full name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="Asim Khan"
              />
            </div>

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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors"
                placeholder="At least 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-emerald-500/90 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-60"
            >
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Sign in
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