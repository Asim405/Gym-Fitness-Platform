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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="mb-6 text-center">
          <div className="text-emerald-500 font-bold tracking-tight mb-2">PULSE&nbsp;FIT</div>
          <h2 className="text-2xl font-semibold text-white">Create your account</h2>
          <p className="text-slate-400 text-sm mt-1">Joins as a Member — trainers/admins are added by staff</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-950 border border-red-800 text-red-300 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-300 mb-1">Full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            placeholder="Asim Khan"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            placeholder="At least 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-medium py-2.5 transition-colors"
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-sm text-slate-400 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
