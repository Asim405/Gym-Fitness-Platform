import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.25),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_25%)]" />
        <div className="relative mx-auto grid min-h-screen max-w-7xl gap-12 px-6 py-10 lg:grid-cols-2 lg:items-center lg:px-12 lg:py-16">
          <section className="hidden flex-col justify-center gap-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/40 lg:flex">
            <div>
              <span className="inline-flex rounded-full bg-emerald-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                PulseFit
              </span>
              <h1 className="mt-8 text-5xl font-semibold tracking-tight text-white">Train harder, recover smarter.</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                The modern gym management platform for members, trainers, and admins. Track attendance, plan diets, manage classes, and boost results with one polished experience.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-3xl bg-slate-950/90 border border-slate-800 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Smart Tracking</p>
                <p className="mt-3 font-semibold text-white">Workout plans, attendance, and progress all connected. <br />everything is in one place.</p>
              </div>
              
            </div>
          </section>

          <section className="mx-auto w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-sm">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Welcome back</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">Sign in to PulseFit</h2>
              <p className="mt-3 text-sm text-slate-400">Choose your role, then enter your login details to continue.</p>
            </div>

            {error && (
              <div className="rounded-3xl bg-red-950/80 border border-red-800 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {['member', 'trainer', 'admin'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`rounded-3xl border px-3 py-2 text-sm font-medium transition ${
                    selectedRole === role
                      ? 'border-emerald-500 bg-emerald-600 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-slate-400">
              New to PulseFit?{' '}
              <Link href="/register" className="font-medium text-emerald-400 hover:text-emerald-300">
                Create an account
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
