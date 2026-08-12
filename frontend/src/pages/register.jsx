import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_25%)]" />
        <div className="relative mx-auto grid min-h-screen max-w-7xl gap-12 px-6 py-10 lg:grid-cols-2 lg:items-center lg:px-12 lg:py-16">
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-sm">
            <span className="inline-flex rounded-full bg-emerald-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
              PulseFit Member
            </span>
            <h1 className="mt-8 text-5xl font-semibold tracking-tight text-white">Launch your fitness journey.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Register with PulseFit to access workout plans, diet plans, class booking, QR entry and progress tracking — built for modern gyms.
            </p>
            <div className="mt-10 grid gap-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Stay motivated</p>
                <p className="mt-3 font-semibold text-white">Track your results and keep your training consistent.</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Built for teams</p>
                <p className="mt-3 font-semibold text-white">Members, trainers and gym admins use one unified platform.</p>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-2xl shadow-slate-950/40">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Create account</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">Join PulseFit today</h2>
              <p className="mt-3 text-sm text-slate-400">Members can self-register, while trainers and admins are invited by staff.</p>
            </div>

            {error && (
              <div className="rounded-3xl bg-red-950/80 border border-red-800 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full name</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Asim Khan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="At least 8 characters"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
                Sign in
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
