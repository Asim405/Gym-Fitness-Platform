import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: ChartBarIcon,
    title: 'Workout Tracking',
    description: 'Log sets, reps, and personal records with smart workout history that keeps you accountable.',
  },
  {
    icon: CalendarDaysIcon,
    title: 'Class Booking',
    description: 'Reserve spots in group sessions, manage your schedule, and never miss a training day.',
  },
  {
    icon: UserPlusIcon,
    title: 'Progress Analytics',
    description: 'Visualize strength gains, attendance trends, and milestones with clear performance insights.',
  },
];

export default function PulseFitLanding() {
  const [view, setView] = useState('landing');
  const [authMode, setAuthMode] = useState('login');

  return (
    <div className="min-h-screen relative bg-[#0c0f12] text-slate-200 font-sans antialiased overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#0c0f12] via-[#141a1f] to-[#1a232b] animate-gradient-subtle" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_55%)]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <button
          type="button"
          onClick={() => setView('landing')}
          className="text-2xl font-light tracking-wider text-white/90 transition-opacity hover:opacity-90"
        >
          Pulse<span className="font-medium text-emerald-400">Fit</span>
        </button>

        {view === 'landing' && (
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setView('auth');
            }}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white transition-all hover:border-emerald-400/40 hover:bg-emerald-500/10"
          >
            Sign In
          </button>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-16">
        {view === 'landing' ? (
          <LandingHero onGetStarted={() => {
            setAuthMode('login');
            setView('auth');
          }} />
        ) : (
          <AuthPanel
            mode={authMode}
            onModeChange={setAuthMode}
            onBack={() => setView('landing')}
          />
        )}
      </main>

      <style jsx global>{`
        @keyframes gradient-subtle {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-subtle {
          background-size: 300% 300%;
          animation: gradient-subtle 20s ease-in-out infinite;
        }
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-up {
          animation: fade-up 0.55s ease-out both;
        }
      `}</style>
    </div>
  );
}

function LandingHero({ onGetStarted }) {
  return (
    <section className="animate-fade-up pt-8 md:pt-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-4 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-emerald-300">
          Fitness management, reimagined
        </p>
        <h1 className="text-4xl font-light tracking-tight text-white sm:text-5xl md:text-6xl">
          Transform Your{' '}
          <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text font-medium text-transparent">
            Fitness Journey
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
          PulseFit brings workouts, class bookings, and progress analytics into one sleek platform —
          built for members, trainers, and gym admins who want results without the clutter.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={onGetStarted}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30"
          >
            Get Started
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-medium text-slate-200 transition-all hover:border-white/20 hover:bg-white/10"
          >
            Sign In
          </button>
        </div>
      </div>

      <div className="mt-16 grid gap-5 md:mt-20 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }, index) => (
          <article
            key={title}
            className="group rounded-2xl border border-white/5 bg-[#141a1f]/70 p-6 shadow-xl shadow-black/20 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-emerald-400/20 hover:bg-[#141a1f]"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="mb-4 inline-flex rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-emerald-400 transition-colors group-hover:bg-emerald-500/15">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
          </article>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-white/5 bg-gradient-to-r from-[#141a1f]/80 to-[#0c0f12]/80 p-8 text-center md:p-10">
        <p className="text-sm uppercase tracking-widest text-emerald-400/80">Trusted by fitness teams</p>
        <p className="mt-3 text-2xl font-light text-white md:text-3xl">
          One platform. Every rep. Every class. Every milestone.
        </p>
      </div>
    </section>
  );
}

function AuthPanel({ mode, onModeChange, onBack }) {
  const { login, register, homeForRole } = useAuth();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState('member');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isLogin = mode === 'login';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = isLogin
        ? await login(email, password)
        : await register(fullName, email, password);
      router.push(homeForRole(user.role));
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.message ||
        (isLogin ? 'Login failed. Check your credentials.' : 'Registration failed.');
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="animate-fade-up mx-auto max-w-lg pt-4 md:pt-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-emerald-400"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Home
      </button>

      <div className="rounded-2xl border border-white/5 bg-[#141a1f]/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm md:p-10">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-light tracking-tight text-white">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {isLogin
              ? 'Sign in to continue your fitness journey.'
              : 'Join PulseFit and start tracking your progress today.'}
          </p>
        </div>

        <div className="mb-6 flex rounded-xl border border-white/10 bg-[#0c0f12]/50 p-1">
          <button
            type="button"
            onClick={() => onModeChange('login')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              isLogin ? 'bg-emerald-500/90 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => onModeChange('register')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              !isLogin ? 'bg-emerald-500/90 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <Field label="Full name">
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Asim Khan"
              />
            </Field>
          )}

          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              required
              minLength={isLogin ? undefined : 8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder={isLogin ? '••••••••' : 'At least 8 characters'}
            />
          </Field>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-emerald-500/90 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
          >
            {busy ? (isLogin ? 'Signing in…' : 'Creating account…') : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {isLogin && (
          <div className="mt-8">
            <p className="text-center text-xs uppercase tracking-wider text-slate-500">I am a</p>
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
        )}
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  'mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f12]/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-0 transition-colors';
