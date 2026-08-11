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
    <div className="min-h-screen flex bg-slate-950">
      {/* Brand side */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-emerald-700 p-12 text-emerald-50">
        <div className="text-xl font-bold tracking-tight">PULSE&nbsp;FIT</div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Track every rep.<br />Measure every result.
          </h1>
          <p className="text-emerald-100/80 max-w-sm">
            The Gym &amp; Fitness Platform for admins, trainers, and members —
            workouts, classes, attendance, and progress in one place.
          </p>
        </div>
        <p className="text-sm text-emerald-100/60">Gym &amp; Fitness Platform</p>
      </div>

      {/* Form side */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">
              {selectedRole === 'member'
                ? 'Member sign in'
                : selectedRole === 'trainer'
                ? 'Trainer sign in'
                : 'Admin sign in'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {selectedRole === 'member'
                ? 'Sign in with your member credentials.'
                : 'Use your admin or trainer panel credentials.'}
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-950 border border-red-800 text-red-300 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder={
                selectedRole === 'member'
                  ? 'member@example.com'
                  : selectedRole === 'trainer'
                  ? 'trainer@example.com'
                  : 'admin@example.com'
              }
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-medium py-2.5 transition-colors"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole('member')}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                selectedRole === 'member'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Member
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('trainer')}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                selectedRole === 'trainer'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Trainer
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                selectedRole === 'admin'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Admin
            </button>
          </div>

          <p className="text-sm text-slate-400 text-center">
            New here?{' '}
            <Link href="/register" className="text-emerald-400 hover:text-emerald-300">
              Create a member account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
