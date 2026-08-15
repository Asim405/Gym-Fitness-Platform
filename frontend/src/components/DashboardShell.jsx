import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

const NAV = {
  admin: [
    { label: 'Overview', href: '/admin/dashboard' },
    { label: 'Members', href: '/admin/members' },
    { label: 'Trainers', href: '/admin/trainers' },
    { label: 'Memberships', href: '/admin/memberships' },
    { label: 'Classes', href: '/admin/classes' },
    { label: 'Inventory', href: '/admin/inventory' },
  ],
  trainer: [
    { label: 'Overview', href: '/trainer/dashboard' },
    { label: 'Classes', href: '/trainer/classes' },
    { label: 'Diet plans', href: '/trainer/diet-plans' },
  ],
  member: [
    { label: 'Overview', href: '/member/dashboard' },
    { label: 'Trainers', href: '/member/trainers' },
    { label: 'My trainer', href: '/member/my-trainer' },
    { label: 'My membership', href: '/member/memberships' },
    { label: 'Classes', href: '/member/classes' },
    { label: 'Diet plans', href: '/member/diet-plans' },
    { label: 'Billing', href: '/member/invoices' },
    { label: 'QR pass', href: '/member/qrcode' },
  ],
};

function isActivePath(router, href) {
  return router.pathname === href || router.pathname.startsWith(href + '/');
}

export default function DashboardShell({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const items = NAV[user?.role] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="lg:flex lg:min-h-screen">
        <aside className="lg:w-80 border-r border-slate-800 bg-slate-950 px-6 py-6 flex flex-col">
          <div>
            <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
              PulseFit
            </span>
            <div className="mt-6 text-3xl font-semibold tracking-tight text-white">Gym Studio</div>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">
              Manage members, classes, workouts, diet plans and attendance from a single polished dashboard.
            </p>
          </div>

          <nav className="mt-10 space-y-2 flex-1">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-3xl px-4 py-3 text-sm font-medium transition duration-200 ${
                  isActivePath(router, item.href)
                    ? 'bg-emerald-600/15 text-emerald-200'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-[1.75rem] border border-slate-800 bg-slate-900/95 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Signed in as</p>
            <p className="mt-3 text-sm font-semibold text-white truncate">{user?.full_name || user?.email}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            <button
              onClick={logout}
              className="mt-5 w-full rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="border-b border-slate-800 bg-slate-950/95 px-6 py-6 backdrop-blur-sm sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
              </div>
            </div>
          </header>
          <div className="p-6 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
